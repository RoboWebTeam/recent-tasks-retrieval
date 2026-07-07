import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';
import { getSession, apiGetFiles, type SiteFile } from '@/lib/auth';
import BuilderCoreDatabase from './BuilderCoreDatabase';
import BuilderCoreSecrets from './BuilderCoreSecrets';
import BuilderCoreStorage from './BuilderCoreStorage';
import BuilderCoreFunctions from './BuilderCoreFunctions';


type CoreTab = 'database' | 'functions' | 'secrets' | 'storage';

interface BuilderCorePanelProps {
  lang: Lang;
  projectId: number;
  onUseFileInChat?: (file: SiteFile) => void;
}

export default function BuilderCorePanel({ lang, projectId, onUseFileInChat }: BuilderCorePanelProps) {
  const [tab, setTab] = useState<CoreTab>('database');
  const [images, setImages] = useState<SiteFile[]>([]);
  const session = getSession();

  const loadImages = useCallback(async () => {
    if (!session) return;
    try {
      const all = await apiGetFiles(session);
      setImages(all.filter(f => f.project_id === projectId && f.file_type === 'image'));
    } catch { /* пусто */ }
  }, [session, projectId]);

  useEffect(() => { loadImages(); }, [loadImages, tab]);

  const tabs: { id: CoreTab; label: string; icon: string }[] = [
    { id: 'database', label: lang === 'ru' ? 'База данных' : 'Database', icon: 'Database' },
    { id: 'functions', label: lang === 'ru' ? 'Функции' : 'Functions', icon: 'Zap' },
    { id: 'secrets', label: lang === 'ru' ? 'Секреты' : 'Secrets', icon: 'KeyRound' },
    { id: 'storage', label: lang === 'ru' ? 'Хранилище' : 'Storage', icon: 'FolderOpen' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-card shrink-0 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Быстрая вставка изображений в чат — видна на любой вкладке */}
      {onUseFileInChat && images.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30 shrink-0 overflow-x-auto">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold shrink-0">
            {lang === 'ru' ? 'В чат:' : 'To chat:'}
          </span>
          {images.map(img => (
            <button
              key={img.id}
              onClick={() => onUseFileInChat(img)}
              title={lang === 'ru' ? `Использовать «${img.file_name}» в чате` : `Use "${img.file_name}" in chat`}
              className="relative shrink-0 h-8 w-8 rounded-lg overflow-hidden border border-border hover:border-primary hover:scale-110 transition-all"
            >
              <img src={img.file_url} alt={img.file_name} className="h-full w-full object-cover" />
              {img.file_name.startsWith('dalle_') && (
                <span className="absolute -top-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Icon name="Sparkles" size={8} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'database' && <BuilderCoreDatabase lang={lang} projectId={projectId} />}
        {tab === 'functions' && <BuilderCoreFunctions lang={lang} projectId={projectId} />}
        {tab === 'secrets' && <BuilderCoreSecrets lang={lang} projectId={projectId} />}
        {tab === 'storage' && <BuilderCoreStorage lang={lang} projectId={projectId} onUseInChat={onUseFileInChat} onFilesChanged={loadImages} />}
      </div>
    </div>
  );
}