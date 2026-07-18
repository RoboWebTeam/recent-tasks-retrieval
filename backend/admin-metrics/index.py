import os
import json
import psycopg2

# ── Конфиг цен/курса (ВЫНЕСЕН В ENV — единственное место для правки при смене курса или прайса
# Anthropic). Значения по умолчанию — актуальная калибровка юнит-экономики. Меняйте в deploy/.env:
#   USD_RUB_RATE, ANTHROPIC_SONNET_IN/OUT, ANTHROPIC_OPUS_IN/OUT, ANTHROPIC_CACHE_READ_MULT, ANTHROPIC_CACHE_WRITE_MULT
def _f(name, default):
    try:
        return float(os.environ.get(name, '') or default)
    except (TypeError, ValueError):
        return float(default)

def pricing_config():
    return {
        'usd_rub': _f('USD_RUB_RATE', 90.0),
        # $/1M токенов
        'sonnet_in': _f('ANTHROPIC_SONNET_IN', 3.0),
        'sonnet_out': _f('ANTHROPIC_SONNET_OUT', 15.0),
        'opus_in': _f('ANTHROPIC_OPUS_IN', 15.0),
        'opus_out': _f('ANTHROPIC_OPUS_OUT', 75.0),
        # кэш: чтение — доля от цены входа, запись — множитель к цене входа
        'cache_read_mult': _f('ANTHROPIC_CACHE_READ_MULT', 0.10),
        'cache_write_mult': _f('ANTHROPIC_CACHE_WRITE_MULT', 1.25),
    }

def model_prices(model, cfg):
    if 'opus' in (model or '').lower():
        return cfg['opus_in'], cfg['opus_out']
    return cfg['sonnet_in'], cfg['sonnet_out']

def row_cost_rub(model, in_tok, out_tok, cache_read, cache_write, cfg):
    """Реальная себестоимость строки в ₽ с учётом кэша промпта."""
    pin, pout = model_prices(model, cfg)
    usd = (in_tok * pin
           + out_tok * pout
           + cache_read * pin * cfg['cache_read_mult']
           + cache_write * pin * cfg['cache_write_mult']) / 1_000_000.0
    return usd * cfg['usd_rub']

def row_cost_no_cache_rub(model, in_tok, out_tok, cache_read, cache_write, cfg):
    """Гипотетическая себестоимость БЕЗ кэша: весь вход (in+cache_read+cache_write) по полной цене."""
    pin, pout = model_prices(model, cfg)
    usd = ((in_tok + cache_read + cache_write) * pin + out_tok * pout) / 1_000_000.0
    return usd * cfg['usd_rub']

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
        'Access-Control-Max-Age': '86400',
    }

def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}

def handler(event: dict, context) -> dict:
    """Дашборд usage-метрик для админки: агрегат generation_metrics + расчёт себестоимости
    по конфигу цен/курса из env. Только для админа (x-admin-key == ADMIN_KEY)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_key = headers.get('x-admin-key', '')
    if not admin_key or admin_key != os.environ.get('ADMIN_KEY', ''):
        return err('Доступ только для администратора', 403)

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cfg = pricing_config()
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            # На случай, если таблицы ещё нет (миграция не применена) — отдаём пустой дашборд.
            cur.execute("SELECT to_regclass(%s)", (f"{schema}.generation_metrics",))
            if not cur.fetchone()[0]:
                return ok({'config': cfg, 'available': False, 'totals': None, 'by_model': [], 'by_day': []})

            # Агрегат по модели
            cur.execute(f"""
                SELECT model,
                       COUNT(*),
                       COALESCE(SUM(in_tokens),0), COALESCE(SUM(out_tokens),0),
                       COALESCE(SUM(cache_read),0), COALESCE(SUM(cache_write),0),
                       COALESCE(SUM(cost_units),0),
                       COALESCE(SUM(CASE WHEN is_large THEN 1 ELSE 0 END),0)
                FROM {schema}.generation_metrics
                GROUP BY model ORDER BY 2 DESC
            """)
            by_model = []
            t_gen = t_cost = t_cost_nc = t_units = 0.0
            t_in = t_cr = 0
            for model, n, sin, sout, scr, scw, units, nlarge in cur.fetchall():
                cost = row_cost_rub(model, sin, sout, scr, scw, cfg)
                cost_nc = row_cost_no_cache_rub(model, sin, sout, scr, scw, cfg)
                hit = (scr / (scr + sin) * 100.0) if (scr + sin) else 0.0
                by_model.append({
                    'model': model, 'generations': n,
                    'in_tokens': int(sin), 'out_tokens': int(sout),
                    'cache_read': int(scr), 'cache_write': int(scw),
                    'units': int(units), 'large_tasks': int(nlarge),
                    'cost_rub': round(cost, 1),
                    'cost_per_gen_rub': round(cost / n, 1) if n else 0.0,
                    'cache_hit_pct': round(hit, 1),
                })
                t_gen += n; t_cost += cost; t_cost_nc += cost_nc; t_units += units
                t_in += sin; t_cr += scr

            totals = {
                'generations': int(t_gen),
                'units': int(t_units),
                'cost_rub': round(t_cost, 1),
                'cost_per_gen_rub': round(t_cost / t_gen, 1) if t_gen else 0.0,
                'cost_no_cache_rub': round(t_cost_nc, 1),
                'cache_savings_rub': round(t_cost_nc - t_cost, 1),
                'cache_savings_pct': round((1 - t_cost / t_cost_nc) * 100.0, 1) if t_cost_nc else 0.0,
                'cache_hit_pct': round((t_cr / (t_cr + t_in) * 100.0), 1) if (t_cr + t_in) else 0.0,
            } if t_gen else None

            # Тренд по дням (14 дней) — для графика
            cur.execute(f"""
                SELECT date_trunc('day', created_at)::date AS d, model,
                       COUNT(*), COALESCE(SUM(in_tokens),0), COALESCE(SUM(out_tokens),0),
                       COALESCE(SUM(cache_read),0), COALESCE(SUM(cache_write),0)
                FROM {schema}.generation_metrics
                WHERE created_at >= NOW() - INTERVAL '14 days'
                GROUP BY 1, 2 ORDER BY 1
            """)
            day_map = {}
            for d, model, n, sin, sout, scr, scw in cur.fetchall():
                key = str(d)
                e = day_map.setdefault(key, {'day': key, 'generations': 0, 'cost_rub': 0.0})
                e['generations'] += n
                e['cost_rub'] += row_cost_rub(model, sin, sout, scr, scw, cfg)
            by_day = [{'day': v['day'], 'generations': v['generations'], 'cost_rub': round(v['cost_rub'], 1)}
                      for v in sorted(day_map.values(), key=lambda x: x['day'])]

            return ok({'config': cfg, 'available': True, 'totals': totals, 'by_model': by_model, 'by_day': by_day})
    finally:
        conn.close()
