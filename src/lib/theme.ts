// Переключение светлой/тёмной темы. Тема применяется классом .dark на <html>; выбор хранится в
// localStorage. Первичное применение — инлайн-скриптом в index.html (до рендера, без вспышки).
export type Theme = 'light' | 'dark';

const DARK_BG = '#0E1116';
const LIGHT_BG = '#F7F8FB';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
  } catch {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');
  root.style.background = t === 'dark' ? DARK_BG : LIGHT_BG;
  root.style.colorScheme = t;
}

export function setTheme(t: Theme) {
  try { localStorage.setItem('theme', t); } catch { /* приватный режим */ }
  applyTheme(t);
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
