import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getLang, tr } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import DashboardHeader from '@/components/DashboardHeader';
import { apiUrl } from '@/lib/apiConfig';

const SITE_LEADS_URL = apiUrl('site-leads');

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  site: string;
  date: string;
  status: 'new' | 'processed' | 'rejected';
}

const STATUS_CONFIG = {
  new:       { label: { ru: 'Новая',      en: 'New' },       color: 'bg-primary/10 text-primary',            dot: 'bg-primary' },
  processed: { label: { ru: 'Обработана', en: 'Processed' }, color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',        dot: 'bg-emerald-500' },
  rejected:  { label: { ru: 'Отклонена',  en: 'Rejected' },  color: 'bg-secondary text-muted-foreground',    dot: 'bg-muted-foreground' },
};

export default function Leads() {
  const lang = getLang();
  const isRu = lang === 'ru';
  const session = getSession();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'processed' | 'rejected'>('all');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  const fetchLeads = () => {
    if (!session) return;
    setLoading(true);
    fetch(SITE_LEADS_URL, { headers: { 'x-session-id': session } })
      .then(r => r.json())
      .then(raw => {
        const data = raw.body !== undefined
          ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body)
          : raw;
        if (data.error) { setError(data.error); return; }
        setLeads(data.leads || []);
        setCounts(data.counts || {});
      })
      .catch(() => setError(tr('errorLoad', lang)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [session]);

  const changeStatus = async (id: number, status: Lead['status']) => {
    if (!session) return;
    setStatusUpdating(id);
    try {
      const res = await fetch(SITE_LEADS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': session },
        body: JSON.stringify({ action: 'update_status', id, status }),
      });
      const raw = await res.json();
      const data = raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
      if (data.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
        // Обновляем счётчики
        setCounts(prev => {
          const oldStatus = leads.find(l => l.id === id)?.status;
          const updated = { ...prev };
          if (oldStatus) updated[oldStatus] = Math.max(0, (updated[oldStatus] || 0) - 1);
          updated[status] = (updated[status] || 0) + 1;
          return updated;
        });
      }
    } finally {
      setStatusUpdating(null);
    }
  };

  const totalCount = Object.values(counts).reduce((s, v) => s + v, 0);
  const newCount = counts['new'] || 0;

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  const filterTabs = [
    { id: 'all', label: isRu ? 'Все' : 'All', count: totalCount },
    { id: 'new', label: isRu ? 'Новые' : 'New', count: counts['new'] || 0 },
    { id: 'processed', label: isRu ? 'Обработанные' : 'Processed', count: counts['processed'] || 0 },
    { id: 'rejected', label: isRu ? 'Отклонённые' : 'Rejected', count: counts['rejected'] || 0 },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader active="leads" leadsCount={newCount} />

      <main className="container py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl">{isRu ? 'Заявки с сайтов' : 'Site leads'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRu ? 'Все обращения с ваших сайтов в одном месте' : 'All inquiries from your sites in one place'}
            </p>
          </div>
          <button onClick={fetchLeads} disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-secondary text-sm text-muted-foreground hover:text-foreground hover:bg-background transition-colors">
            <Icon name={loading ? 'Loader' : 'RefreshCw'} size={14} className={loading ? 'animate-spin' : ''} />
            {isRu ? 'Обновить' : 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: isRu ? 'Всего' : 'Total', value: totalCount, icon: 'Inbox', color: 'text-foreground bg-secondary' },
            { label: isRu ? 'Новые' : 'New', value: newCount, icon: 'Bell', color: 'text-primary bg-primary/10' },
            { label: isRu ? 'Конверсия' : 'Conv.', value: '—', icon: 'TrendingUp', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 ${stat.color}`}>
                <Icon name={stat.icon} size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground">{loading ? '…' : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-2xl px-4 py-3 mb-4 text-sm">
            <Icon name="AlertCircle" size={15} /> {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {filterTabs.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === f.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {f.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === f.id ? 'bg-white/20' : 'bg-secondary'}`}>{f.count}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-5">
          {/* List */}
          <div className="flex-1 min-w-0 space-y-2">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-secondary shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary rounded w-1/3" />
                      <div className="h-3 bg-secondary rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary border border-border mb-4">
                  <Icon name="Inbox" size={28} className="text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-foreground mb-1">{isRu ? 'Заявок пока нет' : 'No leads yet'}</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {isRu ? 'Когда посетители оставят заявки на ваших сайтах — они появятся здесь' : 'When visitors submit forms on your sites — they will appear here'}
                </p>
              </div>
            ) : filtered.map(lead => {
              const s = STATUS_CONFIG[lead.status];
              const isSelected = selected?.id === lead.id;
              return (
                <button key={lead.id} onClick={() => setSelected(isSelected ? null : lead)}
                  className={`w-full text-left bg-card border rounded-2xl p-4 transition-all hover:shadow-md ${isSelected ? 'border-primary shadow-md' : 'border-border'}`}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {lead.name ? lead.name[0].toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{lead.name || '—'}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {s.label[lang as 'ru' | 'en']}
                        </span>
                      </div>
                      {lead.message && <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{lead.message}</p>}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Icon name="Globe" size={10} /> {lead.site}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(lead.date).toLocaleString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-72 shrink-0 hidden lg:block">
              <div className="sticky top-20 bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base">{isRu ? 'Детали' : 'Details'}</h3>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <Icon name="X" size={15} />
                  </button>
                </div>

                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-xl mx-auto">
                  {selected.name ? selected.name[0].toUpperCase() : '?'}
                </div>

                <div className="text-center">
                  <p className="font-bold">{selected.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{selected.site}</p>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  {selected.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0"><Icon name="Phone" size={13} className="text-muted-foreground" /></div>
                      <div><p className="text-[10px] text-muted-foreground">{isRu ? 'Телефон' : 'Phone'}</p><a href={`tel:${selected.phone}`} className="text-sm font-semibold text-primary hover:underline">{selected.phone}</a></div>
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0"><Icon name="Mail" size={13} className="text-muted-foreground" /></div>
                      <div><p className="text-[10px] text-muted-foreground">Email</p><a href={`mailto:${selected.email}`} className="text-sm font-semibold text-primary hover:underline truncate block max-w-[170px]">{selected.email}</a></div>
                    </div>
                  )}
                  {selected.message && (
                    <div className="flex items-start gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0 mt-0.5"><Icon name="MessageSquare" size={13} className="text-muted-foreground" /></div>
                      <div><p className="text-[10px] text-muted-foreground mb-1">{isRu ? 'Сообщение' : 'Message'}</p><p className="text-sm leading-relaxed">{selected.message}</p></div>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isRu ? 'Статус' : 'Status'}</p>
                  {(['new', 'processed', 'rejected'] as const).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    const icons = { new: 'Bell', processed: 'CheckCircle', rejected: 'X' } as const;
                    return (
                      <button key={s} onClick={() => changeStatus(selected.id, s)} disabled={statusUpdating === selected.id}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${selected.status === s ? 'bg-primary text-primary-foreground font-semibold' : 'bg-secondary hover:bg-background text-muted-foreground hover:text-foreground border border-border'}`}>
                        <Icon name={statusUpdating === selected.id ? 'Loader' : icons[s]} size={13} className={statusUpdating === selected.id ? 'animate-spin' : ''} />
                        {cfg.label[lang as 'ru' | 'en']}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  {selected.phone && (
                    <Button size="sm" className="flex-1 rounded-xl h-9 text-xs gap-1.5" asChild>
                      <a href={`tel:${selected.phone}`}><Icon name="Phone" size={12} />{isRu ? 'Позвонить' : 'Call'}</a>
                    </Button>
                  )}
                  {selected.email && (
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl h-9 text-xs gap-1.5" asChild>
                      <a href={`mailto:${selected.email}`}><Icon name="Mail" size={12} />Email</a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}