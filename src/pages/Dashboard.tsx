import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  getSession, getStoredUser, clearSession, storeUser,
  apiGetMe, apiGetProjects, apiCreateProject, apiDeleteProject,
  apiUpdateName, apiChangePassword, apiDeleteAccount, apiGetOrders, apiDisconnectGithub,
  type User, type Project, type Order,
} from '@/lib/auth';
import { getLang, tr } from '@/lib/i18n';
import DashboardHeader from '@/components/DashboardHeader';
import { DashboardFooter } from '@/components/DashboardFooter';
import DashboardProjectsTab from '@/components/dashboard/DashboardProjectsTab';
import DashboardPlanTab from '@/components/dashboard/DashboardPlanTab';
import DashboardProfileTab from '@/components/dashboard/DashboardProfileTab';
import { trackGoal, GOALS } from '@/lib/analytics';
import { apiUrl } from '@/lib/apiConfig';

const YOOKASSA_URL = apiUrl('yookassa');

const getPlanLabels = (lang: ReturnType<typeof getLang>) => ({
  free:     { label: tr('planFree', lang),    color: 'bg-secondary text-secondary-foreground', requests: '10' },
  premium:  { label: tr('planPremium', lang), color: 'bg-primary text-primary-foreground',     requests: '30' },
  pro_60:   { label: tr('planPro', lang),     color: 'bg-foreground text-background',           requests: '60' },
  pro_80:   { label: tr('planPro', lang),     color: 'bg-foreground text-background',           requests: '80' },
  pro_200:  { label: tr('planPro', lang),     color: 'bg-foreground text-background',           requests: '160' },
  pro_400:  { label: tr('planPro', lang),     color: 'bg-foreground text-background',           requests: '320' },
  pro_800:  { label: tr('planPro', lang),     color: 'bg-foreground text-background',           requests: '660' },
});

const getStatusConfig = (lang: ReturnType<typeof getLang>) => ({
  draft:     { label: tr('draft', lang),     color: 'text-muted-foreground bg-secondary',   icon: 'FileText' },
  building:  { label: tr('building', lang),  color: 'text-amber-700 dark:text-amber-300 bg-amber-500/15',       icon: 'Loader' },
  published: { label: tr('published', lang), color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15',   icon: 'Globe' },
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

  // Профиль
  const [nameValue, setNameValue] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [disconnectingGithub, setDisconnectingGithub] = useState(false);

  // Энергия
  const [buyingEnergy, setBuyingEnergy] = useState<string | null>(null);
  const [energyError, setEnergyError] = useState('');

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
      .then(p => {
        if (!Array.isArray(p)) return;
        // Проекты с незавершённой работой (есть переписка с ассистентом) поднимаем выше,
        // чтобы пользователь сразу видел, где продолжить. Внутри групп сохраняется
        // исходный порядок от бэкенда — по дате последнего изменения (свежие сверху).
        const sorted = [...p].sort((a, b) => {
          const aHasChat = (a.chat_count ?? 0) > 0 ? 1 : 0;
          const bHasChat = (b.chat_count ?? 0) > 0 ? 1 : 0;
          return bHasChat - aHasChat;
        });
        setProjects(sorted);
      })
      .catch(() => {/* пустой список */});
  }, []);

  useEffect(() => {
    if (user) setNameValue(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (tab !== 'profile') return;
    const session = getSession();
    if (!session) return;
    apiGetOrders(session).then(setOrders).catch(() => {/* пустая история */});
  }, [tab]);

  const handleLogout = () => { clearSession(); navigate('/'); };

  const handleSaveName = async () => {
    if (!nameValue.trim() || !user) return;
    setNameSaving(true);
    setNameSaved(false);
    try {
      const session = getSession()!;
      await apiUpdateName(session, nameValue.trim());
      const updated = { ...user, name: nameValue.trim() };
      setUser(updated);
      storeUser(updated);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      /* показываем прежнее значение */
    }
    setNameSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);
    setPwSaving(true);
    try {
      const session = getSession()!;
      await apiChangePassword(session, oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : (lang === 'ru' ? 'Ошибка смены пароля' : 'Password change error'));
    }
    setPwSaving(false);
  };

  const handleDisconnectGithub = async () => {
    if (!user) return;
    setDisconnectingGithub(true);
    try {
      const session = getSession()!;
      await apiDisconnectGithub(session);
      const updated = { ...user, github_login: null };
      setUser(updated);
      storeUser(updated);
    } catch {
      /* тихо игнорируем */
    }
    setDisconnectingGithub(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      const session = getSession()!;
      await apiDeleteAccount(session, deletePassword);
      clearSession();
      navigate('/');
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : (lang === 'ru' ? 'Ошибка удаления аккаунта' : 'Account deletion error'));
    }
    setDeleting(false);
  };

  const handleBuyEnergy = async (code: string, requests: number, price: number) => {
    if (!user) return;
    setBuyingEnergy(code);
    setEnergyError('');
    try {
      const res = await fetch(YOOKASSA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price,
          user_email: user.email,
          user_name: user.name,
          description: lang === 'ru' ? `Пакет энергии: ${requests} запросов` : `Energy package: ${requests} requests`,
          return_url: `${window.location.origin}/pricing/status`,
          order_type: 'energy',
          energy_amount: requests,
          user_id: user.id,
        }),
      });
      const raw = await res.json();
      const data = raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
      if (!res.ok || data.error) {
        throw new Error(data.error || (lang === 'ru' ? 'Ошибка создания платежа' : 'Payment creation error'));
      }
      if (data.payment_url) {
        trackGoal(GOALS.ENERGY_PURCHASE_INITIATED, { requests });
        window.location.href = data.payment_url;
      }
    } catch (err: unknown) {
      setEnergyError(err instanceof Error ? err.message : (lang === 'ru' ? 'Ошибка оплаты' : 'Payment error'));
    }
    setBuyingEnergy(null);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const session = getSession()!;
      const project = await apiCreateProject(session, newTitle.trim(), newDesc.trim());
      trackGoal(GOALS.PROJECT_CREATED);
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

  const handleDeleteProject = async (projectId: number) => {
    // Оптимистично убираем карточку сразу; при ошибке возвращаем список обратно.
    const prev = projects;
    setProjects(list => list.filter(p => p.id !== projectId));
    try {
      const session = getSession()!;
      await apiDeleteProject(session, projectId);
    } catch {
      setProjects(prev);
    }
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
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader active={tab} />

      <div className="container py-5 sm:py-6 md:py-8 max-w-5xl flex-1">

        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <DashboardProjectsTab
            lang={lang}
            projects={projects}
            STATUS_CONFIG={STATUS_CONFIG}
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newDesc={newDesc}
            setNewDesc={setNewDesc}
            createError={createError}
            creating={creating}
            handleCreateProject={handleCreateProject}
            handleDeleteProject={handleDeleteProject}
          />
        )}

        {/* PLAN TAB */}
        {tab === 'plan' && (
          <DashboardPlanTab
            lang={lang}
            user={user}
            plan={plan}
            buyingEnergy={buyingEnergy}
            energyError={energyError}
            handleBuyEnergy={handleBuyEnergy}
          />
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && user && (
          <DashboardProfileTab
            lang={lang}
            user={user}
            plan={plan}
            projectsCount={projects.length}
            setTab={setTab}
            nameValue={nameValue}
            setNameValue={setNameValue}
            nameSaving={nameSaving}
            nameSaved={nameSaved}
            handleSaveName={handleSaveName}
            oldPassword={oldPassword}
            setOldPassword={setOldPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            pwSaving={pwSaving}
            pwError={pwError}
            pwSaved={pwSaved}
            handleChangePassword={handleChangePassword}
            orders={orders}
            handleLogout={handleLogout}
            disconnectingGithub={disconnectingGithub}
            handleDisconnectGithub={handleDisconnectGithub}
            deleteOpen={deleteOpen}
            setDeleteOpen={setDeleteOpen}
            deletePassword={deletePassword}
            setDeletePassword={setDeletePassword}
            deleteError={deleteError}
            deleting={deleting}
            handleDeleteAccount={handleDeleteAccount}
          />
        )}
      </div>

      <DashboardFooter lang={lang} />
    </div>
  );
};

export default Dashboard;