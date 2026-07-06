import { memo } from 'react';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';

/**
 * «Агентные» строки живой сборки сайта в чате редактора — в стиле лога Claude Code:
 * плоские компактные строки-операции, единый размер текста 14px, обычное (не жирное)
 * начертание, приглушённый «служебный» тон, дифф-статистика (+добавлено / −удалено).
 */

export const AgentFileCard = memo(function AgentFileCard({
  lang, fileName, status, added, removed, active, onOpen,
}: {
  lang: Lang;
  fileName: string;
  status: 'creating' | 'created' | 'updating' | 'updated';
  added: number;
  removed: number;
  active: boolean;
  onOpen?: () => void;
}) {
  const ru = lang === 'ru';
  const isCreate = status === 'creating' || status === 'created';
  const verb = status === 'creating' ? (ru ? 'Создаю' : 'Creating')
    : status === 'created' ? (ru ? 'Создан' : 'Created')
    : status === 'updating' ? (ru ? 'Обновляю' : 'Updating')
    : (ru ? 'Обновлён' : 'Updated');

  return (
    <button onClick={onOpen} disabled={active || !onOpen}
      title={active ? undefined : (ru ? 'Открыть код' : 'Open code')}
      className="group flex items-center gap-2 w-full text-left rounded-md px-1.5 py-1 -mx-1.5 hover:bg-secondary/50 disabled:hover:bg-transparent transition-colors">
      <Icon name={isCreate ? 'FilePlus2' : 'FilePenLine'} fallback="FileCode" size={14} className="text-muted-foreground shrink-0" />
      <span className="text-[14px] text-muted-foreground shrink-0">{verb}</span>
      <span className="text-[14px] text-foreground truncate">{fileName}</span>
      {added > 0 && <span className="text-[14px] text-emerald-600 dark:text-emerald-400 shrink-0">+{added}</span>}
      {removed > 0 && <span className="text-[14px] text-rose-500 shrink-0">−{removed}</span>}
      <span className="flex-1" />
      {active
        ? <Icon name="Loader" size={13} className="animate-spin text-muted-foreground shrink-0" />
        : onOpen && <Icon name="ChevronRight" size={15} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />}
    </button>
  );
});

export const AgentStep = memo(function AgentStep({
  text, done,
}: {
  text: string;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-2 py-[3px]">
      {done
        ? <Icon name="Check" size={14} className="text-muted-foreground/50 shrink-0 mt-[3px]" />
        : <Icon name="Loader" size={14} className="animate-spin text-primary shrink-0 mt-[3px]" />}
      <span className={`text-[14px] leading-[1.6] ${done ? 'text-muted-foreground' : 'text-foreground'}`}>{text}</span>
    </div>
  );
});
