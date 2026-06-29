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

const NAV = [
  { label: 'Преимущества', href: '#features' },
  { label: 'Как работает', href: '#process' },
  { label: 'Портфолио', href: '#portfolio' },
  { label: 'Тарифы', href: '#pricing' },
  { label: 'Вопросы', href: '#faq' },
];

const CHAT = [
  { who: 'user', text: 'Сделай лендинг для кофейни с меню и доставкой' },
  { who: 'bot', text: 'Принял! Собираю структуру, подбираю стиль и пишу тексты…' },
  { who: 'bot', text: 'Готово ✦ Ваш сайт собран за 47 секунд. Запускаем?' },
];

const FEATURES = [
  {
    icon: 'MessageSquare',
    title: 'Диалог вместо ТЗ',
    text: 'Просто опишите идею словами. Roboweb задаёт уточняющие вопросы и сам собирает сайт.',
  },
  {
    icon: 'Zap',
    title: 'В 30 раз быстрее',
    text: 'То, что фрилансер делает неделями, AI собирает за минуты. Без срывов сроков.',
  },
  {
    icon: 'Wallet',
    title: 'Дешевле студии',
    text: 'Никаких счетов на сотни тысяч. Платите за результат, а не за часы работы.',
  },
  {
    icon: 'Sparkles',
    title: 'Дизайн как у топов',
    text: 'Чистая типографика, продуманные сетки и анимации — на уровне дорогих агентств.',
  },
  {
    icon: 'Layers',
    title: 'Любая сложность',
    text: 'Лендинги, магазины, личные кабинеты, формы и базы данных — всё в одном месте.',
  },
  {
    icon: 'RefreshCw',
    title: 'Правки мгновенно',
    text: 'Хотите изменить цвет или текст? Скажите об этом — и увидите результат сразу.',
  },
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
  {
    q: 'Может ли AI правда заменить фрилансера?',
    a: 'Да. Roboweb создаёт сайты уровня агентства, но в десятки раз быстрее и дешевле. Вы общаетесь словами, а нейросеть делает всю техническую работу.',
  },
  {
    q: 'Сколько времени занимает создание сайта?',
    a: 'Первая рабочая версия появляется за несколько минут. Доработки в диалоге занимают ещё столько же — вместо недель ожидания от исполнителей.',
  },
  {
    q: 'Нужно ли уметь программировать?',
    a: 'Нет. Достаточно описать идею обычным языком. Roboweb сам напишет код, подберёт дизайн и опубликует сайт.',
  },
  {
    q: 'Чем это лучше обычного конструктора?',
    a: 'Конструкторы требуют ручной сборки из шаблонов. Roboweb понимает вашу задачу и создаёт уникальный сайт под неё — без ограничений шаблонов.',
  },
  {
    q: 'Можно ли подключить свой домен?',
    a: 'Конечно. На платных тарифах вы подключаете собственный домен — SSL и хостинг настраиваются автоматически.',
  },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShown(true),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {children}
    </div>
  );
}

const Index = () => {
  const [visibleChat, setVisibleChat] = useState(0);

  useEffect(() => {
    if (visibleChat >= CHAT.length) return;
    const t = setTimeout(() => setVisibleChat((v) => v + 1), 1100);
    return () => clearTimeout(t);
  }, [visibleChat]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <nav className="container flex items-center justify-between py-4">
          <a href="#" className="flex items-center gap-2 font-display font-extrabold text-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Icon name="Bot" size={20} />
            </span>
            Roboweb
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-foreground transition-colors">
                {n.label}
              </a>
            ))}
          </div>
          <Button className="rounded-full font-semibold shadow-lg shadow-primary/20">
            Создать сайт
          </Button>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative pt-36 pb-24 grid-bg">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/60 to-background" />
        <div className="absolute top-20 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-glow" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-glow" />
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Icon name="Sparkles" size={15} /> AI-конструктор нового поколения
            </span>
            <h1 className="mt-6 font-display font-black leading-[1.05] text-5xl md:text-6xl xl:text-7xl tracking-tight">
              Сайты создаёт <span className="text-gradient">искусственный интеллект</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Roboweb заменяет фрилансеров и конструкторы. Опишите идею в диалоге — и получите
              готовый сайт за минуты, а не недели.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full text-base font-semibold h-13 px-8 shadow-xl shadow-primary/25 hover-scale">
                Создать сайт бесплатно
                <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full text-base font-semibold h-13 px-8">
                <Icon name="Play" size={16} className="mr-1" /> Смотреть демо
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
              <div>
                <div className="font-display font-extrabold text-2xl text-foreground">47 сек</div>
                средняя сборка
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="font-display font-extrabold text-2xl text-foreground">12 000+</div>
                созданных сайтов
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="font-display font-extrabold text-2xl text-foreground">−80%</div>
                к расходам
              </div>
            </div>
          </div>

          {/* HERO right: robot + chat */}
          <div className="relative animate-scale-in">
            <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/10 to-accent/20 blur-2xl" />
            <img
              src={ROBO_IMG}
              alt="Roboweb — AI-помощник"
              className="mx-auto w-64 md:w-72 drop-shadow-2xl animate-float rounded-3xl"
            />
            <div className="glass rounded-3xl p-5 shadow-2xl mt-[-2rem] mx-auto max-w-md">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Icon name="Bot" size={15} />
                </span>
                <span className="font-display font-bold text-sm">Roboweb онлайн</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-[hsl(88,70%,45%)] animate-glow" /> печатает…
                </span>
              </div>
              <div className="space-y-3 pt-4 min-h-[180px]">
                {CHAT.slice(0, visibleChat).map((m, i) => (
                  <div
                    key={i}
                    className={`flex animate-fade-in ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.who === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
                <Icon name="MessageSquare" size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Опишите ваш сайт…</span>
                <span className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Icon name="Send" size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Преимущества</span>
              <h2 className="mt-3 font-display font-black text-4xl md:text-5xl tracking-tight">
                Почему AI и диалог — это будущее
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Всё лучшее от веб-студии без её недостатков: скорость, цена и качество в одном инструменте.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group h-full rounded-3xl border border-border bg-card p-7 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/30">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon name={f.icon} size={22} />
                  </span>
                  <h3 className="mt-5 font-display font-bold text-xl">{f.title}</h3>
                  <p className="mt-2 text-muted-foreground">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-[40rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="container relative">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-widest text-accent">Как это работает</span>
              <h2 className="mt-3 font-display font-black text-4xl md:text-5xl tracking-tight">
                4 шага до готового сайта
              </h2>
            </div>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative rounded-3xl border border-white/10 bg-white/5 p-7 h-full backdrop-blur">
                  <div className="font-display font-black text-5xl text-accent/90">{s.n}</div>
                  <h3 className="mt-4 font-display font-bold text-xl">{s.title}</h3>
                  <p className="mt-2 text-background/70">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="py-24">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Портфолио</span>
              <h2 className="mt-3 font-display font-black text-4xl md:text-5xl tracking-tight">
                Сайты, созданные Roboweb
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Реальные проекты и результаты бизнеса, которые отказались от фрилансеров.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PORTFOLIO.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <div className="group overflow-hidden rounded-3xl border border-border bg-card hover-scale">
                  <div className={`relative h-44 bg-gradient-to-br ${p.grad}`}>
                    <span className="absolute top-4 left-4 rounded-full bg-white/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {p.tag}
                    </span>
                    <Icon
                      name="Globe"
                      size={64}
                      className="absolute right-4 bottom-4 text-white/30 transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display font-bold text-xl">{p.title}</h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <Icon name="TrendingUp" size={15} /> {p.metric}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-secondary/50">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Тарифы</span>
              <h2 className="mt-3 font-display font-black text-4xl md:text-5xl tracking-tight">
                Дешевле любого исполнителя
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Прозрачные цены без скрытых часов и бесконечных правок.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 100}>
                <div
                  className={`relative h-full rounded-3xl border p-8 ${
                    p.hot
                      ? 'border-primary bg-card shadow-2xl shadow-primary/15 lg:-translate-y-4'
                      : 'border-border bg-card'
                  }`}
                >
                  {p.hot && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                      Популярный
                    </span>
                  )}
                  <h3 className="font-display font-bold text-2xl">{p.name}</h3>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="font-display font-black text-4xl">{p.price}</span>
                    <span className="mb-1 text-sm text-muted-foreground">{p.note}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Icon name="Check" size={16} className="text-[hsl(88,60%,40%)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-8 w-full rounded-full font-semibold ${
                      p.hot ? '' : 'bg-foreground hover:bg-foreground/90'
                    }`}
                  >
                    {p.cta}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + REGISTER */}
      <section id="register" className="py-24">
        <div className="container">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground text-background p-10 md:p-16 text-center">
              <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
              <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />
              <div className="relative">
                <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight">
                  Создайте первый сайт уже сегодня
                </h2>
                <p className="mt-4 text-background/70 text-lg max-w-xl mx-auto">
                  Оставьте e-mail — и Roboweb начнёт работу. Без карты, без рисков.
                </p>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <Input
                    type="email"
                    placeholder="Ваш e-mail"
                    className="h-12 rounded-full bg-white/10 border-white/20 text-background placeholder:text-background/50 px-5"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 rounded-full font-semibold px-8 whitespace-nowrap"
                  >
                    Начать бесплатно
                  </Button>
                </form>
                <p className="mt-4 text-xs text-background/50">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-secondary/50">
        <div className="container max-w-3xl">
          <Reveal>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</span>
              <h2 className="mt-3 font-display font-black text-4xl md:text-5xl tracking-tight">
                Частые вопросы
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <Accordion type="single" collapsible className="mt-10 space-y-3">
              {FAQ.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-2xl border border-border bg-card px-6"
                >
                  <AccordionTrigger className="text-left font-display font-semibold text-lg hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* FOOTER / CONTACTS */}
      <footer className="border-t border-border bg-background">
        <div className="container py-14 grid md:grid-cols-4 gap-10">
          <div>
            <a href="#" className="flex items-center gap-2 font-display font-extrabold text-xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Icon name="Bot" size={20} />
              </span>
              Roboweb
            </a>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              AI-конструктор, который создаёт сайты в диалоге и заменяет фрилансеров.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Навигация</h4>
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
          <div>
            <h4 className="font-display font-bold mb-4">Контакты</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Icon name="Mail" size={16} className="text-primary" /> roboweb.site@yandex.ru
              </li>
              <li className="flex items-center gap-2">
                <Icon name="Phone" size={16} className="text-primary" /> 8 (933) 177-00-86
              </li>
              <li className="flex items-center gap-2">
                <Icon name="MessageCircle" size={16} className="text-primary" /> Telegram-поддержка
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Мы в сети</h4>
            <div className="flex gap-3">
              {['Send', 'Youtube', 'Instagram'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <Icon name={s} size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border py-6 text-center text-sm text-muted-foreground">
          © 2026 Roboweb. Создано с помощью искусственного интеллекта.
        </div>
      </footer>
    </div>
  );
};

export default Index;