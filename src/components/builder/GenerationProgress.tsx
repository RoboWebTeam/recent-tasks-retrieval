import { useState, useEffect } from 'react';
import { type Lang } from '@/lib/i18n';

interface Props {
  lang: Lang;
  isEdit: boolean;
  /** Реальная веха SSE-стриминга (напр. «Собираю секцию 3…»). Если задана — показываем её
   *  вместо имитации фаз по таймеру, т.к. это настоящий прогресс сборки сайта. */
  liveStatus?: string | null;
}

// Живые статусы процесса — сменяются по очереди, чтобы ожидание выглядело как реальная
// работа разработчика, а не одно застывшее «Думаю…».
const STAGES_CREATE_RU = [
  'Анализирую задачу…',
  'Продумываю структуру…',
  'Подбираю дизайн и палитру…',
  'Вёрстаю секции…',
  'Навожу красоту…',
];
const STAGES_CREATE_EN = [
  'Analyzing the task…',
  'Planning the structure…',
  'Choosing design & palette…',
  'Building sections…',
  'Polishing the details…',
];
const STAGES_EDIT_RU = [
  'Изучаю текущий сайт…',
  'Нахожу что изменить…',
  'Вношу правки…',
  'Проверяю результат…',
];
const STAGES_EDIT_EN = [
  'Reviewing the current site…',
  'Locating what to change…',
  'Applying edits…',
  'Checking the result…',
];

/**
 * Индикатор ожидания ответа ИИ с живыми сменяющимися статусами процесса работы.
 */
export default function GenerationProgress({ lang, isEdit, liveStatus }: Props) {
  const stages = isEdit
    ? (lang === 'ru' ? STAGES_EDIT_RU : STAGES_EDIT_EN)
    : (lang === 'ru' ? STAGES_CREATE_RU : STAGES_CREATE_EN);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // Идём по статусам и останавливаемся на последнем (не зацикливаем — чтобы к концу
    // генерации показывался финальный «Навожу красоту…», а не прыгал заново).
    const timer = setInterval(() => {
      setIdx(i => (i < stages.length - 1 ? i + 1 : i));
    }, 2500);
    return () => clearInterval(timer);
  }, [stages.length]);

  // При стриминге показываем РЕАЛЬНУЮ веху сборки, иначе — имитацию фаз по таймеру.
  const label = liveStatus || stages[idx];

  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className="text-muted-foreground text-[14px] font-semibold transition-opacity duration-300">
        {label}
      </span>
      <span className="flex gap-1">
        {[0, 1, 2].map(j => (
          <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
        ))}
      </span>
    </div>
  );
}
