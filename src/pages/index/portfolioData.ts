import type { Lang } from '@/lib/i18n';
import type { DemoCategory } from './portfolioCategories';

export interface DemoItem {
  tag: string;
  title: string;
  prompt: string;
  img: string;
  color: string;
  category: DemoCategory;
}

// Премиум бизнес-решения. Превью — реальные мокапы интерфейсов (public/demo/*.jpg),
// собранные под каждый тип продукта: магазины, маркетплейсы, порталы, дашборды, лендинги.
const DEMO_ITEMS_RU: DemoItem[] = [
  { category: 'ecommerce', tag: 'B2B-маркетплейс',    title: 'Портал оптовых закупок',            prompt: 'Собери B2B-маркетплейс снабжения: каталог на 700 000 товаров, карточки поставщиков, фильтры, рейтинги и корзину-заявку', img: '/demo/marketplace.jpg',  color: 'from-indigo-500 to-blue-600' },
  { category: 'ecommerce', tag: 'Интернет-магазин',   title: 'Магазин электроники',               prompt: 'Создай премиум интернет-магазин электроники: витрина флагмана, каталог, фильтры, рассрочка и корзина', img: '/demo/ecommerce.jpg',    color: 'from-blue-600 to-slate-800' },
  { category: 'ecommerce', tag: 'Fashion-ритейл',     title: 'Онлайн-бутик одежды',               prompt: 'Сделай элегантный fashion-бутик: лукбук, коллекции, карточки товаров с размерами и корзина', img: '/demo/fashion.jpg',      color: 'from-amber-300 to-stone-500' },
  { category: 'portal',    tag: 'Портал недвижимости', title: 'Поиск квартир на карте',            prompt: 'Создай портал недвижимости: объявления, поиск по фильтрам и интерактивная карта с ценами', img: '/demo/realty.jpg',       color: 'from-emerald-500 to-teal-600' },
  { category: 'portal',    tag: 'Образование',         title: 'Платформа онлайн-обучения',         prompt: 'Собери образовательную платформу (LMS): курсы, видеоуроки, прогресс, тесты и сертификаты', img: '/demo/lms.jpg',          color: 'from-amber-500 to-orange-600' },
  { category: 'portal',    tag: 'Логистика',           title: 'Управление доставками (TMS)',       prompt: 'Создай систему логистики: отправления, статусы, ETA, карта маршрутов и таймлайн доставки', img: '/demo/logistics.jpg',    color: 'from-teal-600 to-cyan-700' },
  { category: 'portal',    tag: 'Медицина',            title: 'Онлайн-запись в клинику',           prompt: 'Сделай медицинскую платформу записи: врачи, специализации, календарь свободных слотов и оформление приёма', img: '/demo/medical.jpg',      color: 'from-emerald-500 to-green-600' },
  { category: 'saas',      tag: 'Финтех',              title: 'Дашборд необанка',                  prompt: 'Создай финтех-дашборд: баланс, карты, переводы, график трат и лента операций', img: '/demo/fintech.jpg',      color: 'from-violet-600 to-indigo-700' },
  { category: 'saas',      tag: 'CRM',                 title: 'CRM для отдела продаж',             prompt: 'Собери CRM: воронка продаж канбаном, сделки, контакты, задачи и аналитика по менеджерам', img: '/demo/crm.jpg',          color: 'from-sky-500 to-blue-700' },
  { category: 'saas',      tag: 'BI-аналитика',        title: 'Дашборд бизнес-аналитики',          prompt: 'Создай BI-дашборд: KPI, график выручки, воронка каналов, топ-товары и выручка по регионам', img: '/demo/analytics.jpg',    color: 'from-cyan-500 to-blue-600' },
  { category: 'landing',   tag: 'SaaS-лендинг',        title: 'Лендинг SaaS-продукта',             prompt: 'Сделай премиум-лендинг SaaS-сервиса: сильный герой, превью продукта, тарифы и форма регистрации', img: '/demo/saas-landing.jpg', color: 'from-indigo-600 to-violet-700' },
  { category: 'landing',   tag: 'Лендинг',             title: 'Лендинг сервиса автоматизации',     prompt: 'Создай эффектный лендинг сервиса автоматизации: неоновый герой, поле запроса и блоки возможностей', img: '/demo/ai-landing.jpg',   color: 'from-fuchsia-600 to-violet-800' },
];

const EN_TAGS = [
  'B2B marketplace', 'Online store', 'Fashion retail', 'Real estate portal', 'Education',
  'Logistics', 'Healthcare', 'Fintech', 'CRM', 'BI analytics', 'SaaS landing', 'Landing',
];
const EN_TITLES = [
  'Wholesale procurement portal', 'Electronics store', 'Online fashion boutique', 'Property search on a map',
  'Online learning platform', 'Delivery management (TMS)', 'Clinic online booking', 'Neobank dashboard',
  'Sales CRM', 'Business analytics dashboard', 'SaaS product landing', 'Automation service landing',
];
const EN_PROMPTS = [
  'Build a B2B procurement marketplace: a 700,000-product catalog, supplier cards, filters, ratings and a quote cart',
  'Create a premium electronics store: a flagship showcase, catalog, filters, installments and cart',
  'Build an elegant fashion boutique: a lookbook, collections, product cards with sizes and a cart',
  'Create a real estate portal: listings, filter search and an interactive map with prices',
  'Build an online learning platform (LMS): courses, video lessons, progress, quizzes and certificates',
  'Create a logistics system: shipments, statuses, ETA, a route map and a delivery timeline',
  'Build a healthcare booking platform: doctors, specialties, a calendar of free slots and appointment checkout',
  'Create a fintech dashboard: balance, cards, transfers, a spending chart and a transactions feed',
  'Build a CRM: a kanban sales pipeline, deals, contacts, tasks and per-manager analytics',
  'Create a BI dashboard: KPIs, a revenue chart, a channel funnel, top products and revenue by region',
  'Build a premium SaaS landing: a strong hero, a product preview, pricing and a sign-up form',
  'Create a striking automation-service landing: a neon hero, a prompt field and feature blocks',
];

const DEMO_ITEMS_EN: DemoItem[] = DEMO_ITEMS_RU.map((item, i) => ({
  ...item,
  tag: EN_TAGS[i] ?? item.tag,
  title: EN_TITLES[i] ?? item.title,
  prompt: EN_PROMPTS[i] ?? item.prompt,
}));

export const getPORTFOLIO = (lang: Lang) => lang === 'ru' ? DEMO_ITEMS_RU : DEMO_ITEMS_EN;
