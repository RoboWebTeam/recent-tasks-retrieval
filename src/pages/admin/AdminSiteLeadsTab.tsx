import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { type SiteLead, SITE_LEAD_STATUS } from './adminTypes';

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
        <div className="flex gap-2 sm:ml-auto">
          <div className="relative flex-1 sm:flex-none">
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 rounded-xl text-sm w-full sm:w-48" />
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
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-xl mx-auto">
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
