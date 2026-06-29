import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const GET_LEADS_URL = 'https://functions.poehali.dev/30e5ede9-3024-46d5-ad27-eae4b46b0056';
const MANAGE_USER_URL = 'https://functions.poehali.dev/f00990ba-30f7-4fe5-9cb2-974518f45564';

interface Lead {
  id: number;
  email: string;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  plan: string;
  created_at: string;
  projects_count: number;
  blocked: boolean;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: 'Пробный',  color: 'bg-secondary text-muted-foreground' },
  premium: { label: 'Премиум',  color: 'bg-primary/15 text-primary' },
  pro:     { label: 'Профи',    color: 'bg-foreground/10 text-foreground' },
};

const Admin = () => {
  const [key, setKey] = useState('');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<'leads' | 'users'>('leads');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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
        if (action === 'delete') {
          setUsers(prev => prev?.filter(u => u.id !== userId) ?? null);
        } else {
          setUsers(prev => prev?.map(u => u.id === userId ? { ...u, blocked: action === 'block' } : u) ?? null);
        }
      }
    } finally {
      setActionLoading(null);
      setConfirmDelete(null);
    }
  };

  const fetchData = async (adminKey: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(GET_LEADS_URL, {
        headers: { 'x-admin-key': adminKey },
      });
      if (res.status === 401) { setError('Неверный пароль'); setLoading(false); return; }
      const data = await res.json();
      setLeads(data.leads || []);
      setUsers(data.users || []);
      setAuthed(true);
    } catch {
      setError('Ошибка соединения. Попробуйте ещё раз.');
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (key.trim()) fetchData(key.trim()); };
  const handleRefresh = () => fetchData(key);

  const filteredLeads = leads?.filter(l => l.email.toLowerCase().includes(search.toLowerCase())) ?? [];
  const filteredUsers = users?.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const copyAll = () => {
    const list = tab === 'leads' ? filteredLeads.map(l => l.email) : filteredUsers.map(u => u.email);
    navigator.clipboard.writeText(list.join('\n'));
  };

  const exportCSV = () => {
    let csv = '';
    if (tab === 'leads') {
      csv = 'ID,Email,Дата\n' + filteredLeads.map(l =>
        `${l.id},"${l.email}","${new Date(l.created_at).toLocaleString('ru')}"`
      ).join('\n');
    } else {
      csv = 'ID,Email,Имя,Тариф,Проектов,Дата\n' + filteredUsers.map(u =>
        `${u.id},"${u.email}","${u.name}","${u.plan}",${u.projects_count},"${new Date(u.created_at).toLocaleString('ru')}"`
      ).join('\n');
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roboweb-${tab}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <Input
              type="password"
              placeholder="Пароль администратора"
              value={key}
              onChange={e => setKey(e.target.value)}
              className="h-12 rounded-xl px-4"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <Icon name="AlertCircle" size={14} /> {error}
              </p>
            )}
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

  const activeList = tab === 'leads' ? filteredLeads : filteredUsers;

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
            { icon: 'Mail',      label: 'Заявок',       value: leads?.length ?? 0,  color: 'text-primary' },
            { icon: 'Users',     label: 'Пользователей', value: users?.length ?? 0,  color: 'text-violet-500' },
            { icon: 'TrendingUp', label: 'Новых за 7 дней', value: (leads?.filter(l => Date.now() - new Date(l.created_at).getTime() < 7*86400000).length ?? 0) + (users?.filter(u => Date.now() - new Date(u.created_at).getTime() < 7*86400000).length ?? 0), color: 'text-emerald-500' },
            { icon: 'Layers',    label: 'Проектов',     value: users?.reduce((s, u) => s + u.projects_count, 0) ?? 0, color: 'text-amber-500' },
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
        <div className="flex gap-2 mb-4">
          {([['leads', 'Заявки', 'Mail'], ['users', 'Пользователи', 'Users']] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon name={icon} size={15} />
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${tab === id ? 'bg-white/20' : 'bg-secondary'}`}>
                {id === 'leads' ? leads?.length : users?.length}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tab === 'leads' ? 'Поиск по e-mail…' : 'Поиск по имени или e-mail…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <Button variant="outline" onClick={copyAll} className="rounded-xl gap-2 shrink-0" disabled={activeList.length === 0}>
            <Icon name="Copy" size={15} />
            Скопировать e-mail
          </Button>
          <Button variant="outline" onClick={exportCSV} className="rounded-xl gap-2 shrink-0" disabled={activeList.length === 0}>
            <Icon name="Download" size={15} />
            Скачать CSV
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border overflow-hidden">
          {activeList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">{search ? 'Ничего не найдено' : tab === 'leads' ? 'Заявок пока нет' : 'Пользователей пока нет'}</p>
            </div>
          ) : tab === 'leads' ? (
            /* LEADS TABLE */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">E-mail</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Дата</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Время</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, i) => {
                    const d = new Date(lead.created_at);
                    return (
                      <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${lead.email}`} className="font-medium hover:text-primary transition-colors">{lead.email}</a>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{d.toLocaleDateString('ru-RU')}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => navigator.clipboard.writeText(lead.email)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Скопировать">
                            <Icon name="Copy" size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* USERS TABLE */
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
                    const isLoading = actionLoading === user.id;
                    const isConfirming = confirmDelete === user.id;
                    return (
                      <tr key={user.id} className={`border-b border-border last:border-0 transition-colors ${user.blocked ? 'bg-rose-50/50 dark:bg-rose-950/10' : 'hover:bg-secondary/30'}`}>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`grid h-8 w-8 place-items-center rounded-xl font-bold text-xs shrink-0 ${user.blocked ? 'bg-rose-200 text-rose-700' : 'bg-primary text-primary-foreground'}`}>
                              {user.blocked ? <Icon name="Ban" size={14} /> : (initials || '?')}
                            </div>
                            <div>
                              <div className="font-medium leading-tight">{user.name || '—'}</div>
                              <a href={`mailto:${user.email}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">{user.email}</a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${plan.color}`}>
                            {plan.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Icon name="Layers" size={13} /> {user.projects_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {user.blocked
                            ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-100 dark:bg-rose-950/30 rounded-full px-2.5 py-1"><Icon name="Ban" size={11} /> Заблокирован</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-full px-2.5 py-1"><Icon name="CheckCircle" size={11} /> Активен</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            {/* Копировать */}
                            <button onClick={() => navigator.clipboard.writeText(user.email)}
                              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Скопировать e-mail">
                              <Icon name="Copy" size={13} />
                            </button>
                            {/* Блокировка */}
                            <button
                              onClick={() => manageUser(user.id, user.blocked ? 'unblock' : 'block')}
                              disabled={isLoading}
                              title={user.blocked ? 'Разблокировать' : 'Заблокировать'}
                              className={`grid h-7 w-7 place-items-center rounded-lg transition-colors disabled:opacity-50 ${user.blocked ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'hover:bg-amber-100 text-muted-foreground hover:text-amber-600'}`}>
                              <Icon name={isLoading ? 'Loader' : user.blocked ? 'Unlock' : 'Lock'} size={13} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                            {/* Удаление */}
                            {isConfirming ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => manageUser(user.id, 'delete')} disabled={isLoading}
                                  className="h-7 px-2 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50">
                                  {isLoading ? '…' : 'Да'}
                                </button>
                                <button onClick={() => setConfirmDelete(null)}
                                  className="h-7 px-2 rounded-lg bg-secondary text-xs font-semibold hover:bg-border transition-colors">
                                  Нет
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDelete(user.id)}
                                className="grid h-7 w-7 place-items-center rounded-lg hover:bg-rose-100 transition-colors text-muted-foreground hover:text-rose-500" title="Удалить пользователя">
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
        </div>

        {activeList.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground text-right">
            Показано: {activeList.length} из {tab === 'leads' ? leads?.length : users?.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default Admin;