import Icon from '@/components/ui/icon';
import { type LogEntry, type Notification, ACTION_LABELS, NOTIF_ICONS } from './adminTypes';

// ── LOG ──────────────────────────────────────────────────────────────────────

interface LogTabProps {
  activityLogs: LogEntry[];
  activityLoading: boolean;
  logActionFilter: string;
  setLogActionFilter: (f: string) => void;
  fetchLog: (key: string, action: string) => void;
  adminKey: string;
}

export function LogTab({ activityLogs, activityLoading, logActionFilter, setLogActionFilter, fetchLog, adminKey }: LogTabProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[['', 'Все'], ['register', 'Регистрации'], ['generate_site', 'Генерации'], ['create_project', 'Проекты'], ['change_plan', 'Тарифы'], ['block_user', 'Блокировки']].map(([val, label]) => (
            <button key={val} onClick={() => { setLogActionFilter(val); fetchLog(adminKey, val); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${logActionFilter === val ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => fetchLog(adminKey, logActionFilter)} disabled={activityLoading}
          className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Icon name={activityLoading ? 'Loader' : 'RefreshCw'} size={13} className={activityLoading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {activityLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Icon name="Loader" size={18} className="animate-spin" /> Загружаем лог…
        </div>
      ) : activityLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="Activity" size={36} className="mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Действий пока нет</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Действие</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Пользователь</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Детали</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Дата</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map(log => {
                  const cfg = ACTION_LABELS[log.action] ?? { label: log.action, color: 'text-muted-foreground bg-secondary', icon: 'Activity' };
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <Icon name={cfg.icon} size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {log.user_id ? (
                          <div>
                            <p className="font-medium text-foreground text-xs">{log.user_name}</p>
                            <p className="text-muted-foreground text-[10px]">{log.user_email}</p>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.meta && Object.keys(log.meta).length > 0
                            ? Object.entries(log.meta).filter(([k]) => k !== 'user_id').slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-3 text-xs text-muted-foreground text-right border-t border-border">
            Показано: {activityLogs.length}
          </p>
        </div>
      )}
    </div>
  );
}

// ── NOTIFICATIONS ────────────────────────────────────────────────────────────

interface NotificationsTabProps {
  notifications: Notification[];
  notifsLoading: boolean;
  unreadCount: number;
  markAllRead: () => void;
  fetchNotifications: (key: string) => void;
  adminKey: string;
}

export function NotificationsTab({ notifications, notifsLoading, unreadCount, markAllRead, fetchNotifications, adminKey }: NotificationsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитаны'}
        </p>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="CheckCheck" size={13} /> Прочитать все
            </button>
          )}
          <button onClick={() => fetchNotifications(adminKey)} disabled={notifsLoading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Icon name={notifsLoading ? 'Loader' : 'RefreshCw'} size={13} className={notifsLoading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </div>

      {notifsLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Icon name="Loader" size={18} className="animate-spin" /> Загружаем…
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary border border-border mb-4">
            <Icon name="Bell" size={28} className="text-muted-foreground/30" />
          </div>
          <p className="font-semibold text-foreground mb-1">Уведомлений нет</p>
          <p className="text-sm text-muted-foreground">Они появятся при важных событиях: регистрации, блокировках, сменах тарифа</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const icon = NOTIF_ICONS[n.type] || 'Bell';
            const isNew = !n.is_read;
            let meta: Record<string, unknown> = {};
            try { meta = JSON.parse(n.body); } catch { /* ok */ }
            return (
              <div key={n.id} className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${isNew ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                <div className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${isNew ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  <Icon name={icon} size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${isNew ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                    {isNew && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  {meta && Object.keys(meta).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {Object.entries(meta).filter(([k]) => k !== 'user_id').slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(n.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
