import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { LogoMark } from '@/components/Logo';
import { getLang } from '@/lib/i18n';
import { setSeo } from '@/lib/seo';

/** Страница «не найдено». Раньше была вне фирменного стиля (серый фон, синие ссылки) и без
 *  мета-тегов — то есть уходила в поиск с заголовком и описанием главной. Теперь закрыта от
 *  индексации и уводит человека обратно на живые разделы, а не в тупик. */
const NotFound = () => {
  const location = useLocation();
  const ru = getLang() === 'ru';

  useEffect(() => {
    setSeo({
      title: ru ? 'Страница не найдена' : 'Page not found',
      description: ru
        ? 'Такой страницы на сайте нет. Вернитесь на главную или посмотрите тарифы и блог.'
        : 'This page does not exist. Go back to the homepage or browse pricing and the blog.',
      noindex: true,
    });
  }, [ru]);

  const links = ru
    ? [
        { to: '/', icon: 'Home', label: 'На главную' },
        { to: '/pricing', icon: 'CreditCard', label: 'Тарифы' },
        { to: '/blog', icon: 'Newspaper', label: 'Блог' },
      ]
    : [
        { to: '/', icon: 'Home', label: 'Homepage' },
        { to: '/pricing', icon: 'CreditCard', label: 'Pricing' },
        { to: '/blog', icon: 'Newspaper', label: 'Blog' },
      ];

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center bg-background px-6 text-center">
      <span
        aria-hidden
        className="pointer-events-none absolute h-72 w-72 rounded-full bg-primary/15 blur-3xl breathe"
      />

      <Link to="/" className="relative mb-8 flex items-center gap-2 font-display text-lg font-extrabold">
        <LogoMark size={32} />
        Roboweb
      </Link>

      <p className="relative font-display text-6xl font-extrabold tracking-tight text-primary sm:text-7xl">404</p>
      <h1 className="relative mt-3 font-display text-2xl font-bold text-foreground text-balance">
        {ru ? 'Такой страницы нет' : 'This page does not exist'}
      </h1>
      <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {ru
          ? 'Возможно, в адресе опечатка или страницу перенесли. Вот куда можно пойти дальше.'
          : 'The address may have a typo, or the page has moved. Here is where to go next.'}
      </p>

      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-2">
        {links.map((l, i) => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              i === 0
                ? 'bg-primary text-primary-foreground glow-hover shadow-md shadow-primary/30'
                : 'border border-border bg-card text-foreground hover:border-primary/40'
            }`}
          >
            <Icon name={l.icon} fallback="Link" size={15} />
            {l.label}
          </Link>
        ))}
      </div>

      <p className="relative mt-8 text-xs text-muted-foreground/70">
        {ru ? 'Запрошенный адрес' : 'Requested address'}: <code className="font-mono">{location.pathname}</code>
      </p>
    </div>
  );
};

export default NotFound;
