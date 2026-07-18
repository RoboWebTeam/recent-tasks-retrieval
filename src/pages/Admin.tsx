import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  GET_LEADS_URL, MANAGE_USER_URL, ANALYTICS_URL, SITE_LEADS_URL, ACTIVITY_LOG_URL,
  unwrap,
  type Lead, type User, type SiteLead, type AnalyticsData, type LogEntry, type Notification, type UserDetails,
} from './admin/adminTypes';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { SiteLeadsTab, LeadsTab, UsersTab, LogTab, NotificationsTab } from './admin/AdminTables';
import { AdminPricingTab } from './admin/AdminPricingTab';
import { AdminMetricsTab } from './admin/AdminMetricsTab';
import { AdminSupportChatTab } from './admin/AdminSupportChatTab';
import { SUPPORT_CHAT_URL } from './admin/adminTypes';

const Admin = () => {
  const [key, setKey] = useState('');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [siteLeads, setSiteLeads] = useState<SiteLead[]>([]);
  const [siteLeadCounts, setSiteLeadCounts] = useState<Record<string, number>>({});
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [siteLeadsLoading, setSiteLeadsLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [planChanging, setPlanChanging] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<'analytics' | 'metrics' | 'site-leads' | 'leads' | 'users' | 'log' | 'notifications' | 'pricing' | 'chat'>('analytics');
  const [chatUnread, setChatUnread] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<SiteLead | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d'>('7d');
  const [siteLeadFilter, setSiteLeadFilter] = useState<'all' | 'new' | 'processed' | 'rejected'>('all');
  const [logActionFilter, setLogActionFilter] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userActionError, setUserActionError] = useState('');

  const manageUser = async (userId: number, action: 'block' | 'unblock' | 'delete' | 'change_plan', plan?: string) => {
    setActionLoading(userId);
    if (action === 'change_plan') setPlanChanging(userId);
    setUserActionError('');
    try {
      const res = await fetch(MANAGE_USER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ action, user_id: userId, ...(plan ? { plan } : {}) }),
      });
      const raw = await res.json();
      const data = unwrap(raw);
      if (data.ok) {
        if (action === 'delete') {
          setUsers(prev => prev?.filter(u => u.id !== userId) ?? null);
          if (expandedUserId === userId) { setExpandedUserId(null); setUserDetails(null); }
        } else if (action === 'change_plan' && plan) {
          setUsers(prev => prev?.map(u => u.id === userId ? { ...u, plan } : u) ?? null);
        } else {
          setUsers(prev => prev?.map(u => u.id === userId ? { ...u, blocked: action === 'block' } : u) ?? null);
        }
      } else {
        setUserActionError((data.error as string) || 'Не удалось выполнить действие');
      }
    } catch {
      setUserActionError('Ошибка соединения. Попробуйте ещё раз.');
    } finally { setActionLoading(null); setConfirmDelete(null); setPlanChanging(null); }
  };

  const fetchUserDetails = (userId: number) => {
    setUserDetailsLoading(true);
    setUserDetails(null);
    fetch(`${MANAGE_USER_URL}?user_id=${userId}`, { headers: { 'x-admin-key': key } })
      .then(r => r.json())
      .then(raw => {
        const d = unwrap(raw);
        if (!d.error) setUserDetails(d as unknown as UserDetails);
      })
      .finally(() => setUserDetailsLoading(false));
  };

  const toggleUserExpand = (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setUserDetails(null);
      return;
    }
    setExpandedUserId(userId);
    fetchUserDetails(userId);
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

  const fetchLog = (adminKey: string, actionF = '') => {
    setActivityLoading(true);
    const q = actionF ? `?action=${actionF}` : '';
    fetch(`${ACTIVITY_LOG_URL}${q}`, { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json()).then(raw => {
        const d = unwrap(raw);
        if (!d.error) setActivityLogs((d.logs as LogEntry[]) || []);
      })
      .finally(() => setActivityLoading(false));
  };

  const fetchNotifications = (adminKey: string) => {
    setNotifsLoading(true);
    fetch(`${ACTIVITY_LOG_URL}?entity=notifications`, { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json()).then(raw => {
        const d = unwrap(raw);
        if (!d.error) {
          setNotifications((d.notifications as Notification[]) || []);
          setUnreadCount((d.unread as number) || 0);
        }
      })
      .finally(() => setNotifsLoading(false));
  };

  const markAllRead = () => {
    fetch(ACTIVITY_LOG_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({}),
    }).then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    });
  };

  const fetchChatUnread = (adminKey: string) => {
    fetch(`${SUPPORT_CHAT_URL}?list=conversations`, { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json()).then(raw => {
        const d = unwrap(raw);
        if (!d.error) setChatUnread((d.unread_total as number) || 0);
      })
      .catch(() => {/* тихо */});
  };

  useEffect(() => {
    if (authed && key) fetchAnalytics(key, analyticsPeriod === '7d' ? 7 : 30);
  }, [authed, analyticsPeriod]);

  useEffect(() => {
    if (authed && key && tab === 'site-leads') fetchSiteLeads(key);
    if (authed && key && tab === 'log') fetchLog(key, logActionFilter);
    if (authed && key && tab === 'notifications') fetchNotifications(key);
  }, [authed, tab]);

  useEffect(() => {
    if (!authed || !key) return;
    fetchChatUnread(key);
    const interval = setInterval(() => fetchChatUnread(key), 8000);
    return () => clearInterval(interval);
     
  }, [authed, key]);

  const fetchData = async (adminKey: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(GET_LEADS_URL, { headers: { 'x-admin-key': adminKey } });
      if (res.status === 429) { setError('Слишком много попыток входа. Попробуйте через 15 минут.'); setLoading(false); return; }
      if (res.status === 401) { setError('Неверный пароль'); setLoading(false); return; }
      const data = await res.json();
      setLeads(data.leads || []);
      setUsers(data.users || []);
      setAuthed(true);
      fetchAnalytics(adminKey, 7);
      fetchSiteLeads(adminKey);
      fetchNotifications(adminKey);
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
            { icon: 'Eye',    label: 'Просмотров',     value: analyticsData ? analyticsData.total_views.toLocaleString() : '…', color: 'text-primary' },
            { icon: 'Users',  label: 'Пользователей',  value: users?.length ?? 0,                                               color: 'text-violet-500' },
            { icon: 'Inbox',  label: 'Заявок с сайтов',value: Object.values(siteLeadCounts).reduce((s, v) => s + v, 0),        color: 'text-emerald-500' },
            { icon: 'Layers', label: 'Проектов',       value: users?.reduce((s, u) => s + u.projects_count, 0) ?? 0,           color: 'text-amber-500' },
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
            ['analytics',     'Аналитика',    'BarChart2',  null],
            ['metrics',       'Экономика',    'TrendingUp', null],
            ['chat',          'Чат',          'MessageCircle', chatUnread],
            ['site-leads',    'Заявки',        'Inbox',      newSiteLeads],
            ['leads',         'Email-лиды',    'Mail',       leads?.length ?? null],
            ['users',         'Пользователи', 'Users',      users?.length ?? null],
            ['log',           'Лог действий', 'Activity',   null],
            ['notifications', 'Уведомления',  'Bell',       unreadCount],
            ['pricing',       'Тарифы',       'CreditCard', null],
          ] as const).map(([id, label, icon, count]) => (
            <button key={id} onClick={() => { setTab(id); setSearch(''); setExpandedUserId(null); setUserDetails(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${tab === id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              <Icon name={icon} size={15} />
              {label}
              {count !== null && count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${tab === id ? 'bg-white/20' : 'bg-secondary'}`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'analytics' && (
          <AdminAnalytics
            analyticsData={analyticsData}
            analyticsLoading={analyticsLoading}
            analyticsPeriod={analyticsPeriod}
            setAnalyticsPeriod={setAnalyticsPeriod}
            siteLeadCounts={siteLeadCounts}
          />
        )}
        {tab === 'metrics' && (
          <AdminMetricsTab adminKey={key} />
        )}
        {tab === 'chat' && (
          <AdminSupportChatTab adminKey={key} />
        )}
        {tab === 'site-leads' && (
          <SiteLeadsTab
            siteLeadsLoading={siteLeadsLoading}
            siteLeadFilter={siteLeadFilter}
            setSiteLeadFilter={setSiteLeadFilter}
            siteLeadCounts={siteLeadCounts}
            filteredSiteLeads={filteredSiteLeads}
            search={search}
            setSearch={setSearch}
            selectedLead={selectedLead}
            setSelectedLead={setSelectedLead}
            changeSiteLeadStatus={changeSiteLeadStatus}
            exportCSV={exportCSV}
          />
        )}
        {tab === 'leads' && (
          <LeadsTab
            filteredLeads={filteredLeads}
            search={search}
            setSearch={setSearch}
            exportCSV={exportCSV}
          />
        )}
        {tab === 'users' && (
          <UsersTab
            filteredUsers={filteredUsers}
            search={search}
            setSearch={setSearch}
            actionLoading={actionLoading}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            planChanging={planChanging}
            manageUser={manageUser}
            exportCSV={exportCSV}
            expandedUserId={expandedUserId}
            onToggleExpand={toggleUserExpand}
            userDetails={userDetails}
            userDetailsLoading={userDetailsLoading}
            actionError={userActionError}
            onDismissError={() => setUserActionError('')}
          />
        )}
        {tab === 'log' && (
          <LogTab
            activityLogs={activityLogs}
            activityLoading={activityLoading}
            logActionFilter={logActionFilter}
            setLogActionFilter={setLogActionFilter}
            fetchLog={fetchLog}
            adminKey={key}
          />
        )}
        {tab === 'notifications' && (
          <NotificationsTab
            notifications={notifications}
            notifsLoading={notifsLoading}
            unreadCount={unreadCount}
            markAllRead={markAllRead}
            fetchNotifications={fetchNotifications}
            adminKey={key}
          />
        )}
        {tab === 'pricing' && (
          <AdminPricingTab adminKey={key} />
        )}
      </div>
    </div>
  );
};

export default Admin;