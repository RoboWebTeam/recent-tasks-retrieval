import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import LangSwitcher from '@/components/LangSwitcher';
import { LogoMark } from '@/components/Logo';
import { type Lang, tr } from '@/lib/i18n';

/** Левая B2B-панель страниц входа/регистрации: живой конвейер ИИ-агентов 24/7,
 *  проверяемые аргументы доверия и реквизиты. Анимации .at-* / .breathe — см. index.css. */
export function AuthSidePanel({ lang, mode }: { lang: Lang; mode: 'login' | 'register' }) {
  const ru = lang === 'ru';

  const agents = ru
    ? [
        { icon: 'Brain', name: 'Аналитик', task: 'разбирает задачу' },
        { icon: 'Palette', name: 'Дизайнер', task: 'собирает интерфейс' },
        { icon: 'Server', name: 'Бэкенд', task: 'серверная логика' },
        { icon: 'Database', name: 'База данных', task: 'схема и данные' },
      ]
    : [
        { icon: 'Brain', name: 'Analyst', task: 'breaks down the task' },
        { icon: 'Palette', name: 'Designer', task: 'builds the UI' },
        { icon: 'Server', name: 'Backend', task: 'server logic' },
        { icon: 'Database', name: 'Database', task: 'schema and data' },
      ];

  const trust = ru
    ? [
        { icon: 'Github', t: 'Код на Next.js + Prisma — в вашем GitHub или GitFlic' },
        { icon: 'Database', t: 'Заявки и заказы — в вашей PostgreSQL, по HTTPS/SSL' },
        { icon: 'KeyRound', t: 'Без вендор-лока: разворачивайте где угодно' },
        { icon: 'RefreshCw', t: 'Возврат 7 дней по оферте, если функции не использовались' },
      ]
    : [
        { icon: 'Github', t: 'Next.js + Prisma code — in your GitHub or GitFlic' },
        { icon: 'Database', t: 'Leads and orders — in your PostgreSQL, over HTTPS/SSL' },
        { icon: 'KeyRound', t: 'No vendor lock-in: deploy anywhere' },
        { icon: 'RefreshCw', t: '7-day refund under the offer if features were unused' },
      ];

  return (
    <div className="hidden lg:flex flex-col w-1/2 border-r border-border p-8 xl:p-10 gap-6 relative overflow-hidden bg-secondary/40">
      {/* Атмосфера */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl breathe pointer-events-none" />
      <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent/20 blur-3xl breathe pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Шапка */}
      <div className="relative flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-xl">
          <LogoMark size={36} pulse />
          Roboweb
        </Link>
        <LangSwitcher lang={lang} />
      </div>

      {/* Сообщение */}
      <div className="relative flex-1 min-h-0 flex flex-col justify-center">
        <span className="at-in self-start inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 at-dot" />
          {ru ? 'Работает 24/7 · агенты параллельно' : 'Works 24/7 · agents in parallel'}
        </span>

        <h2 className="at-in mt-4 font-display font-bold text-[28px] xl:text-4xl leading-[1.12] whitespace-pre-line" style={{ animationDelay: '.08s' }}>
          {tr(mode === 'login' ? 'loginHeroTitle' : 'registerHeroTitle', lang)}
        </h2>
        <p className="at-in mt-3 text-muted-foreground text-[15px] leading-relaxed max-w-md" style={{ animationDelay: '.16s' }}>
          {tr(mode === 'login' ? 'loginHeroDesc' : 'registerHeroDesc', lang)}
        </p>

        {/* Живой конвейер агентов */}
        <div className="at-in mt-5 rounded-2xl border border-border bg-card/70 backdrop-blur p-3.5" style={{ animationDelay: '.24s' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-2 font-display font-bold text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              {ru ? 'Конвейер сборки' : 'Build conveyor'}
            </span>
            <span className="at-beat rounded-full bg-primary/12 border border-primary/25 text-primary text-[11px] font-bold px-2.5 py-0.5">24/7</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {agents.map((a, i) => (
              <div key={a.name} className="at-in at-glow rounded-xl border border-primary/15 bg-background/50 p-2.5" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/12 text-primary shrink-0">
                    <Icon name={a.icon} size={14} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-[12px] leading-tight truncate">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{a.task}</div>
                  </div>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 at-dot shrink-0" style={{ animationDelay: `${i * 200}ms` }} />
                </div>
                <div className="at-track mt-2" style={{ animationDelay: `${i * 120}ms` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Проверяемые аргументы */}
        <div className="mt-5 space-y-2">
          {trust.map((f, i) => (
            <div key={f.t} className="at-in flex items-start gap-2.5 text-sm text-muted-foreground" style={{ animationDelay: `${0.5 + i * 0.07}s` }}>
              <Icon name={f.icon} size={16} className="text-primary shrink-0 mt-0.5" />
              <span className="text-foreground/85">{f.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Реквизиты — доверие «на проверяемом» */}
      <div className="relative shrink-0 text-[11px] text-muted-foreground/80 leading-relaxed">
        © 2026 Roboweb · {ru ? 'ИП Аракелов С. В. · ОГРНИП 324508100357892' : 'Sole proprietor · State ID 324508100357892'}
        {' · '}
        <a href="https://egrul.nalog.ru/" target="_blank" rel="noopener noreferrer" className="text-primary/90 hover:text-primary hover:underline">
          {ru ? 'проверить в ЕГРИП' : 'verify on the register'}
        </a>
      </div>
    </div>
  );
}
