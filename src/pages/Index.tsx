import { useState, useEffect, useRef } from 'react';
import ParticlesBg from '@/components/ui/particles-bg';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getLang, type Lang } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';
import DemoModal from '@/components/DemoModal';

// Переводы для лендинга
const L = {
  nav: {
    features: { ru: 'Преимущества', en: 'Features' },
    process:  { ru: 'Как работает', en: 'How it works' },
    portfolio:{ ru: 'Портфолио',   en: 'Portfolio' },
    pricing:  { ru: 'Тарифы',      en: 'Pricing' },
    faq:      { ru: 'Вопросы',     en: 'FAQ' },
    login:    { ru: 'Войти',       en: 'Sign In' },
    create:   { ru: 'Создать сайт', en: 'Create site' },
  },
  hero: {
    badge:  { ru: 'AI-конструктор нового поколения', en: 'Next-gen AI website builder' },
    title:  { ru: 'Создай свой', en: 'Build your' },
    words:  { ru: ['Создай свой лендинг','Создай свой магазин','Создай своё портфолио','Создай свой стартап','Создай свою визитку'], en: ['Build your landing','Build your store','Build your portfolio','Build your startup','Build your card'] },
    desc:   { ru: 'Roboweb заменяет фрилансеров и конструкторы сайтов. Опишите идею в диалоге — и получите готовый сайт за минуты, а не недели. И это реальность', en: 'Roboweb replaces freelancers and website builders. Describe your idea in chat — get a ready website in minutes, not weeks. And this is reality.' },
    cta:    { ru: 'Создать сайт бесплатно', en: 'Create site for free' },
    demo:   { ru: 'Смотреть демо', en: 'Watch demo' },
    stat1l: { ru: 'средняя сборка', en: 'avg build time' },
    stat2l: { ru: 'созданных сайтов', en: 'websites created' },
    stat3l: { ru: 'экономия бюджета', en: 'budget savings' },
  },
  chat: {
    online:  { ru: 'Roboweb онлайн', en: 'Roboweb online' },
    typing:  { ru: 'пишет…', en: 'typing…' },
    online2: { ru: 'онлайн', en: 'online' },
    input:   { ru: 'Опишите ваш сайт…', en: 'Describe your website…' },
    progress:{ ru: 'Создание сайта', en: 'Building site' },
  },
  features: {
    title: { ru: 'Почему AI и диалог — это будущее', en: 'Why AI and dialog is the future' },
    desc:  { ru: 'Всё лучшее от веб-студии без её недостатков: скорость, цена и качество в одном.', en: 'The best of a web studio without the downsides: speed, cost and quality in one.' },
  },
  cta1: {
    label: { ru: 'Готовы начать?', en: 'Ready to start?' },
    title: { ru: 'Получите первый сайт', en: 'Get your first site' },
    accent:{ ru: 'бесплатно', en: 'for free' },
    desc:  { ru: 'Без регистрации карты. Просто опишите свой проект.', en: 'No card required. Just describe your project.' },
    btn:   { ru: 'Получить доступ', en: 'Get access' },
    input: { ru: 'Ваш e-mail для доступа', en: 'Your email for access' },
  },
  process: {
    label: { ru: 'Как это работает', en: 'How it works' },
    title: { ru: '4 шага до готового сайта', en: '4 steps to a ready website' },
  },
  portfolio: {
    label: { ru: 'Портфолио', en: 'Portfolio' },
    title: { ru: 'Сайты, созданные Roboweb', en: 'Sites built with Roboweb' },
    desc:  { ru: 'Реальные проекты и результаты бизнеса, которые отказались от фрилансеров.', en: 'Real projects and business results from those who dropped freelancers.' },
  },
  compare: {
    label: { ru: 'Сравнение', en: 'Comparison' },
    title: { ru: 'Roboweb vs фрилансеры vs студии', en: 'Roboweb vs freelancers vs agencies' },
    desc:  { ru: 'Посмотрите сами — разница очевидна.', en: 'See for yourself — the difference is clear.' },
  },
  cta2: {
    badge: { ru: 'Только сегодня — первый сайт бесплатно', en: 'Today only — first site free' },
    title: { ru: 'Хватит платить фрилансерам', en: 'Stop paying freelancers' },
    desc:  { ru: 'Ваш конкурент уже использует AI. Не отставайте — запустите сайт сегодня и начните получать клиентов.', en: 'Your competitor already uses AI. Don\'t fall behind — launch today and start getting clients.' },
    btn:   { ru: 'Создать сайт сейчас', en: 'Create site now' },
    phone: { ru: 'Написать в Telegram', en: 'Write in Telegram' },
  },
  pricing: {
    label: { ru: 'Тарифы', en: 'Pricing' },
    title: { ru: 'Дешевле любого исполнителя', en: 'Cheaper than any freelancer' },
    desc:  { ru: 'Прозрачные цены без скрытых часов и бесконечных правок.', en: 'Transparent pricing with no hidden hours or endless revisions.' },
    popular:{ ru: '✦ Популярный', en: '✦ Popular' },
  },
  cta3: {
    badge: { ru: 'Бесплатно для первых 100 клиентов', en: 'Free for the first 100 clients' },
    title: { ru: 'Создайте первый сайт уже сегодня', en: 'Create your first site today' },
    desc:  { ru: 'Оставьте e-mail — и Roboweb начнёт работу. Без карты, без рисков.', en: 'Leave your email — and Roboweb gets to work. No card, no risks.' },
    btn:   { ru: 'Начать бесплатно', en: 'Start for free' },
    input: { ru: 'Ваш e-mail', en: 'Your email' },
    privacy:{ ru: 'Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности.', en: 'By clicking, you agree to the privacy policy.' },
    success:{ ru: 'Заявка принята! Мы свяжемся с вами.', en: 'Request received! We\'ll get in touch.' },
    error:  { ru: 'Ошибка отправки. Попробуйте ещё раз.', en: 'Send error. Please try again.' },
  },
  faq: {
    label: { ru: 'FAQ', en: 'FAQ' },
    title: { ru: 'Частые вопросы', en: 'Frequently asked questions' },
    ctaTitle:{ ru: 'Остались вопросы?', en: 'Still have questions?' },
    ctaDesc: { ru: 'Напишите нам — ответим в течение 15 минут и поможем с запуском вашего первого сайта.', en: 'Write to us — we\'ll reply within 15 minutes and help you launch your first site.' },
    mail:    { ru: 'Написать на почту', en: 'Email us' },
    tg:      { ru: 'Написать в Telegram', en: 'Write in Telegram' },
  },
  footer: {
    nav:     { ru: 'Навигация', en: 'Navigation' },
    contacts:{ ru: 'Контакты', en: 'Contacts' },
    social:  { ru: 'Мы в сети', en: 'Follow us' },
    desc:    { ru: 'AI-конструктор, который создаёт сайты в диалоге и заменяет фрилансеров.', en: 'AI builder that creates websites through dialog and replaces freelancers.' },
    copy:    { ru: 'Создано с помощью искусственного интеллекта.', en: 'Built with artificial intelligence.' },
  },
  marquee: { ru: ['✦ Лендинги','✦ Интернет-магазины','✦ Корпоративные сайты','✦ Портфолио','✦ Блоги','✦ Сайты услуг','✦ Визитки','✦ Стартап-страницы'], en: ['✦ Landings','✦ Online stores','✦ Corporate sites','✦ Portfolios','✦ Blogs','✦ Service sites','✦ Business cards','✦ Startup pages'] },
} as const;

const ROBO_IMG =
  'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/2704f2a7-0e24-4881-a393-b234ab436538.jpg';

const SEND_EMAIL_URL = 'https://functions.poehali.dev/4272fc80-99e8-4abe-8f09-7dce2b50bc57';

const getNAV = (lang: Lang) => [
  { label: L.nav.features[lang], href: '#features' },
  { label: L.nav.process[lang],  href: '#process' },
  { label: L.nav.portfolio[lang],href: '#portfolio' },
  { label: L.nav.pricing[lang],  href: '#pricing' },
  { label: L.nav.faq[lang],      href: '#faq' },
];

const getCHAT_STEPS = (lang: Lang) => lang === 'ru' ? [
  { who: 'user', text: 'Сделай лендинг для кофейни с меню и доставкой' },
  { who: 'bot', text: 'Принял! Анализирую нишу и подбираю стиль…', typing: true },
  { who: 'bot', text: '☕ Структура готова: Герой → Меню → Доставка → Контакты', progress: 40 },
  { who: 'bot', text: '🎨 Применяю дизайн: тёплые тона, красивые шрифты…', progress: 70 },
  { who: 'bot', text: '✦ Сайт готов за 47 секунд! Запускаем?', done: true },
] : [
  { who: 'user', text: 'Create a landing for a coffee shop with menu and delivery' },
  { who: 'bot', text: 'Got it! Analyzing niche and picking style…', typing: true },
  { who: 'bot', text: '☕ Structure ready: Hero → Menu → Delivery → Contacts', progress: 40 },
  { who: 'bot', text: '🎨 Applying design: warm tones, beautiful fonts…', progress: 70 },
  { who: 'bot', text: '✦ Site built in 47 seconds! Ready to launch?', done: true },
];

const getFEATURES = (lang: Lang) => lang === 'ru' ? [
  { icon: 'MessageSquare', title: 'Диалог вместо ТЗ', text: 'Просто опишите идею словами. Roboweb задаёт уточняющие вопросы и сам собирает сайт.' },
  { icon: 'Zap', title: 'В 30 раз быстрее', text: 'То, что фрилансер делает неделями, AI собирает за минуты. Без срывов сроков.' },
  { icon: 'Wallet', title: 'Дешевле студии', text: 'Никаких счетов на сотни тысяч. Платите за результат, а не за часы работы.' },
  { icon: 'Sparkles', title: 'Дизайн как у топов', text: 'Чистая типографика, продуманные сетки и анимации — на уровне дорогих агентств.' },
  { icon: 'Layers', title: 'Любая сложность', text: 'Лендинги, магазины, личные кабинеты, формы и базы данных — всё в одном месте.' },
  { icon: 'RefreshCw', title: 'Правки мгновенно', text: 'Хотите изменить цвет или текст? Скажите об этом — и увидите результат сразу.' },
  { icon: 'Globe', title: 'Публикация в 1 клик', text: 'Хостинг, SSL-сертификат и домен — всё настраивается автоматически. Сайт сразу в сети.' },
  { icon: 'Search', title: 'SEO из коробки', text: 'Мета-теги, структура заголовков и скорость загрузки настроены для высоких позиций в Google и Яндексе.' },
  { icon: 'ShieldCheck', title: 'Безопасность', text: 'Ваши данные и код защищены. Регулярные бэкапы и изолированное окружение для каждого проекта.' },
  { icon: 'BarChart2', title: 'Аналитика и заявки', text: 'Встроенные формы сбора лидов, интеграция с CRM и Яндекс Метрикой — без лишних настроек.' },
  { icon: 'Smartphone', title: 'Адаптивность', text: 'Каждый сайт выглядит идеально на телефоне, планшете и компьютере — автоматически.' },
  { icon: 'HeadphonesIcon', title: 'Поддержка 24/7', text: 'Живая команда в Telegram готова помочь в любое время. Среднее время ответа — 15 минут.' },
] : [
  { icon: 'MessageSquare', title: 'Chat instead of briefs', text: 'Just describe your idea in plain language. Roboweb asks clarifying questions and builds the site.' },
  { icon: 'Zap', title: '30× faster', text: 'What a freelancer does in weeks, AI builds in minutes. No missed deadlines.' },
  { icon: 'Wallet', title: 'Cheaper than agencies', text: 'No invoices for hundreds of thousands. Pay for results, not hours.' },
  { icon: 'Sparkles', title: 'Top-tier design', text: 'Clean typography, thoughtful grids and animations — at the level of expensive agencies.' },
  { icon: 'Layers', title: 'Any complexity', text: 'Landings, stores, dashboards, forms and databases — all in one place.' },
  { icon: 'RefreshCw', title: 'Instant revisions', text: 'Want to change a color or text? Just say it — and see the result immediately.' },
  { icon: 'Globe', title: '1-click publishing', text: 'Hosting, SSL certificate and domain — all configured automatically. Site goes live instantly.' },
  { icon: 'Search', title: 'SEO out of the box', text: 'Meta tags, heading structure and load speed are set up for high rankings in Google.' },
  { icon: 'ShieldCheck', title: 'Security', text: 'Your data and code are protected. Regular backups and isolated environment for each project.' },
  { icon: 'BarChart2', title: 'Analytics & leads', text: 'Built-in lead capture forms, CRM and Google Analytics integration — no extra setup.' },
  { icon: 'Smartphone', title: 'Responsive', text: 'Every site looks perfect on phone, tablet and desktop — automatically.' },
  { icon: 'HeadphonesIcon', title: '24/7 support', text: 'Live team in Telegram ready to help at any time. Average response time — 15 minutes.' },
];

const getCOMPARE = (lang: Lang) => lang === 'ru' ? [
  { label: 'Стоимость', roboweb: 'от 0 ₽', agency: 'от 80 000 ₽', freelancer: 'от 15 000 ₽' },
  { label: 'Срок', roboweb: '47 секунд', agency: '3–6 недель', freelancer: '1–3 недели' },
  { label: 'Правки', roboweb: 'Мгновенно', agency: 'Долго и дорого', freelancer: 'По договору' },
  { label: 'Поддержка', roboweb: '24/7', agency: 'В рабочее время', freelancer: 'Не гарантировано' },
  { label: 'SEO', roboweb: 'Из коробки', agency: 'Дополнительно', freelancer: 'Редко' },
  { label: 'Хостинг', roboweb: 'Включён', agency: 'Отдельно', freelancer: 'Отдельно' },
] : [
  { label: 'Cost', roboweb: 'from $0', agency: 'from $1000', freelancer: 'from $200' },
  { label: 'Timeline', roboweb: '47 seconds', agency: '3–6 weeks', freelancer: '1–3 weeks' },
  { label: 'Revisions', roboweb: 'Instant', agency: 'Slow & costly', freelancer: 'By contract' },
  { label: 'Support', roboweb: '24/7', agency: 'Business hours', freelancer: 'Not guaranteed' },
  { label: 'SEO', roboweb: 'Built-in', agency: 'Extra cost', freelancer: 'Rarely' },
  { label: 'Hosting', roboweb: 'Included', agency: 'Separate', freelancer: 'Separate' },
];

const getTRUST = (lang: Lang) => lang === 'ru' ? [
  { icon: 'Star', value: '4.9', label: 'Средняя оценка' },
  { icon: 'Users', value: '3 200+', label: 'Активных клиентов' },
  { icon: 'Globe', value: '12 000+', label: 'Созданных сайтов' },
  { icon: 'Clock', value: '47 сек', label: 'Среднее время сборки' },
] : [
  { icon: 'Star', value: '4.9', label: 'Average rating' },
  { icon: 'Users', value: '3 200+', label: 'Active clients' },
  { icon: 'Globe', value: '12 000+', label: 'Websites created' },
  { icon: 'Clock', value: '47 sec', label: 'Average build time' },
];

const getSTEPS = (lang: Lang) => lang === 'ru' ? [
  { n: '01', title: 'Опишите задачу', text: 'Расскажите Roboweb, какой сайт нужен и для кого.' },
  { n: '02', title: 'AI создаёт сайт', text: 'Нейросеть собирает структуру, дизайн и тексты под вашу нишу.' },
  { n: '03', title: 'Правите в диалоге', text: 'Меняете что угодно простыми словами — без кода и дизайнеров.' },
  { n: '04', title: 'Публикуете онлайн', text: 'Один клик — сайт в сети, с доменом, SSL и хостингом.' },
] : [
  { n: '01', title: 'Describe your task', text: 'Tell Roboweb what kind of site you need and for whom.' },
  { n: '02', title: 'AI builds the site', text: 'The neural network assembles the structure, design and texts for your niche.' },
  { n: '03', title: 'Edit in dialog', text: 'Change anything with plain words — no code or designers needed.' },
  { n: '04', title: 'Publish online', text: 'One click — site is live, with domain, SSL and hosting.' },
];

const PORTFOLIO_ITEMS = [
  { tag: 'Строительство', title: 'asg-ts.ru',        url: 'https://asg-ts.ru/',        img: 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/466c9b8f-dd55-48c8-9fb7-d8a016540dc0.jpg' },
  { tag: 'Транспорт',     title: 'tc-atlas.ru',       url: 'https://tc-atlas.ru/',      img: 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/bb5a4eb9-7ed6-4c98-8e68-77b215c2436f.jpg' },
  { tag: 'Торговля',      title: 'westeast.biz',      url: 'https://westeast.biz/',     img: 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/1b82b392-3694-49c3-8016-8df9a0a824bd.jpg' },
  { tag: 'Строительство', title: 'weststroy.com',     url: 'https://weststroy.com/',    img: 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/5c30e3f6-1612-472c-95ea-3d77af1deaaa.jpg' },
  { tag: 'AI-агентство',  title: 'roboweb.team',      url: 'https://roboweb.team/',     img: 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/fd5a45b5-b204-4a03-912f-7916bc29cfe5.jpg' },
  { tag: 'Снабжение',     title: 'neurosnab.ru',      url: 'https://neurosnab.ru/',     img: 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/5308f193-617e-43c0-b0cd-e8deeb32a20d.jpg' },
  { tag: 'SaaS',          title: 'zaplan.io',         url: 'https://zaplan.io/',        img: 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/575f5b02-71f6-4759-9c82-3ae697c30347.jpg' },
  { tag: 'Недвижимость',  title: 'bunker-hously.ru',  url: 'https://bunker-hously.ru/', img: 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/c306854c-6390-4c86-a8ba-748686b9571e.jpg' },
];

const getPORTFOLIO = (_lang: Lang) => PORTFOLIO_ITEMS;

const getPLANS = (lang: Lang) => lang === 'ru' ? [
  { name: 'Пробный', badge: 'сейчас', price: 'Бесплатно', note: '', tag: '10 запросов разово', features: ['Без подключения домена','Без скачивания кода','Облачный хостинг','До 3 проектов','База данных 128 МБ','Хранилище 512 МБ','5 функций','8 ч вычислений'], cta: 'Начать бесплатно', hot: false },
  { name: 'Премиум', badge: 'популярный', price: '999 ₽', note: 'в месяц', tag: '40 запросов ежемесячно', features: ['Подключение домена','Бесплатные расширения','Облачный хостинг','До 3 проектов','База данных 128 МБ','Хранилище 512 МБ','5 функций','8 ч вычислений'], cta: 'Выбрать Премиум', hot: true },
  { name: 'Профи', badge: '', price: 'Выберите тариф', note: '', tag: '60 запросов ежемесячно', features: ['Приоритетная поддержка','Все возможности Премиум','Облачный хостинг','До 5 проектов','База данных 1 ГБ','Хранилище 5 ГБ','25 функций','250 ч вычислений'], cta: 'Обсудить тариф', hot: false },
] : [
  { name: 'Free', badge: 'now', price: 'Free', note: '', tag: '10 requests once', features: ['No custom domain','No code download','Cloud hosting','Up to 3 projects','128 MB database','512 MB storage','5 functions','8h compute'], cta: 'Start free', hot: false },
  { name: 'Premium', badge: 'popular', price: '999 ₽', note: 'per month', tag: '40 requests/month', features: ['Custom domain','Free extensions','Cloud hosting','Up to 3 projects','128 MB database','512 MB storage','5 functions','8h compute'], cta: 'Choose Premium', hot: true },
  { name: 'Pro', badge: '', price: 'Custom', note: '', tag: '60 requests/month', features: ['Priority support','All Premium features','Cloud hosting','Up to 5 projects','1 GB database','5 GB storage','25 functions','250h compute'], cta: 'Discuss plan', hot: false },
];

const getFAQ = (lang: Lang) => lang === 'ru' ? [
  { q: 'Может ли AI правда заменить фрилансера?', a: 'Да. Roboweb создаёт сайты уровня агентства, но в десятки раз быстрее и дешевле. Вы общаетесь словами, а нейросеть делает всю техническую работу.' },
  { q: 'Сколько времени занимает создание сайта?', a: 'Первая рабочая версия появляется за несколько минут. Доработки в диалоге занимают ещё столько же — вместо недель ожидания от исполнителей.' },
  { q: 'Нужно ли уметь программировать?', a: 'Нет. Достаточно описать идею обычным языком. Roboweb сам напишет код, подберёт дизайн и опубликует сайт.' },
  { q: 'Чем это лучше обычного конструктора?', a: 'Конструкторы требуют ручной сборки из шаблонов. Roboweb понимает вашу задачу и создаёт уникальный сайт под неё — без ограничений шаблонов.' },
  { q: 'Можно ли подключить свой домен?', a: 'Конечно. На платных тарифах вы подключаете собственный домен — SSL и хостинг настраиваются автоматически.' },
] : [
  { q: 'Can AI really replace a freelancer?', a: 'Yes. Roboweb builds agency-level websites, but dozens of times faster and cheaper. You communicate in plain language, and the neural network does all the technical work.' },
  { q: 'How long does it take to create a website?', a: 'The first working version appears in a few minutes. Dialog-based edits take just as long — instead of weeks of waiting from contractors.' },
  { q: 'Do I need to know how to code?', a: 'No. Just describe your idea in plain language. Roboweb will write the code, pick the design and publish the site.' },
  { q: 'How is this better than a regular website builder?', a: 'Builders require manual assembly from templates. Roboweb understands your task and creates a unique site for it — without template limitations.' },
  { q: 'Can I connect my own domain?', a: 'Of course. On paid plans you connect your own domain — SSL and hosting are configured automatically.' },
];

const getMARQUEE = (lang: Lang) => [...L.marquee[lang], ...L.marquee[lang]];

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
  const [lang, setLangState] = useState<Lang>(getLang());
  const [demoOpen, setDemoOpen] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleLangSwitch = (l: Lang) => {
    setLangState(l);
    setChatStep(0);
    setProgress(0);
    setWordIdx(0);
    setWordVisible(true);
  };

  // Derived data based on lang
  const NAV = getNAV(lang);
  const CHAT_STEPS = getCHAT_STEPS(lang);
  const FEATURES = getFEATURES(lang);
  const COMPARE = getCOMPARE(lang);
  const TRUST = getTRUST(lang);
  const STEPS = getSTEPS(lang);
  const PORTFOLIO = getPORTFOLIO(lang);
  const PLANS = getPLANS(lang);
  const FAQ = getFAQ(lang);
  const MARQUEE_ITEMS = getMARQUEE(lang);
  const typedWords = L.hero.words[lang] as unknown as string[];

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

  // Scroll chat container (not page) to bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatStep, isTyping]);

  // Blur fade word switcher
  useEffect(() => {
    const t = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % typedWords.length);
        setWordVisible(true);
      }, 500);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  // Lock scroll on mobile menu — используем position:fixed чтобы не дёргать overflow
  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">

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
            <LangSwitcher lang={lang} onSwitch={handleLangSwitch} />
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
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-3 px-4 rounded-xl font-medium hover:bg-secondary transition-colors">
                {n.label}
              </a>
            ))}
            <a href="/register" className="block">
              <Button className="w-full rounded-full font-semibold mt-4">{L.nav.create[lang]}</Button>
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
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
              <span
                key={`${wordIdx}-${lang}`}
                className="text-gradient inline-block"
                style={{
                  transition: 'opacity 0.45s ease, filter 0.45s ease, transform 0.45s ease',
                  opacity: wordVisible ? 1 : 0,
                  filter: wordVisible ? 'blur(0px)' : 'blur(12px)',
                  transform: wordVisible ? 'translateY(0)' : 'translateY(8px)',
                }}
              >
                {typedWords[wordIdx]}
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
                onClick={() => setDemoOpen(true)}>
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
              <svg
                viewBox="0 0 256 256"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full robo-bob drop-shadow-2xl"
              >
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

                {/* Glow behind — opacity only, no transform */}
                <circle cx="128" cy="160" r="70" fill="hsl(232,90%,58%)" opacity="0.10"/>
                <circle cx="128" cy="155" r="54" fill="hsl(232,90%,58%)" opacity="0.07"/>

                {/* Antenna */}
                <g className="antenna-sway">
                  <line x1="128" y1="72" x2="128" y2="52" stroke="hsl(232,90%,58%)" strokeWidth="3.5" strokeLinecap="round"/>
                  <circle cx="128" cy="46" r="7" fill="hsl(232,90%,58%)" opacity="0.9"/>
                  <circle cx="128" cy="46" r="4" fill="white"/>
                  {/* Pulse via opacity only — no r animate */}
                  <circle cx="128" cy="46" r="5" fill="hsl(232,90%,58%)">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite"/>
                  </circle>
                </g>

                {/* Body */}
                <rect x="72" y="72" width="112" height="120" rx="28" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
                <rect x="72" y="72" width="112" height="120" rx="28" fill="url(#bodyGrad)" opacity="0.5"/>

                {/* Scanline — clipped to body, transform only */}
                <rect x="72" y="72" width="112" height="4" fill="hsl(232,90%,58%)" opacity="0.25" clipPath="url(#bodyClip)" className="robo-scan"/>

                {/* Screen */}
                <rect x="86" y="88" width="84" height="72" rx="16" fill="hsl(224,47%,9%)" opacity="0.94"/>
                <rect x="86" y="88" width="84" height="72" rx="16" fill="url(#screenGrad)" opacity="0.3"/>

                {/* Eyes — scaleY blink */}
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

                {/* Mouth — static smile */}
                <path d="M 108 140 Q 128 152 148 140" stroke="hsl(88,70%,50%)" strokeWidth="3" strokeLinecap="round" fill="none"/>

                {/* Circuit lines */}
                <g opacity="0.6">
                  <path d="M 90 148 L 106 148 L 106 160 L 118 160" stroke="hsl(232,90%,58%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-1"/>
                  <path d="M 166 148 L 150 148 L 150 160 L 138 160" stroke="hsl(88,70%,50%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-2"/>
                  <path d="M 110 178 L 128 178 L 128 172 L 146 172" stroke="hsl(232,90%,58%)" strokeWidth="1.5" strokeLinecap="round" fill="none" className="circuit-3"/>
                </g>

                {/* Chest light — opacity only */}
                <circle cx="128" cy="178" r="6" fill="hsl(88,70%,50%)" opacity="0.9">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
                </circle>
                <circle cx="128" cy="178" r="3" fill="white" opacity="0.8"/>

                {/* Arms */}
                <rect x="48" y="96" width="26" height="56" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
                <rect x="182" y="96" width="26" height="56" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>

                {/* Legs */}
                <rect x="94" y="188" width="26" height="36" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>
                <rect x="136" y="188" width="26" height="36" rx="13" fill="white" stroke="hsl(220,18%,88%)" strokeWidth="1.5"/>

                {/* Feet */}
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

      {/* CTA 1 — между преимуществами и процессом */}
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
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.portfolio.label[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.portfolio.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.portfolio.desc[lang]}
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {PORTFOLIO.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                  <div className="relative h-44 sm:h-52 overflow-hidden bg-muted">
                    <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Icon name="ExternalLink" size={12} /> Открыть сайт
                    </span>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-display font-bold text-base md:text-lg text-primary">{p.title}</h3>
                    <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{p.tag}</span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
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
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.stars }).map((_, si) => (
                      <Icon key={si} name="Star" size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  {/* Text */}
                  <p className="text-sm md:text-base text-foreground leading-relaxed flex-1">
                    «{r.text}»
                  </p>
                  {/* Author */}
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

          {/* Summary rating */}
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

      {/* CTA 2 — после портфолио */}
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
                  p.hot
                    ? 'border-primary bg-card shadow-2xl shadow-primary/15'
                    : 'border-border bg-card'
                }`}>
                  {p.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold whitespace-nowrap ${
                      p.hot
                        ? 'bg-primary text-primary-foreground animate-glow'
                        : 'bg-secondary text-muted-foreground border border-border'
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

          {/* CTA 4 — под FAQ */}
          <Reveal>
            <div className="mt-12 rounded-2xl md:rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
              <Icon name="MessageCircle" size={32} className="text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl sm:text-2xl mb-2">{L.faq.ctaTitle[lang]}</h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-5">
                {L.faq.ctaDesc[lang]}
              </p>
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
              {L.footer.desc[lang]}
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.nav[lang]}</h4>
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

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} lang={lang} />
    </div>
  );
};

export default Index;