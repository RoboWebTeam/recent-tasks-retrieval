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
import { DomainInfoCards } from '@/components/domain/DomainInfoCards';
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
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold flex items-center gap-2">
              <Icon name="Globe" size={18} className="text-primary" />
              {isRu ? 'Домен сайта' : 'Site domain'}
            </DialogTitle>
          </DialogHeader>

          {/* Быстрое добавление домена */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icon name="Globe" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={newDomain}
                onChange={e => { setNewDomain(e.target.value); setNewDomainError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
                placeholder="mysite.ru"
                className="w-full h-10 rounded-xl pl-9 pr-3 text-sm border border-border bg-secondary/50 outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <Button onClick={handleAddDomain} disabled={adding || !newDomain.trim()} className="rounded-xl font-semibold shrink-0">
              {adding
                ? <Icon name="Loader" size={15} className="animate-spin" />
                : <><Icon name="Plus" size={15} className="mr-1" />{isRu ? 'Добавить' : 'Add'}</>}
            </Button>
          </div>
          {newDomainError && (
            <p className="text-sm text-destructive flex items-center gap-1.5 -mt-2">
              <Icon name="AlertCircle" size={14} /> {newDomainError}
            </p>
          )}

          <DomainInfoCards isRu={isRu} />

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
            <div className="space-y-3">
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

          <Link
            to="/settings/domain"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            {isRu ? 'Открыть полные настройки доменов' : 'Open full domain settings'}
            <Icon name="ArrowRight" size={12} />
          </Link>
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