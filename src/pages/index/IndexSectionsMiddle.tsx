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
            <h2 className="mt-3 inline-block font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight text-gradient">
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
                    ? 'bg-gradient-to-r from-primary to-[hsl(258,90%,62%)] text-white shadow-lg shadow-primary/30 scale-105'
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
              <div className={`pointer-events-none absolute -inset-0.5 -z-10 rounded-[1.1rem] bg-gradient-to-br ${p.color} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30`} />

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
                    <Icon name="Zap" size={10} className="text-[hsl(88,80%,60%)]" />
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

      {/* REVIEWS */}
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2 mb-10 md:mb-14">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{lang === 'ru' ? 'Отзывы' : 'Reviews'}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {lang === 'ru' ? 'Что говорят клиенты' : 'What clients say'}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {lang === 'ru' ? 'Реальные люди, реальные результаты.' : 'Real people, real results.'}
              </p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(lang === 'ru' ? [
              { name: "Анна Петрова", role: "Кофейня", avatar: "АП", color: "from-amber-400 to-orange-500", stars: 5, text: "Просила не просто сайт, а онлайн-заказ. Получила рабочий: меню, корзина, оформление, заявки падают прямо в базу и видны в панели. Это не картинка, а точка приёма заказов." },
              { name: "Дмитрий Козлов", role: "Стартап", avatar: "ДК", color: "from-indigo-500 to-blue-500", stars: 5, text: "За вечер собрали MVP с регистрацией и кабинетами, показали инвесторам, а код на Next.js + Prisma забрали в свой GitHub. Команда продолжила с готового каркаса — сэкономили месяцы старта." },
              { name: "Марина Соколова", role: "Веб-студия", avatar: "МС", color: "from-violet-500 to-fuchsia-500", stars: 5, text: "Отдаём клиентам рабочие сайты с бэкендом за час и передаём код в их репозиторий. Раньше такой бэкенд занимал недели — теперь берём больше проектов и не заперты в чужой платформе." },
              { name: "Игорь Новиков", role: "Фитнес-клуб", avatar: "ИН", color: "from-emerald-400 to-teal-500", stars: 5, text: "Нужна была запись на тренировки с кабинетами клиентов. Всё работает: заявки в базе, расписание живое, люди бронируют сами. Администратор перестал вести таблицы вручную." },
              { name: "Светлана Кравцова", role: "Маркетинг", avatar: "СК", color: "from-rose-500 to-pink-500", stars: 5, text: "Раньше лендинг был просто витриной. Теперь формы пишут лиды в базу и уходят в CRM, ничего не теряется, всё видно в панели. Тестирую по несколько оферов в день без разработчика." },
              { name: "Алексей Громов", role: "Барбершоп", avatar: "АГ", color: "from-cyan-400 to-sky-500", stars: 5, text: "Хотел онлайн-запись, а не визитку. Получил сайт, где клиент выбирает мастера и время, и запись падает в базу. Все заявки в одном месте — блокнот больше не нужен." },
              { name: "Юлия Волкова", role: "Флорист", avatar: "ЮВ", color: "from-pink-400 to-rose-500", stars: 5, text: "Собрала магазин с каталогом букетов, корзиной и оформлением заказа. Букеты продаются онлайн по-настоящему, а не через директ — заказы приходят с адресом и составом прямо в панель." },
              { name: "Роман Ефимов", role: "Автомойка", avatar: "РЕ", color: "from-blue-500 to-slate-700", stars: 5, text: "В сайтах не разбираюсь, но описал по-русски, что нужно — и получил рабочую онлайн-запись с выбором времени и сохранением в базу. Не макет на согласование, а инструмент, который приносит заявки." },
              { name: "Ксения Орлова", role: "HR", avatar: "КО", color: "from-teal-500 to-emerald-600", stars: 5, text: "Собрала карьерный сайт с формой отклика в базу и кабинетом для просмотра заявок. Анкеты кандидатов не теряются, вижу их в панели — рекрутинг перестал жить в почте. Сделали за день без разработчика." },
              { name: "Павел Соловьёв", role: "IT-школа", avatar: "ПС", color: "from-violet-600 to-indigo-800", stars: 5, text: "Как разработчик оценил главное: получил каркас на Next.js + Prisma с аккаунтами и оплатой курсов за минуту, забрал в GitHub и допилил под свою логику. Сэкономил дни рутины на старте." },
              { name: "Наталья Волошина", role: "Отель", avatar: "НВ", color: "from-amber-600 to-emerald-800", stars: 5, text: "Сайт с бронированием и кабинетом гостя работает: заявки на номера падают в базу с датами, подтверждаем в пару кликов. Видим загрузку и не путаемся в бронях — работает, а не просто красиво." }
            ] : [
              { name: "Anna P.", role: "Coffee shop", avatar: "AP", color: "from-amber-400 to-orange-500", stars: 5, text: "I asked for more than a page — online ordering. Got a working one: menu, cart, checkout, leads landing right in the database and shown in a dashboard. Not a picture, an order desk." },
              { name: "David K.", role: "Startup", avatar: "DK", color: "from-indigo-500 to-blue-500", stars: 5, text: "In an evening we built an MVP with sign-up and accounts, showed investors, then pulled the Next.js + Prisma code into our GitHub. The team continued from a ready scaffold — saved months of setup." },
              { name: "Marina S.", role: "Web studio", avatar: "MS", color: "from-violet-500 to-fuchsia-500", stars: 5, text: "We ship clients working sites with a backend in an hour and hand the code to their repo. A backend like this used to take weeks — now we take on more projects and aren't locked into anyone's platform." },
              { name: "Igor N.", role: "Fitness club", avatar: "IN", color: "from-emerald-400 to-teal-500", stars: 5, text: "We needed class booking with member accounts. It all works: leads in the database, a live schedule, people book themselves. The admin stopped keeping manual spreadsheets." },
              { name: "Svetlana K.", role: "Marketing", avatar: "SK", color: "from-rose-500 to-pink-500", stars: 5, text: "Our landing used to be just a showcase. Now forms write leads to a database and push to CRM, nothing gets lost, all visible in one panel. I test several offers a day without a developer." },
              { name: "Alex G.", role: "Barbershop", avatar: "AG", color: "from-cyan-400 to-sky-500", stars: 5, text: "I wanted online booking, not a business card. Got a site where the client picks a barber and time, and the booking saves to a database. Every request in one place — no more notebook." },
              { name: "Julia V.", role: "Florist", avatar: "JV", color: "from-pink-400 to-rose-500", stars: 5, text: "Built a store with a bouquet catalog, cart and checkout. Bouquets sell online for real, not via DMs — orders arrive with the address and contents right in the panel." },
              { name: "Roman E.", role: "Car wash", avatar: "RE", color: "from-blue-500 to-slate-700", stars: 5, text: "I know nothing about websites, but I described what I needed in plain words — and got working online booking with time slots saved to a database. Not a mockup to approve, a tool that brings in leads." },
              { name: "Kate O.", role: "HR", avatar: "KO", color: "from-teal-500 to-emerald-600", stars: 5, text: "I built a careers site with an application form saving to a database and a dashboard to review responses. Candidate entries never get lost, I see them in the panel — recruiting left the inbox. Built in a day without a developer." },
              { name: "Paul S.", role: "IT school", avatar: "PS", color: "from-violet-600 to-indigo-800", stars: 5, text: "As a developer I valued the main thing: a ready Next.js + Prisma scaffold with accounts and course payments in a minute, exported to GitHub and finished to my own logic. Saved days of boilerplate at the start." },
              { name: "Natalie V.", role: "Hotel", avatar: "NV", color: "from-amber-600 to-emerald-800", stars: 5, text: "A site with booking and a guest account works: room requests land in a database with dates and we confirm in a couple of clicks. We see occupancy and never mix up reservations — it works, not just looks good." }
            ]).map((r, i) => (
              <Reveal key={r.name} delay={i * 70}>
                <div className="h-full rounded-2xl md:rounded-3xl bg-card border border-border p-5 md:p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.stars }).map((_, si) => (
                      <Icon key={si} name="Star" size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-foreground leading-relaxed flex-1">«{r.text}»</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${r.color} text-white text-xs font-bold`}>
                      {r.avatar}
                    </div>
                    <div>
                      <div className="font-display font-semibold text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="Star" size={22} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <div className="text-2xl font-display font-black">4.9 / 5</div>
              <div className="text-muted-foreground text-sm">{lang === 'ru' ? 'на основе 1 200+ отзывов' : 'based on 1,200+ reviews'}</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA 2 */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-[hsl(250,90%,60%)]">
        <Reveal>
          <div className="container text-center text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium mb-5">
              <Icon name="Clock" size={15} /> {L.cta2.badge[lang]}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
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