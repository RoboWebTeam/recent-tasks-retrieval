import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';
import { getSession, apiGetSiteUsers, apiDeleteSiteUser, type SiteUser } from '@/lib/auth';

interface Props {
  lang: Lang;
  projectId: number;
}

export default function BuilderCoreUsers({ lang, projectId }: Props) {
  const isRu = lang === 'ru';
  const session = getSession();
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const d = await apiGetSiteUsers(session, projectId);
      setUsers(d.users);
      setTotal(d.total);
    } catch { /* пусто */ }
    setLoading(false);
  }, [session, projectId]);

  useEffect(() => { load(); }, [load]);

  const remove = async (u: SiteUser) => {
    if (!session) return;
    await apiDeleteSiteUser(session, projectId, u.id);
    setUsers(prev => prev.filter(x => x.id !== u.id));
    setTotal(t => Math.max(0, t - 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Icon name="Loader" size={18} className="animate-spin" /> {isRu ? 'Загрузка…' : 'Loading…'}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-dashed border-border p-10 text-center max-w-md mx-auto">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
            <Icon name="Users" size={26} />
          </div>
          <h3 className="font-bold text-lg mb-2">{isRu ? 'Пользователей сайта пока нет' : 'No site users yet'}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isRu
              ? 'Попросите в чате «добавь личный кабинет со входом и регистрацией» — посетители сайта смогут регистрироваться и видеть свои заказы, а вы увидите их здесь.'
              : 'Ask in chat to “add a personal account with login and registration” — site visitors can sign up and see their orders, and you\'ll see them here.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="font-bold text-base">{isRu ? 'Пользователи сайта' : 'Site users'}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRu ? `Зарегистрированные посетители — всего ${total}` : `Registered visitors — ${total} total`}
        </p>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary shrink-0 text-sm font-bold">
              {(u.name || u.email || '?').trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{u.name || (isRu ? 'Без имени' : 'No name')}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{new Date(u.created_at).toLocaleDateString(isRu ? 'ru' : 'en')}</span>
            <button onClick={() => remove(u)} className="shrink-0 grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <Icon name="Trash2" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
