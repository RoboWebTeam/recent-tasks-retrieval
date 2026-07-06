import { memo } from 'react';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';

/**
 * «Агентные» пузыри живой сборки сайта в чате редактора — стиль Claude Code:
 * карточка файла index.html с живым счётчиком строк + отдельные пузыри-шаги работы.
 */

export const AgentFileCard = memo(function AgentFileCard({
  lang, fileName, status, lines, active,
}: {
  lang: Lang;
  fileName: string;
  status: 'creating' | 'created' | 'updating' | 'updated';
  lines: number;
  active: boolean;
}) {
  const isCreate = status === 'creating' || status === 'created';
  const statusLabel = status === 'creating'
    ? (lang === 'ru' ? 'Пишу код…' : 'Writing code…')
    : status === 'updating'
    ? (lang === 'ru' ? 'Вношу правки…' : 'Editing…')
    : status === 'created'
    ? (lang === 'ru' ? 'создан' : 'created')
    : (lang === 'ru' ? 'обновлён' : 'updated');

  return (
    <div className="flex items-center gap-2.5 bg-secondary/50 border border-border rounded-xl px-3 py-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon name={isCreate ? 'FilePlus2' : 'FilePenLine'} fallback="FileCode" size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-semibold text-foreground truncate">{fileName}</span>
          {lines > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums shrink-0">
              +{lines} {lang === 'ru' ? 'строк' : 'lines'}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">{statusLabel}</div>
      </div>
      {active
        ? <Icon name="Loader" size={14} className="animate-spin text-primary shrink-0" />
        : <Icon name="CheckCircle" size={15} className="text-emerald-500 shrink-0" />}
    </div>
  );
});

export const AgentStep = memo(function AgentStep({
  text, done,
}: {
  text: string;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 py-0.5">
      <span className={`grid place-items-center h-5 w-5 rounded-full shrink-0 mt-0.5 ${done ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
        {done ? <Icon name="Check" size={11} /> : <Icon name="Loader" size={11} className="animate-spin" />}
      </span>
      <span className={`text-[13.5px] font-semibold leading-relaxed ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
        {text}
      </span>
    </div>
  );
});
