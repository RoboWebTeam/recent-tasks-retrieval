import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getLang } from '@/lib/i18n';

const isRuLang = (lang: string) => lang === 'ru';

// Фейковые данные для демо
const DEMO_STATS = {
  views: 1247,
  visitors: 834,
  leads: 23,
  conversion: 2.76,
  viewsChange: +18,
  visitorsChange: +12,
  leadsChange: +5,
  conversionChange: +0.4,
};

const DEMO_CHART = [
  { day: 'Пн', views: 120, visitors: 80 },
  { day: 'Вт', views: 95, visitors: 60 },
  { day: 'Ср', views: 180, visitors: 120 },
  { day: 'Чт', views: 145, visitors: 95 },
  { day: 'Пт', views: 210, visitors: 140 },
  { day: 'Сб', views: 190, visitors: 130 },
  { day: 'Вс', views: 160, visitors: 110 },
];

const DEMO_SOURCES = [
  { name: 'Прямые переходы', value: 42, color: 'bg-primary' },
  { name: 'Поисковики', value: 31, color: 'bg-violet-500' },
  { name: 'Соцсети', value: 18, color: 'bg-emerald-500' },
  { name: 'Реклама', value: 9, color: 'bg-amber-500' },
];

const DEMO_PAGES = [
  { path: '/', title: 'Главная', views: 654, time: '2:34' },
  { path: '/menu', title: 'Меню', views: 312, time: '1:48' },
  { path: '/contacts', title: 'Контакты', views: 189, time: '0:55' },
  { path: '/about', title: 'О нас', views: 92, time: '1:22' },
];

const DEMO_DEVICES = [
  { name: 'Мобильные', value: 67, icon: 'Smartphone' },
  { name: 'Десктоп', value: 26, icon: 'Monitor' },
  { name: 'Планшеты', value: 7, icon: 'Tablet' },
];

const maxViews = Math.max(...DEMO_CHART.map(d => d.views));

export default function Analytics() {
  const lang = getLang();
  const isRu = isRuLang(lang);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [activeProject, setActiveProject] = useState('mysite.roboweb.site');

  const periods = [
    { id: '7d', label: isRu ? '7 дней' : '7 days' },
    { id: '30d', label: isRu ? '30 дней' : '30 days' },
    { id: '90d', label: isRu ? '90 дней' : '90 days' },
  ] as const;

  const stats = [
    {
      label: isRu ? 'Просмотры' : 'Views',
      value: DEMO_STATS.views.toLocaleString(),
      change: DEMO_STATS.viewsChange,
      icon: 'Eye',
      color: 'text-primary bg-primary/10',
    },
    {
      label: isRu ? 'Посетители' : 'Visitors',
      value: DEMO_STATS.visitors.toLocaleString(),
      change: DEMO_STATS.visitorsChange,
      icon: 'Users',
      color: 'text-violet-600 bg-violet-100',
    },
    {
      label: isRu ? 'Заявки' : 'Leads',
      value: DEMO_STATS.leads.toLocaleString(),
      change: DEMO_STATS.leadsChange,
      icon: 'MessageSquare',
      color: 'text-emerald-600 bg-emerald-100',
    },
    {
      label: isRu ? 'Конверсия' : 'Conversion',
      value: `${DEMO_STATS.conversion}%`,
      change: DEMO_STATS.conversionChange,
      icon: 'TrendingUp',
      color: 'text-amber-600 bg-amber-100',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/dashboard" className="grid h-7 w-7 place-items-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <Icon name="ArrowLeft" size={16} />
          </Link>
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-base">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={14} />
            </span>
            <span className="hidden sm:block">Roboweb</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{isRu ? 'Аналитика' : 'Analytics'}</span>
        </div>
      </header>

      <main className="container py-8 max-w-6xl">
        {/* Top controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl">{isRu ? 'Аналитика' : 'Analytics'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRu ? 'Статистика посещений ваших сайтов' : 'Traffic statistics for your sites'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Project selector */}
            <div className="flex items-center gap-1.5 bg-secondary border border-border rounded-xl px-3 py-2 text-sm">
              <Icon name="Globe" size={14} className="text-muted-foreground" />
              <span className="font-medium text-foreground">{activeProject}</span>
              <Icon name="ChevronDown" size={13} className="text-muted-foreground" />
            </div>
            {/* Period selector */}
            <div className="flex items-center gap-0.5 bg-secondary border border-border rounded-xl p-1">
              {periods.map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.id ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className={`grid h-8 w-8 place-items-center rounded-xl ${stat.color}`}>
                  <Icon name={stat.icon} size={15} />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground mb-1">{stat.value}</div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${stat.change >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                <Icon name={stat.change >= 0 ? 'TrendingUp' : 'TrendingDown'} size={12} />
                {stat.change >= 0 ? '+' : ''}{stat.change}{typeof stat.change === 'number' && String(stat.value).includes('%') ? 'pp' : '%'}
                <span className="text-muted-foreground font-normal">{isRu ? ' за период' : ' this period'}</span>
              </div>
            </div>
          ))}
        </div>

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
            {/* Bar chart */}
            <div className="flex items-end gap-2 h-40">
              {DEMO_CHART.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-1" style={{ height: '120px' }}>
                    <div className="flex-1 bg-primary/20 rounded-t-md hover:bg-primary/30 transition-colors relative group"
                      style={{ height: `${(d.views / maxViews) * 100}%` }}>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.views}
                      </div>
                    </div>
                    <div className="flex-1 bg-violet-400/30 rounded-t-md hover:bg-violet-400/50 transition-colors relative group"
                      style={{ height: `${(d.visitors / maxViews) * 100}%` }}>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.visitors}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-display font-bold text-base mb-5">{isRu ? 'Источники трафика' : 'Traffic sources'}</h2>
            <div className="space-y-3">
              {DEMO_SOURCES.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-foreground font-medium">{s.name}</span>
                    <span className="font-bold text-foreground">{s.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Top pages */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-display font-bold text-base mb-4">{isRu ? 'Популярные страницы' : 'Top pages'}</h2>
            <div className="space-y-1">
              {DEMO_PAGES.map((page, i) => (
                <div key={page.path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{page.title}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{page.path}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{page.views}</p>
                    <p className="text-xs text-muted-foreground">{page.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Devices */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-display font-bold text-base mb-4">{isRu ? 'Устройства' : 'Devices'}</h2>
            <div className="space-y-4">
              {DEMO_DEVICES.map(d => (
                <div key={d.name} className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary border border-border shrink-0">
                    <Icon name={d.icon} size={17} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-foreground">{d.name}</span>
                      <span className="text-sm font-bold text-foreground">{d.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${d.value}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upgrade nudge */}
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 p-4 text-center">
              <p className="text-sm font-semibold text-foreground mb-1">
                {isRu ? 'Тепловая карта кликов' : 'Click heatmap'}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {isRu ? 'Доступно на тарифе Профи' : 'Available on Pro plan'}
              </p>
              <Button size="sm" className="rounded-xl h-8 text-xs" asChild>
                <Link to="/pricing">
                  <Icon name="Crown" size={13} className="mr-1.5" />
                  {isRu ? 'Улучшить тариф' : 'Upgrade plan'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
