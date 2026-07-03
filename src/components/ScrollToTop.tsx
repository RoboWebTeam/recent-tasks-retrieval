import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Прокручивает страницу наверх при каждом переходе по маршруту. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
