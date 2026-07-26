import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import { apiUrl } from '@/lib/apiConfig';

const ANALYTICS_URL = apiUrl('analytics');
const SITE_LEADS_URL = apiUrl('site-leads');

type ProjectStat = {
  id: number; name: string; url: string | null; status: string; slug: string | null;
  views: number; visitors: number; leads: number; new_leads: number;
};
type Lead = {
  id: number; name: string; phone: string; email: string; message: string;
  site_url: string; status: string; created_at: string; project_id: number | null;
};
type Overview = {
  total_views: number; total_visitors: number; views_change: number;
  total_leads: number; total_new_leads: number;
  chart: { day: string; views: number; visitors: number }[];
  by_project: ProjectStat[];
};

const unwrap = (raw: unknown) => {
  const r = raw as { body?: unknown };
  if (r && r.body !== undefined) return typeof r.body === 'string' ? JSON.parse(r.body) : r.body;
  return raw;
};

/** «Обзор» — сводка бизнеса по всем проектам: заявки, посетители, конверсия,
 *  динамика и вклад каждого проекта. Данные реальные (page_views + site_leads). */
export function DashboardOverviewTab({ lang }: { lang: Lang }) {
  const ru = lang === 'ru';
  const session = getSession();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Overview | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      fetch(`${ANALYTICS_URL}?days=${days}`, { headers: { 'x-session-id': session } }).then(r => r.json()),
      fetch(SITE_LEADS_URL, { headers: { 'x-session-id': session } }).then(r => r.json()),
    ])
      .then(([a, l]) => {
        const ad = unwrap(a) as Overview;
        const ld = unwrap(l) as { leads?: Lead[] };
        setData(ad);
        setLeads(Array.isArray(ld?.leads) ? ld.leads : []);
      })
      .catch(() => {/* показываем пустое состояние */})
      .finally(() => setLoading(false));
  }, [session, days]);

  const conversion = data && data.total_visitors > 0
    ? ((data.total_leads / data.total_visitors) * 100).toFixed(1)
    : '0.0';

  const maxViews = data?.chart?.length ? Math.max(...data.chart.map(d => d.views), 1) : 1;
  const hasData = !!data && (data.total_views > 0 || data.total_leads > 0);

  const kpis = data ? [
    { label: ru ? 'Заявки' : 'Leads', value: data.total_leads, icon: 'Inbox', accent: true,
      badge: data.total_new_leads > 0 ? `${data.total_new_leads} ${ru ? 'новых' : 'new'}` : null },
    { label: ru ? 'Посетители' : 'Visitors', value: data.total_visitors, icon: 'Users' },
    { label: ru ? 'Просмотры' : 'Views', value: data.total_views, icon: 'Eye', change: data.views_change },
    { label: ru ? 'Конверсия' : 'Conversion', value: `${conversion}%`, icon: 'TrendingUp',
      hint: ru ? 'визит → заявка' : 'visit → lead' },
  ] : [];

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Icon name="Loader" size={28} className="animate-spin text-primary mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">{ru ? 'Собираем данные по проектам…' : 'Loading your project data…'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Заголовок + период */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl">{ru ? 'Обзор бизнеса' : 'Business overview'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ru ? 'Что ваши проекты принесли за период' : 'What your projects delivered in the period'}
          </p>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                days === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {d} {ru ? 'дн' : 'd'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={k.label} className="at-in rounded-2xl border border-border bg-card p-4 lift"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name={k.icon} size={15} className={k.accent ? 'text-primary' : ''} />
              <span className="text-xs font-medium">{k.label}</span>
            </div>
            <div className="mt-2 flex items-end gap-2 flex-wrap">
              <span className="font-display font-bold text-2xl tabular-nums">
                {typeof k.value === 'number' ? k.value.toLocaleString() : k.value}
              </span>
              {k.badge && (
                <span className="mb-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                  {k.badge}
                </span>
              )}
              {typeof k.change === 'number' && k.change !== 0 && (
                <span className={`mb-1 text-[11px] font-bold ${k.change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {k.change > 0 ? '▲' : '▼'} {Math.abs(k.change)}%
                </span>
              )}
            </div>
            {k.hint && <div className="text-[11px] text-muted-foreground mt-0.5">{k.hint}</div>}
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
            <Icon name="BarChart2" size={26} />
          </div>
          <p className="mt-4 font-display font-bold">{ru ? 'Данных пока нет' : 'No data yet'}</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {ru
              ? 'Опубликуйте проект и подключите домен — здесь появятся посетители, заявки и конверсия по каждому проекту.'
              : 'Publish a project and connect a domain — visitors, leads and conversion per project will appear here.'}
          </p>
          <Link to="/builder" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-6 py-2.5 text-sm glow-hover">
            <Icon name="Sparkles" size={15} /> {ru ? 'Собрать проект' : 'Build a project'}
          </Link>
        </div>
      ) : (
        <>
          {/* График */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-display font-bold text-sm">{ru ? 'Динамика посещений' : 'Traffic dynamics'}</h3>
              <span className="text-[11px] text-muted-foreground">{ru ? `последние ${days} дней` : `last ${days} days`}</span>
            </div>
            <div className="flex items-end gap-1.5 h-32">
              {data!.chart.map((d, i) => (
                <div key={d.day + i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary/50 to-primary mc-bar relative"
                    style={{ height: `${Math.max((d.views / maxViews) * 100, 3)}%`, animationDelay: `${i * 50}ms` }}>
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 whitespace-nowrap">
                      {d.views}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Вклад проектов */}
          {data!.by_project?.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h3 className="font-display font-bold text-sm mb-4">{ru ? 'Проекты — что приносят' : 'Projects — what they deliver'}</h3>
              <div className="space-y-2">
                {data!.by_project.map(p => {
                  const share = data!.total_views > 0 ? (p.views / data!.total_views) * 100 : 0;
                  return (
                    <div key={p.id} className="rounded-xl border border-border bg-background/50 p-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-display font-bold text-sm truncate max-w-[220px]">{p.name}</span>
                        {p.new_leads > 0 && (
                          <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                            {p.new_leads} {ru ? 'новых заявок' : 'new leads'}
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Icon name="Inbox" size={13} className="text-primary" />{p.leads}</span>
                          <span className="inline-flex items-center gap-1"><Icon name="Users" size={13} />{p.visitors}</span>
                          <span className="inline-flex items-center gap-1"><Icon name="Eye" size={13} />{p.views}</span>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(258,76%,64%)] transition-all duration-700"
                          style={{ width: `${Math.max(share, 2)}%` }} />
                      </div>
                      <div className="mt-2 flex gap-3 text-[11px]">
                        <Link to={`/analytics?site=${encodeURIComponent(p.url || '')}`} className="text-primary font-semibold hover:underline">
                          {ru ? 'Аналитика' : 'Analytics'}
                        </Link>
                        <Link to={`/leads?site=${encodeURIComponent(p.url || '')}`} className="text-primary font-semibold hover:underline">
                          {ru ? 'Заявки' : 'Leads'}
                        </Link>
                        {p.status === 'published' && p.slug && (
                          <a href={`/site/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            {ru ? 'Открыть' : 'Open'} ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Последние заявки */}
          {leads.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm">{ru ? 'Последние заявки' : 'Latest leads'}</h3>
                <Link to="/leads" className="text-xs font-semibold text-primary hover:underline">
                  {ru ? 'Все заявки' : 'All leads'} →
                </Link>
              </div>
              <div className="space-y-2">
                {leads.slice(0, 5).map(l => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 text-xs font-bold">
                      {(l.name || '—').slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{l.name || (ru ? 'Без имени' : 'No name')}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{l.phone || l.email || l.message}</div>
                    </div>
                    {l.status === 'new' && (
                      <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 shrink-0">
                        {ru ? 'новая' : 'new'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
