import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ARTICLES } from '@/data/blog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { type Lang } from '@/lib/i18n';
import { L, getNAV, getFEATURES, getCOMPARE, getTRUST, getSTEPS, getPORTFOLIO, getPLANS, getFAQ, getMARQUEE } from './indexData';
import { Reveal, EmailForm } from './IndexShared';

interface Props { lang: Lang; }

export function IndexSections({ lang }: Props) {
  const NAV           = getNAV(lang);
  const FEATURES      = getFEATURES(lang);
  const COMPARE       = getCOMPARE(lang);
  const TRUST         = getTRUST(lang);
  const STEPS         = getSTEPS(lang);
  const PORTFOLIO     = getPORTFOLIO(lang);
  const PLANS         = getPLANS(lang);
  const FAQ           = getFAQ(lang);
  const MARQUEE_ITEMS = getMARQUEE(lang);

  return (
    <>
      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-border bg-secondary/40 py-3.5">
        <div className="flex animate-marquee whitespace-nowrap gap-8">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="text-sm font-semibold text-muted-foreground">{item}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-16 md:py-24">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.nav.features[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.features.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.features.desc[lang]}
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="group h-full rounded-2xl md:rounded-3xl border border-border bg-card p-5 md:p-7 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 cursor-default">
                  <span className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-xl md:rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <h3 className="mt-4 font-display font-bold text-lg md:text-xl">{f.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm md:text-base">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STATS */}
      <section className="py-12 md:py-16 bg-foreground text-background">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {TRUST.map((t, i) => (
              <Reveal key={t.label} delay={i * 80}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 mb-3 mx-auto">
                    <Icon name={t.icon} size={22} className="text-accent" />
                  </div>
                  <div className="font-display font-black text-2xl sm:text-3xl text-white">{t.value}</div>
                  <div className="text-sm text-background/60 mt-1">{t.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARE TABLE */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2 mb-10 md:mb-14">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.compare.label[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.compare.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.compare.desc[lang]}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="overflow-x-auto rounded-2xl md:rounded-3xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-4 md:p-5 font-display font-bold text-base">{lang === 'ru' ? 'Критерий' : 'Criteria'}</th>
                    <th className="p-4 md:p-5 font-display font-bold text-base">
                      <span className="inline-flex items-center gap-1.5 text-primary">
                        <Icon name="Bot" size={15} /> Roboweb
                      </span>
                    </th>
                    <th className="p-4 md:p-5 font-display font-bold text-base text-muted-foreground">{lang === 'ru' ? 'Агентство' : 'Agency'}</th>
                    <th className="p-4 md:p-5 font-display font-bold text-base text-muted-foreground">{lang === 'ru' ? 'Фрилансер' : 'Freelancer'}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row, i) => (
                    <tr key={row.label} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
                      <td className="p-4 md:p-5 font-medium text-muted-foreground">{row.label}</td>
                      <td className="p-4 md:p-5 text-center">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 text-xs">
                          <Icon name="CheckCircle" size={13} />{row.roboweb}
                        </span>
                      </td>
                      <td className="p-4 md:p-5 text-center text-muted-foreground">{row.agency}</td>
                      <td className="p-4 md:p-5 text-center text-muted-foreground">{row.freelancer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA 1 */}
      <section className="py-12 bg-primary/5 border-y border-primary/10">
        <Reveal>
          <div className="container text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">{L.cta1.label[lang]}</p>
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight mb-2">
              {L.cta1.title[lang]} <span className="text-gradient">{L.cta1.accent[lang]}</span>
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{L.cta1.desc[lang]}</p>
            <EmailForm placeholder={L.cta1.input[lang]} btnText={L.cta1.btn[lang]} />
          </div>
        </Reveal>
      </section>

      {/* PROCESS */}
      <section id="process" className="py-16 md:py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-[40rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="container relative">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-accent">{L.process.label[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.process.title[lang]}
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative rounded-2xl md:rounded-3xl border border-white/10 bg-white/5 p-5 md:p-7 h-full backdrop-blur group hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="font-display font-black text-4xl md:text-5xl text-accent/90 group-hover:text-accent transition-colors">{s.n}</div>
                  <h3 className="mt-3 md:mt-4 font-display font-bold text-lg md:text-xl">{s.title}</h3>
                  <p className="mt-2 text-background/70 text-sm md:text-base">{s.text}</p>
                  {i < STEPS.length - 1 && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden md:block z-10">
                      <Icon name="ChevronRight" size={20} className="text-white/30" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO — Что может ИИ */}
      <section id="portfolio" className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2 mb-10 md:mb-14">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.portfolio.label[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.portfolio.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.portfolio.desc[lang]}
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {PORTFOLIO.map((p, i) => (
              <Reveal key={p.title} delay={i * 60}>
                <a
                  href="/register"
                  className="group flex flex-col overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative h-44 sm:h-48 overflow-hidden bg-muted">
                    <img
                      src={p.img}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Overlay with prompt preview */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <p className="text-white text-xs leading-relaxed line-clamp-2 italic">
                        «{p.prompt}»
                      </p>
                    </div>
                    {/* AI badge */}
                    <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white">
                      <Icon name="Sparkles" size={10} className="text-primary" />
                      {lang === 'ru' ? 'ИИ создаст за минуты' : 'AI builds in minutes'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex items-center justify-between p-4 md:p-5">
                    <div>
                      <h3 className="font-display font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {p.tag}
                      </span>
                    </div>
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary border border-border group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0 ml-3">
                      <Icon name="ArrowRight" size={14} className="text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                    </div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>

          {/* CTA под сеткой */}
          <Reveal>
            <div className="mt-10 text-center">
              <p className="text-muted-foreground mb-4 text-sm">
                {lang === 'ru' ? 'Это лишь малая часть — ИИ сделает любой сайт' : 'This is just a fraction — AI can build any site'}
              </p>
              <a href="/register" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-8 py-3 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                <Icon name="Sparkles" size={16} />
                {lang === 'ru' ? 'Создать свой сайт бесплатно' : 'Create your site for free'}
                <Icon name="ArrowRight" size={16} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

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
            ] : [
              { name: 'Anna P.', role: 'Coffee shop owner', avatar: 'AP', color: 'from-amber-400 to-orange-500', stars: 5, text: 'Used to spend 3 weeks and $800 on freelancers. Now a new landing is ready in an hour. Leads tripled in the first week.' },
              { name: 'David K.', role: 'Startup founder', avatar: 'DK', color: 'from-indigo-500 to-blue-500', stars: 5, text: 'Launched MVP in one day. Investors were impressed with the site quality. Roboweb saved us at least $2k in development.' },
              { name: 'Marina S.', role: 'Web studio director', avatar: 'MS', color: 'from-violet-500 to-fuchsia-500', stars: 5, text: 'Connected Roboweb for client projects. Now a typical landing takes 15 minutes instead of a week. Margin grew 4x.' },
              { name: 'Igor N.', role: 'Fitness trainer', avatar: 'IN', color: 'from-emerald-400 to-teal-500', stars: 5, text: 'Described the idea in chat, got a ready booking site in 2 minutes. Clients started booking online right away.' },
              { name: 'Svetlana K.', role: 'Marketing Director', avatar: 'SK', color: 'from-rose-500 to-pink-500', stars: 5, text: 'Tested 5 different landing pages in a week. With regular contractors it would have taken a month. Conversion up 40%.' },
              { name: 'Alex G.', role: 'Barber, owner IronCut', avatar: 'AG', color: 'from-cyan-400 to-sky-500', stars: 5, text: 'The site looks more expensive than it cost. Clients often ask who built it — I show them Roboweb. Recommended to 5 friends already.' },
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

      {/* PRICING */}
      <section id="pricing" className="py-16 md:py-24 bg-secondary/50">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.pricing.label[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.pricing.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.pricing.desc[lang]}
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 100}>
                <div className={`relative h-full rounded-2xl md:rounded-3xl border p-6 md:p-8 transition-all duration-300 hover:shadow-xl flex flex-col ${
                  p.hot ? 'border-primary bg-card shadow-2xl shadow-primary/15' : 'border-border bg-card'
                }`}>
                  {p.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold whitespace-nowrap ${
                      p.hot ? 'bg-primary text-primary-foreground animate-glow' : 'bg-secondary text-muted-foreground border border-border'
                    }`}>
                      {p.hot ? '✦ ' : ''}{p.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="font-display font-bold text-xl md:text-2xl">{p.name}</h3>
                    <div className="mt-2 flex items-end gap-1 flex-wrap">
                      <span className="font-display font-black text-2xl md:text-3xl">{p.price}</span>
                      {p.note && <span className="mb-0.5 text-sm text-muted-foreground">{p.note}</span>}
                    </div>
                    <span className="inline-block mt-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                      {p.tag}
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Icon name="Check" size={14} className="text-[hsl(88,60%,40%)] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className={`mt-6 w-full rounded-full font-semibold transition-all hover:scale-105 ${p.hot ? 'shadow-lg shadow-primary/20' : 'bg-foreground hover:bg-foreground/90'}`}>
                    {p.cta}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 3 */}
      <section id="register" className="py-16 md:py-24">
        <div className="container px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-foreground text-background p-8 sm:p-10 md:p-16 text-center">
              <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/40 blur-3xl animate-glow" />
              <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-accent/40 blur-3xl animate-glow" style={{animationDelay:'1s'}} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-sm font-medium mb-5">
                  <Icon name="Gift" size={15} /> {L.cta3.badge[lang]}
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                  {L.cta3.title[lang]}
                </h2>
                <p className="mt-4 text-background/70 text-base sm:text-lg max-w-xl mx-auto">
                  {L.cta3.desc[lang]}
                </p>
                <div className="mt-6 md:mt-8">
                  <EmailForm dark placeholder={L.cta3.input[lang]} btnText={L.cta3.btn[lang]} />
                </div>
                <p className="mt-4 text-xs text-background/40">
                  {L.cta3.privacy[lang]}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-secondary/50">
        <div className="container max-w-3xl">
          <Reveal>
            <div className="text-center px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">FAQ</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.faq.title[lang]}
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <Accordion type="single" collapsible className="mt-8 md:mt-10 space-y-3">
              {FAQ.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="rounded-2xl border border-border bg-card px-4 sm:px-6">
                  <AccordionTrigger className="text-left font-display font-semibold text-base sm:text-lg hover:no-underline py-4 sm:py-5">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm sm:text-base">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
          <Reveal>
            <div className="mt-12 rounded-2xl md:rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
              <Icon name="MessageCircle" size={32} className="text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl sm:text-2xl mb-2">{L.faq.ctaTitle[lang]}</h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-5">{L.faq.ctaDesc[lang]}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="rounded-full font-semibold px-6" asChild>
                  <a href="mailto:roboweb.site@yandex.ru">
                    <Icon name="Mail" size={16} className="mr-2" />
                    {L.faq.mail[lang]}
                  </a>
                </Button>
                <Button variant="outline" className="rounded-full font-semibold px-6" asChild>
                  <a href="https://t.me/roboweb" target="_blank" rel="noopener noreferrer">
                    <Icon name="Send" size={16} className="mr-2" />
                    {L.faq.tg[lang]}
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* BLOG */}
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container">
          <Reveal>
            <div className="flex items-end justify-between mb-10 md:mb-14 gap-4">
              <div>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">Блог</span>
                <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                  Всё об AI‑разработке
                </h2>
              </div>
              <Link to="/blog" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline shrink-0">
                Все статьи <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.slice(0, 3).map((article, i) => (
              <Reveal key={article.slug} delay={i * 70}>
                <Link
                  to={`/blog/${article.slug}`}
                  className="group flex flex-col h-full rounded-2xl md:rounded-3xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-40 overflow-hidden bg-muted">
                    <img src={article.cover} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col flex-1 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{article.category}</span>
                      <span className="text-xs text-muted-foreground">{article.readTime} чтения</span>
                    </div>
                    <h3 className="font-display font-bold text-lg leading-snug group-hover:text-primary transition-colors flex-1">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{article.description}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{article.date}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                        Читать <Icon name="ArrowRight" size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Все статьи <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background">
        <div className="container py-10 md:py-14 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 font-display font-extrabold text-lg md:text-xl">
              <span className="grid h-8 w-8 md:h-9 md:w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
                <Icon name="Bot" size={18} />
              </span>
              Roboweb
            </a>
            <p className="mt-3 text-sm text-muted-foreground">{L.footer.desc[lang]}</p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.nav[lang]}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {NAV.map((n) => (
                <li key={n.href}>
                  {n.href.startsWith('/') && !n.href.startsWith('/#')
                    ? <Link to={n.href} className="hover:text-foreground transition-colors">{n.label}</Link>
                    : <a href={n.href} className="hover:text-foreground transition-colors">{n.label}</a>}
                </li>
              ))}
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
                <Icon name="MessageCircle" size={15} className="text-primary shrink-0" /> Telegram
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.social[lang]}</h4>
            <div className="flex gap-2 md:gap-3">
              {['Send', 'Youtube', 'Instagram'].map((s) => (
                <a key={s} href="#"
                  className="grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all hover:scale-110">
                  <Icon name={s} size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs sm:text-sm text-muted-foreground px-4">
          © 2026 Roboweb. {L.footer.copy[lang]}
        </div>
      </footer>
    </>
  );
}