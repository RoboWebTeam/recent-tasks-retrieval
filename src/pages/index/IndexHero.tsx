import { useRef } from 'react';
import { Link } from 'react-router-dom';
import ParticlesBg from '@/components/ui/particles-bg';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import LangSwitcher from '@/components/LangSwitcher';
import { type Lang } from '@/lib/i18n';
import { L, getNAV } from './indexData';
import { CounterStat } from './IndexShared';

interface IndexNavProps {
  lang: Lang;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  onLangSwitch: (l: Lang) => void;
}

export function IndexNav({ lang, menuOpen, setMenuOpen, onLangSwitch }: IndexNavProps) {
  const NAV = getNAV(lang);
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <nav className="container flex items-center justify-between py-3 md:py-4">
        <a href="#" className="flex items-center gap-2 font-display font-extrabold text-lg md:text-xl">
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
          <LangSwitcher lang={lang} onSwitch={onLangSwitch} />
          <a href="/login" className="hidden sm:inline-flex items-center justify-center rounded-full border border-border bg-card text-sm font-semibold px-4 h-9 hover:bg-secondary transition-colors">
            {L.nav.login[lang]}
          </a>
          <a href="/register">
            <Button className="hidden sm:flex rounded-full font-semibold shadow-lg shadow-primary/20 text-sm px-5 h-9">
              {L.nav.create[lang]}
            </Button>
          </a>
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
          <a href="/register" className="block">
            <Button className="w-full rounded-full font-semibold mt-4">{L.nav.create[lang]}</Button>
          </a>
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

  return (
    <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 md:pb-24" style={{clipPath: 'inset(0)'}}>
      <ParticlesBg />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      {/* Floating orbs */}
      <div className="absolute top-20 -left-24 h-56 w-56 md:h-80 md:w-80 rounded-full bg-primary/20 blur-3xl animate-glow" />
      <div className="absolute top-40 -right-24 h-56 w-56 md:h-80 md:w-80 rounded-full bg-accent/25 blur-3xl animate-glow" style={{animationDelay:'1.5s'}} />
      <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-primary/10 blur-2xl animate-glow" style={{animationDelay:'0.8s'}} />

      {/* Floating badges */}
      <div className="absolute top-36 left-8 hidden xl:flex items-center gap-2 rounded-2xl glass px-4 py-2.5 shadow-lg animate-float" style={{animationDelay:'0.3s'}}>
        <Icon name="Zap" size={16} className="text-primary" />
        <span className="text-xs font-semibold">{lang === 'ru' ? '47 секунд' : '47 seconds'}</span>
      </div>
      <div className="absolute top-56 right-8 hidden xl:flex items-center gap-2 rounded-2xl glass px-4 py-2.5 shadow-lg animate-float" style={{animationDelay:'1s'}}>
        <Icon name="TrendingUp" size={16} className="text-[hsl(88,70%,40%)]" />
        <span className="text-xs font-semibold">+212% {lang === 'ru' ? 'конверсия' : 'conversion'}</span>
      </div>
      <div className="absolute bottom-32 left-12 hidden xl:flex items-center gap-2 rounded-2xl glass px-4 py-2.5 shadow-lg animate-float" style={{animationDelay:'1.8s'}}>
        <Icon name="Shield" size={16} className="text-primary" />
        <span className="text-xs font-semibold">SSL + {lang === 'ru' ? 'хостинг' : 'hosting'}</span>
      </div>

      <div className="container grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div className="animate-fade-in text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {L.hero.badge[lang]}
          </span>
          <h1 className="mt-5 font-display font-black leading-[1.05] text-4xl sm:text-5xl md:text-6xl xl:text-7xl tracking-tight">
            <span className="block h-[1.1em]">
              <span className="text-gradient">
                {typedText}
                <span className="typed-cursor">|</span>
              </span>
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
            {L.hero.desc[lang]}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
            <Button size="lg" className="rounded-full text-base font-semibold px-8 shadow-xl shadow-primary/25 w-full sm:w-auto group" asChild>
              <a href="/register">
                {L.hero.cta[lang]}
                <Icon name="ArrowRight" size={18} className="ml-1 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-base font-semibold px-8 w-full sm:w-auto group"
              onClick={onDemoOpen}>
              <Icon name="Play" size={16} className="mr-1" /> {L.hero.demo[lang]}
            </Button>
          </div>

          {/* Stats with counter */}
          <div className="mt-8 flex items-center justify-center lg:justify-start gap-5 sm:gap-8 flex-wrap">
            <CounterStat value={47} suffix={lang === 'ru' ? ' сек' : 's'} label={L.hero.stat1l[lang]} />
            <div className="h-8 w-px bg-border hidden sm:block" />
            <CounterStat value={12000} suffix="+" label={L.hero.stat2l[lang]} />
            <div className="h-8 w-px bg-border hidden sm:block" />
            <CounterStat value={80} suffix="%" label={L.hero.stat3l[lang]} />
          </div>
        </div>

        {/* Robot + chat */}
        <div className="relative animate-scale-in max-w-md mx-auto w-full">
          <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/10 to-accent/20 blur-2xl" />

          {/* Animated Robot SVG */}
          <div className="robo-bob-wrap mx-auto w-44 sm:w-52 md:w-60 flex items-center justify-center">
            <svg viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full robo-bob drop-shadow-2xl">
              <defs>
                <linearGradient id="bodyGrad" x1="72" y1="72" x2="184" y2="192" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="hsl(232,90%,90%)"/>
                  <stop offset="100%" stopColor="hsl(232,90%,58%)" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="screenGrad" x1="86" y1="88" x2="170" y2="160" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="hsl(232,90%,58%)"/>
                  <stop offset="100%" stopColor="hsl(88,70%,50%)"/>
                </linearGradient>
                <clipPath id="bodyClip">
                  <rect x="72" y="72" width="112" height="120" rx="28"/>
                </clipPath>
              </defs>
              <circle cx="128" cy="160" r="70" fill="hsl(232,90%,58%)" opacity="0.10"/>
              <circle cx="128" cy="155" r="54" fill="hsl(232,90%,58%)" opacity="0.07"/>
              <g className="antenna-sway">
                <line x1="128" y1="72" x2="128" y2="52" stroke="hsl(232,90%,58%)" strokeWidth="3.5" strokeLinecap="round"/>
                <circle cx="128" cy="46" r="7" fill="hsl(232,90%,58%)" opacity="0.9"/>
                <circle cx="128" cy="46" r="4" fill="white"/>
                <circle cx="128" cy="46" r="5" fill="hsl(232,90%,58%)">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite"/>
                </circle>
              </g>
              <rect x="72" y="72" width="112" height="120" rx="28" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
              <rect x="72" y="72" width="112" height="120" rx="28" fill="url(#bodyGrad)" opacity="0.5"/>
              <rect x="72" y="72" width="112" height="4" fill="hsl(232,90%,58%)" opacity="0.25" clipPath="url(#bodyClip)" className="robo-scan"/>
              <rect x="86" y="88" width="84" height="72" rx="16" fill="hsl(224,47%,9%)" opacity="0.94"/>
              <rect x="86" y="88" width="84" height="72" rx="16" fill="url(#screenGrad)" opacity="0.3"/>
              <g className="eye-l">
                <rect x="96" y="108" width="22" height="22" rx="7" fill="hsl(232,90%,58%)"/>
                <circle cx="107" cy="119" r="6" fill="white"/>
                <circle cx="109" cy="117" r="2.5" fill="hsl(224,47%,9%)"/>
                <circle cx="111" cy="116" r="1.2" fill="white" opacity="0.9"/>
              </g>
              <g className="eye-r">
                <rect x="138" y="108" width="22" height="22" rx="7" fill="hsl(232,90%,58%)"/>
                <circle cx="149" cy="119" r="6" fill="white"/>
                <circle cx="151" cy="117" r="2.5" fill="hsl(224,47%,9%)"/>
                <circle cx="153" cy="116" r="1.2" fill="white" opacity="0.9"/>
              </g>
              <path d="M 108 140 Q 128 152 148 140" stroke="hsl(88,70%,50%)" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <g opacity="0.6">
                <path d="M 90 148 L 106 148 L 106 160 L 118 160" stroke="hsl(232,90%,58%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-1"/>
                <path d="M 166 148 L 150 148 L 150 160 L 138 160" stroke="hsl(88,70%,50%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-2"/>
                <path d="M 110 178 L 128 178 L 128 172 L 146 172" stroke="hsl(232,90%,58%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-3"/>
              </g>
              <circle cx="128" cy="178" r="6" fill="hsl(88,70%,50%)" opacity="0.9">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
              </circle>
              <circle cx="128" cy="178" r="3" fill="white" opacity="0.8"/>
              <rect x="48" y="96" width="26" height="56" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
              <rect x="182" y="96" width="26" height="56" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
              <rect x="94" y="188" width="26" height="36" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
              <rect x="136" y="188" width="26" height="36" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
              <ellipse cx="107" cy="226" rx="16" ry="7" fill="hsl(232,90%,58%)" opacity="0.15"/>
              <ellipse cx="149" cy="226" rx="16" ry="7" fill="hsl(232,90%,58%)" opacity="0.15"/>
            </svg>
          </div>

          <div className="glass rounded-3xl p-4 sm:p-5 shadow-2xl mt-[-1.5rem] mx-2 sm:mx-0">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <span className="relative grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Icon name="Bot" size={14} />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[hsl(88,70%,45%)] border-2 border-background" />
              </span>
              <span className="font-display font-bold text-xs sm:text-sm">{L.chat.online[lang]}</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                {isTyping ? (
                  <>
                    <span className="flex gap-1 text-primary">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                    <span>{L.chat.typing[lang]}</span>
                  </>
                ) : (
                  <><span className="h-2 w-2 rounded-full bg-[hsl(88,70%,45%)] animate-glow shrink-0" /> {L.chat.online2[lang]}</>
                )}
              </span>
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div className="mt-3 mb-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">{L.chat.progress[lang]}</span>
                  <span className="text-xs font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(88,70%,45%)] transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={chatContainerRef} className="space-y-2 sm:space-y-2.5 pt-3 min-h-[160px] sm:min-h-[190px] overflow-y-auto max-h-[220px]">
              {chatSteps.slice(0, chatStep).map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animation: 'fade-in 0.4s ease-out forwards' }}
                >
                  {m.who === 'bot' && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shrink-0 mr-1.5 mt-0.5">
                      <Icon name="Bot" size={11} />
                    </span>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm ${
                    m.who === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : m.done
                        ? 'bg-gradient-to-r from-primary/20 to-[hsl(88,60%,50%)]/20 border border-primary/30 text-foreground font-semibold rounded-bl-sm'
                        : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                  }`}>
                    {m.text}
                    {m.done && (
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
                          <Icon name="Rocket" size={11} /> Запустить
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold cursor-pointer hover:bg-secondary/80 transition-colors">
                          <Icon name="Eye" size={11} /> Смотреть
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start" style={{ animation: 'fade-in 0.3s ease-out forwards' }}>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shrink-0 mr-1.5 mt-0.5">
                    <Icon name="Bot" size={11} />
                  </span>
                  <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                    <span className="typing-dot text-muted-foreground" />
                    <span className="typing-dot text-muted-foreground" />
                    <span className="typing-dot text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background px-3 sm:px-4 py-2 sm:py-2.5">
              <Icon name="MessageSquare" size={15} className="text-muted-foreground shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground truncate">Опишите ваш сайт…</span>
              <span className="ml-auto grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-primary text-primary-foreground shrink-0 hover:bg-primary/90 transition-colors cursor-pointer">
                <Icon name="Send" size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}