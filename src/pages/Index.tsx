import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ROBO_IMG =
  'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/2704f2a7-0e24-4881-a393-b234ab436538.jpg';

const SEND_EMAIL_URL = 'https://functions.poehali.dev/4272fc80-99e8-4abe-8f09-7dce2b50bc57';

const NAV = [
  { label: 'Преимущества', href: '#features' },
  { label: 'Как работает', href: '#process' },
  { label: 'Портфолио', href: '#portfolio' },
  { label: 'Тарифы', href: '#pricing' },
  { label: 'Вопросы', href: '#faq' },
];

const CHAT_STEPS = [
  { who: 'user', text: 'Сделай лендинг для кофейни с меню и доставкой' },
  { who: 'bot', text: 'Принял! Анализирую нишу и подбираю стиль…', typing: true },
  { who: 'bot', text: '☕ Структура готова: Герой → Меню → Доставка → Контакты', progress: 40 },
  { who: 'bot', text: '🎨 Применяю дизайн: тёплые тона, красивые шрифты…', progress: 70 },
  { who: 'bot', text: '✦ Сайт готов за 47 секунд! Запускаем?', done: true },
];

const FEATURES = [
  { icon: 'MessageSquare', title: 'Диалог вместо ТЗ', text: 'Просто опишите идею словами. Roboweb задаёт уточняющие вопросы и сам собирает сайт.' },
  { icon: 'Zap', title: 'В 30 раз быстрее', text: 'То, что фрилансер делает неделями, AI собирает за минуты. Без срывов сроков.' },
  { icon: 'Wallet', title: 'Дешевле студии', text: 'Никаких счетов на сотни тысяч. Платите за результат, а не за часы работы.' },
  { icon: 'Sparkles', title: 'Дизайн как у топов', text: 'Чистая типографика, продуманные сетки и анимации — на уровне дорогих агентств.' },
  { icon: 'Layers', title: 'Любая сложность', text: 'Лендинги, магазины, личные кабинеты, формы и базы данных — всё в одном месте.' },
  { icon: 'RefreshCw', title: 'Правки мгновенно', text: 'Хотите изменить цвет или текст? Скажите об этом — и увидите результат сразу.' },
];

const STEPS = [
  { n: '01', title: 'Опишите задачу', text: 'Расскажите Roboweb, какой сайт нужен и для кого.' },
  { n: '02', title: 'AI создаёт сайт', text: 'Нейросеть собирает структуру, дизайн и тексты под вашу нишу.' },
  { n: '03', title: 'Правите в диалоге', text: 'Меняете что угодно простыми словами — без кода и дизайнеров.' },
  { n: '04', title: 'Публикуете онлайн', text: 'Один клик — сайт в сети, с доменом, SSL и хостингом.' },
];

const PORTFOLIO = [
  { tag: 'Кофейня', title: 'Brew & Co', metric: '+212% заявок', grad: 'from-amber-400 to-orange-500' },
  { tag: 'Фитнес', title: 'PulseGym', metric: '3 дня → 4 минуты', grad: 'from-indigo-500 to-blue-500' },
  { tag: 'Магазин', title: 'NordShop', metric: '−180 000 ₽ на студии', grad: 'from-emerald-400 to-teal-500' },
  { tag: 'Барбершоп', title: 'IronCut', metric: '98% довольных', grad: 'from-rose-500 to-pink-500' },
  { tag: 'Курсы', title: 'SkillUp', metric: '×5 конверсия', grad: 'from-violet-500 to-fuchsia-500' },
  { tag: 'Стартап', title: 'FlowAI', metric: 'запуск за день', grad: 'from-cyan-400 to-sky-500' },
];

const PLANS = [
  {
    name: 'Старт',
    price: '0 ₽',
    note: 'для первого сайта',
    features: ['1 сайт', 'AI-генерация', 'Базовые блоки', 'Поддомен poehali'],
    cta: 'Попробовать',
    hot: false,
  },
  {
    name: 'Бизнес',
    price: '1 990 ₽',
    note: 'в месяц',
    features: ['До 10 сайтов', 'Свой домен + SSL', 'Формы и база данных', 'Приоритетный AI', 'Поддержка 24/7'],
    cta: 'Выбрать Бизнес',
    hot: true,
  },
  {
    name: 'Агентство',
    price: 'Договорная',
    note: 'для веб-студий',
    features: ['Безлимит сайтов', 'White-label', 'Командный доступ', 'API и интеграции', 'Личный менеджер'],
    cta: 'Обсудить',
    hot: false,
  },
];

const FAQ = [
  { q: 'Может ли AI правда заменить фрилансера?', a: 'Да. Roboweb создаёт сайты уровня агентства, но в десятки раз быстрее и дешевле. Вы общаетесь словами, а нейросеть делает всю техническую работу.' },
  { q: 'Сколько времени занимает создание сайта?', a: 'Первая рабочая версия появляется за несколько минут. Доработки в диалоге занимают ещё столько же — вместо недель ожидания от исполнителей.' },
  { q: 'Нужно ли уметь программировать?', a: 'Нет. Достаточно описать идею обычным языком. Roboweb сам напишет код, подберёт дизайн и опубликует сайт.' },
  { q: 'Чем это лучше обычного конструктора?', a: 'Конструкторы требуют ручной сборки из шаблонов. Roboweb понимает вашу задачу и создаёт уникальный сайт под неё — без ограничений шаблонов.' },
  { q: 'Можно ли подключить свой домен?', a: 'Конечно. На платных тарифах вы подключаете собственный домен — SSL и хостинг настраиваются автоматически.' },
];

const MARQUEE_ITEMS = [
  '✦ Лендинги', '✦ Интернет-магазины', '✦ Корпоративные сайты', '✦ Портфолио',
  '✦ Блоги', '✦ Сайты услуг', '✦ Визитки', '✦ Стартап-страницы',
  '✦ Лендинги', '✦ Интернет-магазины', '✦ Корпоративные сайты', '✦ Портфолио',
  '✦ Блоги', '✦ Сайты услуг', '✦ Визитки', '✦ Стартап-страницы',
];

// --- Hooks ---

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function useCounter(target: number, duration = 1800, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [active, target, duration]);
  return val;
}

// --- Components ---

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

function CounterStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, shown } = useReveal();
  const count = useCounter(value, 1600, shown);
  return (
    <div ref={ref} className="text-center">
      <div className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function EmailForm({ dark = false, placeholder = 'Ваш e-mail', btnText = 'Начать бесплатно' }: {
  dark?: boolean;
  placeholder?: string;
  btnText?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(SEND_EMAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { setStatus('success'); setEmail(''); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };

  if (status === 'success') {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold animate-slide-up ${
        dark ? 'bg-white/10 border border-white/20 text-background' : 'bg-primary/10 border border-primary/20 text-primary'
      }`}>
        <Icon name="CheckCircle" size={20} />
        Заявка принята! Мы свяжемся с вами.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`h-12 rounded-full px-5 ${
            dark
              ? 'bg-white/10 border-white/20 text-background placeholder:text-background/50'
              : 'bg-background border-border'
          }`}
        />
        <Button
          type="submit"
          size="lg"
          disabled={status === 'loading'}
          className={`h-12 rounded-full font-semibold px-8 whitespace-nowrap w-full sm:w-auto transition-all ${
            dark ? '' : 'shadow-xl shadow-primary/25'
          }`}
        >
          {status === 'loading'
            ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />Отправляем…</>
            : <>{btnText} <Icon name="ArrowRight" size={16} className="ml-1 animate-bounce-x" /></>
          }
        </Button>
      </form>
      {status === 'error' && (
        <p className={`mt-2 text-sm text-center ${dark ? 'text-rose-300' : 'text-rose-500'}`}>
          Ошибка отправки. Попробуйте ещё раз.
        </p>
      )}
    </div>
  );
}

// --- Page ---

const Index = () => {
  const [chatStep, setChatStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [typedIdx, setTypedIdx] = useState(0);
  const typedWords = ['лендинг', 'магазин', 'портфолио', 'стартап', 'визитку'];
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Chat animation loop
  useEffect(() => {
    if (chatStep >= CHAT_STEPS.length) {
      // Reset after pause
      const t = setTimeout(() => {
        setChatStep(0);
        setProgress(0);
        setIsTyping(false);
      }, 3000);
      return () => clearTimeout(t);
    }
    const step = CHAT_STEPS[chatStep];
    setIsTyping(step.who === 'bot');
    const delay = chatStep === 0 ? 600 : 1500;
    const t = setTimeout(() => {
      setIsTyping(false);
      if (step.progress !== undefined) {
        setProgress(step.progress);
      }
      if ((step as { done?: boolean }).done) {
        setProgress(100);
      }
      setChatStep(s => s + 1);
    }, chatStep === 0 ? delay : delay + 800);
    return () => clearTimeout(t);
  }, [chatStep]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatStep, isTyping]);

  // Typewriter effect
  useEffect(() => {
    const word = typedWords[wordIdx];
    const delay = deleting ? 60 : 110;
    const t = setTimeout(() => {
      if (!deleting && typedIdx < word.length) {
        setTypedIdx(i => i + 1);
      } else if (!deleting && typedIdx === word.length) {
        setTimeout(() => setDeleting(true), 1200);
      } else if (deleting && typedIdx > 0) {
        setTypedIdx(i => i - 1);
      } else {
        setDeleting(false);
        setWordIdx(i => (i + 1) % typedWords.length);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [typedIdx, deleting, wordIdx]);

  // Lock scroll on mobile menu
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* NAV */}
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
              <a key={n.href} href={n.href} className="hover:text-foreground transition-colors relative group">
                {n.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all group-hover:w-full" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button className="hidden sm:flex rounded-full font-semibold shadow-lg shadow-primary/20 text-sm px-5 h-9">
              Создать сайт
            </Button>
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
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-3 px-4 rounded-xl font-medium hover:bg-secondary transition-colors">
                {n.label}
              </a>
            ))}
            <Button className="w-full rounded-full font-semibold mt-4">Создать сайт</Button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 md:pb-24 grid-bg overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/60 to-background" />
        {/* Floating orbs */}
        <div className="absolute top-20 -left-24 h-56 w-56 md:h-80 md:w-80 rounded-full bg-primary/20 blur-3xl animate-glow" />
        <div className="absolute top-40 -right-24 h-56 w-56 md:h-80 md:w-80 rounded-full bg-accent/25 blur-3xl animate-glow" style={{animationDelay:'1.5s'}} />
        <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-primary/10 blur-2xl animate-glow" style={{animationDelay:'0.8s'}} />

        {/* Floating badges */}
        <div className="absolute top-36 left-8 hidden xl:flex items-center gap-2 rounded-2xl glass px-4 py-2.5 shadow-lg animate-float" style={{animationDelay:'0.3s'}}>
          <Icon name="Zap" size={16} className="text-primary" />
          <span className="text-xs font-semibold">47 секунд</span>
        </div>
        <div className="absolute top-56 right-8 hidden xl:flex items-center gap-2 rounded-2xl glass px-4 py-2.5 shadow-lg animate-float" style={{animationDelay:'1s'}}>
          <Icon name="TrendingUp" size={16} className="text-[hsl(88,70%,40%)]" />
          <span className="text-xs font-semibold">+212% конверсия</span>
        </div>
        <div className="absolute bottom-32 left-12 hidden xl:flex items-center gap-2 rounded-2xl glass px-4 py-2.5 shadow-lg animate-float" style={{animationDelay:'1.8s'}}>
          <Icon name="Shield" size={16} className="text-primary" />
          <span className="text-xs font-semibold">SSL + хостинг</span>
        </div>

        <div className="container grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div className="animate-fade-in text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              AI-конструктор нового поколения
            </span>
            <h1 className="mt-5 font-display font-black leading-[1.05] text-4xl sm:text-5xl md:text-6xl xl:text-7xl tracking-tight">
              Создай свой{' '}
              <span className="text-gradient">
                {typedWords[wordIdx].slice(0, typedIdx)}
                <span className="animate-blink">|</span>
              </span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Roboweb заменяет фрилансеров и конструкторы. Опишите идею в диалоге — и получите готовый сайт за минуты, а не недели.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
              <Button size="lg" className="rounded-full text-base font-semibold px-8 shadow-xl shadow-primary/25 w-full sm:w-auto group">
                Создать сайт бесплатно
                <Icon name="ArrowRight" size={18} className="ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full text-base font-semibold px-8 w-full sm:w-auto group">
                <Icon name="Play" size={16} className="mr-1" /> Смотреть демо
              </Button>
            </div>

            {/* Stats with counter */}
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-5 sm:gap-8 flex-wrap">
              <CounterStat value={47} suffix=" сек" label="средняя сборка" />
              <div className="h-8 w-px bg-border hidden sm:block" />
              <CounterStat value={12000} suffix="+" label="созданных сайтов" />
              <div className="h-8 w-px bg-border hidden sm:block" />
              <CounterStat value={80} suffix="%" label="экономия бюджета" />
            </div>
          </div>

          {/* Robot + chat */}
          <div className="relative animate-scale-in max-w-md mx-auto w-full">
            <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/10 to-accent/20 blur-2xl" />

            {/* Animated Robot SVG */}
            <div className="mx-auto w-44 sm:w-52 md:w-60 flex items-center justify-center">
              <svg
                viewBox="0 0 256 256"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full robo-bob drop-shadow-2xl"
              >
                {/* Glow behind */}
                <circle cx="128" cy="160" r="70" fill="hsl(232,90%,58%)" opacity="0.12" className="robo-bob" style={{animationDelay:'0.2s'}} />
                <circle cx="128" cy="155" r="54" fill="hsl(232,90%,58%)" opacity="0.08" />

                {/* Antenna */}
                <g className="antenna-sway">
                  <line x1="128" y1="72" x2="128" y2="52" stroke="hsl(232,90%,58%)" strokeWidth="3.5" strokeLinecap="round"/>
                  <circle cx="128" cy="46" r="7" fill="hsl(232,90%,58%)" opacity="0.9"/>
                  <circle cx="128" cy="46" r="4" fill="white"/>
                  <circle cx="128" cy="46" r="4" fill="hsl(232,90%,58%)" opacity="0.6">
                    <animate attributeName="r" values="4;6;4" dur="1.2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite"/>
                  </circle>
                </g>

                {/* Body */}
                <rect x="72" y="72" width="112" height="120" rx="28" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
                <rect x="72" y="72" width="112" height="120" rx="28" fill="url(#bodyGrad)" opacity="0.5"/>

                {/* Scanline overlay */}
                <clipPath id="bodyClip">
                  <rect x="72" y="72" width="112" height="120" rx="28"/>
                </clipPath>
                <rect x="72" y="72" width="112" height="4" fill="hsl(232,90%,58%)" opacity="0.3" clipPath="url(#bodyClip)" className="robo-scan"/>

                {/* Screen / face panel */}
                <rect x="86" y="88" width="84" height="72" rx="16" fill="hsl(224,47%,9%)" opacity="0.94"/>
                <rect x="86" y="88" width="84" height="72" rx="16" fill="url(#screenGrad)" opacity="0.3"/>

                {/* Eyes */}
                <g className="eye-l">
                  <rect x="96" y="108" width="22" height="22" rx="7" fill="hsl(232,90%,58%)"/>
                  <rect x="96" y="108" width="22" height="22" rx="7" fill="white" opacity="0.15"/>
                  <circle cx="107" cy="119" r="6" fill="white"/>
                  <circle cx="109" cy="117" r="2.5" fill="hsl(224,47%,9%)"/>
                  <circle cx="111" cy="116" r="1.2" fill="white" opacity="0.9"/>
                </g>
                <g className="eye-r">
                  <rect x="138" y="108" width="22" height="22" rx="7" fill="hsl(232,90%,58%)"/>
                  <rect x="138" y="108" width="22" height="22" rx="7" fill="white" opacity="0.15"/>
                  <circle cx="149" cy="119" r="6" fill="white"/>
                  <circle cx="151" cy="117" r="2.5" fill="hsl(224,47%,9%)"/>
                  <circle cx="153" cy="116" r="1.2" fill="white" opacity="0.9"/>
                </g>

                {/* Mouth — animated smile */}
                <path d="M 108 140 Q 128 152 148 140" stroke="hsl(88,70%,50%)" strokeWidth="3" strokeLinecap="round" fill="none">
                  <animate attributeName="d" values="M 108 140 Q 128 150 148 140;M 108 138 Q 128 155 148 138;M 108 140 Q 128 150 148 140" dur="3s" repeatCount="indefinite"/>
                </path>

                {/* Circuit lines on body */}
                <g opacity="0.6">
                  <path d="M 90 148 L 106 148 L 106 160 L 118 160" stroke="hsl(232,90%,58%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-1"/>
                  <path d="M 166 148 L 150 148 L 150 160 L 138 160" stroke="hsl(88,70%,50%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-2"/>
                  <path d="M 110 178 L 128 178 L 128 172 L 146 172" stroke="hsl(232,90%,58%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-3"/>
                </g>

                {/* Chest light */}
                <circle cx="128" cy="178" r="6" fill="hsl(88,70%,50%)" opacity="0.9">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="128" cy="178" r="3" fill="white" opacity="0.8"/>

                {/* Arms */}
                <rect x="48" y="96" width="26" height="56" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
                <rect x="182" y="96" width="26" height="56" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
                <circle cx="61" cy="152" r="10" fill="hsl(232,90%,58%)" opacity="0.15"/>
                <circle cx="195" cy="152" r="10" fill="hsl(232,90%,58%)" opacity="0.15"/>

                {/* Legs */}
                <rect x="94" y="188" width="26" height="36" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
                <rect x="136" y="188" width="26" height="36" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>

                {/* Feet */}
                <ellipse cx="107" cy="226" rx="16" ry="7" fill="hsl(232,90%,58%)" opacity="0.2"/>
                <ellipse cx="149" cy="226" rx="16" ry="7" fill="hsl(232,90%,58%)" opacity="0.2"/>

                {/* Gradients */}
                <defs>
                  <linearGradient id="bodyGrad" x1="72" y1="72" x2="184" y2="192" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="hsl(232,90%,90%)"/>
                    <stop offset="100%" stopColor="hsl(232,90%,58%)" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="screenGrad" x1="86" y1="88" x2="170" y2="160" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="hsl(232,90%,58%)"/>
                    <stop offset="100%" stopColor="hsl(88,70%,50%)"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="glass rounded-3xl p-4 sm:p-5 shadow-2xl mt-[-1.5rem] mx-2 sm:mx-0">

              {/* Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <span className="relative grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <Icon name="Bot" size={14} />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[hsl(88,70%,45%)] border-2 border-background" />
                </span>
                <span className="font-display font-bold text-xs sm:text-sm">Roboweb онлайн</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  {isTyping ? (
                    <>
                      <span className="flex gap-1 text-primary">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </span>
                      <span>пишет…</span>
                    </>
                  ) : (
                    <><span className="h-2 w-2 rounded-full bg-[hsl(88,70%,45%)] animate-glow shrink-0" /> онлайн</>
                  )}
                </span>
              </div>

              {/* Progress bar */}
              {progress > 0 && (
                <div className="mt-3 mb-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium">Создание сайта</span>
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
              <div className="space-y-2 sm:space-y-2.5 pt-3 min-h-[160px] sm:min-h-[190px] overflow-hidden">
                {CHAT_STEPS.slice(0, chatStep).map((m, i) => (
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
                        : (m as { done?: boolean }).done
                          ? 'bg-gradient-to-r from-primary/20 to-[hsl(88,60%,50%)]/20 border border-primary/30 text-foreground font-semibold rounded-bl-sm'
                          : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                    }`}>
                      {m.text}
                      {(m as { done?: boolean }).done && (
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
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">Преимущества</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                Почему AI и диалог — это будущее
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                Всё лучшее от веб-студии без её недостатков: скорость, цена и качество в одном.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="group h-full rounded-2xl md:rounded-3xl border border-border bg-card p-5 md:p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 cursor-default">
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

      {/* CTA 1 — между преимуществами и процессом */}
      <section className="py-12 bg-primary/5 border-y border-primary/10">
        <Reveal>
          <div className="container text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Готовы начать?</p>
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight mb-2">
              Получите первый сайт <span className="text-gradient">бесплатно</span>
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Без регистрации карты. Просто опишите свой проект.</p>
            <EmailForm placeholder="Ваш e-mail для доступа" btnText="Получить доступ" />
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
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-accent">Как это работает</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                4 шага до готового сайта
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
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <Icon name="ChevronRight" size={20} className="text-white/30" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="py-16 md:py-24">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">Портфолио</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                Сайты, созданные Roboweb
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                Реальные проекты и результаты бизнеса, которые отказались от фрилансеров.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {PORTFOLIO.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <div className="group overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
                  <div className={`relative h-36 sm:h-44 bg-gradient-to-br ${p.grad} overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    <span className="absolute top-4 left-4 rounded-full bg-white/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {p.tag}
                    </span>
                    <Icon name="Globe" size={56} className="absolute right-4 bottom-4 text-white/30 transition-all duration-300 group-hover:scale-125 group-hover:text-white/50" />
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="font-display font-bold text-lg md:text-xl">{p.title}</h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <Icon name="TrendingUp" size={14} /> {p.metric}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 2 — после портфолио */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-[hsl(250,90%,60%)]">
        <Reveal>
          <div className="container text-center text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium mb-5">
              <Icon name="Clock" size={15} /> Только сегодня — первый сайт бесплатно
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
              Хватит платить фрилансерам
            </h2>
            <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Ваш конкурент уже использует AI. Не отставайте — запустите сайт сегодня и начните получать клиентов.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-full font-semibold px-8 bg-white text-primary hover:bg-white/90 h-12 shadow-xl w-full sm:w-auto">
                Создать сайт сейчас
                <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full font-semibold px-8 border-white/30 text-white hover:bg-white/10 h-12 w-full sm:w-auto" asChild>
                <a href="https://t.me/roboweb" target="_blank" rel="noopener noreferrer">
                  <Icon name="Send" size={16} className="mr-2" />
                  Написать в Telegram
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
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">Тарифы</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                Дешевле любого исполнителя
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                Прозрачные цены без скрытых часов и бесконечных правок.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 100}>
                <div className={`relative h-full rounded-2xl md:rounded-3xl border p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  p.hot
                    ? 'border-primary bg-card shadow-2xl shadow-primary/15 sm:col-span-2 lg:col-span-1'
                    : 'border-border bg-card'
                }`}>
                  {p.hot && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground whitespace-nowrap animate-glow">
                      ✦ Популярный
                    </span>
                  )}
                  <h3 className="font-display font-bold text-xl md:text-2xl">{p.name}</h3>
                  <div className="mt-3 flex items-end gap-1 flex-wrap">
                    <span className="font-display font-black text-3xl md:text-4xl">{p.price}</span>
                    <span className="mb-1 text-sm text-muted-foreground">{p.note}</span>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Icon name="Check" size={15} className="text-[hsl(88,60%,40%)] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className={`mt-6 md:mt-8 w-full rounded-full font-semibold transition-all hover:scale-105 ${p.hot ? 'shadow-lg shadow-primary/20' : 'bg-foreground hover:bg-foreground/90'}`}>
                    {p.cta}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 3 — основная форма */}
      <section id="register" className="py-16 md:py-24">
        <div className="container px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-foreground text-background p-8 sm:p-10 md:p-16 text-center">
              <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/40 blur-3xl animate-glow" />
              <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-accent/40 blur-3xl animate-glow" style={{animationDelay:'1s'}} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-sm font-medium mb-5">
                  <Icon name="Gift" size={15} /> Бесплатно для первых 100 клиентов
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                  Создайте первый сайт уже сегодня
                </h2>
                <p className="mt-4 text-background/70 text-base sm:text-lg max-w-xl mx-auto">
                  Оставьте e-mail — и Roboweb начнёт работу. Без карты, без рисков.
                </p>
                <div className="mt-6 md:mt-8">
                  <EmailForm dark placeholder="Ваш e-mail" btnText="Начать бесплатно" />
                </div>
                <p className="mt-4 text-xs text-background/40">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности.
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
                Частые вопросы
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

          {/* CTA 4 — под FAQ */}
          <Reveal>
            <div className="mt-12 rounded-2xl md:rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
              <Icon name="MessageCircle" size={32} className="text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl sm:text-2xl mb-2">Остались вопросы?</h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-5">
                Напишите нам — ответим в течение 15 минут и поможем с запуском вашего первого сайта.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="rounded-full font-semibold px-6" asChild>
                  <a href="mailto:roboweb.site@yandex.ru">
                    <Icon name="Mail" size={16} className="mr-2" />
                    Написать на почту
                  </a>
                </Button>
                <Button variant="outline" className="rounded-full font-semibold px-6" asChild>
                  <a href="https://t.me/roboweb" target="_blank" rel="noopener noreferrer">
                    <Icon name="Send" size={16} className="mr-2" />
                    Написать в Telegram
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
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
            <p className="mt-3 text-sm text-muted-foreground">
              AI-конструктор, который создаёт сайты в диалоге и заменяет фрилансеров.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">Навигация</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-foreground transition-colors">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">Контакты</h4>
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
                <Icon name="MessageCircle" size={15} className="text-primary shrink-0" /> Telegram-поддержка
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">Мы в сети</h4>
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
          © 2026 Roboweb. Создано с помощью искусственного интеллекта.
        </div>
      </footer>
    </div>
  );
};

export default Index;