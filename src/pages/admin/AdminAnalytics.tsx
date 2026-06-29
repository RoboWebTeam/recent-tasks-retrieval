import Icon from '@/components/ui/icon';
import { type AnalyticsData, SOURCE_COLORS } from './adminTypes';

interface Props {
  analyticsData: AnalyticsData | null;
  analyticsLoading: boolean;
  analyticsPeriod: '7d' | '30d';
  setAnalyticsPeriod: (p: '7d' | '30d') => void;
  siteLeadCounts: Record<string, number>;
}

export function AdminAnalytics({
  analyticsData, analyticsLoading, analyticsPeriod, setAnalyticsPeriod, siteLeadCounts,
}: Props) {
  const maxViews = analyticsData?.chart.length
    ? Math.max(...analyticsData.chart.map(d => d.views), 1)
    : 1;

  return (
    <div className="space-y-5">
      {/* Period */}
      <div className="flex items-center gap-2">
        {(['7d', '30d'] as const).map(p => (
          <button key={p} onClick={() => setAnalyticsPeriod(p)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${analyticsPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {p === '7d' ? '7 дней' : '30 дней'}
          </button>
        ))}
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Icon name="Loader" size={20} className="animate-spin" /> Загружаем аналитику…
        </div>
      ) : !analyticsData || analyticsData.total_views === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="BarChart2" size={36} className="mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Данных пока нет — просмотры появятся когда посетители зайдут на сайты</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Просмотров', value: analyticsData.total_views.toLocaleString(), color: 'text-primary' },
              { label: 'Посетителей', value: analyticsData.total_visitors.toLocaleString(), color: 'text-violet-500' },
              { label: 'Изменение', value: `${analyticsData.views_change >= 0 ? '+' : ''}${analyticsData.views_change}%`, color: analyticsData.views_change >= 0 ? 'text-emerald-500' : 'text-destructive' },
              { label: 'Заявок с сайтов', value: (siteLeadCounts.new || 0) + (siteLeadCounts.processed || 0) + (siteLeadCounts.rejected || 0), color: 'text-amber-500' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${s.color}`}>{s.label}</p>
                <p className="font-display font-black text-2xl">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Chart + Sources */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-base">Посещаемость</h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" /> Просмотры</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-400 inline-block" /> Посетители</span>
                </div>
              </div>
              {analyticsData.chart.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Нет данных за период</div>
              ) : (
                <div className="flex items-end gap-2 h-44">
                  {analyticsData.chart.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end gap-0.5" style={{ height: '120px' }}>
                        <div className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group"
                          style={{ height: `${(d.views / maxViews) * 100}%` }}>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {d.views.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex-1 bg-violet-400/30 hover:bg-violet-400/50 rounded-t transition-colors"
                          style={{ height: `${(d.visitors / maxViews) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-display font-bold text-base mb-5">Источники трафика</h2>
              {analyticsData.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              ) : (
                <div className="space-y-3">
                  {analyticsData.sources.map((s, i) => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-foreground font-medium">{s.name}</span>
                        <span className="font-bold">{s.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${SOURCE_COLORS[i % SOURCE_COLORS.length]}`} style={{ width: `${s.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top sites table */}
          {analyticsData.top_sites.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-secondary/30">
                <h2 className="font-display font-bold text-sm">Топ сайтов</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">#</th>
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Сайт</th>
                      <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Просмотры</th>
                      <th className="text-right px-5 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Посетители</th>
                      <th className="text-right px-5 py-3 font-semibold text-muted-foreground hidden md:table-cell">Заявки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.top_sites.map((site, i) => (
                      <tr key={site.url} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                              <Icon name="Globe" size={13} />
                            </div>
                            <span className="font-medium text-foreground">{site.url}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold">{site.views.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground hidden sm:table-cell">{site.visitors.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <Icon name="TrendingUp" size={11} /> {site.leads}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
