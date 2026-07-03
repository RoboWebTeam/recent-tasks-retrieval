import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';

interface Props { lang: Lang; }

export function DashboardFooter({ lang }: Props) {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>© 2026 Roboweb</span>
          <a href="mailto:roboweb.site@yandex.ru" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Icon name="Mail" size={13} /> roboweb.site@yandex.ru
          </a>
          <a href="https://t.me/roboweb" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Icon name="Send" size={13} /> Telegram
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="hover:text-foreground transition-colors">
            {lang === 'ru' ? 'Тарифы' : 'Pricing'}
          </Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">
            {lang === 'ru' ? 'Блог' : 'Blog'}
          </Link>
          <Link to="/" className="hover:text-foreground transition-colors">
            {lang === 'ru' ? 'На сайт' : 'Home'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
