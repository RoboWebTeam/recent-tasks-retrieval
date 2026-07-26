/** Классы продуктов и готовые бизнес-примеры для стартового экрана редактора.
 *
 *  Список намеренно повторяет портфолио с лендинга: клиенту обещают магазины, порталы и рабочие
 *  панели — значит ровно это он должен находить в редакторе первым же экраном, одним кликом.
 *  Промпты написаны развёрнуто (экраны, корзина, фильтры, кабинет, таблицы) — от них зависит,
 *  соберёт ИИ многоэкранное приложение или очередной одностраничник. */

export type ProductType = 'landing' | 'store' | 'portal' | 'saas';

interface Loc { ru: string; en: string }

export const PRODUCT_TYPES: { id: ProductType; icon: string; label: Loc; hint: Loc }[] = [
  {
    id: 'landing', icon: 'Layout',
    label: { ru: 'Лендинг', en: 'Landing' },
    hint: { ru: 'Одна страница, которая продаёт', en: 'One page that sells' },
  },
  {
    id: 'store', icon: 'ShoppingCart',
    label: { ru: 'Магазин', en: 'Store' },
    hint: { ru: 'Каталог, корзина, заказы', en: 'Catalog, cart, orders' },
  },
  {
    id: 'portal', icon: 'Globe',
    label: { ru: 'Портал', en: 'Portal' },
    hint: { ru: 'Объявления, поиск, кабинет', en: 'Listings, search, accounts' },
  },
  {
    id: 'saas', icon: 'LayoutDashboard',
    label: { ru: 'Рабочая панель', en: 'Dashboard' },
    hint: { ru: 'Таблицы, KPI, доступы', en: 'Tables, KPIs, access' },
  },
];

export interface BuilderTemplate {
  type: ProductType;
  icon: string;
  title: Loc;
  sub: Loc;
  prompt: Loc;
  /** Мокап из портфолио на лендинге. Есть не у всех примеров — витрина показывает только те,
   *  у которых он есть, чтобы клиент видел ровно те работы, что обещаны на главной. */
  img?: string;
}

export const BUILDER_TEMPLATES: BuilderTemplate[] = [
  // ── Магазины ────────────────────────────────────────────────────────────────
  {
    type: 'store', icon: 'Store',
    title: { ru: 'Интернет-магазин', en: 'Online store' },
    img: '/demo/ecommerce.jpg',
    sub: { ru: 'Витрина, фильтры, корзина, заказы', en: 'Showcase, filters, cart, orders' },
    prompt: {
      ru: 'Собери интернет-магазин: витрина с хитами продаж, каталог с фильтрами по категории и цене, поиск, карточка товара с галереей и характеристиками, корзина с подсчётом суммы и доставки, оформление заказа и личный кабинет с историей заказов. Товары храни в базе, заказы — приватно у каждого покупателя.',
      en: 'Build an online store: a bestsellers showcase, a catalog with category and price filters, search, a product page with a gallery and specs, a cart with totals and delivery, checkout and an account with order history. Keep products in the database and orders private per customer.',
    },
  },
  {
    type: 'store', icon: 'Network',
    title: { ru: 'B2B-маркетплейс', en: 'B2B marketplace' },
    img: '/demo/marketplace.jpg',
    sub: { ru: 'Поставщики, прайсы, заявки', en: 'Suppliers, price lists, quotes' },
    prompt: {
      ru: 'Собери B2B-маркетплейс снабжения: большой каталог с категориями и фильтрами, карточки поставщиков с рейтингом, сравнение цен по позиции, корзина-заявка на коммерческое предложение, кабинет закупщика со статусами заявок. Заявки видит только их автор.',
      en: 'Build a B2B procurement marketplace: a large catalog with categories and filters, supplier cards with ratings, per-item price comparison, a quote-request cart and a buyer account with request statuses. Requests are visible only to their author.',
    },
  },
  {
    type: 'store', icon: 'Shirt',
    title: { ru: 'Онлайн-бутик одежды', en: 'Fashion boutique' },
    img: '/demo/fashion.jpg',
    sub: { ru: 'Лукбук, размеры, избранное', en: 'Lookbook, sizes, wishlist' },
    prompt: {
      ru: 'Сделай элегантный онлайн-бутик одежды: лукбук на весь экран, коллекции, каталог с фильтрами по размеру и цвету, карточка товара с выбором размера и таблицей размеров, избранное, корзина и оформление заказа. Стиль — минималистичный премиум.',
      en: 'Build an elegant online fashion boutique: a full-screen lookbook, collections, a catalog with size and colour filters, a product page with size selection and a size chart, a wishlist, cart and checkout. Minimalist premium style.',
    },
  },

  // ── Порталы ─────────────────────────────────────────────────────────────────
  {
    type: 'portal', icon: 'Building2',
    title: { ru: 'Портал недвижимости', en: 'Real estate portal' },
    img: '/demo/realty.jpg',
    sub: { ru: 'Объявления, фильтры, карта', en: 'Listings, filters, map' },
    prompt: {
      ru: 'Создай портал недвижимости: лента объявлений с фото, фильтры по цене, комнатам, району и площади, страница объекта с галереей и контактами, форма подачи объявления и кабинет собственника со своими объектами и откликами.',
      en: 'Create a real estate portal: a listing feed with photos, filters by price, rooms, district and area, a property page with a gallery and contacts, a listing submission form and an owner account with their properties and enquiries.',
    },
  },
  {
    type: 'portal', icon: 'GraduationCap',
    title: { ru: 'Платформа обучения', en: 'Learning platform' },
    img: '/demo/lms.jpg',
    sub: { ru: 'Курсы, уроки, прогресс', en: 'Courses, lessons, progress' },
    prompt: {
      ru: 'Собери платформу онлайн-обучения: каталог курсов с фильтрами, страница курса с программой и преподавателем, экран урока с видео и материалами, тест в конце модуля, кабинет студента с прогрессом и сертификатами. Прогресс приватный у каждого студента.',
      en: 'Build an online learning platform: a course catalog with filters, a course page with the syllabus and instructor, a lesson screen with video and materials, an end-of-module quiz and a student account with progress and certificates. Progress is private per student.',
    },
  },
  {
    type: 'portal', icon: 'Stethoscope',
    title: { ru: 'Запись в клинику', en: 'Clinic booking' },
    img: '/demo/medical.jpg',
    sub: { ru: 'Врачи, слоты, приёмы', en: 'Doctors, slots, appointments' },
    prompt: {
      ru: 'Сделай платформу записи в клинику: специализации, карточки врачей с опытом и отзывами, календарь свободных слотов, оформление записи с подтверждением и кабинет пациента с предстоящими и прошедшими приёмами.',
      en: 'Build a clinic booking platform: specialties, doctor cards with experience and reviews, a calendar of free slots, appointment checkout with confirmation and a patient account with upcoming and past visits.',
    },
  },
  {
    type: 'portal', icon: 'Truck',
    title: { ru: 'Управление доставками', en: 'Delivery management' },
    img: '/demo/logistics.jpg',
    sub: { ru: 'Отправления, статусы, маршруты', en: 'Shipments, statuses, routes' },
    prompt: {
      ru: 'Создай систему логистики: список отправлений с фильтрами по статусу и дате, карточка отправления с таймлайном движения и расчётным временем прибытия, создание новой отправки, кабинет клиента со своими доставками и отслеживанием по номеру.',
      en: 'Create a logistics system: a shipment list with status and date filters, a shipment page with a movement timeline and ETA, new shipment creation and a client account with their deliveries and tracking by number.',
    },
  },

  // ── Рабочие панели ──────────────────────────────────────────────────────────
  {
    type: 'saas', icon: 'Users',
    title: { ru: 'CRM для отдела продаж', en: 'Sales CRM' },
    img: '/demo/crm.jpg',
    sub: { ru: 'Воронка, сделки, задачи', en: 'Pipeline, deals, tasks' },
    prompt: {
      ru: 'Собери CRM для отдела продаж: боковое меню, экран воронки продаж канбаном с перетаскиванием сделок по этапам, таблица сделок с фильтрами и созданием, карточки контактов, задачи с дедлайнами и экран аналитики по менеджерам. Вход в систему, данные приватные у каждой компании.',
      en: 'Build a sales CRM: a sidebar, a kanban pipeline screen with deals draggable between stages, a deals table with filters and creation, contact cards, tasks with deadlines and a per-manager analytics screen. Sign-in required, data private per company.',
    },
  },
  {
    type: 'saas', icon: 'BarChart3',
    title: { ru: 'Дашборд аналитики', en: 'Analytics dashboard' },
    img: '/demo/analytics.jpg',
    sub: { ru: 'KPI, графики, отчёты', en: 'KPIs, charts, reports' },
    prompt: {
      ru: 'Создай дашборд бизнес-аналитики: плитки ключевых показателей с динамикой, график выручки по месяцам, воронка каналов привлечения, таблица топ-товаров, выручка по регионам, фильтр по периоду и экспорт отчёта. Графики рисуй инлайн-SVG.',
      en: 'Create a business analytics dashboard: KPI tiles with trends, a monthly revenue chart, an acquisition channel funnel, a top-products table, revenue by region, a period filter and report export. Draw charts as inline SVG.',
    },
  },
  {
    type: 'saas', icon: 'Wallet',
    title: { ru: 'Финансовая панель', en: 'Finance dashboard' },
    img: '/demo/fintech.jpg',
    sub: { ru: 'Счета, платежи, расходы', en: 'Accounts, payments, expenses' },
    prompt: {
      ru: 'Сделай финансовую панель: баланс и карты, перевод между счетами, график трат по категориям, лента операций с фильтрами и поиском, выставление счёта и экран настроек. Вход в систему, операции видит только владелец аккаунта.',
      en: 'Build a finance dashboard: balance and cards, transfers between accounts, a spending-by-category chart, a transactions feed with filters and search, invoice creation and a settings screen. Sign-in required, transactions visible only to the account owner.',
    },
  },
  {
    type: 'saas', icon: 'ClipboardList',
    title: { ru: 'Учёт заявок', en: 'Request tracker' },
    sub: { ru: 'Таблица, статусы, ответственные', en: 'Table, statuses, owners' },
    prompt: {
      ru: 'Собери систему учёта заявок: таблица заявок с фильтрами по статусу, ответственному и дате, форма создания заявки, карточка заявки с комментариями и историей изменений, доска по статусам и экран сводки. Вход в систему, свои заявки у каждого сотрудника.',
      en: 'Build a request tracking system: a requests table with status, owner and date filters, a creation form, a request page with comments and change history, a status board and a summary screen. Sign-in required, each employee sees their own requests.',
    },
  },

  // ── Лендинги ────────────────────────────────────────────────────────────────
  {
    type: 'landing', icon: 'Rocket',
    title: { ru: 'Лендинг SaaS-продукта', en: 'SaaS product landing' },
    img: '/demo/saas-landing.jpg',
    sub: { ru: 'Оффер, превью, тарифы', en: 'Offer, preview, pricing' },
    prompt: {
      ru: 'Сделай премиум-лендинг SaaS-продукта: сильный герой с оффером и скриншотом интерфейса, блок возможностей с иконками, как это работает по шагам, тарифы с выделенным популярным, отзывы, FAQ-аккордеон и форма регистрации.',
      en: 'Build a premium SaaS product landing: a strong hero with an offer and an interface screenshot, a features block with icons, a step-by-step how-it-works, pricing with a highlighted popular plan, testimonials, an FAQ accordion and a sign-up form.',
    },
  },
  {
    type: 'landing', icon: 'Briefcase',
    title: { ru: 'Корпоративный сайт', en: 'Corporate site' },
    sub: { ru: 'Услуги, кейсы, доверие', en: 'Services, cases, trust' },
    prompt: {
      ru: 'Создай корпоративный сайт компании: герой с позиционированием, услуги с ценами, кейсы с результатами в цифрах, этапы работы, команда, сертификаты и лицензии, отзывы клиентов, FAQ и форма заявки с контактами.',
      en: 'Create a corporate company site: a hero with positioning, services with prices, cases with numeric results, a process timeline, the team, certificates and licences, client testimonials, an FAQ and a contact form.',
    },
  },
  {
    type: 'landing', icon: 'Sparkles',
    title: { ru: 'Лендинг под запуск', en: 'Product launch landing' },
    img: '/demo/ai-landing.jpg',
    sub: { ru: 'Акция, дедлайн, заявка', en: 'Promo, deadline, lead form' },
    prompt: {
      ru: 'Сделай эффектный лендинг под запуск продукта: яркий герой с оффером и таймером до конца акции, выгоды с цифрами, сравнение до/после, отзывы, гарантия возврата, блок частых возражений и форма заявки с призывом к действию.',
      en: 'Build a striking product launch landing: a bold hero with an offer and a countdown to the end of the promo, benefits with numbers, a before/after comparison, testimonials, a money-back guarantee, an objections block and a lead form with a call to action.',
    },
  },
];
