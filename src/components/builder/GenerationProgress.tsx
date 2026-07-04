import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { tr, type Lang, type TranslationKey } from '@/lib/i18n';

interface Props {
  lang: Lang;
  /** true — правка существующего сайта (короткий список этапов), false — генерация с нуля */
  isEdit: boolean;
}

const NEW_STEPS: TranslationKey[] = [
  'builderStep1', 'builderStep2', 'builderStep3', 'builderStep4', 'builderStep5', 'builderStep6',
];
const EDIT_STEPS: TranslationKey[] = [
  'builderStepEdit1', 'builderStepEdit2', 'builderStepEdit3',
];

/**
 * Показывает пошаговый прогресс генерации сайта: какие задачи выполняются и на каком этапе.
 * Этапы сменяются по таймеру (реального стриминга этапов от модели нет), но честно отражают
 * последовательность работы и делают ожидание понятным для пользователя.
 */
export default function GenerationProgress({ lang, isEdit }: Props) {
  const steps = isEdit ? EDIT_STEPS : NEW_STEPS;
  const [active, setActive] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Каждый этап держится примерно одинаковое время; последний остаётся активным
    // до тех пор, пока не придёт реальный ответ и компонент не будет размонтирован.
    const perStep = isEdit ? 2500 : 3500;
    const timer = setInterval(() => {
      setActive(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, perStep);
    return () => clearInterval(timer);
  }, [steps.length, isEdit]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-2 py-0.5">
      {steps.map((key, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <div
            key={key}
            className={`flex items-center gap-2 text-xs transition-all duration-300 ${
              done ? 'text-emerald-600 dark:text-emerald-400'
                : current ? 'text-foreground font-medium'
                : 'text-muted-foreground/40'
            }`}
          >
            <span className="grid place-items-center w-4 h-4 shrink-0">
              {done ? (
                <Icon name="CheckCircle2" size={14} />
              ) : current ? (
                <Icon name="LoaderCircle" size={14} className="animate-spin text-primary" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </span>
            <span>{tr(key, lang)}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 pt-1 mt-1 border-t border-border text-[11px] text-muted-foreground/70">
        <Icon name="Clock" size={11} className="shrink-0" />
        <span>{tr(isEdit ? 'builderEtaEdit' : 'builderEta', lang)}</span>
        <span className="text-muted-foreground/50">· {elapsed}{lang === 'ru' ? 'с' : 's'} {tr('builderElapsed', lang)}</span>
      </div>
    </div>
  );
}