import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { tr, type Lang } from '@/lib/i18n';

interface Suggestion {
  icon: string;
  label: string;
  prompt: string;
}

interface Props {
  lang: Lang;
  intro?: string;
  summary?: string;
  steps?: string[];
  design?: string;
  sections?: string[];
  suggestions?: Suggestion[];
  /** true — проигрывать анимацию печати; false — показать всё сразу (старые сообщения из истории) */
  animate: boolean;
  onPreview: () => void;
  onCode: () => void;
  onDownload: () => void;
  onSuggestion: (prompt: string) => void;
  onTick: () => void;
  previewLabel: string;
  codeLabel: string;
  downloadLabel: string;
  fallbackIdeas: Suggestion[];
}

/**
 * Печатающийся по буквам блок текста. Сообщает наверх (onDone), когда закончил,
 * чтобы родитель показал следующий блок отчёта.
 */
function TypingLine({ text, animate, onDone, onTick, className }: {
  text: string; animate: boolean; onDone: () => void; onTick: () => void; className?: string;
}) {
  const [shown, setShown] = useState(animate ? '' : text);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!animate) { onDone(); return; }
    let i = 0;
    const speed = 2;
    const timer = setInterval(() => {
      i = Math.min(i + speed, text.length);
      setShown(text.slice(0, i));
      onTick();
      if (i >= text.length) {
        clearInterval(timer);
        if (!doneRef.current) { doneRef.current = true; onDone(); }
      }
    }, 16);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <span className={className}>{shown}</span>;
}

/**
 * Показывает подробный отчёт ассистента о работе в режиме «печатной машинки»:
 * блоки появляются по очереди (вступление → шаги по одному → итог → дизайн →
 * секции → действия → идеи), а текст каждого печатается по буквам.
 */
export default function TypingReport(props: Props) {
  const {
    lang, intro, summary, steps = [], design, sections = [], suggestions = [],
    animate, onPreview, onCode, onDownload, onSuggestion, onTick,
    previewLabel, codeLabel, downloadLabel, fallbackIdeas,
  } = props;

  // Собираем последовательность «этапов» — сколько блоков нужно раскрыть по очереди.
  // Каждый шаг steps — отдельный этап, чтобы они появлялись один за другим.
  // stage = индекс текущего раскрываемого блока. Если !animate — показываем всё сразу.
  const totalStages =
    (intro ? 1 : 0) + steps.length + (summary ? 1 : 0) + (design ? 1 : 0) + 1; // +1 = финальный (секции/кнопки/идеи)

  const [stage, setStage] = useState(animate ? 0 : totalStages);
  const next = () => setStage(s => s + 1);

  // Вычисляем «границы» этапов для показа
  let cursor = 0;
  const introStage = intro ? cursor++ : -1;
  const stepStages = steps.map(() => cursor++);
  const summaryStage = summary ? cursor++ : -1;
  const designStage = design ? cursor++ : -1;
  const finalStage = cursor; // секции + кнопки + идеи

  const ideas = suggestions.length > 0 ? suggestions : fallbackIdeas;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
        <Icon name="CheckCircle" size={13} /> {tr('builderReady', lang)}
      </div>

      {/* Вступление */}
      {intro && stage >= introStage && (
        <p className="text-foreground text-[13px] leading-relaxed">
          <TypingLine text={intro} animate={animate && stage === introStage} onDone={next} onTick={onTick} />
        </p>
      )}

      {/* Шаги — по одному */}
      {steps.length > 0 && stage > stepStages[0] - 1 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
            {lang === 'ru' ? 'Что я сделал' : 'What I did'}
          </p>
          <div className="space-y-1.5">
            {steps.map((step, i) => (
              stage >= stepStages[i] && (
                <div key={i} className="flex items-start gap-2 text-[13px] text-foreground leading-relaxed">
                  <span className="grid place-items-center h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Icon name="Check" size={10} />
                  </span>
                  <TypingLine text={step} animate={animate && stage === stepStages[i]} onDone={next} onTick={onTick} />
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Итог */}
      {summary && stage >= summaryStage && (
        <p className="text-foreground text-[13px] leading-relaxed">
          <TypingLine text={summary} animate={animate && stage === summaryStage} onDone={next} onTick={onTick} />
        </p>
      )}

      {/* Дизайн */}
      {design && stage >= designStage && (
        <div className="flex items-start gap-2 text-[13px] text-foreground bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-2 leading-relaxed">
          <Icon name="Palette" size={13} className="text-primary shrink-0 mt-0.5" />
          <TypingLine text={design} animate={animate && stage === designStage} onDone={next} onTick={onTick} />
        </div>
      )}

      {/* Финальный этап: секции, кнопки, идеи */}
      {stage >= finalStage && (
        <>
          {!intro && !summary && steps.length === 0 && (
            <p className="text-muted-foreground text-[13px]">{tr('builderReadyDesc', lang)}</p>
          )}

          {sections.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                {lang === 'ru' ? 'На сайте есть' : 'On the site'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sections.map((s, si) => (
                  <span key={si} className="flex items-center gap-1 text-[11px] text-foreground bg-background border border-border px-2 py-1 rounded-lg">
                    <Icon name="Check" size={10} className="text-emerald-500 shrink-0" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2.5 border-t border-border">
            <button onClick={onPreview}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-semibold bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors">
              <Icon name="Eye" size={11} /> {previewLabel}
            </button>
            <button onClick={onCode}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/70 px-2.5 py-1.5 rounded-lg transition-colors">
              <Icon name="Code" size={11} /> {codeLabel}
            </button>
            <button onClick={onDownload}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/70 px-2.5 py-1.5 rounded-lg transition-colors">
              <Icon name="Download" size={11} /> {downloadLabel}
            </button>
          </div>

          <div className="pt-2.5 border-t border-border">
            <p className="text-[11px] text-foreground font-semibold mb-2 flex items-center gap-1">
              <Icon name="Sparkles" size={12} className="text-primary" />
              {lang === 'ru' ? 'Идеи, чтобы сделать сайт лучше' : 'Ideas to improve the site'}
            </p>
            <div className="space-y-1.5">
              {ideas.map((s, sgi) => (
                <button key={sgi} onClick={() => onSuggestion(s.prompt)}
                  className="w-full flex items-center gap-2 text-left text-[12px] text-foreground bg-background hover:bg-primary/5 border border-border hover:border-primary/40 px-2.5 py-2 rounded-lg transition-all group">
                  <span className="grid place-items-center h-6 w-6 rounded-md bg-primary/10 text-primary shrink-0">
                    <Icon name={s.icon} size={13} fallback="Sparkles" />
                  </span>
                  <span className="flex-1 font-medium">{s.label}</span>
                  <Icon name="Plus" size={13} className="text-muted-foreground group-hover:text-primary shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Индикатор «печатает», пока не дошли до финала */}
      {animate && stage < finalStage && (
        <div className="flex gap-1 pt-0.5">
          {[0, 1, 2].map(j => (
            <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}