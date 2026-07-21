import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getSession } from '@/lib/auth';
import { L } from './indexData';
import { DEMO_CATEGORIES_RU, DEMO_CATEGORIES_EN, type DemoCategory } from './portfolioCategories';
import type { DemoItem } from './portfolioData';
import { Reveal, EmailForm } from './IndexShared';

interface Props { lang: Lang; }

const PAGE_SIZE = 12;

const SKELETON_COUNT = 8;

function PortfolioSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card animate-pulse"
        >
          <div className="h-44 bg-muted" />
          <div className="p-4 flex flex-col flex-1 gap-3">
            <div className="h-4 w-20 rounded-full bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-8 w-full rounded-xl bg-muted mt-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Секция портфолио ---
function PortfolioSection({ lang, portfolio }: { lang: Lang; portfolio: DemoItem[] }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<DemoCategory>('all');
  const [page, setPage] = useState(1);
  const [prevCount, setPrevCount] = useState(0);
  const CATEGORIES = lang === 'ru' ? DEMO_CATEGORIES_RU : DEMO_CATEGORIES_EN;

  const goToPrompt = (prompt: string) => {
    const session = getSession();
    if (session) {
      navigate(`/builder?prompt=${encodeURIComponent(prompt)}`);
    } else {
      navigate(`/register?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  const filtered = activeFilter === 'all' ? portfolio : portfolio.filter(p => p.category === activeFilter);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const handleFilter = (id: DemoCategory) => {
    setActiveFilter(id);
    setPage(1);
    setPrevCount(0);
  };

  const handleShowMore = () => {
    setPrevCount(visible.length);
    setPage(p => p + 1);
  };

  return (
    <section id="portfolio" className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto px-2 mb-6">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.portfolio.label[lang]}</span>
            <h2 className="mt-3 inline-block font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-gradient">
              {L.portfolio.title[lang]}
            </h2>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg">
              {L.portfolio.desc[lang]}
            </p>
          </div>
        </Reveal>

        {/* Фильтры */}
        <Reveal>
          <div className="flex items-center gap-2 pb-1 mb-8 justify-center flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleFilter(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeFilter === cat.id
                    ? 'bg-gradient-to-r from-primary to-[hsl(224,60%,46%)] text-white shadow-lg shadow-primary/30 scale-105'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:-translate-y-0.5'
                }`}
              >
                {cat.label}
                {cat.id !== 'all' && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeFilter === cat.id ? 'bg-white/20' : 'bg-secondary'}`}>
                    {portfolio.filter(p => p.category === cat.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Сетка */}
        {portfolio.length === 0 ? (
          <PortfolioSkeleton />
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visible.map((p, i) => {
            const isNew = i >= prevCount;
            const delay = isNew ? `${(i - prevCount) * 50}ms` : '0ms';
            return (
            <div
              key={p.title}
              className="group relative flex flex-col rounded-2xl border border-border bg-card p-2.5 transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-2xl"
              style={isNew ? { animation: `cardIn 0.4s ease both`, animationDelay: delay } : undefined}
            >
              {/* Цветное свечение под карточкой на ховере — уникальный градиент элемента */}
              <div className={`pointer-events-none absolute -inset-0.5 -z-10 rounded-[1.1rem] bg-gradient-to-br ${p.color} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-15`} />

              {/* Скриншот в рамке браузера */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-border bg-secondary/70 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 flex flex-1 items-center gap-1 truncate rounded-md bg-background/80 px-2 py-0.5 text-[9px] text-muted-foreground">
                    <Icon name="Lock" size={8} /> roboweb.dev
                  </span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={250}
                    className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/15 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-xs italic leading-relaxed text-white line-clamp-3">«{p.prompt}»</p>
                  </div>
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    <Icon name="Zap" size={10} className="text-[hsl(195,50%,60%)]" />
                    {lang === 'ru' ? 'ИИ за минуты' : 'AI in minutes'}
                  </span>
                </div>
              </div>

              {/* Подпись + кнопка */}
              <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${p.color}`} />
                  <span className="text-xs font-semibold text-muted-foreground">{p.tag}</span>
                </div>
                <h3 className="mb-3 flex-1 font-display font-bold text-base text-foreground transition-colors group-hover:text-primary">
                  {p.title}
                </h3>
                <button
                  onClick={() => goToPrompt(p.prompt)}
                  className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
                >
                  <Icon name="Sparkles" size={13} />
                  {lang === 'ru' ? 'Попробовать промпт' : 'Try this prompt'}
                  <Icon name="ArrowRight" size={13} className="-ml-2 opacity-0 transition-all group-hover/btn:ml-0 group-hover/btn:opacity-100" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
        )}

        {/* Показать ещё / счётчик */}
        {portfolio.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {lang === 'ru' ? `Показано ${visible.length} из ${filtered.length}` : `Showing ${visible.length} of ${filtered.length}`}
          </p>
          {hasMore && (
            <button
              onClick={handleShowMore}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              <Icon name="ChevronDown" size={15} />
              {lang === 'ru' ? 'Показать ещё' : 'Show more'}
            </button>
          )}
        </div>
        )}

        <Reveal>
          <div className="mt-10 text-center">
            <a href="/register" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-8 py-3 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm sm:text-base">
              <Icon name="Sparkles" size={16} />
              {lang === 'ru' ? 'Создать свой сайт бесплатно' : 'Create your site for free'}
              <Icon name="ArrowRight" size={16} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function IndexSectionsMiddle({ lang }: Props) {
  const [portfolio, setPortfolio] = useState<DemoItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    import('./portfolioData').then(m => {
      if (!cancelled) setPortfolio(m.getPORTFOLIO(lang));
    });
    return () => { cancelled = true; };
  }, [lang]);

  return (
    <>
      {/* PORTFOLIO */}
      <PortfolioSection lang={lang} portfolio={portfolio} />

      {/* TRUST — почему нам можно доверить проект (заменяет фейковые отзывы) */}
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2 mb-10 md:mb-14">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{lang === 'ru' ? "Почему нам можно доверить проект" : "Why you can trust us with your project"}</span>
              <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {lang === 'ru' ? "Доверие — на проверяемых фактах, а не на отзывах" : "Trust built on verifiable facts, not testimonials"}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {lang === 'ru' ? "Мы новый продукт и говорим это прямо: у нас пока нет тысяч клиентов, и мы не станем их выдумывать. Вместо чужих логотипов и звёзд — то, что вы проверите сами: ваш код, ваш стек, ваши данные, публичная оферта и зарегистрированное юрлицо. Уйти можно в один клик, поэтому нам выгодно удерживать вас результатом, а не блокировкой." : "We're a new product and we say it plainly: we don't have thousands of clients yet, and we won't invent them. Instead of borrowed logos and star ratings, here's what you can verify yourself: your code, your stack, your data, a public offer and a registered company. You can leave in one click — so we're incentivized to keep you with results, not lock-in."}
              </p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(lang === 'ru' ? [
              { icon: "Code2", title: "Вы владеете кодом", text: "Готовый проект выгружается как настоящий Next.js + Prisma в ваш GitHub — фронтенд, бэкенд, схема БД и аккаунты. Это ваш актив, а не аренда платформы: он остаётся у вас, даже если вы уйдёте от нас." },
              { icon: "Database", title: "Данные в вашей БД", text: "Заявки, каталог, заказы и пользователи пишутся в вашу PostgreSQL, изолированную по проекту, по HTTPS/SSL. Данные под вашим контролем — выгружайте, переносите или удаляйте их в любой момент." },
              { icon: "KeyRound", title: "Ноль вендор-лока", text: "Забрали код — разворачивайте где угодно: Vercel, свой сервер, чужая команда. Уйти реально в один клик, и это осознанная позиция, а не недоработка: вы не зависите от нашей судьбы как компании." },
              { icon: "Server", title: "Реальный стек, не чёрный ящик", text: "Next.js, Prisma, PostgreSQL — индустриальный стандарт, который поддержит любой разработчик на рынке. Никакого проприетарного формата: проект можно читать и продолжать без нас." },
              { icon: "FileCheck", title: "Прозрачно и до оплаты", text: "Вы видите живое приложение, схему базы и весь код ещё до оплаты и публикации — никаких чёрных ящиков. Цена фиксированная за готовый продукт, без скрытых часов и сюрпризов в счёте." },
              { icon: "Building2", title: "Реальная компания, честная о новизне", text: "За сервисом стоит зарегистрированное ИП с ОГРНИП и ИНН и публичная оферта — это можно проверить в реестре. Мы не показываем выдуманных клиентов и оценок; вместо них — возврат в течение 7 дней по оферте, если оплаченные функции не использовались." }
            ] : [
              { icon: "Code2", title: "You own the code", text: "The finished project exports as real Next.js + Prisma into your GitHub — frontend, backend, DB schema and accounts. It's your asset, not a rented platform: it stays with you even if you leave us." },
              { icon: "Database", title: "Data in your own DB", text: "Leads, catalog, orders and users are written to your PostgreSQL, isolated per project, over HTTPS/SSL. The data is under your control — export, migrate or delete it at any time." },
              { icon: "KeyRound", title: "Zero vendor lock-in", text: "Once you have the code, deploy it anywhere: Vercel, your own server, another team. Leaving is genuinely one click — a deliberate stance, not an oversight: you don't depend on our fate as a company." },
              { icon: "Server", title: "A real stack, not a black box", text: "Next.js, Prisma, PostgreSQL — an industry standard any developer on the market can maintain. No proprietary format: the project can be read and continued without us." },
              { icon: "FileCheck", title: "Transparent, before you pay", text: "You see the live app, the database schema and all the code before you pay or publish — no black boxes. A fixed price for a finished product, with no hidden hours or surprises on the invoice." },
              { icon: "Building2", title: "A real company, honest that it's new", text: "Behind the service is a registered sole proprietor with a state ID (ОГРНИП/ИНН) and a public offer — verifiable on the state register. We show no invented clients or ratings; instead — a refund within 7 days under the offer if the paid features weren't used." }
            ]).map((p, i) => (
              <Reveal key={p.title} delay={i * 60}>
                <div className="h-full rounded-2xl md:rounded-3xl bg-card border border-border p-5 md:p-6 flex flex-col gap-3 hover:border-primary/30 transition-colors duration-300">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={p.icon} size={20} />
                  </span>
                  <h3 className="mt-1 font-display font-bold text-lg">{p.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 2 */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-[hsl(224,60%,44%)]">
        <Reveal>
          <div className="container text-center text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium mb-5">
              <Icon name="Clock" size={15} /> {L.cta2.badge[lang]}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
              {L.cta2.title[lang]}
            </h2>
            <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
              {L.cta2.desc[lang]}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-full font-semibold px-8 bg-white text-primary hover:bg-white/90 h-12 shadow-xl w-full sm:w-auto" asChild>
                <a href="/register">
                  {L.cta2.btn[lang]}
                  <Icon name="ArrowRight" size={18} className="ml-1" />
                </a>
              </Button>
              <Button size="lg" className="rounded-full font-semibold px-8 bg-white text-primary hover:bg-white/90 h-12 shadow-xl w-full sm:w-auto" asChild>
                <a href="https://t.me/roboweb" target="_blank" rel="noopener noreferrer">
                  <Icon name="Send" size={16} className="mr-2" />
                  {L.cta2.phone[lang]}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}