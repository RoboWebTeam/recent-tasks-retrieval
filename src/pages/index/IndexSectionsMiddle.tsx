import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getSession } from '@/lib/auth';
import { L, getPORTFOLIO, DEMO_CATEGORIES_RU, DEMO_CATEGORIES_EN, type DemoCategory } from './indexData';
import { Reveal, EmailForm } from './IndexShared';

interface Props { lang: Lang; }

const PAGE_SIZE = 12;

// --- Секция портфолио ---
function PortfolioSection({ lang, portfolio }: { lang: Lang; portfolio: ReturnType<typeof getPORTFOLIO> }) {
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
            <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
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
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((p, i) => {
            const isNew = i >= prevCount;
            const delay = isNew ? `${(i - prevCount) * 50}ms` : '0ms';
            return (
            <div
              key={p.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={isNew ? { animation: `cardIn 0.4s ease both`, animationDelay: delay } : undefined}
            >
              <div className="relative h-44 overflow-hidden bg-muted">
                <img
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={176}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3.5">
                  <p className="text-white text-xs leading-relaxed line-clamp-2 italic">«{p.prompt}»</p>
                </div>
                <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white">
                  <Icon name="Sparkles" size={10} className="text-primary" />
                  {lang === 'ru' ? 'ИИ за минуты' : 'AI in minutes'}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mb-2 w-fit">{p.tag}</span>
                <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors flex-1 mb-3">
                  {p.title}
                </h3>
                <button
                  onClick={() => goToPrompt(p.prompt)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold py-2.5 transition-all duration-200 group/btn"
                >
                  <Icon name="Sparkles" size={13} />
                  {lang === 'ru' ? 'Попробовать промпт' : 'Try this prompt'}
                  <Icon name="ArrowRight" size={13} className="opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {/* Показать ещё / счётчик */}
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
  const PORTFOLIO = getPORTFOLIO(lang);

  return (
    <>
      {/* PORTFOLIO */}
      <PortfolioSection lang={lang} portfolio={PORTFOLIO} />

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