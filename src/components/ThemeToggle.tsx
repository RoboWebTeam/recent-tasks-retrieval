import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { getTheme, toggleTheme, type Theme } from '@/lib/theme';

interface ThemeToggleProps {
  className?: string;
  size?: number;
}

/** Кнопка переключения светлой/тёмной темы (солнце/луна). Выбор сохраняется в localStorage. */
export default function ThemeToggle({ className = '', size = 17 }: ThemeToggleProps) {
  const [theme, setThemeState] = useState<Theme>(getTheme());
  const handle = () => setThemeState(toggleTheme());
  return (
    <button
      type="button"
      onClick={handle}
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      className={`grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${className}`}
    >
      <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={size} />
    </button>
  );
}
