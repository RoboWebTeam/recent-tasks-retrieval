import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getLang, tr } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import DashboardHeader from '@/components/DashboardHeader';
import { apiUrl } from '@/lib/apiConfig';

const ANALYTICS_URL = apiUrl('analytics');
const SITE_LEADS_URL = apiUrl('site-leads');

interface AnalyticsData {
  total_views: number;
  total_visitors: number;
  views_change: number;
  chart: { day: string; views: number; visitors: number }[];
  devices: { name: string; value: number }[];
  top_pages: { path: string; views: number }[];
  sources: { name: string; value: number }[];
}

const DEVICE_ICONS: Record<string, string> = {
  mobile: 'Smartphone',
  desktop: 'Monitor',
  tablet: 'Tablet',
};

const SOURCE_COLORS = ['bg-primary', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

export default function Analytics() {
  const lang = getLang();
  const isRu = lang === 'ru';
  const session = getSession();

  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [leadsCount, setLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError('');

    Promise.all([
      fetch(`${ANALYTICS_URL}?days=${period}`, {
        headers: { 'x-session-id': session },
      }).then(r => r.json()),
      fetch(SITE_LEADS_URL, {
        headers: { 'x-session-id': session },
      }).then(r => r.json()),
    ])
      .then(([analyticsRaw, leadsRaw]) => {
        // Unwrap platform envelope
        const aData = analyticsRaw.body !== undefined
          ? (typeof analyticsRaw.body === 'string' ? JSON.parse(analyticsRaw.body) : analyticsRaw.body)
          : analyticsRaw;
        const lData = leadsRaw.body !== undefined
          ? (typeof leadsRaw.body === 'string' ? JSON.parse(leadsRaw.body) : leadsRaw.body)
          : leadsRaw;

        if (aData.error) { setError(aData.error); return; }
        setData(aData);

        const counts = lData.counts || {};
        setLeadsCount(Object.values(counts).reduce((s: number, v) => s + (v as number), 0));
      })
      .catch(() => setError(tr('errorLoad', lang)))
      .finally(() => setLoading(false));
  }, [session, period]);

  const maxViews = data?.chart.length ? Math.max(...data.chart.map(d => d.views), 1) : 1;

  const conversion = data && data.total_visitors > 0
    ? ((leadsCount / data.total_visitors) * 100).toFixed(2)
    : '0.00';

  const stats = data ? [
    { label: isRu ? 'Просмотры' : 'Views', value: data.total_views.toLocaleString(), change: data.views_change, icon: 'Eye', color: 'text-primary bg-primary/10' },
    { label: isRu ? 'Посетители' : 'Visitors', value: data.total_visitors.toLocaleString(), change: null, icon: 'Users', color: 'text-violet-300 bg-violet-500/15' },
    { label: isRu ? 'Заявки' : 'Leads', value: leadsCount.toString(), change: null, icon: 'MessageSquare', color: 'text-emerald-300 bg-emerald-500/15' },
    { label: isRu ? 'Конверсия' : 'Conversion', value: `${conversion}%`, change: null, icon: 'TrendingUp', color: 'text-amber-300 bg-amber-500/15' },
  ] : [];

  const periods = [
    { id: 7, label: isRu ? '7 дней' : '7 days' },
    { id: 30, label: isRu ? '30 дней' : '30 days' },
    { id: 90, label: isRu ? '90 дней' : '90 days' },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader active="analytics" />

      <main className="container py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl">{isRu ? 'Аналитика' : 'Analytics'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRu ? 'Реальная статистика посещений ваших сайтов' : 'Real traffic statistics for your sites'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary border border-border rounded-xl p-1">
            {periods.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.id ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-2xl px-4 py-3 mb-6 text-sm">
            <Icon name="AlertCircle" size={15} /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-secondary rounded w-2/3 mb-3" />
                <div className="h-8 bg-secondary rounded w-1/2" />
              </div>
            ))
          ) : stats.map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className={`grid h-8 w-8 place-items-center rounded-xl ${stat.color}`}>
                  <Icon name={stat.icon} size={15} />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground mb-1">{stat.value}</div>
              {stat.change !== null && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${stat.change >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  <Icon name={stat.change >= 0 ? 'TrendingUp' : 'TrendingDown'} size={12} />
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                  <span className="text-muted-foreground font-normal ml-1">{isRu ? 'vs предыдущий период' : 'vs prev period'}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Icon name="Loader" size={20} className="animate-spin" />
            {tr('loading', lang)}
          </div>
        ) : !data || data.total_views === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-card border border-border mb-5">
              <Icon name="BarChart2" size={32} className="text-muted-foreground/30" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">{tr('noData', lang)}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">{tr('noDataDesc', lang)}</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-5 mb-5">
              {/* Chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-base">{isRu ? 'Посещаемость' : 'Traffic'}</h2>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />{isRu ? 'Просмотры' : 'Views'}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-400 inline-block" />{isRu ? 'Посетители' : 'Visitors'}</span>
                  </div>
                </div>
                {data.chart.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    {isRu ? 'Нет данных за период' : 'No data for period'}
                  </div>
                ) : (
                  <div className="flex items-end gap-2 h-40">
                    {data.chart.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end gap-0.5" style={{ height: '120px' }}>
                          <div className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors relative group"
                            style={{ height: `${(d.views / maxViews) * 100}%` }}>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {d.views.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex-1 bg-violet-400/30 rounded-t hover:bg-violet-400/50 transition-colors"
                            style={{ height: `${(d.visitors / maxViews) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{d.day}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sources */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-display font-bold text-base mb-5">{isRu ? 'Источники' : 'Sources'}</h2>
                {data.sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isRu ? 'Нет данных' : 'No data'}</p>
                ) : (
                  <div className="space-y-3">
                    {data.sources.map((s, i) => (
                      <div key={s.name}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="font-medium">{s.name}</span>
                          <span className="font-bold">{s.value}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${SOURCE_COLORS[i % SOURCE_COLORS.length]} transition-all duration-700`}
                            style={{ width: `${s.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              {/* Top pages */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-display font-bold text-base mb-4">{isRu ? 'Популярные страницы' : 'Top pages'}</h2>
                {data.top_pages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isRu ? 'Нет данных' : 'No data'}</p>
                ) : (
                  <div className="space-y-1">
                    {data.top_pages.map((page, i) => (
                      <div key={page.path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                        <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                        <span className="flex-1 text-sm font-mono text-foreground truncate">{page.path}</span>
                        <span className="text-sm font-bold text-foreground shrink-0">{page.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Devices */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-display font-bold text-base mb-4">{isRu ? 'Устройства' : 'Devices'}</h2>
                {data.devices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isRu ? 'Нет данных' : 'No data'}</p>
                ) : (
                  <div className="space-y-4">
                    {data.devices.map(d => (
                      <div key={d.name} className="flex items-center gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary border border-border shrink-0">
                          <Icon name={DEVICE_ICONS[d.name] || 'Monitor'} size={17} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold capitalize">{d.name}</span>
                            <span className="text-sm font-bold">{d.value}%</span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${d.value}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 p-4 text-center">
                  <p className="text-sm font-semibold mb-1">{isRu ? 'Тепловая карта кликов' : 'Click heatmap'}</p>
                  <p className="text-xs text-muted-foreground mb-3">{isRu ? 'Доступно на тарифе Профи' : 'Available on Pro plan'}</p>
                  <Button size="sm" className="rounded-xl h-8 text-xs" asChild>
                    <Link to="/pricing"><Icon name="Crown" size={13} className="mr-1.5" />{isRu ? 'Улучшить тариф' : 'Upgrade'}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}