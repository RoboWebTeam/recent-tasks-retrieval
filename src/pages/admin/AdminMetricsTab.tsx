import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { ADMIN_METRICS_URL, unwrap } from './adminTypes';

interface ByModel {
  model: string; generations: number; in_tokens: number; out_tokens: number;
  cache_read: number; cache_write: number; units: number; large_tasks: number;
  cost_rub: number; cost_per_gen_rub: number; cache_hit_pct: number;
}
interface Totals {
  generations: number; units: number; cost_rub: number; cost_per_gen_rub: number;
  cost_no_cache_rub: number; cache_savings_rub: number; cache_savings_pct: number; cache_hit_pct: number;
}
interface MetricsData {
  available: boolean;
  config: Record<string, number>;
  totals: Totals | null;
  by_model: ByModel[];
  by_day: { day: string; generations: number; cost_rub: number }[];
}

const modelLabel = (m: string) => m.includes('opus') ? 'Opus 4.8' : m.includes('sonnet') ? 'Sonnet 5' : m;
const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const k = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

export function AdminMetricsTab({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!adminKey) return;
    setLoading(true); setError('');
    fetch(ADMIN_METRICS_URL, { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json())
      .then(raw => setData(unwrap(raw) as MetricsData))
      .catch(() => setError('Не удалось загрузить метрики'))
      .finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground text-sm py-10 justify-center"><Icon name="Loader" size={16} className="animate-spin" /> Загрузка метрик…</div>;
  if (error) return <div className="text-destructive text-sm py-10 text-center">{error}</div>;
  if (!data) return null;

  const t = data.totals;
  const cfg = data.config || {};

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg">Экономика генераций</h2>
          <p className="text-sm text-muted-foreground">Реальный расход токенов и себестоимость по данным generation_metrics.</p>
        </div>
      </div>

      {(!data.available || !t || t.generations === 0) ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Icon name="BarChart2" size={28} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">Пока нет данных</p>
          <p className="text-sm text-muted-foreground mt-1">
            Метрики появятся по мере генераций пользователей. Каждая генерация записывает расход
            токенов и эффективность кэша промпта.
          </p>
        </div>
      ) : (
        <>
          {/* Сводные карточки */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Генераций', value: t.generations.toLocaleString('ru-RU'), icon: 'Sparkles', sub: `${t.units.toLocaleString('ru-RU')} единиц списано` },
              { label: 'Себестоимость', value: rub(t.cost_rub), icon: 'Wallet', sub: `${rub(t.cost_per_gen_rub)} за генерацию` },
              { label: 'Экономия кэша', value: rub(t.cache_savings_rub), icon: 'Zap', sub: `−${t.cache_savings_pct}% к затратам` },
              { label: 'Попадание в кэш', value: `${t.cache_hit_pct}%`, icon: 'Database', sub: 'доля входа из кэша' },
            ].map(c => (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><Icon name={c.icon} size={14} /></span>
                  <span className="text-xs font-semibold uppercase tracking-wide">{c.label}</span>
                </div>
                <div className="font-display font-bold text-xl sm:text-2xl">{c.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* По моделям */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-sm">Себестоимость по моделям</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/40">
                    <th className="px-4 py-2 font-semibold">Модель</th>
                    <th className="px-4 py-2 font-semibold text-right">Генераций</th>
                    <th className="px-4 py-2 font-semibold text-right">Единиц</th>
                    <th className="px-4 py-2 font-semibold text-right">Токены вх/вых</th>
                    <th className="px-4 py-2 font-semibold text-right">Кэш-хит</th>
                    <th className="px-4 py-2 font-semibold text-right">Себест.</th>
                    <th className="px-4 py-2 font-semibold text-right">₽/ген</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_model.map(m => (
                    <tr key={m.model} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-semibold">{modelLabel(m.model)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{m.generations}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{m.units}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{k(m.in_tokens)} / {k(m.out_tokens)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{m.cache_hit_pct}%</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{rub(m.cost_rub)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{rub(m.cost_per_gen_rub)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Тренд по дням */}
          {data.by_day.length > 1 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="font-semibold text-sm mb-3">Последние 14 дней</div>
              <div className="flex items-end gap-1.5 h-28">
                {(() => {
                  const max = Math.max(...data.by_day.map(d => d.generations), 1);
                  return data.by_day.map(d => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.day}: ${d.generations} ген, ${rub(d.cost_rub)}`}>
                      <div className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors" style={{ height: `${Math.max(4, (d.generations / max) * 96)}px` }} />
                      <span className="text-[9px] text-muted-foreground">{d.day.slice(5)}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {/* Конфиг цен/курса */}
      <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        <div className="font-semibold text-foreground mb-1.5">Параметры расчёта (конфиг)</div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span>Курс: <b className="text-foreground">{cfg.usd_rub} ₽/$</b></span>
          <span>Sonnet 5: ${cfg.sonnet_in}/${cfg.sonnet_out} за 1М</span>
          <span>Opus 4.8: ${cfg.opus_in}/${cfg.opus_out} за 1М</span>
          <span>Кэш-чтение: {Math.round((cfg.cache_read_mult || 0) * 100)}% входа</span>
        </div>
        <p className="mt-2">Меняются в <code>deploy/.env</code>: <code>USD_RUB_RATE</code>, <code>ANTHROPIC_SONNET_IN/OUT</code>, <code>ANTHROPIC_OPUS_IN/OUT</code>, <code>ANTHROPIC_CACHE_READ_MULT</code>.</p>
      </div>
    </div>
  );
}
