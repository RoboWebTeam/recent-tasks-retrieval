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
              <div className={`pointer-events-none absolute -inset-0.5 -z-10 rounded-[1.1rem] bg-gradient-to-br ${p.color} opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-60`} />

              {/* Скриншот в рамке браузера */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-border bg-secondary/70 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 flex flex-1 items-center gap-1 truncate rounded-md bg-background/80 px-2 py-0.5 text-[9px] text-muted-foreground">
                    <Icon name="Lock" size={8} /> roboweb.site
                  </span>
                </div>
                <div
                  onClick={() => goToPrompt(p.prompt)}
                  role="button"
                  aria-label={p.title}
                  className="relative aspect-[16/10] cursor-pointer overflow-hidden"
                >
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
                  <span className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 scale-90 items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-primary opacity-0 shadow-xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                    <Icon name="Eye" size={13} /> {lang === 'ru' ? 'Открыть' : 'Open'}
                  </span>
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
              { name: 'Анна Петрова', role: 'Владелец кофейни', avatar: 'АП', color: 'from-amber-400 to-orange-500', stars: 5, text: 'Раньше тратила 3 недели и 60 000 ₽ на фрилансеров. Теперь новый лендинг готов за час. Заявок стало в 3 раза больше уже в первую неделю.' },
              { name: 'Дмитрий Козлов', role: 'Основатель стартапа', avatar: 'ДК', color: 'from-indigo-500 to-blue-500', stars: 5, text: 'Запустили MVP за один день. Инвесторы были удивлены качеством сайта. Roboweb сэкономил нам минимум 150 000 ₽ на разработке.' },
              { name: 'Марина Соколова', role: 'Руководитель веб-студии', avatar: 'МС', color: 'from-violet-500 to-fuchsia-500', stars: 5, text: 'Подключили Roboweb для клиентских проектов. Теперь типовой лендинг собираем за 15 минут вместо недели. Маржа выросла в 4 раза.' },
              { name: 'Игорь Новиков', role: 'Фитнес-тренер', avatar: 'ИН', color: 'from-emerald-400 to-teal-500', stars: 5, text: 'Описал идею голосом в чат, через 2 минуты получил готовый сайт с записью на тренировки. Клиенты сразу начали бронировать онлайн.' },
              { name: 'Светлана Кравцова', role: 'Директор по маркетингу', avatar: 'СК', color: 'from-rose-500 to-pink-500', stars: 5, text: 'Тестировали 5 разных посадочных страниц за неделю. С обычными подрядчиками это заняло бы месяц. Конверсия выросла на 40%.' },
              { name: 'Алексей Громов', role: 'Барбер, owner IronCut', avatar: 'АГ', color: 'from-cyan-400 to-sky-500', stars: 5, text: 'Сайт выглядит дороже, чем стоил. Клиенты часто спрашивают, кто делал — показываю Roboweb. Уже посоветовал пятерым знакомым.' },
              { name: 'Юлия Волкова', role: 'Флорист, «Бутон»', avatar: 'ЮВ', color: 'from-pink-400 to-rose-500', stars: 5, text: 'Заказы через сайт пошли уже в первый день. Конструктор букетов сделали за один вечер диалога с AI — раньше на это ушёл бы месяц поиска студии.' },
              { name: 'Роман Ефимов', role: 'Владелец автомойки', avatar: 'РЕ', color: 'from-blue-500 to-slate-700', stars: 5, text: 'Не разбираюсь в сайтах вообще, но за 20 минут сделал рабочую онлайн-запись. Экономия на разработчике — минимум 40 000 ₽.' },
              { name: 'Ксения Орлова', role: 'HR-директор', avatar: 'КО', color: 'from-teal-500 to-emerald-600', stars: 5, text: 'Собрали карьерный сайт компании за вечер вместо тендера среди подрядчиков на 2 месяца. Отклики соискателей выросли вдвое.' },
              { name: 'Павел Соловьёв', role: 'Основатель IT-школы', avatar: 'ПС', color: 'from-violet-600 to-indigo-800', stars: 5, text: 'Тестировали 3 конструктора до этого — везде шаблонно и криво на мобильных. Roboweb сразу выдал адаптивный сайт под наш стиль.' },
              { name: 'Наталья Волошина', role: 'Управляющая отелем', avatar: 'НВ', color: 'from-amber-600 to-emerald-800', stars: 5, text: 'Бронирования с сайта пошли через два дня после публикации. Раньше платили агентству 25 000 ₽ в месяц только за поддержку сайта.' },
            ] : [
              { name: 'Anna P.', role: 'Coffee shop owner', avatar: 'AP', color: 'from-amber-400 to-orange-500', stars: 5, text: 'Used to spend 3 weeks and $800 on freelancers. Now a new landing is ready in an hour. Leads tripled in the first week.' },
              { name: 'David K.', role: 'Startup founder', avatar: 'DK', color: 'from-indigo-500 to-blue-500', stars: 5, text: 'Launched MVP in one day. Investors were impressed with the site quality. Roboweb saved us at least $2k in development.' },
              { name: 'Marina S.', role: 'Web studio director', avatar: 'MS', color: 'from-violet-500 to-fuchsia-500', stars: 5, text: 'Connected Roboweb for client projects. Now a typical landing takes 15 minutes instead of a week. Margin grew 4x.' },
              { name: 'Igor N.', role: 'Fitness trainer', avatar: 'IN', color: 'from-emerald-400 to-teal-500', stars: 5, text: 'Described the idea in chat, got a ready booking site in 2 minutes. Clients started booking online right away.' },
              { name: 'Svetlana K.', role: 'Marketing Director', avatar: 'SK', color: 'from-rose-500 to-pink-500', stars: 5, text: 'Tested 5 different landing pages in a week. With regular contractors it would have taken a month. Conversion up 40%.' },
              { name: 'Alex G.', role: 'Barber, owner IronCut', avatar: 'AG', color: 'from-cyan-400 to-sky-500', stars: 5, text: 'The site looks more expensive than it cost. Clients often ask who built it — I show them Roboweb. Recommended to 5 friends already.' },
              { name: 'Julia V.', role: 'Florist, "Bouton"', avatar: 'JV', color: 'from-pink-400 to-rose-500', stars: 5, text: 'Orders started coming through the site on day one. Built the bouquet builder in one evening chatting with AI — used to take a month of searching for a studio.' },
              { name: 'Roman E.', role: 'Car wash owner', avatar: 'RE', color: 'from-blue-500 to-slate-700', stars: 5, text: 'I know nothing about websites, but I built a working booking page in 20 minutes. Saved at least $500 on a developer.' },
              { name: 'Kate O.', role: 'HR Director', avatar: 'KO', color: 'from-teal-500 to-emerald-600', stars: 5, text: 'Built the company careers site in an evening instead of a 2-month contractor tender. Applicant responses doubled.' },
              { name: 'Paul S.', role: 'Founder of a coding school', avatar: 'PS', color: 'from-violet-600 to-indigo-800', stars: 5, text: 'Tried 3 other builders before this — all template-y and broken on mobile. Roboweb gave us a responsive site matching our brand right away.' },
              { name: 'Natalie V.', role: 'Hotel manager', avatar: 'NV', color: 'from-amber-600 to-emerald-800', stars: 5, text: 'Bookings from the site started two days after launch. We used to pay an agency $300/month just for site maintenance.' },
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