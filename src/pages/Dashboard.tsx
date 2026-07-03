import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { getLang, tr } from '@/lib/i18n';
import DashboardHeader from '@/components/DashboardHeader';

const getPlanLabels = (lang: ReturnType<typeof getLang>) => ({
  free:    { label: tr('planFree', lang),    color: 'bg-secondary text-secondary-foreground', requests: '3' },
  premium: { label: tr('planPremium', lang), color: 'bg-primary text-primary-foreground',     requests: '40' },
  pro:     { label: tr('planPro', lang),     color: 'bg-foreground text-background',           requests: '60' },
});

const getStatusConfig = (lang: ReturnType<typeof getLang>) => ({
  draft:     { label: tr('draft', lang),     color: 'text-muted-foreground bg-secondary',   icon: 'FileText' },
  building:  { label: tr('building', lang),  color: 'text-amber-700 bg-amber-100',          icon: 'Loader' },
  published: { label: tr('published', lang), color: 'text-emerald-700 bg-emerald-100',      icon: 'Globe' },
});

const Dashboard = () => {
  const lang = getLang();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const PLAN_LABELS = getPlanLabels(lang);
  const STATUS_CONFIG = getStatusConfig(lang);
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const tabParam = searchParams.get('tab');
  const tab: 'projects' | 'profile' | 'plan' = tabParam === 'profile' || tabParam === 'plan' ? tabParam : 'projects';
  const setTab = (t: 'projects' | 'profile' | 'plan') => setSearchParams(t === 'projects' ? {} : { tab: t });
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    // Показываем кешированного пользователя сразу
    const cached = getStoredUser();
    if (cached) { setUser(cached); setLoading(false); }

    apiGetMe(session)
      .then(d => {
        const u = (d as { user?: typeof cached }).user || d;
        if (u && (u as { id?: number }).id) {
          setUser(u as typeof cached);
          storeUser(u as typeof cached);
        }
      })
      .catch(() => {/* показываем кешированного */})
      .finally(() => setLoading(false));

    apiGetProjects(session)
      .then(p => { if (Array.isArray(p)) setProjects(p); })
      .catch(() => {/* пустой список */});
  }, []);

  const handleLogout = () => { clearSession(); navigate('/'); };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const session = getSession()!;
      const project = await apiCreateProject(session, newTitle.trim(), newDesc.trim());
      setProjects(prev => [project, ...prev]);
      setNewTitle('');
      setNewDesc('');
      setDialogOpen(false);
      navigate(`/builder?project=${project.id}`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : tr('errorProject', lang));
    }
    setCreating(false);
  };

  const plan = PLAN_LABELS[user?.plan ?? 'free'] ?? PLAN_LABELS.free;

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Icon name="Loader" size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">{tr('loadingCabinet', lang)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader active={tab} />

      <div className="container py-6 md:py-8 max-w-5xl">

        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <div>
                <h1 className="font-display font-black text-2xl">{tr('myProjects', lang)}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{projects.length} {lang === 'ru' ? `проект${projects.length === 1 ? '' : projects.length < 5 ? 'а' : 'ов'}` : `project${projects.length === 1 ? '' : 's'}`}</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl font-semibold gap-2">
                    <Icon name="Plus" size={16} /> {tr('newProject', lang)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="font-display font-bold">{tr('newProject', lang)}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-4 mt-2">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">{tr('projectName', lang)}</label>
                      <Input
                        placeholder={tr('projectNamePlaceholder', lang)}
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        required
                        className="h-10 rounded-xl"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">{tr('description', lang)} <span className="text-muted-foreground font-normal">({tr('optional', lang)})</span></label>
                      <Input
                        placeholder={tr('descriptionPlaceholder', lang)}
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    {createError && (
                      <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
                        <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
                        <span>{createError}</span>
                      </div>
                    )}
                    <Button type="submit" className="w-full rounded-xl font-semibold" disabled={creating}>
                      {creating ? <><Icon name="Loader" size={15} className="mr-2 animate-spin" />{tr('creating', lang)}</> : <><Icon name="Sparkles" size={15} className="mr-1.5" />{tr('createAndOpen', lang)}</>}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
                  <Icon name="Sparkles" size={28} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{tr('noProjects', lang)}</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  {tr('noProjectsDesc', lang)}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button className="rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20" onClick={() => setDialogOpen(true)}>
                    <Icon name="Sparkles" size={16} /> {tr('createWithAI', lang)}
                  </Button>
                  <Link to="/builder">
                    <Button variant="outline" className="rounded-xl font-semibold gap-2 w-full sm:w-auto">
                      <Icon name="MessageSquare" size={16} /> {tr('openBuilder', lang)}
                    </Button>
                  </Link>
                </div>
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
                          {new Date(p.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/settings/domain"
                            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline"
                          >
                            <Icon name="Link" size={11} /> {lang === 'ru' ? 'Домен' : 'Domain'}
                          </Link>
                          <Link
                            to={`/builder?project=${p.id}`}
                            className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <Icon name="Sparkles" size={12} /> {tr('openInEditor', lang)}
                          </Link>
                        </div>
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
                  <span className="text-sm font-medium">{tr('newProject', lang)}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* PLAN TAB */}
        {tab === 'plan' && (
          <div>
            <h1 className="font-display font-black text-2xl mb-6">{lang === 'ru' ? 'Тарифный план' : 'Pricing Plan'}</h1>
            <div className="rounded-2xl border border-primary bg-card p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${plan.color}`}>{plan.label}</span>
                  <span className="text-xs text-muted-foreground">{tr('currentPlan', lang)}</span>
                </div>
                <h3 className="font-display font-bold text-xl">{lang === 'ru' ? 'Ваш план' : 'Your plan'}: {plan.label}</h3>
                <p className="text-muted-foreground text-sm mt-1">{plan.requests} {lang === 'ru' ? 'запросов к AI в месяц' : 'AI requests per month'}</p>
              </div>
              <Button className="rounded-xl font-semibold shrink-0" asChild>
                <Link to="/pricing">{tr('upgradePlan', lang)}</Link>
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: tr('planFree', lang), price: lang === 'ru' ? 'Бесплатно' : 'Free', requests: `3 ${tr('requestsMonthly', lang)}`, features: lang === 'ru' ? ['1 сайт', 'Публикация на roboweb.site', 'Скачать HTML'] : ['1 website', 'Publish on roboweb.site', 'Download HTML'], current: user?.plan === 'free' },
                { name: tr('planPremium', lang), price: '1 490 ₽/мес', requests: `40 ${tr('requestsMonthly', lang)}`, features: lang === 'ru' ? ['5 сайтов', 'Свой домен + SSL', 'Аналитика посещений', 'Форма заявок'] : ['5 websites', 'Custom domain + SSL', 'Visit analytics', 'Lead forms'], current: user?.plan === 'premium', hot: true },
                { name: tr('planPro', lang), price: '3 490 ₽/мес', requests: `60 ${tr('requestsMonthly', lang)}`, features: lang === 'ru' ? ['Безлимитные сайты', 'Продвинутая аналитика', 'Приоритетная поддержка 24/7', 'Белый лейбл'] : ['Unlimited websites', 'Advanced analytics', 'Priority support 24/7', 'White label'], current: user?.plan === 'pro' },
              ].map(p => (
                <div key={p.name} className={`rounded-2xl border p-5 ${p.current ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  {p.hot && <span className="inline-block bg-primary text-primary-foreground text-xs font-bold rounded-full px-2.5 py-0.5 mb-2">{lang === 'ru' ? 'Популярный' : 'Popular'}</span>}
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
                  {p.current ? (
                    <Button className="w-full rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary" disabled>
                      {tr('currentPlanBtn', lang)}
                    </Button>
                  ) : (
                    <Button className="w-full rounded-xl text-sm font-semibold" asChild>
                      <Link to="/pricing">{tr('selectPlan', lang)}</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && user && (
          <div className="max-w-lg">
            <h1 className="font-display font-black text-2xl mb-6">{tr('profile', lang)}</h1>

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
                  <div className="text-xs text-muted-foreground mb-0.5">{lang === 'ru' ? 'Имя' : 'Name'}</div>
                  <div className="font-medium">{user.name}</div>
                </div>
                <div className="rounded-xl bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground mb-0.5">E-mail</div>
                  <div className="font-medium">{user.email}</div>
                </div>
                {user.created_at && (
                  <div className="rounded-xl bg-secondary/50 px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-0.5">{tr('registeredAt', lang)}</div>
                    <div className="font-medium">{new Date(user.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">{tr('projects', lang)}</div>
                <div className="text-muted-foreground text-xs">{projects.length} {tr('created', lang)}</div>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setTab('projects')}>
                {tr('goTo', lang)}
              </Button>
            </div>

            <Button variant="outline" className="w-full mt-4 rounded-xl text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5" onClick={handleLogout}>
              <Icon name="LogOut" size={15} className="mr-2" /> {tr('logout', lang)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;