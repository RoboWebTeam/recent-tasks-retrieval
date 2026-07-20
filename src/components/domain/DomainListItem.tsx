import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { type Domain, type DnsCheckResult } from '@/lib/auth';
import { REGISTRAR_LINKS, SERVER_IP, CNAME_VALUE } from './DomainInfoCards';

interface DomainListItemProps {
  d: Domain;
  isRu: boolean;
  isOpen: boolean;
  setSelected: (d: Domain | null) => void;
  setDnsResult: (r: DnsCheckResult | null) => void;
  dnsResult: DnsCheckResult | null;
  verifying: boolean;
  copiedRow: string | null;
  savingRedirect: boolean;
  savingProject: boolean;
  projects: { id: number; title: string }[];
  onVerify: (d: Domain) => void;
  onSetPrimary: (d: Domain) => void;
  onSetRedirect: (d: Domain, mode: string) => void;
  onAssignProject: (d: Domain, projectId: string) => void;
  onCopy: (text: string, key: string) => void;
  onDeleteRequest: (d: Domain) => void;
}

export default function DomainListItem({
  d, isRu, isOpen, setSelected, setDnsResult, dnsResult, verifying, copiedRow,
  savingRedirect, savingProject, projects,
  onVerify, onSetPrimary, onSetRedirect, onAssignProject, onCopy, onDeleteRequest,
}: DomainListItemProps) {
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => { setSelected(isOpen ? null : d); setDnsResult(null); }}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${d.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
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
                            <button onClick={() => onCopy(cell.value, `${d.id}-${row.key}`)} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
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
            <Button size="sm" variant="outline" className="rounded-xl" disabled={verifying} onClick={() => onVerify(d)}>
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
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300 shrink-0">
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
              onValueChange={(v) => onAssignProject(d, v)}
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
                  onClick={() => onSetRedirect(d, opt.id)}
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
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onSetPrimary(d)}>
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
            <Button size="sm" variant="outline" className="rounded-xl text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5 ml-auto" onClick={() => onDeleteRequest(d)}>
              <Icon name="Trash2" size={13} className="mr-1.5" />
              {isRu ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}