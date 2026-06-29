import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  getSession, getStoredUser, clearSession, storeUser,
  apiGetMe, apiGetProjects, apiCreateProject,
  type User, type Project,
} from '@/lib/auth';

const PLAN_LABELS: Record<string, { label: string; color: string; requests: string }> = {
  free:    { label: 'Пробный',  color: 'bg-secondary text-secondary-foreground', requests: '10' },
  premium: { label: 'Премиум',  color: 'bg-primary text-primary-foreground',     requests: '40' },
  pro:     { label: 'Профи',    color: 'bg-foreground text-background',           requests: '60' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft:     { label: 'Черновик',   color: 'text-muted-foreground bg-secondary',                icon: 'FileText' },
  building:  { label: 'Собирается', color: 'text-amber-700 bg-amber-100',                       icon: 'Loader' },
  published: { label: 'Опубликован', color: 'text-emerald-700 bg-emerald-100',                  icon: 'Globe' },
};

function Avatar({ user }: { user: User }) {
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'projects' | 'profile' | 'plan'>('projects');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { navigate('/login'); return; }

    Promise.all([
      apiGetMe(session).then(d => { setUser(d.user); storeUser(d.user); }),
      apiGetProjects(session).then(setProjects),
    ]).catch(() => {
      clearSession();
      navigate('/login');
    }).finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => { clearSession(); navigate('/'); };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const session = getSession()!;
      const project = await apiCreateProject(session, newTitle.trim(), newDesc.trim());
      setProjects(prev => [project, ...prev]);
      setNewTitle('');
      setNewDesc('');
      setDialogOpen(false);
    } catch { /* silent */ }
    setCreating(false);
  };

  const plan = PLAN_LABELS[user?.plan ?? 'free'] ?? PLAN_LABELS.free;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Icon name="Loader" size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Загружаем ваш кабинет…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between py-3.5">
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={17} />
            </span>
            Roboweb
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {([['projects', 'Проекты', 'Layers'], ['plan', 'Тариф', 'CreditCard'], ['profile', 'Профиль', 'User']] as const).map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon name={icon} size={15} />{label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user && <Avatar user={user} />}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-xl text-muted-foreground hover:text-foreground hidden sm:flex">
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-t border-border">
          {([['projects', 'Проекты', 'Layers'], ['plan', 'Тариф', 'CreditCard'], ['profile', 'Профиль', 'User']] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                tab === id ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon name={icon} size={18} />{label}
            </button>
          ))}
        </div>
      </header>

      <div className="container py-6 md:py-8 max-w-5xl">

        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <div>
                <h1 className="font-display font-black text-2xl">Мои проекты</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{projects.length} проект{projects.length === 1 ? '' : projects.length < 5 ? 'а' : 'ов'}</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl font-semibold gap-2">
                    <Icon name="Plus" size={16} /> Новый проект
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="font-display font-bold">Новый проект</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-4 mt-2">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Название сайта</label>
                      <Input
                        placeholder="Например: Лендинг кофейни"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        required
                        className="h-10 rounded-xl"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Описание <span className="text-muted-foreground font-normal">(необязательно)</span></label>
                      <Input
                        placeholder="Кратко о проекте…"
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <Button type="submit" className="w-full rounded-xl font-semibold" disabled={creating}>
                      {creating ? <><Icon name="Loader" size={15} className="mr-2 animate-spin" />Создаём…</> : 'Создать'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
                  <Icon name="Globe" size={28} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Ещё нет проектов</h3>
                <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto">
                  Создайте первый проект — опишите идею, и Roboweb соберёт сайт за минуты.
                </p>
                <Button className="rounded-xl font-semibold gap-2" onClick={() => setDialogOpen(true)}>
                  <Icon name="Plus" size={16} /> Создать первый проект
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(p => {
                  const s = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
                  return (
                    <div key={p.id} className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon name="Globe" size={18} />
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.color}`}>
                          <Icon name={s.icon} size={11} className={p.status === 'building' ? 'animate-spin' : ''} />
                          {s.label}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base mb-1 line-clamp-1">{p.title}</h3>
                      {p.description && (
                        <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        <button className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1">
                          Открыть <Icon name="ArrowRight" size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* New project card */}
                <button
                  onClick={() => setDialogOpen(true)}
                  className="rounded-2xl border border-dashed border-border p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all min-h-[160px]"
                >
                  <Icon name="Plus" size={24} />
                  <span className="text-sm font-medium">Новый проект</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* PLAN TAB */}
        {tab === 'plan' && (
          <div>
            <h1 className="font-display font-black text-2xl mb-6">Тарифный план</h1>
            <div className="rounded-2xl border border-primary bg-card p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${plan.color}`}>{plan.label}</span>
                  <span className="text-xs text-muted-foreground">текущий тариф</span>
                </div>
                <h3 className="font-display font-bold text-xl">Ваш план: {plan.label}</h3>
                <p className="text-muted-foreground text-sm mt-1">{plan.requests} запросов к AI в месяц</p>
              </div>
              <Button className="rounded-xl font-semibold shrink-0">
                Улучшить тариф
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: 'Пробный', price: 'Бесплатно', requests: '10 запросов разово', features: ['До 3 проектов', '512 МБ хранилища', 'Облачный хостинг'], current: user?.plan === 'free' },
                { name: 'Премиум', price: '999 ₽/мес', requests: '40 запросов в месяц', features: ['До 3 проектов', '512 МБ хранилища', 'Подключение домена', 'Расширения'], current: user?.plan === 'premium', hot: true },
                { name: 'Профи',   price: 'По запросу', requests: '60 запросов в месяц', features: ['До 5 проектов', '5 ГБ хранилища', 'Приоритетная поддержка', '25 функций'], current: user?.plan === 'pro' },
              ].map(p => (
                <div key={p.name} className={`rounded-2xl border p-5 ${p.current ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  {p.hot && <span className="inline-block bg-primary text-primary-foreground text-xs font-bold rounded-full px-2.5 py-0.5 mb-2">Популярный</span>}
                  <h3 className="font-display font-bold text-lg">{p.name}</h3>
                  <div className="font-display font-black text-2xl my-2">{p.price}</div>
                  <p className="text-xs text-primary font-semibold mb-3">{p.requests}</p>
                  <ul className="space-y-1.5 mb-4">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Icon name="Check" size={13} className="text-emerald-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-xl text-sm font-semibold ${p.current ? 'bg-secondary text-secondary-foreground hover:bg-secondary' : ''}`}
                    disabled={p.current}
                  >
                    {p.current ? 'Текущий тариф' : 'Выбрать'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && user && (
          <div className="max-w-lg">
            <h1 className="font-display font-black text-2xl mb-6">Профиль</h1>

            <div className="rounded-2xl border border-border bg-card p-6 mb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground font-display font-black text-xl">
                  {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="font-display font-bold text-lg">{user.name}</div>
                  <div className="text-muted-foreground text-sm">{user.email}</div>
                  <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${plan.color}`}>
                    {plan.label}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground mb-0.5">Имя</div>
                  <div className="font-medium">{user.name}</div>
                </div>
                <div className="rounded-xl bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground mb-0.5">E-mail</div>
                  <div className="font-medium">{user.email}</div>
                </div>
                {user.created_at && (
                  <div className="rounded-xl bg-secondary/50 px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-0.5">Дата регистрации</div>
                    <div className="font-medium">{new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">Проекты</div>
                <div className="text-muted-foreground text-xs">{projects.length} создано</div>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setTab('projects')}>
                Перейти
              </Button>
            </div>

            <Button variant="outline" className="w-full mt-4 rounded-xl text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5" onClick={handleLogout}>
              <Icon name="LogOut" size={15} className="mr-2" /> Выйти из аккаунта
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
