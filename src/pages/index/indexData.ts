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
    create:   { ru: 'Собрать проект', en: 'Build project' },
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
    title: { ru: "Не конструктор, а ИИ-разработчик", en: "Not a builder — an AI developer" },
    desc:  { ru: "RoboWeb собирает настоящий фуллстек из вашего описания: рабочий бэкенд, база данных, корзина и кабинеты — и отдаёт код на Next.js + Prisma в ваш GitHub. Ниже — что это даёт бизнесу, фрилансерам и разработчикам.", en: "RoboWeb builds a real full-stack from your description: a working backend, a database, cart and accounts — and hands you Next.js + Prisma code in your GitHub. Here's what that means for businesses, freelancers and developers." },
  },
  cta1: {
    label: { ru: "Готовы начать?", en: "Ready to start?" },
    title: { ru: "Соберите первый фуллстек-сайт", en: "Build your first full-stack site" },
    accent:{ ru: "бесплатно", en: "free" },
    desc:  { ru: "Опишите идею по-русски — получите работающий сайт с бэкендом и доступ к экспорту кода. Карту привязывать не нужно.", en: "Describe your idea in plain words — get a working site with a backend and access to code export. No card required." },
    btn:   { ru: "Получить доступ", en: "Get access" },
    input: { ru: "Ваш e-mail для доступа", en: "Your e-mail for access" },
  },
  process: {
    label: { ru: 'Как это работает', en: 'How it works' },
    title: { ru: '4 шага до рабочего продукта', en: '4 steps to a working product' },
  },
  portfolio: {
    label: { ru: "Что собирает ИИ", en: "What the AI builds" },
    title: { ru: "Фуллстек-приложения, а не визитки", en: "Full-stack apps, not business cards" },
    desc:  { ru: "От сайта услуг с заявками в базу до интернет-магазина с корзиной, оформлением заказа и кабинетами. Каждый проект — с рабочим бэкендом и кодом на Next.js + Prisma, который можно забрать в свой GitHub.", en: "From a service site with leads in a database to an online store with cart, checkout and accounts. Every project ships with a real backend and Next.js + Prisma code you can take to your GitHub." },
  },
  compare: {
    label: { ru: 'Сравнение', en: 'Comparison' },
    title: { ru: "Картинка в чужой платформе — или продукт с вашим кодом", en: "A picture in someone's platform — or a product with your code" },
    desc:  { ru: "Конструктор отдаёт красивую страницу и запирает вас внутри. RoboWeb собирает рабочий бэкенд — заявки, каталог и заказы в базе, кабинеты — и весь проект на Next.js + Prisma выгружается в ваш GitHub. Продукт, которым вы владеете.", en: "A builder hands you a nice page and locks you inside. RoboWeb ships a working backend — leads, catalog and orders in a database, accounts — and the whole Next.js + Prisma project exports to your GitHub. A product you own." },
  },
  cta2: {
    badge: { ru: "Первый фуллстек-сайт — бесплатно", en: "First full-stack site — free" },
    title: { ru: "Сайт, который работает, а не просто выглядит", en: "A site that works, not just looks good" },
    desc:  { ru: "Формы в базу, каталог, корзина, кабинеты — и код на Next.js в вашем GitHub. Соберите рабочий продукт сегодня, а не макет на согласование.", en: "Forms to a database, catalog, cart, accounts — and Next.js code in your GitHub. Build a working product today, not a mockup to approve." },
    btn:   { ru: "Собрать проект сейчас", en: "Build project now" },
    phone: { ru: "Написать в Telegram", en: "Message on Telegram" },
  },
  pricing: {
    label: { ru: 'Тарифы', en: 'Pricing' },
    title: { ru: "Платите за рабочий продукт и его код", en: "Pay for a working product and its code" },
    desc:  { ru: "Прозрачные тарифы за готовое фуллстек-приложение с бэкендом и правом выгрузить код в свой GitHub. Без скрытых часов и бесконечных правок.", en: "Transparent plans for a finished full-stack app with a backend and the right to export the code to your GitHub. No hidden hours, no endless revisions." },
    popular:{ ru: '✦ Популярный', en: '✦ Popular' },
  },
  cta3: {
    badge: { ru: "Бесплатно для первых 100 клиентов", en: "Free for the first 100 clients" },
    title: { ru: "Запустите работающий сайт сегодня", en: "Launch a working site today" },
    desc:  { ru: "Оставьте e-mail и опишите проект — ИИ соберёт фуллстек с бэкендом, а код вы сможете забрать в свой GitHub.", en: "Leave your e-mail and describe the project — the AI builds a full-stack with a backend, and you can take the code to your GitHub." },
    btn:   { ru: "Начать бесплатно", en: "Start free" },
    input: { ru: "Ваш e-mail", en: "Your e-mail" },
    privacy:{ ru: "Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности.", en: "By clicking, you agree to the privacy policy." },
    success:{ ru: 'Заявка принята! Мы свяжемся с вами.', en: 'Request received! We\'ll get in touch.' },
    error:  { ru: 'Ошибка отправки. Попробуйте ещё раз.', en: 'Send error. Please try again.' },
  },
  faq: {
    label: { ru: 'FAQ', en: 'FAQ' },
    title: { ru: 'Частые вопросы', en: 'Frequently asked questions' },
    ctaTitle:{ ru: "Остались вопросы?", en: "Still have questions?" },
    ctaDesc: { ru: "Напишите нам в Telegram — расскажем про бэкенд, кабинеты и выгрузку кода на вашем примере. Ответим в течение 15 минут.", en: "Message us on Telegram — we'll walk through the backend, accounts and code export on your own example. We reply within 15 minutes." },
    mail:    { ru: 'Написать на почту', en: 'Email us' },
    tg:      { ru: 'Написать в Telegram', en: 'Write in Telegram' },
  },
  footer: {
    nav:     { ru: 'Навигация', en: 'Navigation' },
    contacts:{ ru: 'Контакты', en: 'Contacts' },
    social:  { ru: 'Мы в сети', en: 'Follow us' },
    desc:    { ru: "ИИ-разработчик фуллстек-сайтов: из вашего описания собирает рабочий продукт с базой, формами, корзиной и кабинетами — и отдаёт код на Next.js + Prisma в ваш GitHub.", en: "An AI developer for full-stack sites: turns your description into a working product with a database, forms, cart and accounts — and hands you Next.js + Prisma code in your GitHub." },
    copy:    { ru: 'Создано с помощью искусственного интеллекта.', en: 'Built with artificial intelligence.' },
  },
  marquee: { ru: ["✦ Магазины с корзиной", "✦ Сайты услуг с заявками в базу", "✦ Каталоги на базе данных", "✦ Личные кабинеты", "✦ Оформление заказа", "✦ Онлайн-запись и бронирование", "✦ Каркасы на Next.js + Prisma", "✦ Выгрузка кода в GitHub"], en: ["✦ Stores with a cart", "✦ Service sites with leads in a DB", "✦ Database-driven catalogs", "✦ User accounts", "✦ Checkout flow", "✦ Online booking", "✦ Next.js + Prisma scaffolds", "✦ Code export to GitHub"] },
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
  { icon: "MessageSquare", title: "Описываете на русском", text: "Расскажите идею словами — ИИ проектирует страницы, данные и серверную логику и собирает готовое приложение, а не макет." },
  { icon: "Zap", title: "Каркас за минуту — разработчику", text: "Next.js, Prisma, аккаунты и корзина собраны за минуту. Забираете код и допиливаете свою логику сами." },
  { icon: "Wallet", title: "Код клиенту — фрилансеру и студии", text: "Собираете клиенту рабочий сайт с бэкендом и отдаёте код в его репозиторий. Фикс-цена вместо бесконечных часов." },
  { icon: "Sparkles", title: "Код на вынос", text: "Готовый проект на Next.js + Prisma экспортируется в ваш GitHub. Настоящий код, а не вечная аренда платформы." },
  { icon: "Layers", title: "Настоящий бэкенд", text: "Формы пишут в базу данных, каталог живой, корзина и оформление заказа работают по-настоящему. Данные под контролем." },
  { icon: "ShieldCheck", title: "Личные кабинеты", text: "Регистрация, вход и аккаунты клиентов из коробки — рабочая авторизация, а не бутафория. Клиенты видят свои заказы." },
  { icon: "BarChart2", title: "Заявки и заказы приходят", text: "Каждая заявка и заказ сохраняются в базе и видны в панели. Сайт приносит клиентов, а не просто выглядит." },
  { icon: "RefreshCw", title: "Правки в диалоге", text: "Меняете логику, тексты и дизайн словами — ИИ переписывает и данные, и интерфейс, не ломая проект." },
  { icon: "Globe", title: "Публикация в 1 клик", text: "Хостинг, SSL и домен настраиваются сами. Работающий сайт с бэкендом сразу онлайн — без настройки серверов." },
  { icon: "Search", title: "SEO из коробки", text: "Чистая разметка, метатеги и скорость Next.js настроены под Google и Яндекс — продукт находят, а не только показывают." },
  { icon: "Smartphone", title: "Адаптивность", text: "Каталог, корзина и кабинеты одинаково удобны на телефоне, планшете и десктопе — автоматически." },
  { icon: "HeadphonesIcon", title: "Живая поддержка", text: "Команда в Telegram помогает с бэкендом, экспортом кода и доменом на любом этапе. Среднее время ответа — 15 минут." },
] : [
  { icon: "MessageSquare", title: "Describe it in plain words", text: "Tell the AI your idea — it designs the pages, data and server logic and builds a working app, not a mockup." },
  { icon: "Zap", title: "A scaffold in a minute — for devs", text: "Next.js, Prisma, accounts and cart assembled in a minute. Take the code and add your own logic yourself." },
  { icon: "Wallet", title: "Client code — for freelancers & studios", text: "Build a client a working site with a backend and hand the code to their repo. A fixed price instead of endless hours." },
  { icon: "Sparkles", title: "Code you can take", text: "The finished Next.js + Prisma project exports to your GitHub. Real code, not a platform you rent forever." },
  { icon: "Layers", title: "A real backend", text: "Forms write to a database, the catalog is live, cart and checkout truly work. Your data, under control." },
  { icon: "ShieldCheck", title: "User accounts", text: "Sign-up, login and customer accounts out of the box — real auth, not a mockup. Clients see their own orders." },
  { icon: "BarChart2", title: "Leads and orders land", text: "Every lead and order is saved in the database and visible in a dashboard. The site brings clients, not just looks." },
  { icon: "RefreshCw", title: "Edits in dialog", text: "Change logic, copy and design in words — the AI rewrites both data and UI without breaking the project." },
  { icon: "Globe", title: "One-click publishing", text: "Hosting, SSL and domain configure themselves. A working site with a backend goes live at once — no server setup." },
  { icon: "Search", title: "SEO out of the box", text: "Clean markup, meta tags and Next.js speed tuned for Google and Yandex — built to rank, not just to show." },
  { icon: "Smartphone", title: "Responsive everywhere", text: "Catalog, cart and accounts work the same on phone, tablet and desktop — automatically." },
  { icon: "HeadphonesIcon", title: "Live support", text: "The team in Telegram helps with the backend, code export and domain at any stage. Average response time — 15 minutes." },
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
  { icon: 'Globe', value: '12 000+', label: 'Собранных проектов' },
  { icon: 'Clock', value: '47 сек', label: 'Среднее время сборки' },
] : [
  { icon: 'Star', value: '4.9', label: 'Average rating' },
  { icon: 'Users', value: '3 200+', label: 'Active clients' },
  { icon: 'Globe', value: '12 000+', label: 'Projects built' },
  { icon: 'Clock', value: '47 sec', label: 'Average build time' },
];

export const getSTEPS = (lang: Lang) => lang === 'ru' ? [
  { n: "01", title: "Опишите продукт", text: "Расскажите по-русски, что должен делать сайт: каталог, заявки, корзина, кабинеты. ИИ уточнит детали." },
  { n: "02", title: "ИИ собирает фуллстек", text: "За минуты появляется рабочее приложение: фронтенд, база данных, формы, корзина и оформление заказа." },
  { n: "03", title: "Правите в диалоге", text: "Меняете дизайн и логику словами и сразу видите результат в живом приложении — без кода и разработчика." },
  { n: "04", title: "Публикуете или забираете код", text: "Один клик — продукт онлайн с доменом и SSL. Или экспортируете проект на Next.js + Prisma в свой GitHub." },
] : [
  { n: "01", title: "Describe the product", text: "Say in plain words what the site should do: catalog, leads, cart, accounts. The AI clarifies the details." },
  { n: "02", title: "AI builds the full-stack", text: "In minutes a working app appears: frontend, database, forms, cart and checkout." },
  { n: "03", title: "Refine in chat", text: "Change design and logic in words and see it live in the running app — no code, no developer needed." },
  { n: "04", title: "Publish or export the code", text: "One click and the product is live with domain and SSL. Or export the Next.js + Prisma project to your GitHub." },
];

// Данные портфолио (63 демо-сайта) вынесены в отдельный чанк portfolioData.ts,
// который подгружается асинхронно на главной странице — см. IndexSectionsMiddle.tsx.

export const getPLANS = (lang: Lang) => lang === 'ru' ? [
  { name: 'Пробный', badge: 'сейчас', price: 'Бесплатно', note: '', tag: '10 генераций разово', features: ['Фуллстек: формы в базу, каталог','Серверные функции','Публикация по ссылке','До 3 проектов','Облачный хостинг + SSL','Без своего домена','Без экспорта кода'], cta: 'Начать бесплатно', hot: false },
  { name: 'Премиум', badge: 'популярный', price: '990 ₽', note: 'в месяц', tag: '30 генераций ежемесячно', features: ['Свой домен, без бейджа','Фуллстек-бэкенд: заявки, каталог, корзина, кабинеты','Экспорт кода Next.js + Prisma в GitHub','Публикация в GitHub Pages','Серверные функции и оформление заказа','Приоритетная сборка'], cta: 'Выбрать Премиум', hot: true },
] : [
  { name: 'Free', badge: 'now', price: 'Free', note: '', tag: '10 generations once', features: ['Fullstack: forms to DB, catalog','Server functions','Publish via link','Up to 3 projects','Cloud hosting + SSL','No custom domain','No code export'], cta: 'Start free', hot: false },
  { name: 'Premium', badge: 'popular', price: '990 ₽', note: 'per month', tag: '30 generations/month', features: ['Custom domain, no badge','Fullstack backend: leads, catalog, cart, accounts','Export Next.js + Prisma code to GitHub','Publish to GitHub Pages','Server functions & checkout','Priority build'], cta: 'Choose Premium', hot: true },
];

export const getFAQ = (lang: Lang) => lang === 'ru' ? [
  { q: "Это очередной конструктор сайтов?", a: "Нет. Конструктор отдаёт вёрстку, запертую внутри платформы. RoboWeb — это ИИ-разработчик: он собирает фуллстек с базой данных, формами, корзиной и кабинетами, а готовый проект на Next.js + Prisma можно выгрузить в свой GitHub." },
  { q: "У сайта правда рабочий бэкенд, а не красивая страница?", a: "Да. Заявки пишутся в настоящую базу данных, каталог живой, корзина и оформление заказа работают, у посетителей есть личные кабинеты. Это приложение, которое реально принимает заявки и заказы — всё видно в панели проекта." },
  { q: "Смогу ли я забрать код проекта себе?", a: "Да, это ключевое отличие. Готовый проект выгружается как настоящий код на Next.js + Prisma в ваш GitHub — с фронтендом, бэкендом, схемой базы и аккаунтами. Вы не заперты в платформе: дорабатывайте и хостите где угодно." },
  { q: "Нужно ли уметь программировать?", a: "Чтобы получить рабочий сайт — нет: достаточно описать продукт по-русски, ИИ соберёт фуллстек сам. А если вы разработчик, забираете готовый каркас на Next.js + Prisma с аккаунтами и корзиной за минуту и допиливаете код руками." },
  { q: "Подходит ли это фрилансерам и студиям?", a: "Да, это одна из наших ключевых аудиторий. Собирайте клиенту рабочий сайт с бэкендом за час и отдавайте код в его репозиторий — берите фикс-цену вместо бесконечных часов. RoboWeb ускоряет вас, а не заменяет." },
  { q: "Можно ли подключить свой домен?", a: "Да. На платных тарифах свой домен, SSL и хостинг подключаются автоматически при публикации. А если вы выгрузили код на Next.js + Prisma — разворачивайте проект где угодно, вы владеете им полностью." },
] : [
  { q: "Is this just another site builder?", a: "No. A builder gives you markup locked inside its platform. RoboWeb is an AI developer: it assembles a full-stack with a database, forms, cart and accounts, and the finished Next.js + Prisma project exports to your own GitHub." },
  { q: "Does the site really have a working backend, not just a pretty page?", a: "Yes. Leads are written to a real database, the catalog is live, cart and checkout work, and visitors get personal accounts. It's an app that genuinely takes leads and orders — all visible in the project dashboard." },
  { q: "Can I take the project's code with me?", a: "Yes, that's the key difference. The finished project exports as real Next.js + Prisma code to your GitHub — frontend, backend, database schema and accounts. You're not locked into the platform: extend and host it anywhere." },
  { q: "Do I need to know how to code?", a: "To get a working site — no: just describe the product in plain words and the AI builds the full-stack. And if you're a developer, take the ready Next.js + Prisma scaffold with accounts and cart in a minute and finish the code by hand." },
  { q: "Is it good for freelancers and studios?", a: "Yes, that's one of our core audiences. Build a client a working, backend-powered site in an hour and hand over the code to their repo — charge a fixed price instead of endless hours. RoboWeb speeds you up, it doesn't replace you." },
  { q: "Can I connect my own domain?", a: "Yes. On paid plans your own domain, SSL and hosting connect automatically on publish. And once you've exported the Next.js + Prisma code, deploy the project anywhere — you fully own it." },
];

export const getMARQUEE = (lang: Lang) => [...L.marquee[lang], ...L.marquee[lang]];