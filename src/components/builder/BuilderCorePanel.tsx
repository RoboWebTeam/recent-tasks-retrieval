import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';
import { type SiteFile } from '@/lib/auth';
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'database' && <BuilderCoreDatabase lang={lang} projectId={projectId} />}
        {tab === 'functions' && <BuilderCoreFunctions lang={lang} />}
        {tab === 'secrets' && <BuilderCoreSecrets lang={lang} projectId={projectId} />}
        {tab === 'storage' && <BuilderCoreStorage lang={lang} projectId={projectId} onUseInChat={onUseFileInChat} />}
      </div>
    </div>
  );
}