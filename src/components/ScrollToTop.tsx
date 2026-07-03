import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Прокручивает страницу наверх при переходе по маршруту.
 * Если в URL есть якорь (#section) — плавно скроллит к нужной секции. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      // Небольшая задержка, чтобы секция успела отрендериться после перехода
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        window.scrollTo(0, 0);
      }, 100);
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}