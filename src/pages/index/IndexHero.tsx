import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ParticlesBg from '@/components/ui/particles-bg';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LangSwitcher from '@/components/LangSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { type Lang } from '@/lib/i18n';
import { getSession, getStoredUser, clearSession } from '@/lib/auth';
import { L, getNAV } from './indexData';

interface IndexNavProps {
  lang: Lang;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  onLangSwitch: (l: Lang) => void;
}

export function IndexNav({ lang, menuOpen, setMenuOpen, onLangSwitch }: IndexNavProps) {
  const NAV = getNAV(lang);
  const navigate = useNavigate();
  const session = getSession();
  const user = getStoredUser();
  const isAuthed = !!(session && user);
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const handleLogout = () => { clearSession(); navigate(0); };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <nav className="container flex items-center justify-between py-3 md:py-4">
        <a href="/" className="flex items-center gap-2 font-display font-extrabold text-lg md:text-xl">
          <span className="relative grid h-8 w-8 md:h-9 md:w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
            <Icon name="Bot" size={18} />
            <span className="absolute inset-0 rounded-xl animate-pulse-ring bg-primary/40" />
          </span>
          Roboweb
        </a>
        <div className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-muted-foreground">
          {NAV.map((n) => (
            n.href.startsWith('/') && !n.href.startsWith('/#')
              ? <Link key={n.href} to={n.href} className="hover:text-foreground transition-colors relative group">{n.label}<span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all group-hover:w-full" /></Link>
              : <a key={n.href} href={n.href} className="hover:text-foreground transition-colors relative group">{n.label}<span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all group-hover:w-full" /></a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LangSwitcher lang={lang} onSwitch={onLangSwitch} />
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shrink-0 hover:opacity-90 transition-opacity">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <Icon name="LayoutDashboard" size={15} className="mr-2" />
                    {lang === 'ru' ? 'В кабинет' : 'Dashboard'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard?tab=plan" className="cursor-pointer">
                    <Icon name="CreditCard" size={15} className="mr-2" />
                    {lang === 'ru' ? 'Тариф' : 'Plan'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard?tab=profile" className="cursor-pointer">
                    <Icon name="User" size={15} className="mr-2" />
                    {lang === 'ru' ? 'Профиль' : 'Profile'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <Icon name="LogOut" size={15} className="mr-2" />
                  {lang === 'ru' ? 'Выйти' : 'Log out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <a href="/login" className="hidden sm:inline-flex items-center justify-center rounded-full border border-border bg-card text-sm font-semibold px-4 h-9 hover:bg-secondary transition-colors">
                {L.nav.login[lang]}
              </a>
              <a href="/register">
                <Button className="hidden sm:flex rounded-full font-semibold shadow-lg shadow-primary/20 text-sm px-5 h-9">
                  {L.nav.create[lang]}
                </Button>
              </a>
            </>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden grid h-9 w-9 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary"
            aria-label="Меню"
          >
            <Icon name={menuOpen ? 'X' : 'Menu'} size={20} />
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 pb-6 pt-4 space-y-1 animate-slide-up">
          {NAV.map((n) => (
            n.href.startsWith('/') && !n.href.startsWith('/#')
              ? <Link key={n.href} to={n.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 px-4 rounded-xl font-medium hover:bg-secondary transition-colors">{n.label}</Link>
              : <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 px-4 rounded-xl font-medium hover:bg-secondary transition-colors">{n.label}</a>
          ))}
          {isAuthed ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 px-4 rounded-xl font-medium hover:bg-secondary transition-colors">
                <Icon name="LayoutDashboard" size={16} /> {lang === 'ru' ? 'В кабинет' : 'Dashboard'}
              </Link>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-2 py-3 px-4 rounded-xl font-medium text-destructive hover:bg-secondary transition-colors text-left">
                <Icon name="LogOut" size={16} /> {lang === 'ru' ? 'Выйти' : 'Log out'}
              </button>
            </>
          ) : (
            <a href="/register" className="block">
              <Button className="w-full rounded-full font-semibold mt-4">{L.nav.create[lang]}</Button>
            </a>
          )}
        </div>
      )}
    </header>
  );
}

interface IndexHeroProps {
  lang: Lang;
  typedText: string;
  chatStep: number;
  isTyping: boolean;
  progress: number;
  chatSteps: { who: string; text: string; typing?: boolean; progress?: number; done?: boolean }[];
  onDemoOpen: () => void;
}

export function IndexHero({ lang, typedText, chatStep, isTyping, progress, chatSteps, onDemoOpen }: IndexHeroProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const heroCtaHref = getSession() ? '/builder' : '/register';
  const secRef = useRef<HTMLElement>(null);
  const handleParallax = (e: React.MouseEvent) => {
    const el = secRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
  };
  const resetParallax = () => {
    const el = secRef.current;
    if (!el) return;
    el.style.setProperty('--px', '0');
    el.style.setProperty('--py', '0');
  };

  return (
    <section ref={secRef} onMouseMove={handleParallax} onMouseLeave={resetParallax} className="hero-ambient relative overflow-hidden pt-28 sm:pt-32 lg:pt-36 pb-16 md:pb-24" style={{clipPath: 'inset(0)'}}>
      <div className="aurora absolute inset-0 -z-10" />
      <ParticlesBg />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      {/* Floating orbs */}
      <div className="absolute top-20 -left-24 h-56 w-56 md:h-80 md:w-80 rounded-full bg-primary/20 blur-3xl animate-glow" style={{transform:'translate3d(calc(var(--px,0) * 34px), calc(var(--py,0) * 34px), 0)', transition:'transform 0.4s ease-out'}} />
      <div className="absolute top-40 -right-24 h-56 w-56 md:h-80 md:w-80 rounded-full bg-accent/25 blur-3xl animate-glow" style={{animationDelay:'1.5s', transform:'translate3d(calc(var(--px,0) * -28px), calc(var(--py,0) * -28px), 0)', transition:'transform 0.4s ease-out'}} />
      <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-primary/10 blur-2xl animate-glow" style={{animationDelay:'0.8s', transform:'translate3d(calc(var(--px,0) * 44px), calc(var(--py,0) * 22px), 0)', transition:'transform 0.4s ease-out'}} />

      <div className="container grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div className="animate-fade-in text-center lg:text-left" style={{transform:'translate3d(calc(var(--px,0) * -14px), calc(var(--py,0) * -9px), 0)', transition:'transform 0.4s ease-out'}}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {L.hero.badge[lang]}
          </span>
          <h1 className="mt-5 font-display font-bold leading-[1.02] text-5xl sm:text-6xl md:text-7xl xl:text-7xl 2xl:text-8xl tracking-tight">
            <span className="text-gradient-animated inline-block min-h-[1.1em] drop-shadow-[0_4px_30px_hsl(232_90%_58%_/_0.28)]">
              {typedText}
              <span className="typed-cursor">|</span>
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
            {L.hero.desc[lang]}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
            <div className="relative w-full sm:w-auto">
              <span className="cta-glow rounded-full" />
              <Button size="lg" className="rounded-full text-base font-semibold px-8 shadow-xl shadow-primary/25 w-full sm:w-auto group" asChild>
                <Link to={heroCtaHref}>
                  {L.hero.cta[lang]}
                  <Icon name="ArrowRight" size={18} className="ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <Button size="lg" variant="outline" className="rounded-full text-base font-semibold px-8 w-full sm:w-auto group"
              onClick={onDemoOpen}>
              <Icon name="Play" size={16} className="mr-1" /> {L.hero.demo[lang]}
            </Button>
          </div>

          {/* Trust proof-points (конкретные возможности вместо вымышленных цифр) */}
          <div className="mt-8 flex items-center justify-center lg:justify-start gap-x-5 gap-y-2.5 flex-wrap">
            {[
              { icon: 'Github', ru: 'Код в вашем GitHub', en: 'Code in your GitHub' },
              { icon: 'Database', ru: 'Данные в вашей PostgreSQL', en: 'Data in your PostgreSQL' },
              { icon: 'KeyRound', ru: 'Без вендор-лока', en: 'No vendor lock-in' },
              { icon: 'ShieldCheck', ru: 'SSL и свой домен', en: 'SSL & custom domain' },
            ].map(s => (
              <div key={s.icon} className="inline-flex items-center gap-2 text-sm">
                <Icon name={s.icon} size={16} className="text-primary shrink-0" />
                <span className="font-medium text-foreground/90">{lang === 'ru' ? s.ru : s.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Артефакт «Что вы получаете»: репозиторий Next.js + Prisma, которым вы владеете */}
        <div className="relative animate-scale-in max-w-md mx-auto w-full">
          <div className="glow-frame relative rounded-2xl md:rounded-3xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Icon name="Github" size={16} className="text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold">your-project</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Icon name="GitBranch" size={12} /> main
              </span>
            </div>
            <div className="grid sm:grid-cols-[132px_1fr]">
              <div className="hidden sm:block border-r border-border p-3 text-[11px] font-mono text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-1.5 text-foreground"><Icon name="Folder" size={12} className="text-primary shrink-0" />app</div>
                <div className="pl-4">page.tsx</div>
                <div className="pl-4 flex items-center gap-1.5"><Icon name="Folder" size={12} className="text-primary shrink-0" />api</div>
                <div className="flex items-center gap-1.5 text-foreground"><Icon name="Folder" size={12} className="text-primary shrink-0" />prisma</div>
                <div className="pl-4 text-primary">schema.prisma</div>
                <div className="flex items-center gap-1.5"><Icon name="FileCode2" size={12} className="shrink-0" />.env.example</div>
              </div>
              <div className="p-4 font-mono text-[12px] leading-relaxed overflow-x-auto">
                <div className="text-muted-foreground/70">{'// prisma/schema.prisma'}</div>
                <div><span className="text-primary">model</span> <span className="text-foreground font-semibold">Lead</span> {'{'}</div>
                <div className="pl-4 text-foreground/80">id{'        '}<span className="text-accent">String</span>{'   '}@id @default(cuid())</div>
                <div className="pl-4 text-foreground/80">name{'      '}<span className="text-accent">String</span></div>
                <div className="pl-4 text-foreground/80">phone{'     '}<span className="text-accent">String</span></div>
                <div className="pl-4 text-foreground/80">createdAt <span className="text-accent">DateTime</span> @default(now())</div>
                <div className="text-foreground">{'}'}</div>
              </div>
            </div>
            <div className="border-t border-border px-4 py-3 flex items-center gap-2.5 text-xs">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary shrink-0"><Icon name="Database" size={12} /></span>
              <span className="text-muted-foreground">{lang === 'ru' ? 'Новая заявка → ' : 'New lead → '}<span className="text-foreground">Иван, +7 900…</span>{lang === 'ru' ? ' — в вашей PostgreSQL' : ' — in your PostgreSQL'}</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground inline-flex w-full items-center justify-center gap-1.5">
            <Icon name="Github" size={13} className="text-primary shrink-0" />
            {lang === 'ru' ? 'Это выгружается в ваш GitHub — код принадлежит вам' : 'This exports to your GitHub — the code is yours'}
          </p>
        </div>
      </div>
    </section>
  );
}