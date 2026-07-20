import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { getLang } from '@/lib/i18n';
import DashboardHeader from '@/components/DashboardHeader';
import {
  getSession,
  apiGetDomains, apiAddDomain, apiVerifyDomain, apiSetPrimaryDomain,
  apiSetDomainRedirect, apiAssignDomainProject, apiDeleteDomain,
  type Domain, type DnsCheckResult,
} from '@/lib/auth';
import DomainAddDialog from '@/components/domain/DomainAddDialog';
import { DomainInfoCards, DomainRegistrarGuides } from '@/components/domain/DomainInfoCards';
import DomainListItem from '@/components/domain/DomainListItem';
import DomainDeleteDialog from '@/components/domain/DomainDeleteDialog';

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader active="domain" />

      <main className="container max-w-3xl py-10 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl mb-1">
              {isRu ? 'Домены' : 'Domains'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRu ? 'Подключайте свои домены к сайтам, созданным на Roboweb' : 'Connect your own domains to sites built on Roboweb'}
            </p>
          </div>
          <DomainAddDialog
            isRu={isRu}
            addOpen={addOpen}
            setAddOpen={setAddOpen}
            newDomain={newDomain}
            setNewDomain={setNewDomain}
            newDomainError={newDomainError}
            setNewDomainError={setNewDomainError}
            adding={adding}
            onAddDomain={handleAddDomain}
          />
        </div>

        <DomainInfoCards isRu={isRu} />

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
            {domains.map(d => (
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

        <DomainRegistrarGuides isRu={isRu} />
      </main>

      <DomainDeleteDialog
        isRu={isRu}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        deleting={deleting}
        onDelete={handleDelete}
      />
    </div>
  );
}
