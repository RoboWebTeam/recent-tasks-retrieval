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
  /** true — шаги уже показаны вживую отдельными пузырями (стрим), поэтому отчёт их и чип файла не дублирует */
  hideSteps?: boolean;
  /** Клик по предложению улучшения — отправляет его как новую команду в чат */
  onSuggestion?: (prompt: string) => void;
  /** Блокировать кнопки предложений (во время генерации), чтобы не запустить второй запрос */
  suggestionsDisabled?: boolean;
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
    lang, intro, summary, steps = [],
    animate, onTick, isEdit, hideSteps,
    suggestions = [], onSuggestion, suggestionsDisabled,
  } = props;

  // В стрим-режиме шаги уже показаны вживую отдельными пузырями — в отчёте их и чип файла не дублируем.
  // Вступление («понял задачу — собираю… взялся за дело») тоже прячем: оно написано в «стартовом»
  // тоне и странно читается ПОСЛЕ готового сайта — ведём отчёт сразу с итога.
  const shownSteps = hideSteps ? [] : steps;
  const shownIntro = hideSteps ? '' : intro;

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
  // Показываем только intro, шаги и итог (блоки дизайна/секций/идей убраны из отчёта).
  const totalStages =
    (shownIntro ? 1 : 0) + shownSteps.length + (summary ? 1 : 0) + 1; // +1 = финальный

  const [stage, setStage] = useState(animate ? 0 : totalStages);
  const next = () => setStage(s => s + 1);

  // Вычисляем «границы» этапов для показа
  let cursor = 0;
  const introStage = shownIntro ? cursor++ : -1;
  const stepStages = shownSteps.map(() => cursor++);
  const summaryStage = summary ? cursor++ : -1;
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
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[14px] font-semibold">
        <Icon name="CheckCircle" size={14} /> {tr('builderReady', lang)}
      </div>

      {/* ФАЗА 1 — какой файл читается/создаётся. В стрим-режиме уже есть карточка файла — не дублируем. */}
      {!hideSteps && (
        <div className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground bg-secondary/60 border border-border rounded-lg px-2.5 py-1.5 w-fit">
          <Icon name={isEdit ? 'FilePenLine' : 'FilePlus2'} fallback="FileCode" size={14} className="text-primary shrink-0" />
          <span className="font-mono">index.html</span>
          <span className="text-muted-foreground/70">
            {phase < 2
              ? (lang === 'ru' ? 'читаю…' : 'reading…')
              : isEdit ? (lang === 'ru' ? 'обновлён' : 'updated') : (lang === 'ru' ? 'создан' : 'created')}
          </span>
        </div>
      )}

      {/* ФАЗА 2 — подробное описание работы. До неё показываем индикатор ожидания. */}
      {phase < 2 && (
        <div className="flex gap-1 pt-0.5">
          {[0, 1, 2].map(j => (
            <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
          ))}
        </div>
      )}

      {/* Вступление (в лайв-режиме скрыто — см. shownIntro) */}
      {phase >= 2 && shownIntro && stage >= introStage && (
        <p className="text-foreground text-[14px] font-semibold leading-relaxed">
          <TypingLine text={shownIntro} animate={detailsAnimate && stage === introStage} onDone={next} onTick={onTick} />
        </p>
      )}

      {/* Шаги — по одному (в стрим-режиме shownSteps пуст, т.к. шаги уже показаны вживую) */}
      {phase >= 2 && shownSteps.length > 0 && stage > stepStages[0] - 1 && (
        <div className="space-y-1.5">
          <p className="text-[15px] text-foreground font-semibold">
            {lang === 'ru' ? 'Что я сделал' : 'What I did'}
          </p>
          <div className="space-y-1.5">
            {shownSteps.map((step, i) => (
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

      {/* Финальный этап */}
      {phase >= 2 && stage >= finalStage && !shownIntro && !summary && shownSteps.length === 0 && (
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

      {/* ИНТЕРАКТИВНЫЕ ИДЕИ — кликабельные чипы: клик отправляет готовую команду в чат.
          Появляются после того, как отчёт допечатан. */}
      {phase >= 2 && stage >= finalStage && suggestions.length > 0 && (
        <div className="pt-1 animate-fade-in">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
            <Icon name="Sparkles" size={12} className="text-primary" />
            {lang === 'ru' ? 'Что дальше' : 'What’s next'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 4).map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestion?.(s.prompt)}
                disabled={suggestionsDisabled}
                title={s.prompt}
                className="group flex items-center gap-1.5 rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all px-3 py-1.5 text-[12.5px] font-semibold text-foreground"
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