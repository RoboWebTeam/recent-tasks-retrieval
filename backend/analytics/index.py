import os
import json
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Admin-Key',
        'Access-Control-Max-Age': '86400',
    }

def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Аналитика: запись просмотра страницы и получение статистики"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    schema = get_schema()

    # POST — запись просмотра (вызывается со сгенерированного сайта)
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        site_url = body.get('site_url', '')
        path = body.get('path', '/')
        referrer = body.get('referrer', '')
        user_agent = headers.get('user-agent', '')

        # Определяем устройство по user-agent
        ua = user_agent.lower()
        if any(x in ua for x in ['mobile', 'android', 'iphone', 'ipad']):
            device = 'mobile'
        elif 'tablet' in ua or 'ipad' in ua:
            device = 'tablet'
        else:
            device = 'desktop'

        if not site_url:
            return err('site_url required')

        # Ищем project_id по site_url
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id FROM {schema}.projects WHERE url = %s LIMIT 1",
                    (site_url,)
                )
                row = cur.fetchone()
                project_id = row[0] if row else None

                cur.execute(
                    f"INSERT INTO {schema}.page_views (project_id, site_url, path, referrer, device) VALUES (%s, %s, %s, %s, %s)",
                    (project_id, site_url, path, referrer, device)
                )
            conn.commit()
        finally:
            conn.close()

        return ok({'ok': True})

    # GET — статистика (для дашборда пользователя или админа)
    if method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        try:
            days = max(1, min(int(query_params.get('days', 7)), 365))
        except (ValueError, TypeError):
            days = 7
        site_url = query_params.get('site_url', '')[:500]  # ограничиваем длину
        admin_key = headers.get('x-admin-key', '')
        session_id = headers.get('x-session-id', '')

        # Проверка доступа
        is_admin = admin_key and admin_key == os.environ.get('ADMIN_KEY', '')
        user_id = None

        if not is_admin:
            if not session_id:
                return err('Не авторизован', 401)
            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
                        (session_id,)
                    )
                    row = cur.fetchone()
                    if not row:
                        return err('Сессия истекла', 401)
                    user_id = row[0]
            finally:
                conn.close()

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                # Фильтр по сайту или пользователю (без дней — days вставляем через f-string)
                if is_admin and not site_url:
                    site_filter = ""
                    site_params: tuple = ()
                elif site_url:
                    site_filter = "AND pv.site_url = %s"
                    site_params = (site_url,)
                else:
                    site_filter = "AND p.user_id = %s"
                    site_params = (user_id,)

                # Общая статистика за период
                cur.execute(f"""
                    SELECT
                        COUNT(*) as total_views,
                        COUNT(DISTINCT date_trunc('hour', pv.created_at)::text || pv.site_url) as approx_visitors
                    FROM {schema}.page_views pv
                    LEFT JOIN {schema}.projects p ON p.id = pv.project_id
                    WHERE pv.created_at > NOW() - INTERVAL '{days} days'
                    {site_filter}
                """, site_params)
                stats = cur.fetchone()
                total_views = stats[0] if stats else 0
                total_visitors = stats[1] if stats else 0

                # Статистика за предыдущий период (для расчёта изменения)
                cur.execute(f"""
                    SELECT COUNT(*) FROM {schema}.page_views pv
                    LEFT JOIN {schema}.projects p ON p.id = pv.project_id
                    WHERE pv.created_at BETWEEN NOW() - INTERVAL '{days * 2} days' AND NOW() - INTERVAL '{days} days'
                    {site_filter}
                """, site_params)
                prev_row = cur.fetchone()
                prev_views = prev_row[0] if prev_row else 0

                # График по дням
                cur.execute(f"""
                    SELECT
                        to_char(DATE(pv.created_at), 'DD.MM') as day,
                        COUNT(*) as views,
                        COUNT(DISTINCT date_trunc('hour', pv.created_at)::text || pv.site_url) as visitors
                    FROM {schema}.page_views pv
                    LEFT JOIN {schema}.projects p ON p.id = pv.project_id
                    WHERE pv.created_at > NOW() - INTERVAL '{days} days'
                    {site_filter}
                    GROUP BY DATE(pv.created_at)
                    ORDER BY DATE(pv.created_at)
                """, site_params)
                chart = [{'day': r[0], 'views': r[1], 'visitors': r[2]} for r in cur.fetchall()]

                # Разбивка по устройствам
                cur.execute(f"""
                    SELECT device, COUNT(*) as cnt
                    FROM {schema}.page_views pv
                    LEFT JOIN {schema}.projects p ON p.id = pv.project_id
                    WHERE pv.created_at > NOW() - INTERVAL '{days} days'
                    {site_filter}
                    GROUP BY device ORDER BY cnt DESC
                """, site_params)
                devices_raw = cur.fetchall()
                device_total = sum(r[1] for r in devices_raw) or 1
                devices = [{'name': r[0], 'value': round(r[1] / device_total * 100)} for r in devices_raw]

                # Топ страниц
                cur.execute(f"""
                    SELECT path, COUNT(*) as views
                    FROM {schema}.page_views pv
                    LEFT JOIN {schema}.projects p ON p.id = pv.project_id
                    WHERE pv.created_at > NOW() - INTERVAL '{days} days'
                    {site_filter}
                    GROUP BY path ORDER BY views DESC LIMIT 10
                """, site_params)
                top_pages = [{'path': r[0], 'views': r[1]} for r in cur.fetchall()]

                # Топ сайтов (только для админа без фильтра)
                top_sites = []
                if is_admin and not site_url:
                    cur.execute(f"""
                        SELECT pv.site_url,
                               COUNT(*) as views,
                               COUNT(DISTINCT date_trunc('hour', pv.created_at)::text || pv.site_url) as visitors
                        FROM {schema}.page_views pv
                        WHERE pv.created_at > NOW() - INTERVAL '{days} days'
                        GROUP BY pv.site_url ORDER BY views DESC LIMIT 10
                    """)
                    for r in cur.fetchall():
                        cur.execute(f"SELECT COUNT(*) FROM {schema}.site_leads WHERE site_url = %s", (r[0],))
                        leads_count = cur.fetchone()[0]
                        top_sites.append({'url': r[0], 'views': r[1], 'visitors': r[2], 'leads': leads_count})

                # Источники (по referrer)
                cur.execute(f"""
                    SELECT
                        CASE
                            WHEN referrer = '' OR referrer IS NULL THEN 'Прямые'
                            WHEN referrer LIKE '%%google%%' OR referrer LIKE '%%yandex%%' OR referrer LIKE '%%bing%%' THEN 'Поисковики'
                            WHEN referrer LIKE '%%vk.com%%' OR referrer LIKE '%%instagram%%' OR referrer LIKE '%%t.me%%' OR referrer LIKE '%%facebook%%' THEN 'Соцсети'
                            ELSE 'Другие'
                        END as source,
                        COUNT(*) as cnt
                    FROM {schema}.page_views pv
                    LEFT JOIN {schema}.projects p ON p.id = pv.project_id
                    WHERE pv.created_at > NOW() - INTERVAL '{days} days'
                    {site_filter}
                    GROUP BY source ORDER BY cnt DESC
                """, site_params)
                sources_raw = cur.fetchall()
                sources_total = sum(r[1] for r in sources_raw) or 1
                sources = [{'name': r[0], 'value': round(r[1] / sources_total * 100)} for r in sources_raw]

                views_change = round((total_views - prev_views) / max(prev_views, 1) * 100) if prev_views else 0

        finally:
            conn.close()

        return ok({
            'total_views': total_views,
            'total_visitors': total_visitors,
            'views_change': views_change,
            'chart': chart,
            'devices': devices,
            'top_pages': top_pages,
            'top_sites': top_sites,
            'sources': sources,
        })

    return err('Not found', 404)