import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const GET_LEADS_URL    = 'https://functions.poehali.dev/30e5ede9-3024-46d5-ad27-eae4b46b0056';
const MANAGE_USER_URL  = 'https://functions.poehali.dev/f00990ba-30f7-4fe5-9cb2-974518f45564';
const ANALYTICS_URL    = 'https://functions.poehali.dev/ee6777e6-59d0-4d5f-acb2-d292c72253d3';
const SITE_LEADS_URL   = 'https://functions.poehali.dev/96a428e9-25c5-47d2-83b1-bdc68f9f8010';

function unwrap(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.body !== undefined) {
    return typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body as Record<string, unknown>;
  }
  return raw;
}

interface Lead { id: number; email: string; created_at: string; }

interface User {
  id: number; email: string; name: string; plan: string;
  created_at: string; projects_count: number; blocked: boolean;
}

interface SiteLead {
  id: number; name: string; phone: string; email: string;
  message: string; site: string; date: string; status: 'new' | 'processed' | 'rejected';
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: 'Пробный',  color: 'bg-secondary text-muted-foreground' },
  premium: { label: 'Премиум',  color: 'bg-primary/15 text-primary' },
  pro:     { label: 'Профи',    color: 'bg-foreground/10 text-foreground' },
};



const SITE_LEAD_STATUS = {
  new:       { label: 'Новая',       color: 'bg-primary/10 text-primary', dot: 'bg-primary' },
  processed: { label: 'Обработана',  color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rejected:  { label: 'Отклонена',   color: 'bg-secondary text-muted-foreground', dot: 'bg-muted-foreground' },
};

interface AnalyticsData {
  total_views: number; total_visitors: number; views_change: number;
  chart: { day: string; views: number; visitors: number }[];
  devices: { name: string; value: number }[];
  top_pages: { path: string; views: number }[];
  top_sites: { url: string; views: number; visitors: number; leads: number }[];
  sources: { name: string; value: number }[];
}

const SOURCE_COLORS = ['bg-primary', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];

const Admin = () => {
  const [key, setKey] = useState('');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [siteLeads, setSiteLeads] = useState<SiteLead[]>([]);
  const [siteLeadCounts, setSiteLeadCounts] = useState<Record<string, number>>({});
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [siteLeadsLoading, setSiteLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<'analytics' | 'site-leads' | 'leads' | 'users'>('analytics');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<SiteLead | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d'>('7d');
  const [siteLeadFilter, setSiteLeadFilter] = useState<'all' | 'new' | 'processed' | 'rejected'>('all');

  const manageUser = async (userId: number, action: 'block' | 'unblock' | 'delete') => {
    setActionLoading(userId);
    try {
      const res = await fetch(MANAGE_USER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ action, user_id: userId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (action === 'delete') setUsers(prev => prev?.filter(u => u.id !== userId) ?? null);
        else setUsers(prev => prev?.map(u => u.id === userId ? { ...u, blocked: action === 'block' } : u) ?? null);
      }
    } finally { setActionLoading(null); setConfirmDelete(null); }
  };

  const fetchAnalytics = (adminKey: string, days: number) => {
    setAnalyticsLoading(true);
    fetch(`${ANALYTICS_URL}?days=${days}`, { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json()).then(raw => { const d = unwrap(raw); if (!d.error) setAnalyticsData(d as unknown as AnalyticsData); })
      .finally(() => setAnalyticsLoading(false));
  };

  const fetchSiteLeads = (adminKey: string) => {
    setSiteLeadsLoading(true);
    fetch(SITE_LEADS_URL, { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json()).then(raw => {
        const d = unwrap(raw);
        if (!d.error) {
          setSiteLeads((d.leads as SiteLead[]) || []);
          setSiteLeadCounts((d.counts as Record<string, number>) || {});
        }
      })
      .finally(() => setSiteLeadsLoading(false));
  };

  useEffect(() => {
    if (authed && key) {
      fetchAnalytics(key, analyticsPeriod === '7d' ? 7 : 30);
    }
  }, [authed, analyticsPeriod]);

  useEffect(() => {
    if (authed && key && tab === 'site-leads') {
      fetchSiteLeads(key);
    }
  }, [authed, tab]);

  const fetchData = async (adminKey: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(GET_LEADS_URL, { headers: { 'x-admin-key': adminKey } });
      if (res.status === 401) { setError('Неверный пароль'); setLoading(false); return; }
      const data = await res.json();
      setLeads(data.leads || []);
      setUsers(data.users || []);
      setAuthed(true);
      fetchAnalytics(adminKey, 7);
      fetchSiteLeads(adminKey);
    } catch { setError('Ошибка соединения. Попробуйте ещё раз.'); }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (key.trim()) fetchData(key.trim()); };
  const handleRefresh = () => fetchData(key);

  const filteredLeads = leads?.filter(l => l.email.toLowerCase().includes(search.toLowerCase())) ?? [];
  const filteredUsers = users?.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];
  const filteredSiteLeads = siteLeads.filter(l =>
    (siteLeadFilter === 'all' || l.status === siteLeadFilter) &&
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.site.toLowerCase().includes(search.toLowerCase()) || l.message.toLowerCase().includes(search.toLowerCase()))
  );

  const changeSiteLeadStatus = async (id: number, status: SiteLead['status']) => {
    setSiteLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : null);
    // Сохраняем в БД
    await fetch(SITE_LEADS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ action: 'update_status', id, status }),
    });
  };

  const exportCSV = () => {
    let csv = '';
    if (tab === 'leads') {
      csv = 'ID,Email,Дата\n' + filteredLeads.map(l => `${l.id},"${l.email}","${new Date(l.created_at).toLocaleString('ru')}"`).join('\n');
    } else if (tab === 'users') {
      csv = 'ID,Email,Имя,Тариф,Проектов,Дата\n' + filteredUsers.map(u => `${u.id},"${u.email}","${u.name}","${u.plan}",${u.projects_count},"${new Date(u.created_at).toLocaleString('ru')}"`).join('\n');
    } else if (tab === 'site-leads') {
      csv = 'ID,Имя,Телефон,Email,Сайт,Сообщение,Статус,Дата\n' + filteredSiteLeads.map(l =>
        `${l.id},"${l.name}","${l.phone}","${l.email}","${l.site}","${l.message}","${l.status}","${new Date(l.date).toLocaleString('ru')}"`
      ).join('\n');
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `roboweb-${tab}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const maxViews = analyticsData?.chart.length
    ? Math.max(...analyticsData.chart.map(d => d.views), 1)
    : 1;

  // LOGIN
  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground mb-4 mx-auto">
              <Icon name="Lock" size={26} />
            </span>
            <h1 className="font-display font-black text-2xl">Панель администратора</h1>
            <p className="text-muted-foreground text-sm mt-2">Введите пароль для входа</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <Input type="password" placeholder="Пароль администратора" value={key}
              onChange={e => setKey(e.target.value)} className="h-12 rounded-xl px-4" autoFocus />
            {error && <p className="text-sm text-destructive flex items-center gap-1.5"><Icon name="AlertCircle" size={14} /> {error}</p>}
            <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading}>
              {loading ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />Вход…</> : 'Войти'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              <Icon name="ArrowLeft" size={14} /> Вернуться на сайт
            </a>
          </div>
        </div>
      </div>
    );
  }

  const newSiteLeads = siteLeadCounts['new'] || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Icon name="Bot" size={18} />
            </span>
            <div>
              <div className="font-display font-bold text-lg leading-tight">Roboweb Admin</div>
              <div className="text-xs text-muted-foreground">Панель управления</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl gap-2" disabled={loading}>
              <Icon name={loading ? 'Loader' : 'RefreshCw'} size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Обновить</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-2" asChild>
              <a href="/"><Icon name="ArrowLeft" size={15} /><span className="hidden sm:inline">На сайт</span></a>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 md:py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: 'Eye', label: 'Просмотров', value: analyticsData ? analyticsData.total_views.toLocaleString() : '…', color: 'text-primary' },
            { icon: 'Users', label: 'Пользователей', value: users?.length ?? 0, color: 'text-violet-500' },
            { icon: 'Inbox', label: 'Заявок с сайтов', value: Object.values(siteLeadCounts).reduce((s, v) => s + v, 0), color: 'text-emerald-500' },
            { icon: 'Layers', label: 'Проектов', value: users?.reduce((s, u) => s + u.projects_count, 0) ?? 0, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 md:p-5">
              <div className={`flex items-center gap-2 mb-1 ${s.color}`}>
                <Icon name={s.icon} size={15} />
                <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
              </div>
              <div className="font-display font-black text-3xl">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {([
            ['analytics', 'Аналитика', 'BarChart2', null],
            ['site-leads', 'Заявки с сайтов', 'Inbox', newSiteLeads],
            ['leads', 'Email-лиды', 'Mail', leads?.length ?? null],
            ['users', 'Пользователи', 'Users', users?.length ?? null],
          ] as const).map(([id, label, icon, count]) => (
            <button key={id} onClick={() => { setTab(id); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${tab === id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              <Icon name={icon} size={15} />
              {label}
              {count !== null && count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${tab === id ? 'bg-white/20' : 'bg-secondary'}`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
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
        )}

        {/* ── SITE LEADS TAB ── */}
        {tab === 'site-leads' && (
          <div>
            {siteLeadsLoading && (
              <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
                <Icon name="Loader" size={18} className="animate-spin" /> Загружаем заявки…
              </div>
            )}
            {/* Filters + toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {([
                  ['all', 'Все', Object.values(siteLeadCounts).reduce((s, v) => s + v, 0)],
                  ['new', 'Новые', siteLeadCounts['new'] || 0],
                  ['processed', 'Обработанные', siteLeadCounts['processed'] || 0],
                  ['rejected', 'Отклонённые', siteLeadCounts['rejected'] || 0],
                ] as const).map(([id, label, count]) => (
                  <button key={id} onClick={() => setSiteLeadFilter(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${siteLeadFilter === id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                    {label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${siteLeadFilter === id ? 'bg-white/20' : 'bg-secondary'}`}>{count}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 ml-auto">
                <div className="relative">
                  <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Поиск…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 rounded-xl text-sm w-48" />
                </div>
                <Button variant="outline" onClick={exportCSV} className="rounded-xl gap-1.5 h-9 text-sm shrink-0" disabled={filteredSiteLeads.length === 0}>
                  <Icon name="Download" size={13} /> CSV
                </Button>
              </div>
            </div>

            <div className="flex gap-5">
              {/* List */}
              <div className="flex-1 min-w-0 space-y-2">
                {filteredSiteLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Icon name="Inbox" size={36} className="mb-3 text-muted-foreground/30" />
                    <p className="font-medium text-muted-foreground">Заявок не найдено</p>
                  </div>
                ) : filteredSiteLeads.map(lead => {
                  const s = SITE_LEAD_STATUS[lead.status];
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <button key={lead.id} onClick={() => setSelectedLead(isSelected ? null : lead)}
                      className={`w-full text-left bg-card border rounded-2xl p-4 transition-all hover:shadow-sm ${isSelected ? 'border-primary shadow-md' : 'border-border'}`}>
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0">
                          {lead.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{lead.name}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{lead.message}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Icon name="Globe" size={10} /> {lead.site}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(lead.date).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detail panel */}
              {selectedLead && (
                <div className="w-72 shrink-0 hidden lg:block">
                  <div className="sticky top-24 bg-card border border-border rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-base">Детали заявки</h3>
                      <button onClick={() => setSelectedLead(null)} className="text-muted-foreground hover:text-foreground">
                        <Icon name="X" size={15} />
                      </button>
                    </div>
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary font-black text-xl mx-auto">
                      {selectedLead.name[0]}
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{selectedLead.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedLead.site}</p>
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                      {selectedLead.phone && (
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0"><Icon name="Phone" size={13} className="text-muted-foreground" /></div>
                          <div><p className="text-[10px] text-muted-foreground">Телефон</p><a href={`tel:${selectedLead.phone}`} className="text-sm font-semibold text-primary hover:underline">{selectedLead.phone}</a></div>
                        </div>
                      )}
                      {selectedLead.email && (
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0"><Icon name="Mail" size={13} className="text-muted-foreground" /></div>
                          <div><p className="text-[10px] text-muted-foreground">Email</p><a href={`mailto:${selectedLead.email}`} className="text-sm font-semibold text-primary hover:underline truncate block max-w-[180px]">{selectedLead.email}</a></div>
                        </div>
                      )}
                      <div className="flex items-start gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0 mt-0.5"><Icon name="MessageSquare" size={13} className="text-muted-foreground" /></div>
                        <div><p className="text-[10px] text-muted-foreground mb-1">Сообщение</p><p className="text-sm leading-relaxed">{selectedLead.message}</p></div>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Статус</p>
                      {([['new', 'Новая', 'Bell'], ['processed', 'Обработана', 'CheckCircle'], ['rejected', 'Отклонить', 'X']] as const).map(([id, label, icon]) => (
                        <button key={id} onClick={() => changeSiteLeadStatus(selectedLead.id, id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${selectedLead.status === id ? 'bg-primary text-primary-foreground font-semibold' : 'bg-secondary hover:bg-background text-muted-foreground hover:text-foreground border border-border'}`}>
                          <Icon name={icon} size={13} /> {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      {selectedLead.phone && (
                        <Button size="sm" className="flex-1 rounded-xl h-9 text-xs gap-1.5" asChild>
                          <a href={`tel:${selectedLead.phone}`}><Icon name="Phone" size={12} />Позвонить</a>
                        </Button>
                      )}
                      {selectedLead.email && (
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl h-9 text-xs gap-1.5" asChild>
                          <a href={`mailto:${selectedLead.email}`}><Icon name="Mail" size={12} />Email</a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EMAIL LEADS TAB ── */}
        {tab === 'leads' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск по e-mail…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
              </div>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(filteredLeads.map(l => l.email).join('\n'))} className="rounded-xl gap-2 shrink-0" disabled={filteredLeads.length === 0}>
                <Icon name="Copy" size={15} /> Скопировать e-mail
              </Button>
              <Button variant="outline" onClick={exportCSV} className="rounded-xl gap-2 shrink-0" disabled={filteredLeads.length === 0}>
                <Icon name="Download" size={15} /> CSV
              </Button>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden">
              {filteredLeads.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{search ? 'Ничего не найдено' : 'Заявок пока нет'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12">#</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">E-mail</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Дата</th>
                        <th className="w-10 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead, i) => {
                        const d = new Date(lead.created_at);
                        return (
                          <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                            <td className="px-4 py-3"><a href={`mailto:${lead.email}`} className="font-medium hover:text-primary transition-colors">{lead.email}</a></td>
                            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{d.toLocaleDateString('ru-RU')} {d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => navigator.clipboard.writeText(lead.email)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                                <Icon name="Copy" size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {filteredLeads.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground text-right">Показано: {filteredLeads.length}</p>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск по имени или e-mail…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
              </div>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(filteredUsers.map(u => u.email).join('\n'))} className="rounded-xl gap-2 shrink-0" disabled={filteredUsers.length === 0}>
                <Icon name="Copy" size={15} /> Скопировать e-mail
              </Button>
              <Button variant="outline" onClick={exportCSV} className="rounded-xl gap-2 shrink-0" disabled={filteredUsers.length === 0}>
                <Icon name="Download" size={15} /> CSV
              </Button>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Icon name="Users" size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{search ? 'Ничего не найдено' : 'Пользователей пока нет'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12">#</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Пользователь</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Тариф</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Проекты</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Дата</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Статус</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, i) => {
                        const plan = PLAN_LABELS[user.plan] ?? PLAN_LABELS.free;
                        const initials = user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                        const isLoad = actionLoading === user.id;
                        const isConf = confirmDelete === user.id;
                        return (
                          <tr key={user.id} className={`border-b border-border last:border-0 transition-colors ${user.blocked ? 'bg-rose-50/50' : 'hover:bg-secondary/30'}`}>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`grid h-8 w-8 place-items-center rounded-xl font-bold text-xs shrink-0 ${user.blocked ? 'bg-rose-200 text-rose-700' : 'bg-primary text-primary-foreground'}`}>
                                  {user.blocked ? <Icon name="Ban" size={14} /> : (initials || '?')}
                                </div>
                                <div>
                                  <div className="font-medium leading-tight">{user.name || '—'}</div>
                                  <a href={`mailto:${user.email}`} className="text-xs text-muted-foreground hover:text-primary">{user.email}</a>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${plan.color}`}>{plan.label}</span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="inline-flex items-center gap-1 text-muted-foreground"><Icon name="Layers" size={13} /> {user.projects_count}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              {user.blocked
                                ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-100 rounded-full px-2.5 py-1"><Icon name="Ban" size={11} /> Заблокирован</span>
                                : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1"><Icon name="CheckCircle" size={11} /> Активен</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => navigator.clipboard.writeText(user.email)}
                                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Скопировать e-mail">
                                  <Icon name="Copy" size={13} />
                                </button>
                                <button onClick={() => manageUser(user.id, user.blocked ? 'unblock' : 'block')} disabled={isLoad}
                                  className={`grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary transition-colors ${user.blocked ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-500 hover:text-amber-600'}`}
                                  title={user.blocked ? 'Разблокировать' : 'Заблокировать'}>
                                  <Icon name={isLoad ? 'Loader' : user.blocked ? 'Unlock' : 'Lock'} size={13} className={isLoad ? 'animate-spin' : ''} />
                                </button>
                                {isConf ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => manageUser(user.id, 'delete')} disabled={isLoad}
                                      className="h-7 px-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors">
                                      {isLoad ? '…' : 'Да'}
                                    </button>
                                    <button onClick={() => setConfirmDelete(null)}
                                      className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                                      <Icon name="X" size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDelete(user.id)}
                                    className="grid h-7 w-7 place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Удалить">
                                    <Icon name="Trash2" size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {filteredUsers.length > 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground text-right border-t border-border">Показано: {filteredUsers.length}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;