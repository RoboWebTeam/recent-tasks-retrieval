import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const GET_LEADS_URL = 'https://functions.poehali.dev/30e5ede9-3024-46d5-ad27-eae4b46b0056';

interface Lead {
  id: number;
  email: string;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const Admin = () => {
  const [key, setKey] = useState('');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [authed, setAuthed] = useState(false);

  const fetchLeads = async (adminKey: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(GET_LEADS_URL, {
        headers: { 'x-admin-key': adminKey },
      });
      if (res.status === 401) {
        setError('Неверный пароль');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLeads(data.leads || []);
      setAuthed(true);
    } catch {
      setError('Ошибка соединения. Попробуйте ещё раз.');
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    fetchLeads(key.trim());
  };

  const handleRefresh = () => fetchLeads(key);

  const filtered = leads?.filter(l =>
    l.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const copyAll = () => {
    const text = filtered.map(l => l.email).join('\n');
    navigator.clipboard.writeText(text);
  };

  // LOGIN SCREEN
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

  // ADMIN PANEL
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
              <div className="text-xs text-muted-foreground">Управление заявками</div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: 'Users', label: 'Всего заявок', value: leads?.length ?? 0, color: 'text-primary' },
            { icon: 'TrendingUp', label: 'За последние 7 дней', value: leads?.filter(l => {
                const d = new Date(l.created_at);
                return Date.now() - d.getTime() < 7 * 86400000;
              }).length ?? 0, color: 'text-[hsl(88,60%,40%)]' },
            { icon: 'Calendar', label: 'Сегодня', value: leads?.filter(l => {
                const d = new Date(l.created_at);
                return new Date().toDateString() === d.toDateString();
              }).length ?? 0, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 md:p-5">
              <div className={`flex items-center gap-2 mb-1 ${s.color}`}>
                <Icon name={s.icon} size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
              </div>
              <div className="font-display font-black text-3xl">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по e-mail…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <Button variant="outline" onClick={copyAll} className="rounded-xl gap-2 shrink-0" disabled={filtered.length === 0}>
            <Icon name="Copy" size={15} />
            Скопировать все e-mail
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">{search ? 'Ничего не найдено' : 'Заявок пока нет'}</p>
              <p className="text-sm mt-1">{search ? 'Попробуйте изменить запрос' : 'Заявки появятся здесь после заполнения формы'}</p>
            </div>
          ) : (
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
                  {filtered.map((lead, i) => {
                    const d = new Date(lead.created_at);
                    return (
                      <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${lead.email}`} className="font-medium hover:text-primary transition-colors">
                            {lead.email}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {d.toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigator.clipboard.writeText(lead.email)}
                            className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Скопировать"
                          >
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

        {filtered.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground text-right">
            Показано: {filtered.length} из {leads?.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default Admin;
