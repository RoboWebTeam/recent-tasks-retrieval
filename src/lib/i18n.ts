export type Lang = 'ru' | 'en';

export function getLang(): Lang {
  const saved = localStorage.getItem('lang') as Lang | null;
  if (saved === 'ru' || saved === 'en') return saved;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith('ru') ? 'ru' : 'en';
}

export function setLang(lang: Lang) {
  localStorage.setItem('lang', lang);
  window.location.reload();
}

export const t = {
  // --- AUTH ---
  login: { ru: 'Войти', en: 'Sign In' },
  register: { ru: 'Регистрация', en: 'Sign Up' },
  email: { ru: 'E-mail', en: 'Email' },
  password: { ru: 'Пароль', en: 'Password' },
  yourName: { ru: 'Ваше имя', en: 'Your name' },
  namePlaceholder: { ru: 'Иван Иванов', en: 'John Smith' },
  emailPlaceholder: { ru: 'your@email.com', en: 'your@email.com' },
  passwordPlaceholder: { ru: 'Введите пароль', en: 'Enter password' },
  minChars: { ru: 'Минимум 6 символов', en: 'Minimum 6 characters' },
  signIn: { ru: 'Войти', en: 'Sign In' },
  signingIn: { ru: 'Входим…', en: 'Signing in…' },
  createAccount: { ru: 'Создать аккаунт', en: 'Create Account' },
  creatingAccount: { ru: 'Регистрируемся…', en: 'Creating account…' },
  noAccount: { ru: 'Нет аккаунта?', en: 'No account?' },
  hasAccount: { ru: 'Уже есть аккаунт?', en: 'Already have an account?' },
  signUpLink: { ru: 'Зарегистрироваться', en: 'Sign Up' },
  signInLink: { ru: 'Войти', en: 'Sign In' },
  backHome: { ru: 'На главную', en: 'Back to home' },
  enterAccount: { ru: 'Введите данные для входа', en: 'Enter your credentials' },
  freeNoCard: { ru: 'Бесплатно — без карты', en: 'Free — no card required' },
  passwordWeak: { ru: 'Слабый', en: 'Weak' },
  passwordMedium: { ru: 'Средний', en: 'Medium' },
  passwordStrong: { ru: 'Надёжный', en: 'Strong' },
  termsAgree: { ru: 'Регистрируясь, вы принимаете', en: 'By registering, you accept the' },
  termsLink: { ru: 'условия использования', en: 'terms of service' },
  loginHeroTitle: { ru: 'Создавайте сайты\nв диалоге с AI', en: 'Build websites\nthrough AI dialog' },
  loginHeroDesc: { ru: 'Войдите и управляйте своими проектами, тарифом и настройками.', en: 'Sign in to manage your projects, plan and settings.' },
  registerHeroTitle: { ru: 'Начните создавать\nпрямо сейчас', en: 'Start building\nright now' },
  registerHeroDesc: { ru: 'Регистрация занимает 30 секунд. Никакой карты не нужно.', en: 'Registration takes 30 seconds. No card required.' },
  firstFree: { ru: 'Первый сайт бесплатно', en: 'First website free' },
  showPassword: { ru: 'Показать пароль', en: 'Show password' },
  hidePassword: { ru: 'Скрыть пароль', en: 'Hide password' },

  // --- DASHBOARD ---
  myProjects: { ru: 'Мои проекты', en: 'My Projects' },
  plan: { ru: 'Тариф', en: 'Plan' },
  profile: { ru: 'Профиль', en: 'Profile' },
  newProject: { ru: 'Новый проект', en: 'New Project' },
  createWithAI: { ru: 'Создать сайт с AI', en: 'Create site with AI' },
  openBuilder: { ru: 'Открыть конструктор', en: 'Open Builder' },
  noProjects: { ru: 'Ещё нет проектов', en: 'No projects yet' },
  noProjectsDesc: { ru: 'Создайте первый проект — опишите идею в диалоге с AI.', en: 'Create your first project — describe your idea in AI chat.' },
  projectName: { ru: 'Название сайта', en: 'Website name' },
  projectNamePlaceholder: { ru: 'Например: Лендинг кофейни', en: 'E.g.: Coffee shop landing' },
  description: { ru: 'Описание', en: 'Description' },
  descriptionPlaceholder: { ru: 'Кратко о проекте…', en: 'Brief about the project…' },
  optional: { ru: 'необязательно', en: 'optional' },
  creating: { ru: 'Создаём…', en: 'Creating…' },
  createAndOpen: { ru: 'Создать и открыть редактор', en: 'Create and open editor' },
  openInEditor: { ru: 'Открыть в редакторе', en: 'Open in editor' },
  draft: { ru: 'Черновик', en: 'Draft' },
  building: { ru: 'Собирается', en: 'Building' },
  published: { ru: 'Опубликован', en: 'Published' },
  logout: { ru: 'Выйти из аккаунта', en: 'Log out' },
  currentPlan: { ru: 'текущий тариф', en: 'current plan' },
  upgradePlan: { ru: 'Улучшить тариф', en: 'Upgrade Plan' },
  selectPlan: { ru: 'Выбрать', en: 'Select' },
  currentPlanBtn: { ru: 'Текущий тариф', en: 'Current plan' },
  registeredAt: { ru: 'Дата регистрации', en: 'Registered' },
  projects: { ru: 'Проекты', en: 'Projects' },
  created: { ru: 'создано', en: 'created' },
  goTo: { ru: 'Перейти', en: 'Go' },
  planFree: { ru: 'Пробный', en: 'Free' },
  planPremium: { ru: 'Премиум', en: 'Premium' },
  planPro: { ru: 'Профи', en: 'Pro' },
  perMonth: { ru: 'в месяц', en: '/mo' },
  requestsOnce: { ru: 'запросов разово', en: 'requests once' },
  requestsMonthly: { ru: 'запросов в месяц', en: 'requests/month' },

  // --- BUILDER ---
  builderHello: { ru: 'Привет', en: 'Hello' },
  builderWelcome: { ru: 'Опишите сайт — и я создам его за секунды', en: 'Describe your site — I\'ll build it in seconds' },
  builderTryTitle: { ru: 'Попробуйте', en: 'Try these' },
  builderInputPlaceholder: { ru: 'Опишите ваш сайт…', en: 'Describe your website…' },
  builderInputHint: { ru: 'Enter — отправить · Shift+Enter — новая строка', en: 'Enter to send · Shift+Enter for new line' },
  builderGenerating: { ru: 'Генерирую сайт', en: 'Generating site' },
  builderReady: { ru: 'Сайт готов!', en: 'Site ready!' },
  builderReadyDesc: { ru: 'Превью обновлено справа. Можете скачать или продолжить диалог.', en: 'Preview updated on the right. Download or continue the dialog.' },
  builderPreview: { ru: 'Превью', en: 'Preview' },
  builderCode: { ru: 'Код', en: 'Code' },
  builderDownload: { ru: 'Скачать', en: 'Download' },
  builderPublish: { ru: 'Опубликовать', en: 'Publish' },
  builderPreviewEmpty: { ru: 'Превью появится здесь', en: 'Preview will appear here' },
  builderPreviewEmptyDesc: { ru: 'Опишите сайт в чате слева — и я сгенерирую его за несколько секунд', en: 'Describe your site in the chat on the left and I\'ll generate it in seconds' },
  builderCodeEmpty: { ru: 'Код появится после генерации сайта', en: 'Code will appear after site generation' },
  builderCopy: { ru: 'Скопировать', en: 'Copy' },
  builderProject: { ru: 'Проект', en: 'Project' },
  builderError: { ru: 'Произошла ошибка. Попробуйте ещё раз.', en: 'An error occurred. Please try again.' },
  builderNoConnection: { ru: 'Ошибка соединения. Проверьте интернет.', en: 'Connection error. Check your internet.' },

  // --- BLOG ---
  blogLabel:          { ru: 'Блог', en: 'Blog' },
  blogTitle:          { ru: 'Всё об AI‑разработке сайтов', en: 'Everything about AI website development' },
  blogDesc:           { ru: 'Статьи, инструкции и кейсы о том, как создавать сайты быстро и без лишних затрат.', en: 'Articles, guides and case studies on building websites fast and affordably.' },
  blogSeoTitle:       { ru: 'Блог о AI-разработке сайтов — Roboweb', en: 'Blog about AI website development — Roboweb' },
  blogSeoDesc:        { ru: 'Статьи, инструкции и кейсы о том, как создавать сайты быстро и без лишних затрат с помощью Roboweb.', en: 'Articles, guides and case studies on how to build websites fast with Roboweb.' },
  blogBackHome:       { ru: 'На главную', en: 'Back to home' },
  blogSearch:         { ru: 'Поиск по статьям…', en: 'Search articles…' },
  blogAll:            { ru: 'Все', en: 'All' },
  blogNotFound:       { ru: 'Ничего не найдено', en: 'Nothing found' },
  blogFoundCount:     { ru: 'Найдено', en: 'Found' },
  blogArticles1:      { ru: 'статья', en: 'article' },
  blogArticles2:      { ru: 'статьи', en: 'articles' },
  blogArticles5:      { ru: 'статей', en: 'articles' },
  blogQuery:          { ru: 'по запросу', en: 'for query' },
  blogEmpty:          { ru: 'Статей не найдено', en: 'No articles found' },
  blogEmptyDesc:      { ru: 'Попробуйте другой запрос или выберите другую категорию', en: 'Try a different query or select another category' },
  blogReset:          { ru: 'Сбросить фильтры', en: 'Reset filters' },
  blogRead:           { ru: 'Читать', en: 'Read' },
  blogReadTime:       { ru: 'чтения', en: 'read' },
  blogCtaTitle:       { ru: 'Готовы создать свой сайт?', en: 'Ready to build your site?' },
  blogCtaDesc:        { ru: 'Попробуйте Roboweb бесплатно — первый сайт за несколько минут', en: 'Try Roboweb for free — first site in minutes' },
  blogCtaBtn:        { ru: 'Создать сайт бесплатно', en: 'Create site for free' },
  blogCreate:        { ru: 'Создать сайт', en: 'Create site' },
  // Article
  articleBack:        { ru: 'Все статьи', en: 'All articles' },
  articleShare:       { ru: 'Поделиться', en: 'Share' },
  articleCopied:      { ru: 'Скопировано!', en: 'Copied!' },
  articleShareTitle:  { ru: 'Понравилась статья?', en: 'Enjoyed the article?' },
  articleShareDesc:   { ru: 'Поделитесь с коллегами и друзьями', en: 'Share with colleagues and friends' },
  // Common errors
  errorSend:          { ru: 'Ошибка отправки. Попробуйте ещё раз.', en: 'Send error. Please try again.' },
  errorLoad:          { ru: 'Ошибка загрузки. Попробуйте ещё раз.', en: 'Loading error. Please try again.' },
  errorConnection:    { ru: 'Ошибка соединения. Попробуйте ещё раз.', en: 'Connection error. Please try again.' },
  errorProject:       { ru: 'Ошибка создания проекта', en: 'Failed to create project' },
  errorPassword:      { ru: 'Пароль должен быть не менее 6 символов', en: 'Password must be at least 6 characters' },
  errorServer:        { ru: 'Неверный ответ сервера. Попробуйте ещё раз.', en: 'Invalid server response. Please try again.' },
  errorDomain:        { ru: 'Введите корректный домен, например: mysite.ru', en: 'Enter a valid domain, e.g.: mysite.com' },
  successEmail:       { ru: 'Заявка принята! Мы свяжемся с вами.', en: 'Request received! We\'ll be in touch.' },
  sending:            { ru: 'Отправляем…', en: 'Sending…' },
  loading:            { ru: 'Загружаем…', en: 'Loading…' },
  loadingCabinet:     { ru: 'Загружаем ваш кабинет…', en: 'Loading your dashboard…' },
  noData:             { ru: 'Данных пока нет', en: 'No data yet' },
  noDataDesc:         { ru: 'Статистика появится когда посетители начнут заходить на ваши сайты', en: 'Stats will appear when visitors start viewing your sites' },

  // --- SUGGESTIONS ---
  suggestion1: { ru: 'Лендинг для кофейни с меню и формой заказа', en: 'Coffee shop landing with menu and order form' },
  suggestion2: { ru: 'Сайт-визитка для фотографа', en: 'Portfolio website for a photographer' },
  suggestion3: { ru: 'Лендинг для фитнес-тренера', en: 'Landing page for a fitness trainer' },
  suggestion4: { ru: 'Интернет-магазин одежды', en: 'Online clothing store' },
  suggestion5: { ru: 'Сайт для барбершопа с записью', en: 'Barbershop site with booking' },
  suggestion6: { ru: 'Лендинг для онлайн-курсов', en: 'Landing page for online courses' },
} as const;

export type TranslationKey = keyof typeof t;

export function tr(key: TranslationKey, lang: Lang): string {
  return t[key][lang];
}