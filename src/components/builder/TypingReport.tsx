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
  /** Список секций/блоков созданного сайта */
  sections?: string[];
  /** Идеи улучшений — кликабельные кнопки, запускающие правку */
  suggestions?: Suggestion[];
  /** true — проигрывать анимацию печати; false — показать всё сразу (старые сообщения из истории) */
  animate: boolean;
  onTick: () => void;
  /** true — это правка существующего сайта, false — создание нового */
  isEdit?: boolean;
  /** Клик по предложению улучшения — отправляет его как новую команду в чат */
  onSuggestion?: (prompt: string) => void;
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
    // Скорость печати снижена в 2 раза (интервал 16 → 32 мс) — текст печатается плавнее.
    const timer = setInterval(() => {
      i = Math.min(i + speed, text.length);
      setShown(text.slice(0, i));
      onTick();
      if (i >= text.length) {
        clearInterval(timer);
        if (!doneRef.current) { doneRef.current = true; onDone(); }
      }
    }, 32);
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
    sections = [], suggestions = [],
    animate, onTick, isEdit, onSuggestion,
  } = props;

  // Диалог отправляется частями (фазами), появляющимися по очереди с паузой:
  //   phase 0 — «Жду ответов...» (короткое ожидание перед показом)
  //   phase 1 — какой файл читается/создаётся
  //   phase 2 — подробное описание работы (intro / шаги / итог / дизайн)
  // Если !animate (старое сообщение из истории) — сразу показываем всё (phase 2).
  const [phase, setPhase] = useState(animate ? 0 : 2);

  useEffect(() => {
    if (!animate) return;
    // Пауза перед показом файла, затем пауза перед подробным описанием.
    const t1 = setTimeout(() => { setPhase(1); onTick(); }, 700);
    const t2 = setTimeout(() => { setPhase(2); onTick(); }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Собираем последовательность «этапов» подробного описания — блоки раскрываются по очереди.
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

  // Подробное описание печатается только на 2-й фазе.
  const detailsAnimate = animate && phase >= 2;

  // ФАЗА 0 — ждём ответов
  if (phase === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-[14px] font-medium py-0.5">
        <span>{lang === 'ru' ? 'Жду ответов' : 'Waiting for response'}</span>
        <span className="flex gap-1">
          {[0, 1, 2].map(j => (
            <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
          ))}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
        <Icon name="CheckCircle" size={13} /> {tr('builderReady', lang)}
      </div>

      {/* ФАЗА 1 — какой файл читается/создаётся */}
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground bg-secondary/60 border border-border rounded-lg px-2.5 py-1.5 w-fit">
        <Icon name={isEdit ? 'FilePenLine' : 'FilePlus2'} fallback="FileCode" size={13} className="text-primary shrink-0" />
        <span className="font-mono">index.html</span>
        <span className="text-muted-foreground/60">
          {phase < 2
            ? (lang === 'ru' ? 'читаю…' : 'reading…')
            : isEdit ? (lang === 'ru' ? 'обновлён' : 'updated') : (lang === 'ru' ? 'создан' : 'created')}
        </span>
      </div>

      {/* ФАЗА 2 — подробное описание работы. До неё показываем индикатор ожидания. */}
      {phase < 2 && (
        <div className="flex gap-1 pt-0.5">
          {[0, 1, 2].map(j => (
            <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
          ))}
        </div>
      )}

      {/* Вступление */}
      {phase >= 2 && intro && stage >= introStage && (
        <p className="text-foreground text-[14px] font-semibold leading-relaxed">
          <TypingLine text={intro} animate={detailsAnimate && stage === introStage} onDone={next} onTick={onTick} />
        </p>
      )}

      {/* Шаги — по одному */}
      {phase >= 2 && steps.length > 0 && stage > stepStages[0] - 1 && (
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
                  <TypingLine text={step} animate={detailsAnimate && stage === stepStages[i]} onDone={next} onTick={onTick} />
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Итог */}
      {phase >= 2 && summary && stage >= summaryStage && (
        <p className="text-foreground text-[14px] font-semibold leading-relaxed">
          <TypingLine text={summary} animate={detailsAnimate && stage === summaryStage} onDone={next} onTick={onTick} />
        </p>
      )}

      {/* Дизайн */}
      {phase >= 2 && design && stage >= designStage && (
        <div className="flex items-start gap-2 text-[14px] font-semibold text-foreground bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-2 leading-relaxed">
          <Icon name="Palette" size={13} className="text-primary shrink-0 mt-0.5" />
          <TypingLine text={design} animate={detailsAnimate && stage === designStage} onDone={next} onTick={onTick} />
        </div>
      )}

      {/* Секции сайта — теги с блоками, которые получились */}
      {phase >= 2 && stage >= finalStage && sections.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
            {lang === 'ru' ? 'Секции сайта' : 'Site sections'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground bg-secondary border border-border rounded-lg px-2 py-1">
                <Icon name="LayoutPanelTop" fallback="Square" size={11} className="text-primary shrink-0" />
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Идеи улучшений — кликабельные кнопки, запускающие правку */}
      {phase >= 2 && stage >= finalStage && suggestions.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
            {lang === 'ru' ? 'Что ещё можно улучшить' : 'What else to improve'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {suggestions.map((sg, i) => (
              <button
                key={i}
                onClick={() => onSuggestion?.(sg.prompt)}
                className="group flex items-center gap-2 text-left text-[13px] font-medium text-foreground bg-secondary hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary rounded-xl px-2.5 py-2 transition-colors"
                title={sg.prompt}
              >
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-primary-foreground shrink-0 transition-colors">
                  <Icon name={sg.icon} fallback="Sparkles" size={13} />
                </span>
                <span className="flex-1 min-w-0 truncate">{sg.label}</span>
                <Icon name="Plus" size={13} className="text-muted-foreground group-hover:text-primary-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Финальный этап */}
      {phase >= 2 && stage >= finalStage && !intro && !summary && steps.length === 0 && (
        <p className="text-muted-foreground text-[14px]">{tr('builderReadyDesc', lang)}</p>
      )}

      {/* Индикатор «печатает», пока не дошли до финала (только на фазе подробного описания) */}
      {detailsAnimate && stage < finalStage && (
        <div className="flex gap-1 pt-0.5">
          {[0, 1, 2].map(j => (
            <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}