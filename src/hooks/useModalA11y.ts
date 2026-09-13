import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Клавиатура и фокус для САМОДЕЛЬНЫХ модальных окон.
 *
 * У окон на Radix это есть из коробки, а у собранных руками — не было ничего:
 * проверил на живой сборке, после открытия окна демонстрации активным элементом
 * оставался BODY. То есть с клавиатуры окно недостижимо, Tab уходит на страницу
 * под ним, а Esc не закрывает.
 *
 * Хук делает четыре вещи:
 *   • уводит фокус внутрь окна при открытии;
 *   • держит Tab внутри (по кругу, и вперёд, и назад с Shift);
 *   • закрывает по Esc;
 *   • возвращает фокус на элемент, с которого окно открыли.
 *
 * Прокрутку страницы под окном он НЕ блокирует намеренно: место под полосу
 * прокрутки зарезервировано глобально (scrollbar-gutter), и блокировка здесь
 * дала бы вторую, конфликтующую реализацию.
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    // Фокус на первый интерактивный элемент, иначе на сам контейнер.
    const first = node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !node) return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }

      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      else if (!node.contains(document.activeElement)) { e.preventDefault(); firstEl.focus(); }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      restoreTo.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  return ref;
}
