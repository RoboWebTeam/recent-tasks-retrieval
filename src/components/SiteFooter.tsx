import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';
import { L, getNAV } from '@/pages/index/indexData';

interface Props { lang: Lang; }

export function SiteFooter({ lang }: Props) {
  const NAV = getNAV(lang);

  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-10 md:py-14 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-lg md:text-xl">
            <span className="grid h-8 w-8 md:h-9 md:w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={18} />
            </span>
            Roboweb
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">{L.footer.desc[lang]}</p>
        </div>
        <div>
          <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.nav[lang]}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {NAV.map((n) => {
              // Якорные ссылки (#process и т.п.) в футере ведут на соответствующую секцию
              // главной страницы, чтобы работать с любой страницы сайта.
              const to = n.href.startsWith('#') ? `/${n.href}` : n.href;
              return (
                <li key={n.href}>
                  <Link to={to} className="hover:text-foreground transition-colors">{n.label}</Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.contacts[lang]}</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Icon name="Mail" size={15} className="text-primary shrink-0" />
              <a href="mailto:roboweb.site@yandex.ru" className="hover:text-foreground transition-colors break-all">
                roboweb.site@yandex.ru
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="Phone" size={15} className="text-primary shrink-0" />
              <a href="tel:+79331770086" className="hover:text-foreground transition-colors">
                8 (933) 177-00-86
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="MessageCircle" size={15} className="text-primary shrink-0" />
              <a href="https://t.me/roboweb" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Telegram
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.social[lang]}</h4>
          <div className="flex gap-2 md:gap-3">
            {[
              { icon: 'Send', href: 'https://t.me/roboweb', title: 'Telegram' },
              { icon: 'Rss', href: 'https://dzen.ru/roboweb', title: 'Яндекс Дзен' },
            ].map((s) => (
              <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer" title={s.title}
                className="grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all hover:scale-110">
                <Icon name={s.icon} size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs sm:text-sm text-muted-foreground px-4 space-y-1">
        <p>© 2026 Roboweb. {L.footer.copy[lang]}</p>
        <p className="text-[11px] sm:text-xs text-muted-foreground/70">
          ИП Аракелов Станислав Владиславович · ОГРНИП 324508100357892 · ИНН 501210007760
        </p>
      </div>
    </footer>
  );
}