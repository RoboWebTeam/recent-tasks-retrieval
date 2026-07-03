import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';
import { getSession, apiGetFiles, apiUploadFile, apiDeleteFile, type SiteFile } from '@/lib/auth';

interface BuilderCoreStorageProps {
  lang: Lang;
  projectId: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BuilderCoreStorage({ lang, projectId }: BuilderCoreStorageProps) {
  const isRu = lang === 'ru';
  const session = getSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<SiteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadFiles = useCallback(async () => {
    if (!session) return;
    try {
      const all = await apiGetFiles(session);
      setFiles(all.filter(f => f.project_id === projectId));
    } catch { /* пусто */ }
    setLoading(false);
  }, [session, projectId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);
    setError('');
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const isZip = file.name.toLowerCase().endsWith('.zip');
      const uploaded = await apiUploadFile(session, file.name, base64, isZip, projectId);
      setFiles(prev => [uploaded, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isRu ? 'Ошибка загрузки' : 'Upload error'));
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id: number) => {
    if (!session) return;
    setDeletingId(id);
    try {
      await apiDeleteFile(session, id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch { /* тихо */ }
    setDeletingId(null);
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
          <h3 className="font-display font-bold text-base">{isRu ? 'Хранилище файлов' : 'File storage'}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{isRu ? 'Файлы и изображения для этого проекта' : 'Files and images for this project'}</p>
        </div>
        <Button size="sm" className="rounded-xl gap-1.5 shrink-0" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Upload" size={14} />}
          {isRu ? 'Загрузить' : 'Upload'}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl px-3 py-2 mb-4 text-sm">
          <Icon name="AlertCircle" size={14} /> {error}
        </div>
      )}

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Icon name="FolderOpen" size={28} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-4">{isRu ? 'Файлов пока нет' : 'No files yet'}</p>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={handleUploadClick}>
            <Icon name="Upload" size={14} /> {isRu ? 'Загрузить файл' : 'Upload file'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
              <div className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 ${f.file_type === 'zip' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                <Icon name={f.file_type === 'zip' ? 'FileArchive' : 'FileCode'} size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{f.file_name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}</p>
              </div>
              <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0 grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Download" size={14} />
              </a>
              <button onClick={() => handleDelete(f.id)} disabled={deletingId === f.id} className="shrink-0 grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40">
                <Icon name={deletingId === f.id ? 'Loader' : 'Trash2'} size={14} className={deletingId === f.id ? 'animate-spin' : ''} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
