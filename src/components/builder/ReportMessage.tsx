import ChatMarkdown from './ChatMarkdown';
import Icon from '@/components/ui/icon';
import { tr, type Lang } from '@/lib/i18n';

interface Suggestion { icon: string; label: string; prompt: string; }

/**
 * Финальный «красивый развёрнутый» отчёт ИИ в чате редактора — в стиле Claude Code.
 * Приоритетно рендерит готовый markdown-отчёт от модели (поле report / маркер RW:report);
 * если его нет — собирает markdown из структурных полей (intro / шаги / дизайн / итог).
 * Ниже — кликабельные чипы «Что дальше».
 */
export default function ReportMessage({
  lang, report, intro, summary, steps = [], design, sections = [], suggestions = [],
  liveSteps, onSuggestion, suggestionsDisabled,
}: {
  lang: Lang;
  report?: string;
  intro?: string;
  summary?: string;
  steps?: string[];
  design?: string;
  sections?: string[];
  suggestions?: Suggestion[];
  liveSteps?: boolean;
  onSuggestion?: (prompt: string) => void;
  suggestionsDisabled?: boolean;
}) {
  let md = (report || '').trim();
  if (!md) {
    // Fallback: собираем markdown из имеющихся полей (модель не прислала готовый отчёт).
    // Ведём с ИТОГА (summary, прошедшее время) — а не со стартового intro «взялся за дело».
    const p: string[] = [];
    if (summary) p.push(summary);
    else if (intro) p.push(intro);
    if (design) p.push((lang === 'ru' ? '**Дизайн.** ' : '**Design.** ') + design);
    if (!liveSteps && steps.length) {
      p.push(lang === 'ru' ? '**Что я сделал:**' : '**What I did:**');
      steps.forEach(s => p.push('- ' + s));
    }
    if (!liveSteps && sections.length) {
      p.push((lang === 'ru' ? '**Секции:** ' : '**Sections:** ') + sections.join(' · '));
    }
    md = p.join('\n\n');
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[14px] font-medium">
        <Icon name="CheckCircle" size={14} /> {tr('builderReady', lang)}
      </div>

      {md && <ChatMarkdown text={md} />}

      {suggestions.length > 0 && (
        <div className="pt-1">
          <p className="text-[14px] text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <Icon name="Sparkles" size={13} className="text-primary" />
            {lang === 'ru' ? 'Что дальше' : 'What’s next'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 4).map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestion?.(s.prompt)}
                disabled={suggestionsDisabled}
                title={s.prompt}
                className="group flex items-center gap-1.5 rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all px-3 py-1.5 text-[14px] font-medium text-foreground"
              >
                <Icon name={s.icon} fallback="Sparkles" size={13} className="text-primary shrink-0" />
                <span className="truncate max-w-[180px]">{s.label}</span>
                <Icon name="Plus" size={12} className="text-muted-foreground/60 group-hover:text-primary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
