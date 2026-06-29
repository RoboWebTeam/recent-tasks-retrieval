import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getLang } from '@/lib/i18n';

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

const DEMO_LEADS: Lead[] = [
  { id: 1, name: 'Александр Петров', phone: '+7 999 123-45-67', email: 'alex@mail.ru', message: 'Хочу заказать кофе на вынос, есть ли акции?', site: 'brewco.roboweb.site', date: '2026-06-29T10:23:00', status: 'new' },
  { id: 2, name: 'Мария Иванова', phone: '+7 926 555-12-34', email: 'masha@gmail.com', message: 'Интересует доставка, какой минимальный заказ?', site: 'brewco.roboweb.site', date: '2026-06-29T09:15:00', status: 'new' },
  { id: 3, name: 'Дмитрий Козлов', phone: '+7 916 777-88-99', email: '', message: 'Можно ли забронировать столик на 4 человека?', site: 'brewco.roboweb.site', date: '2026-06-28T18:45:00', status: 'processed' },
  { id: 4, name: 'Ольга Смирнова', phone: '+7 903 444-22-11', email: 'olga@yandex.ru', message: 'Вы работаете в выходные?', site: 'mybarber.roboweb.site', date: '2026-06-28T14:30:00', status: 'processed' },
  { id: 5, name: 'Иван Новиков', phone: '+7 985 321-65-43', email: 'ivan@mail.ru', message: 'Хочу записаться на стрижку в субботу', site: 'mybarber.roboweb.site', date: '2026-06-27T11:10:00', status: 'rejected' },
];

const STATUS_CONFIG = {
  new: { label: { ru: 'Новая', en: 'New' }, color: 'bg-primary/10 text-primary', dot: 'bg-primary' },
  processed: { label: { ru: 'Обработана', en: 'Processed' }, color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: { ru: 'Отклонена', en: 'Rejected' }, color: 'bg-secondary text-muted-foreground', dot: 'bg-muted-foreground' },
};

export default function Leads() {
  const lang = getLang();
  const isRu = lang === 'ru';
  const [leads, setLeads] = useState<Lead[]>(DEMO_LEADS);
  const [filter, setFilter] = useState<'all' | 'new' | 'processed' | 'rejected'>('all');
  const [selected, setSelected] = useState<Lead | null>(null);

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
  const newCount = leads.filter(l => l.status === 'new').length;

  const changeStatus = (id: number, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const filters = [
    { id: 'all', label: isRu ? 'Все' : 'All', count: leads.length },
    { id: 'new', label: isRu ? 'Новые' : 'New', count: leads.filter(l => l.status === 'new').length },
    { id: 'processed', label: isRu ? 'Обработанные' : 'Processed', count: leads.filter(l => l.status === 'processed').length },
    { id: 'rejected', label: isRu ? 'Отклонённые' : 'Rejected', count: leads.filter(l => l.status === 'rejected').length },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/dashboard" className="grid h-7 w-7 place-items-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <Icon name="ArrowLeft" size={16} />
          </Link>
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-base">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={14} />
            </span>
            <span className="hidden sm:block">Roboweb</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium flex items-center gap-2">
            {isRu ? 'Заявки' : 'Leads'}
            {newCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {newCount}
              </span>
            )}
          </span>
        </div>
      </header>

      <main className="container py-8 max-w-5xl">
        {/* Top */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl">
              {isRu ? 'Заявки с сайтов' : 'Site leads'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRu ? 'Все обращения с ваших сайтов в одном месте' : 'All inquiries from your sites in one place'}
            </p>
          </div>
          <Button variant="outline" className="rounded-xl h-9 gap-2 text-sm" asChild>
            <Link to="/settings/domain">
              <Icon name="Settings" size={14} />
              {isRu ? 'Настроить уведомления' : 'Configure notifications'}
            </Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: isRu ? 'Всего заявок' : 'Total leads', value: leads.length, icon: 'Inbox', color: 'text-foreground bg-secondary' },
            { label: isRu ? 'Новые' : 'New', value: leads.filter(l => l.status === 'new').length, icon: 'Bell', color: 'text-primary bg-primary/10' },
            { label: isRu ? 'Конверсия' : 'Conversion', value: '2.8%', icon: 'TrendingUp', color: 'text-emerald-600 bg-emerald-100' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 ${stat.color}`}>
                <Icon name={stat.icon} size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === f.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {f.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === f.id ? 'bg-white/20' : 'bg-secondary'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-5">
          {/* Leads list */}
          <div className="flex-1 min-w-0 space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary border border-border mb-4">
                  <Icon name="Inbox" size={28} className="text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-foreground mb-1">{isRu ? 'Заявок пока нет' : 'No leads yet'}</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {isRu ? 'Добавьте форму заявок на свой сайт через редактор' : 'Add a lead form to your site via the editor'}
                </p>
              </div>
            ) : (
              filtered.map(lead => {
                const s = STATUS_CONFIG[lead.status];
                const isSelected = selected?.id === lead.id;
                return (
                  <button key={lead.id} onClick={() => setSelected(isSelected ? null : lead)}
                    className={`w-full text-left bg-card border rounded-2xl p-4 transition-all hover:shadow-md ${isSelected ? 'border-primary shadow-md' : 'border-border'}`}>
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0">
                        {lead.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{lead.name}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            {s.label[lang as 'ru' | 'en']}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{lead.message}</p>
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
              })
            )}
          </div>

          {/* Lead detail panel */}
          {selected && (
            <div className="w-72 shrink-0 hidden lg:block">
              <div className="sticky top-20 bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base">{isRu ? 'Детали заявки' : 'Lead details'}</h3>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="X" size={15} />
                  </button>
                </div>

                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary font-black text-xl mx-auto">
                  {selected.name[0]}
                </div>

                <div className="text-center">
                  <p className="font-bold text-foreground">{selected.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.site}</p>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  {selected.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0">
                        <Icon name="Phone" size={13} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">{isRu ? 'Телефон' : 'Phone'}</p>
                        <a href={`tel:${selected.phone}`} className="text-sm font-semibold text-primary hover:underline">{selected.phone}</a>
                      </div>
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0">
                        <Icon name="Mail" size={13} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Email</p>
                        <a href={`mailto:${selected.email}`} className="text-sm font-semibold text-primary hover:underline truncate block max-w-[170px]">{selected.email}</a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary shrink-0 mt-0.5">
                      <Icon name="MessageSquare" size={13} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">{isRu ? 'Сообщение' : 'Message'}</p>
                      <p className="text-sm text-foreground leading-relaxed">{selected.message}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isRu ? 'Статус' : 'Status'}</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {([
                      { id: 'new', label: isRu ? 'Новая' : 'New', icon: 'Bell' },
                      { id: 'processed', label: isRu ? 'Обработана' : 'Processed', icon: 'CheckCircle' },
                      { id: 'rejected', label: isRu ? 'Отклонить' : 'Reject', icon: 'X' },
                    ] as const).map(s => (
                      <button key={s.id} onClick={() => changeStatus(selected.id, s.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${selected.status === s.id ? 'bg-primary text-primary-foreground font-semibold' : 'bg-secondary hover:bg-background text-muted-foreground hover:text-foreground border border-border'}`}>
                        <Icon name={s.icon} size={13} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {selected.phone && (
                    <Button size="sm" className="flex-1 rounded-xl h-9 text-xs gap-1.5" asChild>
                      <a href={`tel:${selected.phone}`}><Icon name="Phone" size={13} />{isRu ? 'Позвонить' : 'Call'}</a>
                    </Button>
                  )}
                  {selected.email && (
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl h-9 text-xs gap-1.5" asChild>
                      <a href={`mailto:${selected.email}`}><Icon name="Mail" size={13} />Email</a>
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
