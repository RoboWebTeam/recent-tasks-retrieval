import type { Lang } from '@/lib/i18n';
import { apiUrl } from '@/lib/apiConfig';

export const L = {
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
    badge:  { ru: 'ИИ-разработчик, а не конструктор сайтов', en: 'AI developer, not a website builder' },
    title:  { ru: 'Твой', en: 'Your' },
    words:  { ru: ['Твоя ИИ-команда разработки','Сайт, который работает','Приложение из одного промпта','Код Next.js — в твой GitHub','Фуллстек за минуты, не недели'], en: ['Your AI dev team','A site that actually works','An app from one prompt','Next.js code in your GitHub','Fullstack in minutes, not weeks'] },
    desc:   { ru: 'RoboWeb — не конструктор лендингов, а ИИ-разработчик. Опишите идею по-русски — получите настоящий фуллстек-сайт: формы пишут в базу, живой каталог, корзина, оформление заказа и личные кабинеты. А когда нужно — заберите готовый код на Next.js + Prisma прямо в свой GitHub. Для бизнеса, фрилансеров и разработчиков.', en: 'RoboWeb is not a landing-page builder — it\'s an AI developer. Describe your idea and get a real fullstack site: forms that save to a database, a live catalog, cart, checkout and user accounts. And when you need it, export the whole thing as Next.js + Prisma code straight to your GitHub. For businesses, freelancers and developers.' },
    cta:    { ru: 'Собрать проект бесплатно', en: 'Build your project free' },
    demo:   { ru: 'Смотреть демо', en: 'Watch demo' },
    stat1l: { ru: 'средняя сборка', en: 'avg build time' },
    stat2l: { ru: 'генераций сайтов', en: 'sites generated' },
    stat3l: { ru: 'дешевле студии', en: 'cheaper than a studio' },
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
    label: { ru: 'Возможности ИИ', en: 'AI Capabilities' },
    title: { ru: 'Что может сделать ИИ', en: 'What AI can build' },
    desc:  { ru: 'Любой тип сайта — от лендинга до интернет-магазина. Просто опишите идею. Вы увидите как ваш личный разработчик будет выполнять все быстро и безукоризненно!', en: 'Any type of website — from landing to online store. Just describe your idea. Watch your personal developer build everything fast and flawlessly!' },
  },
  compare: {
    label: { ru: 'Сравнение', en: 'Comparison' },
    title: { ru: 'Зачем платить больше, если результат хуже?', en: 'Why pay more and get less?' },
    desc:  { ru: 'Roboweb делает то же самое — только в 30 раз быстрее и в 10 раз дешевле. Судите сами.', en: 'Roboweb does the same — 30× faster and 10× cheaper. Judge for yourself.' },
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

export const ROBO_IMG =
  'https://s3-nl.hostkey.com/robo/demo/2704f2a7-0e24-4881-a393-b234ab436538.jpg';

export const SEND_EMAIL_URL = apiUrl('send-email');

export const getNAV = (lang: Lang) => [
  { label: L.nav.features[lang], href: '#features' },
  { label: L.nav.process[lang],  href: '#process' },
  { label: L.nav.portfolio[lang],href: '#portfolio' },
  { label: L.nav.pricing[lang],  href: '#pricing' },
  { label: L.nav.faq[lang],      href: '#faq' },
  { label: lang === 'ru' ? 'Блог' : 'Blog', href: '/blog' },
  { label: lang === 'ru' ? 'Тарифы' : 'Pricing', href: '/pricing' },
];

export const getCHAT_STEPS = (lang: Lang) => lang === 'ru' ? [
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

export const getFEATURES = (lang: Lang) => lang === 'ru' ? [
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

export const getCOMPARE = (lang: Lang) => lang === 'ru' ? [
  { label: 'Стоимость', roboweb: 'от 0 ₽', agency: 'от 80 000 ₽', freelancer: 'от 15 000 ₽' },
  { label: 'Срок', roboweb: 'Минуты', agency: '3–6 недель', freelancer: '1–3 недели' },
  { label: 'Рабочий бэкенд: формы, каталог, корзина', roboweb: 'Из коробки', agency: 'Отдельно, дорого', freelancer: 'Зависит' },
  { label: 'Код проекта на вынос (Next.js в GitHub)', roboweb: 'Да', agency: 'За доплату', freelancer: 'Редко' },
  { label: 'Правки', roboweb: 'Мгновенно, в диалоге', agency: 'Долго и дорого', freelancer: 'По договору' },
  { label: 'Хостинг + SSL', roboweb: 'Включён', agency: 'Отдельно', freelancer: 'Отдельно' },
] : [
  { label: 'Cost', roboweb: 'from $0', agency: 'from $1000', freelancer: 'from $200' },
  { label: 'Timeline', roboweb: 'Minutes', agency: '3–6 weeks', freelancer: '1–3 weeks' },
  { label: 'Real backend: forms, catalog, cart', roboweb: 'Out of the box', agency: 'Extra, costly', freelancer: 'Depends' },
  { label: 'Own the code (Next.js to GitHub)', roboweb: 'Yes', agency: 'Extra cost', freelancer: 'Rarely' },
  { label: 'Revisions', roboweb: 'Instant, in chat', agency: 'Slow & costly', freelancer: 'By contract' },
  { label: 'Hosting + SSL', roboweb: 'Included', agency: 'Separate', freelancer: 'Separate' },
];

export const getTRUST = (lang: Lang) => lang === 'ru' ? [
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

export const getSTEPS = (lang: Lang) => lang === 'ru' ? [
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

// Данные портфолио (63 демо-сайта) вынесены в отдельный чанк portfolioData.ts,
// который подгружается асинхронно на главной странице — см. IndexSectionsMiddle.tsx.

export const getPLANS = (lang: Lang) => lang === 'ru' ? [
  { name: 'Пробный', badge: 'сейчас', price: 'Бесплатно', note: '', tag: '10 генераций разово', features: ['Фуллстек: формы в базу, каталог','Серверные функции','Публикация по ссылке','До 3 проектов','Облачный хостинг + SSL','Без своего домена','Без экспорта кода'], cta: 'Начать бесплатно', hot: false },
  { name: 'Премиум', badge: 'популярный', price: '990 ₽', note: 'в месяц', tag: '40 генераций ежемесячно', features: ['Свой домен, без бейджа','Фуллстек-бэкенд: заявки, каталог, корзина, кабинеты','Экспорт кода Next.js + Prisma в GitHub','Публикация в GitHub Pages','Серверные функции и оформление заказа','Приоритетная сборка'], cta: 'Выбрать Премиум', hot: true },
] : [
  { name: 'Free', badge: 'now', price: 'Free', note: '', tag: '10 generations once', features: ['Fullstack: forms to DB, catalog','Server functions','Publish via link','Up to 3 projects','Cloud hosting + SSL','No custom domain','No code export'], cta: 'Start free', hot: false },
  { name: 'Premium', badge: 'popular', price: '990 ₽', note: 'per month', tag: '40 generations/month', features: ['Custom domain, no badge','Fullstack backend: leads, catalog, cart, accounts','Export Next.js + Prisma code to GitHub','Publish to GitHub Pages','Server functions & checkout','Priority build'], cta: 'Choose Premium', hot: true },
];

export const getFAQ = (lang: Lang) => lang === 'ru' ? [
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

export const getMARQUEE = (lang: Lang) => [...L.marquee[lang], ...L.marquee[lang]];