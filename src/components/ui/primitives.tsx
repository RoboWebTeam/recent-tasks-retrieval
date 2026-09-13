import type { ReactNode } from 'react';
import Icon from '@/components/ui/icon';

/**
 * Мелкие повторяющиеся узоры интерфейса.
 *
 * Волны 1–3 привели ЗНАЧЕНИЯ к системе (шкалы, роли, слои), но сами узоры так и
 * остались копипастой: одна и та же строка классов встречалась до 12 раз в четырёх
 * файлах. Здесь собраны только те, что реально повторяются — по замеру, а не «на
 * всякий случай». Каждый принимает className, чтобы местные отличия не требовали
 * форка компонента.
 */

const cx = (...v: (string | false | undefined)[]) => v.filter(Boolean).join(' ');

/** Надзаголовок секции — мелкая прописная строка акцентным цветом. 12 мест. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary', className)}>
      {children}
    </span>
  );
}

/** Заголовок секции лендинга. 10 мест. */
export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cx('mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight', className)}>
      {children}
    </h2>
  );
}

/** Подзаголовок под заголовком секции. 8 мест. */
export function SectionLead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('mt-4 text-muted-foreground text-base sm:text-lg', className)}>{children}</p>;
}

/** Заголовок страницы кабинета. 5 мест. */
export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cx('font-display font-bold text-2xl sm:text-3xl', className)}>{children}</h1>;
}

/** Мелкая прописная подпись над группой полей. 8 мест. */
export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('text-muted-foreground uppercase tracking-widest text-2xs font-semibold mb-2', className)}>
      {children}
    </p>
  );
}

/** Ячейка шапки таблицы. 10 мест в админке. */
export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cx('text-left px-4 py-3 font-semibold text-muted-foreground', className)}>{children}</th>;
}

/** Рамка вокруг таблицы. 5 мест. */
export function TableFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-border overflow-hidden', className)}>{children}</div>;
}

/** Карточка-панель. 5 мест. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('bg-card border border-border rounded-2xl p-5', className)}>{children}</div>;
}

/**
 * Состояние «пусто» или «загрузка» в середине блока. 7 мест в семи файлах.
 * `loading` крутит спиннер, иначе показывает иконку (по умолчанию — пустая коробка).
 */
export function EmptyState({
  children, icon = 'Inbox', loading = false, className,
}: { children: ReactNode; icon?: string; loading?: boolean; className?: string }) {
  return (
    <div className={cx('flex items-center justify-center py-16 text-muted-foreground gap-2', className)}>
      <Icon name={loading ? 'Loader' : icon} fallback="Inbox" size={18} className={loading ? 'animate-spin' : undefined} />
      {children}
    </div>
  );
}

/** Плашка с ошибкой под формой. 5 мест. */
export function ErrorNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cx('flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-3', className)}
    >
      <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
      <span className="break-all">{children}</span>
    </div>
  );
}

/** Крупная иконка в скруглённой плашке по центру — шапка пустого раздела. 5 мест. */
export function FeatureIcon({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cx('grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4', className)}>
      <Icon name={name} fallback="Sparkles" size={26} />
    </div>
  );
}

/** Текстовая ссылка акцентным цветом. 7 мест. */
export function TextLink({ children, className, ...rest }: { children: ReactNode; className?: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx('text-primary font-semibold hover:underline', className)} {...rest}>{children}</a>;
}

/**
 * Заглушка загрузки. Радиус НЕ задаёт намеренно: у мест разные скругления
 * (lg, xl, 2xl, full), а два класса радиуса в одной строке дали бы непредсказуемый
 * результат — побеждает не порядок в строке, а порядок в собранном CSS.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse bg-secondary', className)} aria-hidden />;
}
