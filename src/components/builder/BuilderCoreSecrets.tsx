import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { type Lang } from '@/lib/i18n';
import {
  getSession, apiGetProjectSecrets, apiAddProjectSecret, apiDeleteProjectSecret,
  type ProjectSecret,
} from '@/lib/auth';

interface BuilderCoreSecretsProps {
  lang: Lang;
  projectId: number;
}

export default function BuilderCoreSecrets({ lang, projectId }: BuilderCoreSecretsProps) {
  const isRu = lang === 'ru';
  const session = getSession();

  const [secrets, setSecrets] = useState<ProjectSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProjectSecret | null>(null);

  const loadSecrets = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiGetProjectSecrets(session, projectId);
      setSecrets(data);
    } catch { /* пусто */ }
    setLoading(false);
  }, [session, projectId]);

  useEffect(() => { loadSecrets(); }, [loadSecrets]);

  const handleAdd = async () => {
    if (!session) return;
    setError('');
    if (!keyName.trim() || !keyValue.trim()) {
      setError(isRu ? 'Заполните оба поля' : 'Fill in both fields');
      return;
    }
    setSaving(true);
    try {
      const secret = await apiAddProjectSecret(session, projectId, keyName.trim(), keyValue.trim());
      setSecrets(prev => [secret, ...prev.filter(s => s.key_name !== secret.key_name)]);
      setAddOpen(false);
      setKeyName('');
      setKeyValue('');
    } catch (e) {
      setError(e instanceof Error ? e.message : (isRu ? 'Ошибка добавления' : 'Error adding secret'));
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!session || !deleteTarget) return;
    await apiDeleteProjectSecret(session, projectId, deleteTarget.id);
    setSecrets(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Icon name="Loader" size={18} className="animate-spin" />
        {isRu ? 'Загрузка…' : 'Loading…'}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base">{isRu ? 'Секреты проекта' : 'Project secrets'}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{isRu ? 'Ключи и токены для интеграций сайта — хранятся в зашифрованном виде' : 'Keys and tokens for site integrations — stored securely'}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) setError(''); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5 shrink-0">
              <Icon name="Plus" size={14} /> {isRu ? 'Секрет' : 'Secret'}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-bold">{isRu ? 'Новый секрет' : 'New secret'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">{isRu ? 'Имя ключа' : 'Key name'}</label>
                <Input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="SMTP_PASSWORD" className="h-9 rounded-xl font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{isRu ? 'Значение' : 'Value'}</label>
                <Input value={keyValue} onChange={e => setKeyValue(e.target.value)} type="password" className="h-9 rounded-xl" />
              </div>
              {error && <p className="text-sm text-destructive flex items-center gap-1.5"><Icon name="AlertCircle" size={14} /> {error}</p>}
              <Button className="w-full rounded-xl" disabled={saving} onClick={handleAdd}>
                {saving ? <Icon name="Loader" size={14} className="mr-1.5 animate-spin" /> : null}
                {isRu ? 'Сохранить' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {secrets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Icon name="KeyRound" size={28} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-4">{isRu ? 'Секретов пока нет' : 'No secrets yet'}</p>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
            <Icon name="Plus" size={14} /> {isRu ? 'Добавить секрет' : 'Add secret'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {secrets.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <Icon name="KeyRound" size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono font-semibold truncate">{s.key_name}</p>
                  <p className="text-xs text-muted-foreground">•••••••• · {new Date(s.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(s)} className="shrink-0 grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-bold">{isRu ? 'Удалить секрет?' : 'Delete secret?'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{deleteTarget?.key_name}</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteTarget(null)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDelete}>{isRu ? 'Удалить' : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}