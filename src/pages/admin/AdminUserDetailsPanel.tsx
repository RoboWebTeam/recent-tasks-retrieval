import { useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  type UserDetails, type UserProject, type UserOrder, type UserDomain, type UserSiteLead,
  PROJECT_STATUS_LABELS, ORDER_STATUS_LABELS, DOMAIN_STATUS_LABELS, SITE_LEAD_STATUS,
} from './adminTypes';

interface AdminUserDetailsPanelProps {
  details: UserDetails | null;
  loading: boolean;
}

type DetailsTab = 'projects' | 'orders' | 'domains' | 'leads';

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProjectsList({ projects }: { projects: UserProject[] }) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Проектов пока нет</p>;
  }
  return (
    <div className="space-y-2">
      {projects.map(p => {
        const s = PROJECT_STATUS_LABELS[p.status] ?? PROJECT_STATUS_LABELS.draft;
        return (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{p.title || 'Без названия'}</p>
              <p className="text-xs text-muted-foreground">{fmtDate(p.updated_at)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {p.slug && (
                <a href={`https://roboweb.site/site/${p.slug}`} target="_blank" rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors" title="Открыть сайт">
                  <Icon name="ExternalLink" size={13} />
                </a>
              )}
              <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${s.color}`}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrdersList({ orders }: { orders: UserOrder[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Платежей пока нет</p>;
  }
  return (
    <div className="space-y-2">
      {orders.map(o => {
        const s = ORDER_STATUS_LABELS[o.status] ?? ORDER_STATUS_LABELS.pending;
        return (
          <div key={o.order_number} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {o.order_type === 'energy' ? `Энергия +${o.energy_amount}` : (o.plan || 'Тариф')}
              </p>
              <p className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{o.amount.toLocaleString()} ₽</p>
              <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${s.color}`}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DomainsList({ domains }: { domains: UserDomain[] }) {
  if (domains.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Доменов пока нет</p>;
  }
  return (
    <div className="space-y-2">
      {domains.map(d => {
        const s = DOMAIN_STATUS_LABELS[d.status] ?? DOMAIN_STATUS_LABELS.pending;
        return (
          <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
            <div className="min-w-0 flex items-center gap-2">
              <span className="text-sm font-medium truncate">{d.domain}</span>
              {d.is_primary && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary rounded-full px-1.5 py-0.5 shrink-0">
                  Основной
                </span>
              )}
            </div>
            <span className={`text-xs font-medium rounded-full px-2 py-0.5 shrink-0 ${s.color}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SiteLeadsList({ leads }: { leads: UserSiteLead[] }) {
  if (leads.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Заявок пока нет</p>;
  }
  return (
    <div className="space-y-2">
      {leads.map(l => {
        const s = SITE_LEAD_STATUS[l.status] ?? SITE_LEAD_STATUS.new;
        return (
          <div key={l.id} className="rounded-xl bg-secondary/50 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <p className="text-sm font-medium truncate">{l.name || 'Без имени'}</p>
              <span className={`text-xs font-medium rounded-full px-2 py-0.5 shrink-0 ${s.color}`}>{s.label}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate mb-1">{l.site}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {l.phone && <a href={`tel:${l.phone}`} onClick={e => e.stopPropagation()} className="hover:text-primary">{l.phone}</a>}
              {l.email && <a href={`mailto:${l.email}`} onClick={e => e.stopPropagation()} className="hover:text-primary">{l.email}</a>}
              <span className="ml-auto">{fmtDate(l.created_at)}</span>
            </div>
            {l.message && <p className="text-xs text-foreground mt-1.5">{l.message}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function AdminUserDetailsPanel({ details, loading }: AdminUserDetailsPanelProps) {
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('projects');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
        <Icon name="Loader" size={18} className="animate-spin" />
        Загрузка…
      </div>
    );
  }

  if (!details) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Не удалось загрузить данные</p>;
  }

  const { user, projects, orders, domains, site_leads } = details;

  return (
    <div className="p-4 space-y-4">
      {/* Quota info */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary/50 px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">AI-запросы использовано</p>
          <p className="text-sm font-semibold">{user.requests_used} / {user.requests_limit}</p>
        </div>
        <div className="rounded-xl bg-secondary/50 px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">Баланс энергии</p>
          <p className="text-sm font-semibold flex items-center gap-1">
            <Icon name="Zap" size={13} className="text-amber-500" /> {user.energy_balance}
          </p>
        </div>
        {user.blocked_at && (
          <div className="rounded-xl bg-rose-50 px-3 py-2.5 sm:col-span-2">
            <p className="text-xs text-rose-600 mb-0.5">Заблокирован</p>
            <p className="text-sm font-semibold text-rose-700">{fmtDate(user.blocked_at)}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          ['projects', 'Проекты', 'Layers', projects.length],
          ['orders', 'Платежи', 'CreditCard', orders.length],
          ['domains', 'Домены', 'Globe', domains.length],
          ['leads', 'Заявки', 'Inbox', site_leads.length],
        ] as const).map(([id, label, icon, count]) => (
          <button key={id} onClick={() => setDetailsTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${detailsTab === id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            <Icon name={icon} size={13} />
            {label}
            {count > 0 && <span className="opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {detailsTab === 'projects' && <ProjectsList projects={projects} />}
      {detailsTab === 'orders' && <OrdersList orders={orders} />}
      {detailsTab === 'domains' && <DomainsList domains={domains} />}
      {detailsTab === 'leads' && <SiteLeadsList leads={site_leads} />}
    </div>
  );
}