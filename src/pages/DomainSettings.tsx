import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getLang } from '@/lib/i18n';
import DashboardHeader from '@/components/DashboardHeader';
import {
  getSession,
  apiGetDomains, apiAddDomain, apiVerifyDomain, apiSetPrimaryDomain,
  apiSetDomainRedirect, apiAssignDomainProject, apiDeleteDomain,
  type Domain, type DnsCheckResult,
} from '@/lib/auth';

const SERVER_IP = '185.230.209.10';
const CNAME_VALUE = 'cname.roboweb.site';

const REGISTRAR_LINKS: Record<string, string> = {
  'Reg.ru': 'https://www.reg.ru/support/hosting-and-domains/dns-i-nastroika-domenov/kak-izmenit-dns-zapisi-dlya-domena',
  'RuCenter (Nic.ru)': 'https://www.nic.ru/help/dns-nastrojka_7402.html',
  Timeweb: 'https://timeweb.com/ru/docs/domain/kak-nastroit-dns-zapisi-domena',
  Yandex: 'https://yandex.ru/support/domain/setting-up-servers.html',
  GoDaddy: 'https://www.godaddy.com/help/add-an-a-record-19238',
  Namecheap: 'https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain',
  Cloudflare: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/',
  Beget: 'https://beget.com/ru/kb/how-to/domains/upravlenie-dns-zapisyami',
};

const REGISTRARS_FALLBACK = [
  { name: 'Reg.ru', url: REGISTRAR_LINKS['Reg.ru'] },
  { name: 'RuCenter (Nic.ru)', url: REGISTRAR_LINKS['RuCenter (Nic.ru)'] },
  { name: 'Timeweb', url: REGISTRAR_LINKS.Timeweb },
  { name: 'GoDaddy', url: REGISTRAR_LINKS.GoDaddy },
  { name: 'Namecheap', url: REGISTRAR_LINKS.Namecheap },
  { name: 'Cloudflare', url: REGISTRAR_LINKS.Cloudflare },
];

const BUY_DOMAIN_URL = 'https://www.reg.ru/domain/new';

function validateDomain(val: string) {
  const re = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return re.test(val.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''));
}

function cleanDomain(val: string) {
  return val.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
}

export default function DomainSettings() {
  const lang = getLang();
  const isRu = lang === 'ru';
  const session = getSession();

  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newDomainError, setNewDomainError] = useState('');
  const [adding, setAdding] = useState(false);

  const [selected, setSelected] = useState<Domain | null>(null);
  const [dnsResult, setDnsResult] = useState<DnsCheckResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [copiedRow, setCopiedRow] = useState<string | null>(null);
  const [savingRedirect, setSavingRedirect] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDomains = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiGetDomains(session);
      setDomains(data.domains);
      setProjects(data.projects);
      setSelected(prev => {
        if (!prev) return prev;
        return data.domains.find(d => d.id === prev.id) || null;
      });
    } catch {
      /* пустой список при ошибке */
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { loadDomains(); }, [loadDomains]);

  // Автопроверка DNS каждые 15 секунд для доменов в статусе pending
  useEffect(() => {
    const hasPending = domains.some(d => d.status === 'pending');
    if (!hasPending || !session) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      domains.filter(d => d.status === 'pending').forEach(d => {
        apiVerifyDomain(session, d.id).then(() => loadDomains()).catch(() => {/* тихо */});
      });
    }, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domains.map(d => d.status).join(','), session]);

  const handleAddDomain = async () => {
    if (!session) return;
    const clean = cleanDomain(newDomain);
    if (!validateDomain(clean)) {
      setNewDomainError(isRu ? 'Некорректный формат домена' : 'Invalid domain format');
      return;
    }
    setAdding(true);
    setNewDomainError('');
    try {
      const domain = await apiAddDomain(session, clean);
      setDomains(prev => [domain, ...prev]);
      setNewDomain('');
      setAddOpen(false);
      setSelected(domain);
    } catch (err) {
      setNewDomainError(err instanceof Error ? err.message : (isRu ? 'Ошибка добавления домена' : 'Error adding domain'));
    }
    setAdding(false);
  };

  const handleVerify = async (d: Domain) => {
    if (!session) return;
    setVerifying(true);
    try {
      const result = await apiVerifyDomain(session, d.id);
      setDnsResult(result.dns);
      await loadDomains();
    } catch {
      /* показываем предыдущий результат */
    }
    setVerifying(false);
  };

  const handleSetPrimary = async (d: Domain) => {
    if (!session) return;
    await apiSetPrimaryDomain(session, d.id);
    loadDomains();
  };

  const handleSetRedirect = async (d: Domain, mode: string) => {
    if (!session) return;
    setSavingRedirect(true);
    await apiSetDomainRedirect(session, d.id, mode);
    await loadDomains();
    setSavingRedirect(false);
  };

  const handleAssignProject = async (d: Domain, projectId: string) => {
    if (!session) return;
    setSavingProject(true);
    await apiAssignDomainProject(session, d.id, projectId === 'none' ? null : Number(projectId));
    await loadDomains();
    setSavingProject(false);
  };

  const handleDelete = async () => {
    if (!session || !deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteDomain(session, deleteTarget.id);
      setDomains(prev => prev.filter(d => d.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRow(key);
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const dnsRows = [
    {
      key: 'a',
      type: 'A',
      host: '@',
      value: SERVER_IP,
      ttl: '3600',
      desc: isRu ? 'Для корневого домена (example.ru)' : 'For root domain (example.com)',
    },
    {
      key: 'cname',
      type: 'CNAME',
      host: 'www',
      value: CNAME_VALUE,
      ttl: '3600',
      desc: isRu ? 'Для www (www.example.ru)' : 'For www (www.example.com)',
    },
  ];

  const registrarLink = dnsResult?.registrar ? REGISTRAR_LINKS[dnsResult.registrar] : null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader active="domain" />

      <main className="container max-w-3xl py-10 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl mb-1">
              {isRu ? 'Домены' : 'Domains'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRu ? 'Подключайте свои домены к сайтам, созданным на Roboweb' : 'Connect your own domains to sites built on Roboweb'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="rounded-xl font-semibold gap-2" asChild>
              <a href={BUY_DOMAIN_URL} target="_blank" rel="noopener noreferrer">
                <Icon name="ShoppingCart" size={15} />
                {isRu ? 'Купить домен' : 'Buy domain'}
              </a>
            </Button>
            <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setNewDomain(''); setNewDomainError(''); } }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-semibold gap-2">
                  <Icon name="Plus" size={15} />
                  {isRu ? 'Добавить домен' : 'Add domain'}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-display font-bold">{isRu ? 'Новый домен' : 'New domain'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="relative">
                    <Icon name="Globe" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={newDomain}
                      onChange={e => { setNewDomain(e.target.value); setNewDomainError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
                      placeholder="mysite.ru"
                      className="h-11 rounded-xl pl-9"
                      autoFocus
                    />
                  </div>
                  {newDomainError && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <Icon name="AlertCircle" size={14} /> {newDomainError}
                    </p>
                  )}
                  <Button onClick={handleAddDomain} disabled={adding || !newDomain.trim()} className="w-full h-11 rounded-xl font-semibold">
                    {adding
                      ? <><Icon name="Loader" size={15} className="mr-1.5 animate-spin" />{isRu ? 'Добавляем…' : 'Adding…'}</>
                      : <>{isRu ? 'Добавить' : 'Add'}<Icon name="ArrowRight" size={15} className="ml-1.5" /></>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: 'Shield', title: isRu ? 'SSL бесплатно' : 'Free SSL', desc: isRu ? 'HTTPS сертификат активируется автоматически' : 'HTTPS certificate activates automatically' },
            { icon: 'Zap', title: isRu ? 'CDN и кэш' : 'CDN & Cache', desc: isRu ? 'Быстрая загрузка по всему миру' : 'Fast loading worldwide' },
            { icon: 'RefreshCw', title: isRu ? 'Обновление' : 'Updates', desc: isRu ? 'Сайт обновляется мгновенно' : 'Site updates instantly' },
          ].map(item => (
            <div key={item.title} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon name={item.icon} size={16} />
              </div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Domains list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Icon name="Loader" size={20} className="animate-spin" />
            {isRu ? 'Загрузка…' : 'Loading…'}
          </div>
        ) : domains.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
              <Icon name="Globe" size={28} />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">{isRu ? 'Нет подключённых доменов' : 'No domains connected'}</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              {isRu ? 'Добавьте свой домен, чтобы сайт открывался по нему' : 'Add your domain so your site opens under it'}
            </p>
            <Button className="rounded-xl font-semibold gap-2" onClick={() => setAddOpen(true)}>
              <Icon name="Plus" size={16} /> {isRu ? 'Добавить домен' : 'Add domain'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map(d => {
              const isOpen = selected?.id === d.id;
              return (
                <div key={d.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => { setSelected(isOpen ? null : d); setDnsResult(null); }}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/40 transition-colors"
                  >
                    <div className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${d.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      <Icon name={d.status === 'active' ? 'CheckCircle' : 'Clock'} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{d.domain}</span>
                        {d.is_primary && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary rounded-full px-2 py-0.5">
                            {isRu ? 'Основной' : 'Primary'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className={`text-xs font-medium ${d.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {d.status === 'active' ? (isRu ? 'Подключён' : 'Connected') : (isRu ? 'Ожидает DNS' : 'Awaiting DNS')}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon name="Lock" size={11} />
                          {d.ssl_status === 'active' ? 'SSL' : (isRu ? 'SSL ожидает' : 'SSL pending')}
                        </span>
                        {d.project_title && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Icon name="Layers" size={11} />
                            {d.project_title}
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0" />
                  </button>

                  {isOpen && (
                    <div className="border-t border-border p-4 space-y-5">
                      {/* DNS records */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {isRu ? 'DNS-записи для добавления' : 'DNS records to add'}
                        </p>
                        <div className="space-y-2">
                          {dnsRows.map(row => (
                            <div key={row.key} className="bg-secondary/50 rounded-xl p-3">
                              <p className="text-[11px] text-muted-foreground mb-2">{row.desc}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { label: isRu ? 'Тип' : 'Type', value: row.type },
                                  { label: isRu ? 'Хост' : 'Host', value: row.host },
                                  { label: isRu ? 'Значение' : 'Value', value: row.value },
                                  { label: 'TTL', value: row.ttl },
                                ].map(cell => (
                                  <div key={cell.label} className="bg-card rounded-lg p-2">
                                    <p className="text-[9px] text-muted-foreground uppercase mb-0.5">{cell.label}</p>
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-mono font-semibold truncate">{cell.value}</p>
                                      {(cell.label === (isRu ? 'Значение' : 'Value')) && (
                                        <button onClick={() => copyToClipboard(cell.value, `${d.id}-${row.key}`)} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                                          <Icon name={copiedRow === `${d.id}-${row.key}` ? 'Check' : 'Copy'} size={11} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Verify */}
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl" disabled={verifying} onClick={() => handleVerify(d)}>
                          {verifying
                            ? <Icon name="Loader" size={13} className="mr-1.5 animate-spin" />
                            : <Icon name="Search" size={13} className="mr-1.5" />}
                          {isRu ? 'Проверить DNS' : 'Check DNS'}
                        </Button>
                        {d.status === 'pending' && (
                          <span className="text-xs text-muted-foreground">
                            {isRu ? 'Проверяем автоматически каждые 15 секунд' : 'Auto-checking every 15 seconds'}
                          </span>
                        )}
                      </div>

                      {dnsResult && (
                        <div className={`rounded-xl p-3 text-xs space-y-1.5 ${dnsResult.verified ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                          <div className="flex items-center gap-1.5">
                            <Icon name={dnsResult.a_record.ok ? 'CheckCircle' : 'XCircle'} size={13} />
                            A-запись: {dnsResult.a_record.ok ? (isRu ? 'найдена' : 'found') : (isRu ? 'не найдена' : 'not found')}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon name={dnsResult.cname_record.ok ? 'CheckCircle' : 'XCircle'} size={13} />
                            CNAME: {dnsResult.cname_record.ok ? (isRu ? 'найдена' : 'found') : (isRu ? 'не найдена' : 'not found')}
                          </div>
                          {dnsResult.registrar && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <Icon name="Building2" size={13} />
                              {isRu ? `Регистратор: ${dnsResult.registrar}` : `Registrar: ${dnsResult.registrar}`}
                              {registrarLink && (
                                <a href={registrarLink} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">
                                  {isRu ? 'инструкция' : 'guide'}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SSL status */}
                      {d.status === 'active' && (
                        <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                            <Icon name="Lock" size={14} />
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold text-foreground">{isRu ? 'SSL-сертификат активен' : 'SSL certificate active'}</p>
                            {d.ssl_expires_at && (
                              <p className="text-muted-foreground">
                                {isRu ? 'Действует до ' : 'Valid until '}
                                {new Date(d.ssl_expires_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Project assignment */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                          {isRu ? 'Привязан к проекту' : 'Assigned project'}
                        </label>
                        <Select
                          value={d.project_id ? String(d.project_id) : 'none'}
                          onValueChange={(v) => handleAssignProject(d, v)}
                          disabled={savingProject}
                        >
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{isRu ? 'Не выбран' : 'None'}</SelectItem>
                            {projects.map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Redirect mode */}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                          {isRu ? 'Редирект' : 'Redirect'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'none', label: isRu ? 'Без редиректа' : 'No redirect' },
                            { id: 'www_to_root', label: `www → ${d.domain}` },
                            { id: 'root_to_www', label: `${d.domain} → www` },
                          ].map(opt => (
                            <button
                              key={opt.id}
                              disabled={savingRedirect}
                              onClick={() => handleSetRedirect(d, opt.id)}
                              className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                                d.redirect_mode === opt.id
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        {!d.is_primary && (
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleSetPrimary(d)}>
                            <Icon name="Star" size={13} className="mr-1.5" />
                            {isRu ? 'Сделать основным' : 'Set as primary'}
                          </Button>
                        )}
                        {d.status === 'active' && (
                          <Button size="sm" variant="outline" className="rounded-xl" asChild>
                            <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer">
                              <Icon name="ExternalLink" size={13} className="mr-1.5" />
                              {isRu ? 'Открыть' : 'Open'}
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="rounded-xl text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5 ml-auto" onClick={() => setDeleteTarget(d)}>
                          <Icon name="Trash2" size={13} className="mr-1.5" />
                          {isRu ? 'Удалить' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Registrar guides */}
        <div className="bg-card border border-border rounded-2xl p-5 mt-8">
          <p className="text-sm font-semibold mb-3">
            {isRu ? 'Инструкции для популярных регистраторов' : 'Instructions for popular registrars'}
          </p>
          <div className="flex flex-wrap gap-2">
            {REGISTRARS_FALLBACK.map(r => (
              <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-secondary hover:bg-background hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground">
                <Icon name="ExternalLink" size={11} />
                {r.name}
              </a>
            ))}
          </div>
        </div>
      </main>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">{isRu ? 'Удалить домен?' : 'Delete domain?'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? `Домен ${deleteTarget?.domain} будет отключён от сайта.`
              : `Domain ${deleteTarget?.domain} will be disconnected from the site.`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteTarget(null)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button variant="destructive" className="flex-1 rounded-xl" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Icon name="Loader" size={14} className="mr-1.5 animate-spin" /> : null}
              {isRu ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
