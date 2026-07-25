import { type Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { L, getFEATURES, getCOMPARE, getTRUST, getSTEPS } from './indexData';
import { Reveal, EmailForm } from './IndexShared';

interface Props { lang: Lang; }

export function IndexSectionsTop({ lang }: Props) {
  const FEATURES      = getFEATURES(lang);
  const COMPARE       = getCOMPARE(lang);
  const TRUST         = getTRUST(lang);
  const STEPS         = getSTEPS(lang);
  const DOORS = lang === 'ru' ? [
    { icon: 'Briefcase', tag: 'Фрилансерам и студиям', title: 'Делайте сайты клиентам за час', text: 'Соберите рабочий сайт по брифу и отдайте настоящий код на Next.js прямо в GitHub клиента. Фикс-цена вместо почасовки — ваша ИИ-команда разработки.', cta: 'Собрать сайт клиенту', hot: true },
    { icon: 'Store', tag: 'Бизнесу и самозанятым', title: 'Сайт, который принимает заявки', text: 'Формы пишут в базу, живой каталог, корзина и оформление заказа — без разработчика и без кода. Сайт, который работает, а не просто выглядит.', cta: 'Запустить сайт', hot: false },
    { icon: 'Code2', tag: 'Разработчикам', title: 'Готовый каркас за минуту', text: 'Next.js + Prisma + аккаунты + корзина — экспортом в ваш GitHub. Рабочий каркас на старте — дальше допиливаете код сами.', cta: 'Забрать код', hot: false },
  ] : [
    { icon: 'Briefcase', tag: 'Freelancers & studios', title: 'Ship client sites in an hour', text: 'Build a working site from a brief and hand over real Next.js code straight to the client\'s GitHub. Fixed price instead of hourly — your AI dev team.', cta: 'Build a client site', hot: true },
    { icon: 'Store', tag: 'Small business', title: 'A site that takes orders', text: 'Forms save to a database, a live catalog, cart and checkout — no developer, no code. A site that works, not just looks good.', cta: 'Launch a site', hot: false },
    { icon: 'Code2', tag: 'Developers', title: 'A ready scaffold in a minute', text: 'Next.js + Prisma + accounts + cart, exported to your GitHub. A working scaffold to start from — you finish the rest.', cta: 'Grab the code', hot: false },
  ];

  return (
    <>
      {/* B2B-ПРИЗЫВ: профессиональный инструмент уровня команды разработки */}
      <section className="py-16 md:py-24 border-y border-border bg-secondary/60">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal>
              <div>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
                  {lang === 'ru' ? 'Инструмент для бизнеса и профессионалов' : 'A tool for business & professionals'}
                </span>
                <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.08]">
                  {lang === 'ru'
                    ? <>Как отдел разработки — <span className="text-gradient">без найма</span> и месяцев ожидания</>
                    : <>Like a dev team — <span className="text-gradient">without hiring</span> or months of waiting</>}
                </h2>
                <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed">
                  {lang === 'ru'
                    ? 'RoboWeb берёт на себя рутину фуллстека: бэкенд, базу данных, интеграции и код. Студии и фрилансеры сдают проекты быстрее и берут больше клиентов; бизнес запускает продукт, не собирая команду разработки.'
                    : 'RoboWeb handles the full-stack grunt work: backend, database, integrations and code. Studios and freelancers ship faster and take on more clients; businesses launch a product without assembling a dev team.'}
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <a href="/register" className="w-full sm:w-auto">
                    <Button size="lg" className="rounded-full font-semibold px-7 h-12 w-full">
                      {lang === 'ru' ? 'Собрать проект бесплатно' : 'Build your project free'}
                      <Icon name="ArrowRight" size={17} className="ml-1" />
                    </Button>
                  </a>
                  <a href="https://t.me/roboweb" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="rounded-full font-semibold px-7 h-12 w-full">
                      <Icon name="Send" size={16} className="mr-1.5" />
                      {lang === 'ru' ? 'Обсудить проект' : 'Discuss a project'}
                    </Button>
                  </a>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <Icon name="Check" size={15} className="text-primary shrink-0" />
                  {lang === 'ru' ? 'Первый проект бесплатно · без карты · код в вашем GitHub' : 'First project free · no card · code in your GitHub'}
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="grid gap-3">
                {(lang === 'ru' ? [
                  { icon: 'Gauge', title: 'Скорость команды', text: 'Недели ручной работы → часы. Рутину фуллстека делает ИИ — вы занимаетесь продуктом и клиентами.' },
                  { icon: 'Wallet', title: 'Экономика студии', text: 'Фикс-цена вместо почасовки и без штата разработчиков — берите больше проектов той же командой.' },
                  { icon: 'Code2', title: 'Профессиональный результат', text: 'Настоящий код Next.js + Prisma, который ваш разработчик продолжит вести. Фундамент, а не игрушка.' },
                ] : [
                  { icon: 'Gauge', title: 'Team-level speed', text: 'Weeks of manual work → hours. The AI does the full-stack grunt work — you focus on product and clients.' },
                  { icon: 'Wallet', title: 'Studio economics', text: 'A fixed price instead of hourly, with no dev headcount — take on more projects with the same team.' },
                  { icon: 'Code2', title: 'A professional result', text: 'Real Next.js + Prisma code your developer can keep maintaining. A foundation, not a toy.' },
                ]).map((c) => (
                  <div key={c.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon name={c.icon} size={20} />
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-base sm:text-lg">{c.title}</h3>
                      <p className="mt-1 text-muted-foreground text-sm md:text-base leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3 ДВЕРИ — под 3 аудитории (позиционирование: ИИ-разработчик, не конструктор) */}
      <section id="doors" className="py-20 md:py-32">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{lang === 'ru' ? 'Кому это' : 'Who it\'s for'}</span>
              <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {lang === 'ru' ? 'Три способа использовать RoboWeb' : 'Three ways to use RoboWeb'}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {lang === 'ru' ? 'Не просто «сделай сайт». Выберите свой сценарий.' : 'Not just "make a site". Pick your path.'}
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid md:grid-cols-3 gap-4 md:gap-6">
            {DOORS.map((d, i) => (
              <Reveal key={d.tag} delay={i * 80}>
                <div className={`group relative h-full rounded-3xl border p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${d.hot ? 'border-primary/40 bg-primary/[0.04] hover:shadow-primary/15' : 'border-border bg-card hover:border-primary/30 hover:shadow-primary/10'}`}>
                  {d.hot && (
                    <span className="absolute top-5 right-5 text-[11px] font-bold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-2.5 py-1">
                      {lang === 'ru' ? 'рекомендуем' : 'top pick'}
                    </span>
                  )}
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                    <Icon name={d.icon} size={22} />
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">{d.tag}</p>
                  <h3 className="mt-1.5 font-display font-bold text-xl md:text-2xl">{d.title}</h3>
                  <p className="mt-3 text-muted-foreground text-sm md:text-base">{d.text}</p>
                  <a href="/register" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary group/link">
                    {d.cta}
                    <Icon name="ArrowRight" size={16} className="transition-transform group-hover/link:translate-x-1" />
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 md:py-24 border-y border-border bg-secondary/60">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.nav.features[lang]}</span>
              <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
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
                <div className="group h-full rounded-3xl border border-border bg-card p-5 md:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 cursor-default">
                  <span className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <h3 className="mt-4 font-display font-bold text-lg md:text-xl">{f.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm md:text-base">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-10 text-center">
              <a href="/register" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-8 py-3 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm sm:text-base">
                <Icon name="Sparkles" size={16} />
                {lang === 'ru' ? 'Собрать проект бесплатно' : 'Build your project free'}
                <Icon name="ArrowRight" size={16} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* СТЕК ТЕХНОЛОГИЙ — на чём ИИ собирает продукты (без упоминания движка) */}
      <section id="stack" className="py-16 md:py-24 border-y border-border">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2 mb-10 md:mb-14">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{lang === 'ru' ? 'Технологии' : 'Tech stack'}</span>
              <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {lang === 'ru' ? 'Собираем на современном стеке' : 'Built on a modern stack'}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {lang === 'ru'
                  ? 'От витрины до сложной серверной логики — ИИ пишет на индустриальном стеке, который поддержит любой разработчик. Никакого проприетарного формата.'
                  : 'From storefront to complex server logic — the AI writes in an industry-standard stack any developer can maintain. No proprietary format.'}
              </p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {(lang === 'ru' ? [
              { icon: 'Layout',   title: 'Фронтенд',            items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue', 'HTML5 / CSS3'] },
              { icon: 'Server',   title: 'Бэкенд и логика',     items: ['Node.js', 'Python', 'Серверные функции', 'REST API', 'Вебхуки', 'Авторизация'] },
              { icon: 'Database', title: 'Данные',              items: ['PostgreSQL', 'Prisma ORM', 'SQL', 'Схемы и миграции', 'Личные кабинеты'] },
              { icon: 'Blocks',   title: 'Интеграции и запуск', items: ['Платежи (ЮKassa)', 'E-mail', 'Telegram', 'Домен + SSL', 'GitHub / GitFlic', 'SEO'] },
            ] : [
              { icon: 'Layout',   title: 'Frontend',            items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue', 'HTML5 / CSS3'] },
              { icon: 'Server',   title: 'Backend & logic',     items: ['Node.js', 'Python', 'Server functions', 'REST API', 'Webhooks', 'Auth'] },
              { icon: 'Database', title: 'Data',                items: ['PostgreSQL', 'Prisma ORM', 'SQL', 'Schemas & migrations', 'User accounts'] },
              { icon: 'Blocks',   title: 'Integrations & launch', items: ['Payments', 'E-mail', 'Telegram', 'Domain + SSL', 'GitHub / GitFlic', 'SEO'] },
            ]).map((col, i) => (
              <Reveal key={col.title} delay={i * 70}>
                <div className="group h-full rounded-3xl border border-border bg-card p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                    <Icon name={col.icon} size={20} />
                  </span>
                  <h3 className="mt-4 font-display font-bold text-lg">{col.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {col.items.map(t => (
                      <span key={t} className="inline-flex items-center rounded-lg bg-secondary border border-border px-2.5 py-1 text-xs font-medium text-foreground/80">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {lang === 'ru'
                ? 'Нужен другой инструмент под задачу? Опишите — ИИ подберёт и соберёт под ваш стек.'
                : 'Need a different tool for the job? Describe it — the AI will pick it and build to your stack.'}
            </p>
          </Reveal>
        </div>
      </section>

      {/* TRUST STATS */}
      <section className="py-12 md:py-16 border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 md:divide-x md:divide-border">
            {TRUST.map((t, i) => (
              <Reveal key={t.label} delay={i * 80}>
                <div className="text-center flex flex-col items-center md:px-6">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 mb-3">
                    <Icon name={t.icon} size={22} className="text-primary" />
                  </div>
                  <div className="font-display font-bold text-lg sm:text-xl text-foreground tracking-tight">{t.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">{t.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARE TABLE */}
      <section className="py-16 md:py-24 border-y border-border bg-secondary/60">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2 mb-10 md:mb-14">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.compare.label[lang]}</span>
              <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.compare.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.compare.desc[lang]}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="overflow-x-auto rounded-2xl md:rounded-3xl border border-border">
              <table className="w-full min-w-[620px] text-sm">
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
            <h3 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight mb-2">
              {L.cta1.title[lang]} <span className="text-gradient">{L.cta1.accent[lang]}</span>
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{L.cta1.desc[lang]}</p>
            <EmailForm placeholder={L.cta1.input[lang]} btnText={L.cta1.btn[lang]} />
          </div>
        </Reveal>
      </section>

      {/* PROCESS */}
      <section id="process" className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-[40rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.process.label[lang]}</span>
              <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.process.title[lang]}
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative rounded-3xl border border-border bg-card p-5 md:p-7 h-full group hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                  <div className="font-display font-bold text-4xl md:text-5xl text-primary/80 group-hover:text-primary transition-colors">{s.n}</div>
                  <h3 className="mt-3 md:mt-4 font-display font-bold text-lg md:text-xl">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm md:text-base">{s.text}</p>
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
    </>
  );
}
