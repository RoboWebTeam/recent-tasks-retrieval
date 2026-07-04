import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { tr, type Lang } from '@/lib/i18n';

interface Props {
  lang: Lang;
  intro?: string;
  summary?: string;
  steps?: string[];
  design?: string;
  /** true — проигрывать анимацию печати; false — показать всё сразу (старые сообщения из истории) */
  animate: boolean;
  onTick: () => void;
  /** true — это правка существующего сайта, false — создание нового */
  isEdit?: boolean;
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
    const speed = 1;
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
    lang, intro, summary, steps = [], design,
    animate, onTick, isEdit,
  } = props;

  // Собираем последовательность «этапов» — сколько блоков нужно раскрыть по очереди.
  // Каждый шаг steps — отдельный этап, чтобы они появлялись один за другим.
  // stage = индекс текущего раскрываемого блока. Если !animate — показываем всё сразу.
  const totalStages =
    (intro ? 1 : 0) + steps.length + (summary ? 1 : 0) + (design ? 1 : 0) + 1; // +1 = финальный

  const [stage, setStage] = useState(animate ? 0 : totalStages);
  const next = () => setStage(s => s + 1);

  // Вычисляем «границы» этапов для показа
  let cursor = 0;
  const introStage = intro ? cursor++ : -1;
  const stepStages = steps.map(() => cursor++);
  const summaryStage = summary ? cursor++ : -1;
  const designStage = design ? cursor++ : -1;
  const finalStage = cursor;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
        <Icon name="CheckCircle" size={13} /> {tr('builderReady', lang)}
      </div>

      {/* Файл, с которым работал ИИ — показываем какой именно код был изменён */}
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground bg-secondary/60 border border-border rounded-lg px-2.5 py-1.5 w-fit">
        <Icon name={isEdit ? 'FilePenLine' : 'FilePlus2'} fallback="FileCode" size={13} className="text-primary shrink-0" />
        <span className="font-mono">index.html</span>
        <span className="text-muted-foreground/60">
          {isEdit ? (lang === 'ru' ? 'обновлён' : 'updated') : (lang === 'ru' ? 'создан' : 'created')}
        </span>
      </div>

      {/* Вступление */}
      {intro && stage >= introStage && (
        <p className="text-foreground text-[14px] font-semibold leading-relaxed">
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
                <div key={i} className="flex items-start gap-2 text-[14px] font-semibold text-foreground leading-relaxed">
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
        <p className="text-foreground text-[14px] font-semibold leading-relaxed">
          <TypingLine text={summary} animate={animate && stage === summaryStage} onDone={next} onTick={onTick} />
        </p>
      )}

      {/* Дизайн */}
      {design && stage >= designStage && (
        <div className="flex items-start gap-2 text-[14px] font-semibold text-foreground bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-2 leading-relaxed">
          <Icon name="Palette" size={13} className="text-primary shrink-0 mt-0.5" />
          <TypingLine text={design} animate={animate && stage === designStage} onDone={next} onTick={onTick} />
        </div>
      )}

      {/* Финальный этап */}
      {stage >= finalStage && !intro && !summary && steps.length === 0 && (
        <p className="text-muted-foreground text-[14px]">{tr('builderReadyDesc', lang)}</p>
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