import { type Lang } from '@/lib/i18n';
import Icon from '@/components/ui/icon';
import { Reveal } from './IndexShared';

/** «Команда, которая не спит» — акцент: личная ИИ-команда разработки работает 24/7,
 *  несколько агентов параллельно, как конвейер. Живые анимации .at-* (см. index.css). */
export function AgentTeamSection({ lang }: { lang: Lang }) {
  const ru = lang === 'ru';

  const agents = ru ? [
    { icon: 'Brain',    name: 'Аналитик',      task: 'разбирает задачу' },
    { icon: 'Palette',  name: 'Дизайнер',      task: 'собирает интерфейс' },
    { icon: 'Code2',    name: 'Фронтенд',      task: 'пишет экраны' },
    { icon: 'Server',   name: 'Бэкенд',        task: 'серверная логика' },
    { icon: 'Database', name: 'База данных',   task: 'схема и данные' },
    { icon: 'Rocket',   name: 'Публикация',    task: 'домен и SSL' },
  ] : [
    { icon: 'Brain',    name: 'Analyst',   task: 'breaks down the task' },
    { icon: 'Palette',  name: 'Designer',  task: 'builds the UI' },
    { icon: 'Code2',    name: 'Frontend',  task: 'writes the screens' },
    { icon: 'Server',   name: 'Backend',   task: 'server logic' },
    { icon: 'Database', name: 'Database',  task: 'schema and data' },
    { icon: 'Rocket',   name: 'Deploy',    task: 'domain and SSL' },
  ];

  const metrics = ru ? [
    { icon: 'Zap',    t: 'Готово за минуты, а не недели' },
    { icon: 'Moon',   t: 'Работает, пока вы спите' },
    { icon: 'Infinity', t: 'Ноль простоев и срывов сроков' },
  ] : [
    { icon: 'Zap',    t: 'Ready in minutes, not weeks' },
    { icon: 'Moon',   t: 'Works while you sleep' },
    { icon: 'Infinity', t: 'Zero downtime, zero missed deadlines' },
  ];

  return (
    <section id="team" className="relative overflow-hidden py-20 md:py-32 border-y border-border bg-secondary/60">
      <div className="absolute -top-24 right-1/4 h-80 w-[38rem] rounded-full bg-primary/10 blur-3xl breathe pointer-events-none" />
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Сообщение */}
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
                <span className="at-beat inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 at-dot" />
                </span>
                {ru ? 'Ваша ИИ-команда' : 'Your AI team'}
              </span>
              <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.08]">
                {ru
                  ? <>Команда разработки, которая <span className="text-gradient">не спит и не устаёт</span></>
                  : <>A dev team that <span className="text-gradient">never sleeps or tires</span></>}
              </h2>
              <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed">
                {ru
                  ? 'Пока конкуренты неделями ищут разработчиков, ваша ИИ-команда собирает продукт прямо сейчас. Несколько агентов работают одновременно, как конвейер: аналитик, дизайнер, фронтенд, бэкенд, база и публикация — параллельно. Она не ест, не спит, не берёт отпуск и не срывает сроки.'
                  : 'While competitors spend weeks hiring developers, your AI team is building the product right now. Several agents work in parallel, like a conveyor: analyst, designer, frontend, backend, database and deploy — all at once. It doesn\'t eat, sleep, take vacations or miss deadlines.'}
              </p>
              <div className="mt-7 flex flex-col gap-2.5">
                {metrics.map(m => (
                  <div key={m.t} className="inline-flex items-center gap-3 text-sm sm:text-base font-medium text-foreground/90">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon name={m.icon} size={16} />
                    </span>
                    {m.t}
                  </div>
                ))}
              </div>
              <a href="/register" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold px-7 py-3 hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25 text-sm sm:text-base">
                <Icon name="Sparkles" size={16} />
                {ru ? 'Запустить свою ИИ-команду' : 'Launch your AI team'}
                <Icon name="ArrowRight" size={16} />
              </a>
            </div>
          </Reveal>

          {/* Живой конвейер агентов */}
          <Reveal delay={120}>
            <div className="relative rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl shadow-primary/5">
              {/* Шапка */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                  <span className="font-display font-bold text-sm sm:text-base">{ru ? 'Конвейер сборки' : 'Build conveyor'}</span>
                </div>
                <span className="at-beat inline-flex items-center gap-1.5 rounded-full bg-primary/12 border border-primary/25 text-primary text-xs font-bold px-3 py-1">
                  <Icon name="Clock" size={12} /> 24/7
                </span>
              </div>

              {/* Сетка агентов — работают параллельно */}
              <div className="grid grid-cols-2 gap-3">
                {agents.map((a, i) => (
                  <div key={a.name} className="at-in at-glow rounded-2xl border border-primary/15 bg-background/40 p-3.5"
                    style={{ animationDelay: `${i * 90}ms` }}>
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary shrink-0">
                        <Icon name={a.icon} size={17} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-display font-bold text-[13px] leading-tight truncate">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{a.task}</div>
                      </div>
                      <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 at-dot shrink-0"
                        style={{ animationDelay: `${i * 200}ms` }} />
                    </div>
                    {/* индетерминантный «рабочий» прогресс */}
                    <div className="at-track mt-3" style={{ animationDelay: `${i * 120}ms` }} />
                  </div>
                ))}
              </div>

              {/* Итог конвейера */}
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-3.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 shadow-lg shadow-primary/30">
                  <Icon name="Check" size={18} />
                </span>
                <div>
                  <div className="font-display font-bold text-sm">{ru ? 'Готовый проект' : 'Finished project'}</div>
                  <div className="text-[11px] text-muted-foreground">Next.js + Prisma · {ru ? 'код в GitHub / GitFlic' : 'code in GitHub / GitFlic'}</div>
                </div>
                <span className="ml-auto text-xs font-bold text-emerald-500 dark:text-emerald-400">{ru ? 'за минуты' : 'in minutes'}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
