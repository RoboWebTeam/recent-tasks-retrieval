import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  type Lead, type User, type SiteLead, type LogEntry, type Notification,
  PLAN_LABELS, SITE_LEAD_STATUS, ACTION_LABELS, NOTIF_ICONS,
} from './adminTypes';

// ── SITE LEADS ──────────────────────────────────────────────────────────────

interface SiteLeadsTabProps {
  siteLeadsLoading: boolean;
  siteLeadFilter: 'all' | 'new' | 'processed' | 'rejected';
  setSiteLeadFilter: (f: 'all' | 'new' | 'processed' | 'rejected') => void;
  siteLeadCounts: Record<string, number>;
  filteredSiteLeads: SiteLead[];
  search: string;
  setSearch: (s: string) => void;
  selectedLead: SiteLead | null;
  setSelectedLead: (l: SiteLead | null) => void;
  changeSiteLeadStatus: (id: number, status: SiteLead['status']) => void;
  exportCSV: () => void;
}

export function SiteLeadsTab({
  siteLeadsLoading, siteLeadFilter, setSiteLeadFilter, siteLeadCounts,
  filteredSiteLeads, search, setSearch, selectedLead, setSelectedLead,
  changeSiteLeadStatus, exportCSV,
}: SiteLeadsTabProps) {
  return (
    <div>
      {siteLeadsLoading && (
        <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
          <Icon name="Loader" size={18} className="animate-spin" /> Загружаем заявки…
        </div>
      )}
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
  );
}

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
}

export function UsersTab({
  filteredUsers, search, setSearch, actionLoading, confirmDelete,
  setConfirmDelete, planChanging, manageUser, exportCSV,
}: UsersTabProps) {
  return (
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
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${plan.color}`}>{plan.label}</span>
                          <div className="relative group">
                            <button className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Изменить тариф">
                              <Icon name={planChanging === user.id ? 'Loader' : 'ChevronDown'} size={11} className={planChanging === user.id ? 'animate-spin' : ''} />
                            </button>
                            <div className="absolute left-0 top-6 z-20 hidden group-hover:flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[100px]">
                              {(['free', 'premium', 'pro'] as const).map(p => (
                                <button key={p} onClick={() => manageUser(user.id, 'change_plan', p)}
                                  className={`px-3 py-2 text-xs font-semibold text-left hover:bg-secondary transition-colors ${user.plan === p ? 'text-primary' : 'text-foreground'}`}>
                                  {p === 'free' ? 'Пробный' : p === 'premium' ? 'Премиум' : 'Профи'}
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
  );
}

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
