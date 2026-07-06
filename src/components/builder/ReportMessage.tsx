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
    </div>
  );
}
