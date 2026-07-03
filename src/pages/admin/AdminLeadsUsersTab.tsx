import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { type Lead, type User, type UserDetails, PLAN_LABELS } from './adminTypes';
import { AdminUserDetailsPanel } from './AdminUserDetailsPanel';

// ── EMAIL LEADS ──────────────────────────────────────────────────────────────

interface LeadsTabProps {
  filteredLeads: Lead[];
  search: string;
  setSearch: (s: string) => void;
  exportCSV: () => void;
}

export function LeadsTab({ filteredLeads, search, setSearch, exportCSV }: LeadsTabProps) {
  return (
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
  );
}

// ── USERS ────────────────────────────────────────────────────────────────────

interface UsersTabProps {
  filteredUsers: User[];
  search: string;
  setSearch: (s: string) => void;
  actionLoading: number | null;
  confirmDelete: number | null;
  setConfirmDelete: (id: number | null) => void;
  planChanging: number | null;
  manageUser: (userId: number, action: 'block' | 'unblock' | 'delete' | 'change_plan', plan?: string) => void;
  exportCSV: () => void;
  expandedUserId: number | null;
  onToggleExpand: (userId: number) => void;
  userDetails: UserDetails | null;
  userDetailsLoading: boolean;
  actionError?: string;
  onDismissError?: () => void;
}

export function UsersTab({
  filteredUsers, search, setSearch, actionLoading, confirmDelete,
  setConfirmDelete, planChanging, manageUser, exportCSV,
  expandedUserId, onToggleExpand, userDetails, userDetailsLoading,
  actionError, onDismissError,
}: UsersTabProps) {
  return (
    <div>
      {actionError && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl px-4 py-3 mb-4 text-sm">
          <Icon name="AlertCircle" size={15} className="shrink-0" />
          <span className="flex-1">{actionError}</span>
          {onDismissError && (
            <button onClick={onDismissError}><Icon name="X" size={14} /></button>
          )}
        </div>
      )}
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
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, i) => {
                  const plan = PLAN_LABELS[user.plan] ?? PLAN_LABELS.free;
                  const initials = user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                  const isLoad = actionLoading === user.id;
                  const isConf = confirmDelete === user.id;
                  const isExpanded = expandedUserId === user.id;
                  return (
                    <Fragment key={user.id}>
                    <tr onClick={() => onToggleExpand(user.id)} className={`border-b border-border last:border-0 transition-colors cursor-pointer ${user.blocked ? 'bg-rose-50/50' : 'hover:bg-secondary/30'} ${isExpanded ? 'bg-secondary/40' : ''}`}>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`grid h-8 w-8 place-items-center rounded-xl font-bold text-xs shrink-0 ${user.blocked ? 'bg-rose-200 text-rose-700' : 'bg-primary text-primary-foreground'}`}>
                            {user.blocked ? <Icon name="Ban" size={14} /> : (initials || '?')}
                          </div>
                          <div>
                            <div className="font-medium leading-tight">{user.name || '—'}</div>
                            <a href={`mailto:${user.email}`} onClick={e => e.stopPropagation()} className="text-xs text-muted-foreground hover:text-primary">{user.email}</a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${plan.color}`}>{plan.label}</span>
                          <div className="relative group">
                            <button className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Изменить тариф">
                              <Icon name={planChanging === user.id ? 'Loader' : 'ChevronDown'} size={11} className={planChanging === user.id ? 'animate-spin' : ''} />
                            </button>
                            <div className="absolute left-0 top-6 z-20 hidden group-hover:flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[130px]">
                              {(['free', 'premium', 'pro_60', 'pro_80', 'pro_200', 'pro_400', 'pro_800'] as const).map(p => (
                                <button key={p} onClick={() => manageUser(user.id, 'change_plan', p)}
                                  className={`px-3 py-2 text-xs font-semibold text-left hover:bg-secondary transition-colors whitespace-nowrap ${user.plan === p ? 'text-primary' : 'text-foreground'}`}>
                                  {PLAN_LABELS[p]?.label ?? p}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
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
                            <div className="flex items-center gap-1" title="Удаление безвозвратно: пользователь, его проекты и все данные будут удалены навсегда">
                              <button onClick={() => manageUser(user.id, 'delete')} disabled={isLoad}
                                className="h-7 px-2.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors whitespace-nowrap">
                                {isLoad ? '…' : 'Удалить навсегда'}
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
                      <td className="px-2 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onToggleExpand(user.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors mx-auto"
                          title={isExpanded ? 'Свернуть' : 'Подробнее'}>
                          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={15} />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border last:border-0 bg-secondary/20">
                        <td colSpan={7} className="p-0">
                          <AdminUserDetailsPanel details={userDetails} loading={userDetailsLoading} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
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
  );
}