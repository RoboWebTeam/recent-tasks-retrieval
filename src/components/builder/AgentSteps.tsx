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
  const ru = lang === 'ru';
  // Пока строк ещё нет — модель «думает» (adaptive thinking) до первого токена. Как только код
  // пошёл — честно показываем «Пишу код…»/«Вношу правки…».
  const statusLabel = status === 'creating'
    ? (lines > 0 ? (ru ? 'Пишу код…' : 'Writing code…') : (ru ? 'Думаю над структурой…' : 'Thinking…'))
    : status === 'updating'
    ? (lines > 0 ? (ru ? 'Вношу правки…' : 'Editing…') : (ru ? 'Анализирую сайт…' : 'Analyzing…'))
    : status === 'created'
    ? (ru ? 'создан' : 'created')
    : (ru ? 'обновлён' : 'updated');

  return (
    <div className="flex items-center gap-2.5 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 animate-fade-in">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon name={isCreate ? 'FilePlus2' : 'FilePenLine'} fallback="FileCode" size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-semibold text-foreground truncate">{fileName}</span>
          {lines > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums shrink-0">
              +{lines} {ru ? 'строк' : 'lines'}
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

/** Подбирает осмысленную иконку шага по его тексту — чтобы завершённые шаги читались как лог операций. */
function iconForStep(text: string): string {
  const t = text.toLowerCase();
  if (/hero|оффер|шапк|главн|первый экран|заголов/.test(t)) return 'Sparkles';
  if (/меню|услуг|каталог|товар|блюд|ассортимент/.test(t)) return 'List';
  if (/цен|тариф|стоимост|абонемент|прайс|пакет/.test(t)) return 'CreditCard';
  if (/отзыв|доверия|клиент|рейтинг|репутац/.test(t)) return 'Star';
  if (/форм|запис|контакт|связ|заявк|подписк|звон/.test(t)) return 'Mail';
  if (/расписан|график|календар|дни|время|часы|режим/.test(t)) return 'Calendar';
  if (/преимуществ|почему|выгод|цифр|факт|достоинств|о нас|о компан/.test(t)) return 'Award';
  if (/галере|фото|изображ|портфолио|работ/.test(t)) return 'Image';
  if (/карт|адрес|проезд|локац|парков/.test(t)) return 'MapPin';
  if (/анимац|красот|полир|стил|дизайн|палитр|шрифт|адаптив|финал/.test(t)) return 'Palette';
  if (/футер|подвал|копирайт|соцсет/.test(t)) return 'PanelBottom';
  if (/faq|вопрос/.test(t)) return 'HelpCircle';
  if (/цвет|кнопк|меняю|правк|измен|заменя/.test(t)) return 'Wand2';
  return 'Check';
}

export const AgentStep = memo(function AgentStep({
  text, done,
}: {
  text: string;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 py-0.5 animate-fade-in">
      <span className={`grid place-items-center h-5 w-5 rounded-full shrink-0 mt-0.5 ${done ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
        {done
          ? <Icon name={iconForStep(text)} fallback="Check" size={11} />
          : <Icon name="Loader" size={11} className="animate-spin" />}
      </span>
      <span className={`text-[13.5px] font-semibold leading-relaxed ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
        {text}
      </span>
    </div>
  );
});
