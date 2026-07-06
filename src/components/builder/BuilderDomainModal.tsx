import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  getSession,
  apiGetDomains, apiAddDomain, apiVerifyDomain, apiSetPrimaryDomain,
  apiSetDomainRedirect, apiAssignDomainProject, apiDeleteDomain,
  type Domain, type DnsCheckResult,
} from '@/lib/auth';
import DomainListItem from '@/components/domain/DomainListItem';
import DomainDeleteDialog from '@/components/domain/DomainDeleteDialog';

function validateDomain(val: string) {
  const re = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return re.test(val.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''));
}

function cleanDomain(val: string) {
  return val.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
}

interface BuilderDomainModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lang: 'ru' | 'en';
  projectId: number | null;
}

export default function BuilderDomainModal({ open, onOpenChange, lang, projectId }: BuilderDomainModalProps) {
  const isRu = lang === 'ru';
  const session = getSession();

  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (open) loadDomains();
  }, [open, loadDomains]);

  // Автопроверка DNS каждые 15 секунд для доменов в статусе pending, пока модалка открыта
  useEffect(() => {
    const hasPending = domains.some(d => d.status === 'pending');
    if (!open || !hasPending || !session) {
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
  }, [open, domains.map(d => d.status).join(','), session]);

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
      const domain = await apiAddDomain(session, clean, projectId || undefined);
      setDomains(prev => [domain, ...prev]);
      setNewDomain('');
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

  const handleAssignProject = async (d: Domain, pid: string) => {
    if (!session) return;
    setSavingProject(true);
    await apiAssignDomainProject(session, d.id, pid === 'none' ? null : Number(pid));
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

  // Домены этого проекта показываем первыми
  const sortedDomains = [...domains].sort((a, b) => {
    const aMatch = projectId && a.project_id === projectId ? 1 : 0;
    const bMatch = projectId && b.project_id === projectId ? 1 : 0;
    return bMatch - aMatch;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl max-w-xl p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
          {/* Header */}
          <DialogHeader className="shrink-0 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border">
            <DialogTitle className="font-bold text-base sm:text-lg flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Icon name="Globe" size={18} />
              </span>
              {isRu ? 'Домен сайта' : 'Site domain'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground pl-[46px] -mt-1">
              {isRu ? 'Подключите свой домен вместо адреса на roboweb.site' : 'Connect your own domain instead of a roboweb.site address'}
            </p>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
            {/* Быстрое добавление домена */}
            <div>
              <div className="flex flex-col xs:flex-row gap-2">
                <div className="relative flex-1">
                  <Icon name="Globe" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={newDomain}
                    onChange={e => { setNewDomain(e.target.value); setNewDomainError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
                    placeholder="mysite.ru"
                    className="w-full h-11 rounded-xl pl-9 pr-3 text-sm border border-border bg-secondary/40 outline-none focus:border-primary/50 focus:bg-background transition-colors"
                  />
                </div>
                <Button onClick={handleAddDomain} disabled={adding || !newDomain.trim()} className="rounded-xl font-semibold shrink-0 h-11 w-full xs:w-auto">
                  {adding
                    ? <Icon name="Loader" size={15} className="animate-spin" />
                    : <><Icon name="Plus" size={15} className="mr-1" />{isRu ? 'Добавить' : 'Add'}</>}
                </Button>
              </div>
              {newDomainError && (
                <p className="text-sm text-destructive flex items-center gap-1.5 mt-2">
                  <Icon name="AlertCircle" size={14} /> {newDomainError}
                </p>
              )}
            </div>

            {/* Компактная строка преимуществ */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-secondary/40 px-3.5 py-2.5">
              {[
                { icon: 'Shield', label: isRu ? 'SSL бесплатно' : 'Free SSL' },
                { icon: 'Zap', label: isRu ? 'CDN и кэш' : 'CDN & cache' },
                { icon: 'Search', label: isRu ? 'Лучше для SEO' : 'Better for SEO' },
              ].map(item => (
                <span key={item.label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon name={item.icon} size={13} className="text-primary" />
                  {item.label}
                </span>
              ))}
            </div>

            {/* Domains list */}
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Icon name="Loader" size={18} className="animate-spin" />
                {isRu ? 'Загрузка…' : 'Loading…'}
              </div>
            ) : sortedDomains.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
                  <Icon name="Globe" size={22} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Добавьте свой домен, чтобы сайт открывался по нему' : 'Add your domain so your site opens under it'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedDomains.map(d => (
                  <DomainListItem
                    key={d.id}
                    d={d}
                    isRu={isRu}
                    isOpen={selected?.id === d.id}
                    setSelected={setSelected}
                    setDnsResult={setDnsResult}
                    dnsResult={dnsResult}
                    verifying={verifying}
                    copiedRow={copiedRow}
                    savingRedirect={savingRedirect}
                    savingProject={savingProject}
                    projects={projects}
                    onVerify={handleVerify}
                    onSetPrimary={handleSetPrimary}
                    onSetRedirect={handleSetRedirect}
                    onAssignProject={handleAssignProject}
                    onCopy={copyToClipboard}
                    onDeleteRequest={setDeleteTarget}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border px-4 sm:px-6 py-3">
            <Link
              to="/settings/domain"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {isRu ? 'Открыть полные настройки доменов' : 'Open full domain settings'}
              <Icon name="ArrowRight" size={12} />
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <DomainDeleteDialog
        isRu={isRu}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        deleting={deleting}
        onDelete={handleDelete}
      />
    </>
  );
}