import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getLang } from '@/lib/i18n';
import { getSession, apiGetFiles, apiUploadFile, apiDeleteFile, type SiteFile } from '@/lib/auth';

function formatSize(bytes: number, isRu: boolean): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Files() {
  const lang = getLang();
  const isRu = lang === 'ru';
  const session = getSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<SiteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchFiles = () => {
    if (!session) return;
    setLoading(true);
    apiGetFiles(session)
      .then(setFiles)
      .catch(e => setError(e instanceof Error ? e.message : (isRu ? 'Ошибка загрузки' : 'Load error')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFiles(); }, [session]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    const isZip = file.name.toLowerCase().endsWith('.zip');
    const isHtml = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');

    if (!isZip && !isHtml) {
      setError(isRu ? 'Поддерживаются только файлы .html и .zip' : 'Only .html and .zip files are supported');
      e.target.value = '';
      return;
    }

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

      const uploaded = await apiUploadFile(session, file.name, base64, isZip);
      setFiles(prev => [uploaded, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isRu ? 'Ошибка загрузки файла' : 'Upload error'));
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
    } catch (err) {
      setError(err instanceof Error ? err.message : (isRu ? 'Ошибка удаления' : 'Delete error'));
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/dashboard" className="grid h-7 w-7 place-items-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <Icon name="ArrowLeft" size={16} />
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-base">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={14} />
            </span>
            <span className="hidden sm:block">Roboweb</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{isRu ? 'Мои файлы' : 'My files'}</span>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl">{isRu ? 'Мои файлы' : 'My files'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRu ? 'Готовые сайты в формате HTML или ZIP' : 'Ready-made sites in HTML or ZIP format'}
            </p>
          </div>
          <Button onClick={handleUploadClick} disabled={uploading} className="rounded-xl font-semibold gap-2">
            {uploading
              ? <><Icon name="Loader" size={15} className="animate-spin" />{isRu ? 'Загрузка…' : 'Uploading…'}</>
              : <><Icon name="Upload" size={15} />{isRu ? 'Загрузить файл' : 'Upload file'}</>}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.zip"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-2xl px-4 py-3 mb-6 text-sm">
            <Icon name="AlertCircle" size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
              <Icon name="FolderOpen" size={28} />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">{isRu ? 'Пока нет файлов' : 'No files yet'}</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              {isRu ? 'Загрузите готовый сайт в формате HTML или ZIP-архив' : 'Upload a ready-made site as HTML or a ZIP archive'}
            </p>
            <Button onClick={handleUploadClick} className="rounded-xl font-semibold gap-2">
              <Icon name="Upload" size={16} /> {isRu ? 'Загрузить файл' : 'Upload file'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
                <div className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${f.file_type === 'zip' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                  <Icon name={f.file_type === 'zip' ? 'FileArchive' : 'FileCode'} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{f.file_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatSize(f.file_size, isRu)} · {new Date(f.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}
                  </div>
                </div>
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                  title={isRu ? 'Скачать' : 'Download'}
                >
                  <Icon name="Download" size={16} />
                </a>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={deletingId === f.id}
                  className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 disabled:opacity-40"
                  title={isRu ? 'Удалить' : 'Delete'}
                >
                  <Icon name={deletingId === f.id ? 'Loader' : 'Trash2'} size={16} className={deletingId === f.id ? 'animate-spin' : ''} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}