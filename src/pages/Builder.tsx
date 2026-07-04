import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getSession, getStoredUser, apiUploadFile, apiGetProject, apiPublishProject, apiGenerateImage, apiSaveChatHistory, LOW_BALANCE_THRESHOLD } from '@/lib/auth';
import { getLang, tr } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';
import { useToast } from '@/hooks/use-toast';
import BuilderCorePanel from '@/components/builder/BuilderCorePanel';
import BuilderDomainModal from '@/components/builder/BuilderDomainModal';
import GenerationProgress from '@/components/builder/GenerationProgress';
import TypingReport from '@/components/builder/TypingReport';
import { trackGoal, GOALS } from '@/lib/analytics';
import { apiUrl } from '@/lib/apiConfig';

const GENERATE_URL = apiUrl('generate-site');

/** Повторяет запрос генерации при временной недоступности AI-сервиса (502/503), с нарастающей паузой.
 * Реальный статус может быть внутри JSON-тела (raw.statusCode), а не только в res.status.
 * Таймаут (504) НЕ повторяем — повторный запрос с тем же сложным промптом, скорее всего, снова упрётся
 * в лимит времени, а пользователь будет ждать без результата. Вместо этого сразу показываем понятную ошибку.
 * Ответ 504 от прокси-сервера может не быть валидным JSON — обрабатываем это безопасно. */
async function fetchWithAiRetry(url: string, options: RequestInit, maxRetries = 2, delayMs = 1500): Promise<{ res: Response; raw: Record<string, unknown> }> {
  let res: Response;
  let raw: Record<string, unknown>;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = await fetch(url, options);
    try {
      raw = await res.json();
    } catch {
      raw = { statusCode: res.status, error: 'TIMEOUT_OR_INVALID_RESPONSE' };
    }
    const statusCode = typeof raw.statusCode === 'number' ? raw.statusCode : res.status;
    const isRetryable = statusCode === 502 || statusCode === 503;
    if (!isRetryable || attempt === maxRetries) return { res, raw };
    await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
  }
  return { res: res!, raw: raw! };
}

interface Suggestion {
  icon: string;
  label: string;
  prompt: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isHtml?: boolean;
  tokens?: number;
  /** true — этот пустой ответ ассистента относится к правке существующего сайта, а не к генерации с нуля */
  isEdit?: boolean;
  /** Вступление: как ИИ понял задачу */
  intro?: string;
  /** Живое описание от ИИ: что именно он сделал */
  summary?: string;
  /** Пошаговый рассказ что конкретно сделано/исправлено/улучшено */
  steps?: string[];
  /** Дизайн-решения: палитра, шрифты, стиль */
  design?: string;
  /** Список секций/блоков, которые есть на созданном сайте */
  sections?: string[];
  /** Персональные предложения улучшений именно для этого сайта */
  suggestions?: Suggestion[];
  /** true — сообщение только что сгенерировано в этой сессии (нужно проиграть анимацию печати).
   * У сообщений, восстановленных из истории при повторном входе, флага нет — они не анимируются. */
  justGenerated?: boolean;
}

interface Version {
  html: string;
  label: string;
  ts: number;
}

type RightTab = 'preview' | 'code' | 'core';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

// Ключевые слова, при которых стоит предложить Gemini — модель лучше справляется
// со сложной логикой, интерактивом и насыщенными интерфейсами
const GEMINI_HINT_KEYWORDS_RU = ['сложн', 'интерактив', 'калькулятор', 'фильтр', 'анимаци', 'игр', 'квиз', 'викторин'];
const GEMINI_HINT_KEYWORDS_EN = ['complex', 'interactive', 'calculator', 'filter', 'animation', 'game', 'quiz'];

// Ключевые слова, при которых стоит предложить Claude — модель лучше справляется
// с классическими бизнес-сайтами и структурированным контентом
const CLAUDE_HINT_KEYWORDS_RU = ['лендинг', 'интернет-магазин', 'магазин', 'каталог', 'визитк', 'портфолио', 'корпоратив', 'услуг', 'юридическ', 'медицинск', 'клиник', 'салон'];
const CLAUDE_HINT_KEYWORDS_EN = ['landing', 'online store', 'shop', 'catalog', 'portfolio', 'corporate', 'services', 'law firm', 'clinic', 'salon'];

type SuggestedModel = 'claude' | 'gemini' | null;

function getSuggestedModel(text: string, lang: 'ru' | 'en'): SuggestedModel {
  const lower = text.toLowerCase();
  const geminiKw = lang === 'ru' ? GEMINI_HINT_KEYWORDS_RU : GEMINI_HINT_KEYWORDS_EN;
  const claudeKw = lang === 'ru' ? CLAUDE_HINT_KEYWORDS_RU : CLAUDE_HINT_KEYWORDS_EN;
  if (geminiKw.some(kw => lower.includes(kw))) return 'gemini';
  if (claudeKw.some(kw => lower.includes(kw))) return 'claude';
  return null;
}

// Приветственное сообщение ассистента при первом входе в новый проект.
const WELCOME_MESSAGE = (lang: 'ru' | 'en') =>
  lang === 'ru'
    ? 'Привет :) Roboweb заменяет фрилансеров и конструкторы сайтов. Опишите идею в диалоге — и получите готовый сайт, магазин, IT-стартап за минуты, а не недели. Ваш личный разработчик! И это всё реальность! Попробуйте, вам обязательно понравится.'
    : 'Hi :) Roboweb replaces freelancers and site builders. Describe your idea in the chat — and get a ready website, store or IT startup in minutes, not weeks. Your personal developer! And it\'s all real! Give it a try — you\'ll love it.';

const QUICK_EDITS_RU = [
  { icon: 'Palette', label: 'Тёмная тема', prompt: 'Сделай тёмную цветовую схему' },
  { icon: 'Sun', label: 'Светлая тема', prompt: 'Сделай светлую цветовую схему' },
  { icon: 'Type', label: 'Крупнее шрифт', prompt: 'Увеличь размер шрифтов на всём сайте' },
  { icon: 'Zap', label: 'Добавь анимации', prompt: 'Добавь плавные анимации появления элементов' },
  { icon: 'Phone', label: 'Кнопка звонка', prompt: 'Добавь кнопку звонка с номером телефона' },
  { icon: 'MessageSquare', label: 'Форма обратной связи', prompt: 'Добавь форму обратной связи с полями имя, телефон, сообщение' },
  { icon: 'Star', label: 'Блок отзывов', prompt: 'Добавь блок с отзывами клиентов (3-4 карточки)' },
  { icon: 'MapPin', label: 'Карта и контакты', prompt: 'Добавь раздел с адресом, телефоном и картой' },
  { icon: 'ShoppingCart', label: 'Прайс-лист', prompt: 'Добавь раздел с ценами и тарифами' },
  { icon: 'Award', label: 'Преимущества', prompt: 'Добавь блок с ключевыми преимуществами компании (4-6 штук)' },
];

const QUICK_EDITS_EN = [
  { icon: 'Palette', label: 'Dark theme', prompt: 'Apply a dark color scheme' },
  { icon: 'Sun', label: 'Light theme', prompt: 'Apply a light color scheme' },
  { icon: 'Type', label: 'Larger font', prompt: 'Increase font sizes across the site' },
  { icon: 'Zap', label: 'Add animations', prompt: 'Add smooth entrance animations to elements' },
  { icon: 'Phone', label: 'Call button', prompt: 'Add a click-to-call button with phone number' },
  { icon: 'MessageSquare', label: 'Contact form', prompt: 'Add a contact form with name, phone, and message fields' },
  { icon: 'Star', label: 'Reviews block', prompt: 'Add a customer reviews section with 3-4 cards' },
  { icon: 'MapPin', label: 'Map & contacts', prompt: 'Add a section with address, phone and map' },
  { icon: 'ShoppingCart', label: 'Price list', prompt: 'Add a pricing and plans section' },
  { icon: 'Award', label: 'Benefits', prompt: 'Add a key company benefits block (4-6 items)' },
];

// Библиотека готовых секций — добавление целых блоков сайта в один клик.
const SECTION_LIBRARY_RU = [
  { icon: 'Image', label: 'Галерея', prompt: 'Добавь красивую галерею изображений в виде адаптивной сетки с hover-эффектом' },
  { icon: 'CreditCard', label: 'Тарифы', prompt: 'Добавь секцию с тарифами: 3 карточки цен, у средней выдели «Популярный», с кнопками' },
  { icon: 'Users', label: 'Команда', prompt: 'Добавь секцию «Наша команда» с карточками сотрудников (фото, имя, должность)' },
  { icon: 'HelpCircle', label: 'FAQ', prompt: 'Добавь раздел с частыми вопросами и ответами (аккордеон, 5-6 вопросов)' },
  { icon: 'MessageSquare', label: 'Отзывы', prompt: 'Добавь секцию отзывов клиентов со звёздным рейтингом (3-4 правдоподобных отзыва с именами)' },
  { icon: 'ListChecks', label: 'Этапы работы', prompt: 'Добавь блок «Как мы работаем» с нумерованными этапами (4 шага с иконками)' },
  { icon: 'Images', label: 'Портфолио', prompt: 'Добавь секцию портфолио/кейсов с карточками работ и описаниями' },
  { icon: 'Percent', label: 'Акция', prompt: 'Добавь яркий баннер с акцией/спецпредложением и кнопкой призыва к действию' },
  { icon: 'MapPin', label: 'Контакты', prompt: 'Добавь секцию контактов: адрес, телефон, email, режим работы и карту' },
  { icon: 'Newspaper', label: 'Новости/блог', prompt: 'Добавь секцию с последними новостями или статьями блога (3 карточки)' },
];

const SECTION_LIBRARY_EN = [
  { icon: 'Image', label: 'Gallery', prompt: 'Add a beautiful responsive image gallery grid with hover effects' },
  { icon: 'CreditCard', label: 'Pricing', prompt: 'Add a pricing section: 3 price cards, highlight the middle one as "Popular", with buttons' },
  { icon: 'Users', label: 'Team', prompt: 'Add an "Our team" section with member cards (photo, name, role)' },
  { icon: 'HelpCircle', label: 'FAQ', prompt: 'Add a FAQ section with accordion (5-6 questions and answers)' },
  { icon: 'MessageSquare', label: 'Reviews', prompt: 'Add a customer reviews section with star ratings (3-4 realistic reviews with names)' },
  { icon: 'ListChecks', label: 'How it works', prompt: 'Add a "How we work" block with numbered steps (4 steps with icons)' },
  { icon: 'Images', label: 'Portfolio', prompt: 'Add a portfolio/cases section with work cards and descriptions' },
  { icon: 'Percent', label: 'Promo', prompt: 'Add a bright promo/special offer banner with a call-to-action button' },
  { icon: 'MapPin', label: 'Contacts', prompt: 'Add a contacts section: address, phone, email, working hours and a map' },
  { icon: 'Newspaper', label: 'News/blog', prompt: 'Add a section with latest news or blog articles (3 cards)' },
];

export default function Builder() {
  const lang = getLang();
  const QUICK_EDITS = lang === 'ru' ? QUICK_EDITS_RU : QUICK_EDITS_EN;
  const SECTION_LIBRARY = lang === 'ru' ? SECTION_LIBRARY_RU : SECTION_LIBRARY_EN;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  // Ключ для хранения истории чата в localStorage — свой для каждого проекта
  const chatStorageKey = `builder_chat_${projectId || 'new'}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`builder_chat_${new URLSearchParams(window.location.search).get('project') || 'new'}`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Валидируем структуру: должен быть массив объектов с корректными role/content,
      // иначе рендер сломается на битых данных из localStorage
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((m): m is Message =>
          m && typeof m === 'object' &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
        )
        // Восстановленные сообщения НИКОГДА не анимируются повторно — сбрасываем флаг.
        .map(({ justGenerated, ...rest }: Message) => rest);
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState('');
  const [rightTab, setRightTab] = useState<RightTab>('preview');
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [builderTheme, setBuilderTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('builder_theme') as 'light' | 'dark') || 'light';
  });
  const [showEnergyBonus, setShowEnergyBonus] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('show_energy_bonus') === '1';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Ширина панели чата — можно менять мышкой за разделитель. Сохраняем в localStorage,
  // чтобы выбранная ширина сохранялась между сессиями работы в редакторе.
  const [chatWidth, setChatWidth] = useState(() => {
    if (typeof window === 'undefined') return 400;
    const saved = Number(localStorage.getItem('builder_chat_width'));
    return saved >= 300 && saved <= 800 ? saved : 400;
  });
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showQuickEdits, setShowQuickEdits] = useState(false);
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [codeApplied, setCodeApplied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ url: string; name: string; alreadyUploaded?: boolean } | null>(null);
  const [showExtensions, setShowExtensions] = useState(false);
  const [savingToFiles, setSavingToFiles] = useState(false);
  const [saveToFilesDone, setSaveToFilesDone] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [loadingProject, setLoadingProject] = useState(false);
  // Флаг: история чата из БД уже загружена. До этого момента не сохраняем автоматически,
  // чтобы пустой стартовый стейт не затёр сохранённую историю в базе.
  const [chatLoaded, setChatLoaded] = useState(!projectId);
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [aiModel, setAiModel] = useState<'claude' | 'gpt-4o' | 'gemini' | 'opus' | 'sonnet'>('gemini');
  // Выбранный стиль-пресет для новых сайтов ('' = авто, ИИ подбирает сам под нишу)
  const [siteStyle, setSiteStyle] = useState<'' | 'minimal' | 'premium' | 'bright' | 'dark'>('');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [dismissedStyleHint, setDismissedStyleHint] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [dismissedModelHint, setDismissedModelHint] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageGenError, setImageGenError] = useState('');
  const [showDomainModal, setShowDomainModal] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [editPopover, setEditPopover] = useState<{ x: number; y: number; text: string; path: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [propsPanel, setPropsPanel] = useState<{
    path: string; tag: string;
    color: string; backgroundColor: string;
    fontSize: string; fontWeight: string; textAlign: string;
    paddingTop: string; paddingRight: string; paddingBottom: string; paddingLeft: string;
    borderRadius: string; opacity: string;
  } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Автопрокрутка чата вниз включена, пока пользователь сам не проскроллил вверх.
  // Хранится в ref (а не state), чтобы не пересоздавать колбэки печати на каждый тик.
  const autoScrollRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const session = getSession();
  const user = getStoredUser();

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); }
  }, [session, navigate]);

  useEffect(() => {
    if (user && typeof user.requests_limit === 'number') {
      setRemaining(Math.max(0, user.requests_limit - (user.requests_used || 0)) + (user.energy_balance || 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Загрузка сохранённого проекта при открытии по ссылке /builder?project=ID
  useEffect(() => {
    if (!session || !projectId) return;
    setLoadingProject(true);
    apiGetProject(session, projectId)
      .then(project => {
        setProjectTitle(project.title);
        if (project.html_content) {
          setHtml(project.html_content);
          setCodeEditorValue(project.html_content);
          setVersions([{ html: project.html_content, label: lang === 'ru' ? 'Сохранённая версия' : 'Saved version', ts: Date.now() }]);
        }
        if (project.status === 'published' && project.slug) {
          setPublishedSlug(project.slug);
        }
        // История диалога хранится в БД — восстанавливаем её при входе, чтобы чат
        // не был пустым. БД имеет приоритет над localStorage (работает с любого устройства).
        const dbHistory = Array.isArray(project.chat_history) ? project.chat_history : [];
        const validHistory = dbHistory
          .filter((m): m is Message =>
            !!m && typeof m === 'object' &&
            ((m as Message).role === 'user' || (m as Message).role === 'assistant') &&
            typeof (m as Message).content === 'string'
          )
          // Гарантируем: восстановленные из БД сообщения не анимируются повторно.
          .map(({ justGenerated, ...rest }: Message) => rest);
        if (validHistory.length > 0) {
          setMessages(validHistory);
        } else {
          // Первый вход в проект (истории ещё нет) — приветствуем пользователя в диалоге.
          // Проверяем и текущий localStorage-стейт, чтобы не задублировать приветствие.
          setMessages(prev => prev.length > 0 ? prev : [{ role: 'assistant', content: WELCOME_MESSAGE(lang) }]);
        }
        // Разрешаем автосохранение истории только после первичной загрузки —
        // иначе пустой стартовый стейт перезапишет сохранённую историю в БД.
        setChatLoaded(true);
      })
      .catch(() => { setChatLoaded(true); })
      .finally(() => setLoadingProject(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, projectId]);

  // Прокручиваем вниз только если пользователь не увёл скролл вверх сам.
  const scrollChatToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (autoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  // Следим за ручным скроллом: если пользователь у самого низа — автоскролл включён,
  // если проскроллил вверх — выключаем, чтобы печать ИИ не тянула его обратно вниз.
  const handleChatScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    autoScrollRef.current = nearBottom;
  };

  useEffect(() => {
    // Новое сообщение отправлено пользователем — всегда возвращаем автоскролл и едем вниз.
    autoScrollRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Изменение ширины панели чата мышкой за разделитель
  useEffect(() => {
    if (!isResizingChat) return;
    const MIN_WIDTH = 300;
    const MAX_WIDTH = 800;
    const handleMouseMove = (e: MouseEvent) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setChatWidth(next);
    };
    const handleMouseUp = () => {
      setIsResizingChat(false);
      setChatWidth(w => {
        localStorage.setItem('builder_chat_width', String(w));
        return w;
      });
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingChat]);

  // Сохраняем историю чата в localStorage — быстрый локальный кеш на случай перезагрузки.
  // Не сохраняем во время загрузки (когда последнее сообщение ассистента ещё пустое).
  useEffect(() => {
    if (loading) return;
    try {
      if (messages.length > 0) {
        // Без флага justGenerated — восстановленные из кеша сообщения не должны перепечатываться.
        const toStore = messages.slice(-50).map(({ justGenerated, ...rest }) => rest);
        localStorage.setItem(chatStorageKey, JSON.stringify(toStore));
      } else {
        localStorage.removeItem(chatStorageKey);
      }
    } catch {
      /* localStorage может быть переполнен — не критично */
    }
  }, [messages, loading, chatStorageKey]);

  // Сохраняем историю чата в БД проекта — чтобы она восстанавливалась при повторном входе
  // с любого устройства. Делаем с задержкой (debounce), чтобы не слать запрос на каждый символ,
  // и только после того как история из БД уже загружена (иначе затрём её пустым стейтом).
  useEffect(() => {
    if (loading || !session || !projectId || !chatLoaded) return;
    const timer = setTimeout(() => {
      // Убираем флаг justGenerated перед сохранением — иначе при повторном входе
      // восстановленное сообщение снова начнёт печататься с анимацией.
      const toSave = messages.slice(-100).map(({ justGenerated, ...rest }) => rest);
      apiSaveChatHistory(session, projectId, toSave).catch(() => {/* не критично */});
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading, chatLoaded, projectId]);

  useEffect(() => {
    localStorage.setItem('builder_theme', builderTheme);
  }, [builderTheme]);

  const toggleBuilderTheme = () => setBuilderTheme(t => t === 'light' ? 'dark' : 'light');

  const dismissEnergyBonus = () => {
    setShowEnergyBonus(false);
    localStorage.removeItem('show_energy_bonus');
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  useEffect(() => {
    if (!input.trim()) setDismissedModelHint(false);
  }, [input]);

  const suggestedModel = getSuggestedModel(input, lang);
  const showModelHint = !dismissedModelHint && suggestedModel !== null && suggestedModel !== aiModel;
  // Умное уточнение: пользователь пишет запрос на новый сайт, но не выбрал стиль —
  // мягко предлагаем выбрать стиль для лучшего результата (не блокируя генерацию).
  const showStyleHint = !html && !siteStyle && input.trim().length >= 8 && !dismissedStyleHint;

  const applyTemplate = (text: string) => {
    setInput(text);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(text.length, text.length);
    });
  };

  // Подхватываем промпт, переданный со страницы (например /builder?prompt=...)
  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl) applyTemplate(promptFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text?: string) => {
    const rawContent = (text || input).trim();
    if (!rawContent.trim() && !attachedImage) return;
    if (loading) return;

    const pendingImage = attachedImage;
    setInput('');
    setAttachedImage(null);
    setShowQuickEdits(false);
    setLoading(true);

    // Если прикреплено изображение — используем готовую ссылку (если файл уже в хранилище)
    // или загружаем его туда, чтобы AI мог вставить в сайт реальную ссылку, а не выдумывать путь
    let imageNote = '';
    if (pendingImage?.alreadyUploaded) {
      imageNote = `\n[Изображение из хранилища проекта, используй эту ссылку в src: ${pendingImage.url}]`;
    } else if (pendingImage && session) {
      try {
        const base64 = pendingImage.url.split(',')[1] || '';
        const uploaded = await apiUploadFile(session, pendingImage.name, base64, false, projectId ? Number(projectId) : undefined);
        imageNote = `\n[Изображение загружено, используй эту ссылку в src: ${uploaded.file_url}]`;
      } catch {
        imageNote = `\n[Изображение прикреплено: ${pendingImage.name}]`;
      }
    }

    const content = rawContent + imageNote;

    const isEditRequest = !!html;
    const newMessages: Message[] = [...messages, { role: 'user', content }];
    // Добавляем сообщение пользователя И пустой ответ ассистента одним обновлением —
    // без гонки между двумя setState (иначе при быстрых кликах история могла рассинхронизироваться).
    setMessages([...newMessages, { role: 'assistant', content: '', isEdit: isEditRequest }]);

    try {
      const { res, raw } = await fetchWithAiRetry(GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': session! },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          project_id: projectId,
          model: aiModel,
          // Стиль-пресет применяется только к новым сайтам (при правке html уже есть)
          style: !html ? siteStyle : undefined,
          // Передаём текущий HTML сайта — модель правит именно его, а не пытается
          // восстановить состояние сайта по истории текстовых команд
          current_html: html || undefined,
        }),
      });

      let data: Record<string, unknown> = raw;
      if (raw.body !== undefined) {
        // Парсинг тела оборачиваем в try — иначе битый JSON из ответа приводил к крашу
        // ВНЕ основного catch и оставлял чат навсегда в состоянии загрузки.
        if (typeof raw.body === 'string') {
          try {
            data = JSON.parse(raw.body);
          } catch {
            data = { statusCode: 502, error: tr('builderError', lang) };
          }
        } else {
          data = raw.body as Record<string, unknown>;
        }
      }
      const statusCode = typeof raw.statusCode === 'number' ? raw.statusCode : res.status;
      const ok = statusCode >= 200 && statusCode < 300;

      if (!ok) {
        if (statusCode === 402) {
          setQuotaExceeded(true);
          setRemaining(0);
          toast({
            variant: 'destructive',
            title: lang === 'ru' ? '🚫 Лимит AI-запросов исчерпан' : '🚫 AI request limit reached',
            description: lang === 'ru'
              ? 'Пополните энергию или смените тариф, чтобы продолжить генерацию сайта.'
              : 'Top up energy or upgrade your plan to keep generating.',
          });
        }
        const friendlyError = statusCode === 504
          ? tr('builderTimeout', lang)
          : statusCode === 502 || statusCode === 503
          ? tr('builderAiUnavailable', lang)
          : (data as { error?: string }).error || tr('builderError', lang);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: friendlyError };
          return updated;
        });
        return;
      }

      setQuotaExceeded(false);
      const generatedHtml = (data as { html?: string }).html || '';
      const tokens = (data as { tokens?: number }).tokens || 0;

      // Усиленная генерация крупной задачи: сообщаем про повышенный расход, чтобы было прозрачно.
      const isLargeTask = (data as { large_task?: boolean }).large_task === true;
      const requestCost = (data as { cost?: number }).cost || 1;
      if (generatedHtml && isLargeTask && requestCost > 1) {
        toast({
          title: lang === 'ru' ? '✨ Детальный сайт' : '✨ Detailed site',
          description: lang === 'ru'
            ? `Крупная задача — сделал более насыщенный сайт. Списано ${requestCost} запроса вместо 1.`
            : `Large task — generated a richer site. ${requestCost} requests used instead of 1.`,
        });
      }
      if (typeof (data as { remaining?: number }).remaining === 'number') {
        const newRemaining = (data as { remaining?: number }).remaining!;
        if (newRemaining <= LOW_BALANCE_THRESHOLD && (remaining === null || remaining > LOW_BALANCE_THRESHOLD)) {
          toast({
            title: lang === 'ru' ? '⚡ Заканчиваются запросы к AI' : '⚡ AI requests running low',
            description: lang === 'ru'
              ? `Осталось ${newRemaining} запросов. Пополните энергию или смените тариф, чтобы не потерять доступ.`
              : `${newRemaining} requests left. Top up energy or upgrade your plan to avoid losing access.`,
          });
        }
        setRemaining(newRemaining);
      }

      // Сохраняем версию
      if (generatedHtml) {
        if (versions.length === 0) trackGoal(GOALS.WEBSITE_GENERATED_FIRST);
        setVersions(prev => [
          { html: generatedHtml, label: content.slice(0, 40) + (content.length > 40 ? '…' : ''), ts: Date.now() },
          ...prev.slice(0, 9),
        ]);
        setTotalTokens(t => t + tokens);
      }

      // Обновляем превью ТОЛЬКО если пришёл новый HTML — иначе не трогаем состояние,
      // чтобы случайный пустой ответ не стирал уже показанный сайт.
      if (generatedHtml) {
        setHtml(generatedHtml);
        setCodeEditorValue(generatedHtml); // держим редактор кода в синхроне с превью
        setRightTab('preview');
        setIframeKey(k => k + 1);          // принудительно пересобираем iframe с новым содержимым
      }

      const intro = (data as { intro?: string }).intro || '';
      const summary = (data as { summary?: string }).summary || '';
      const steps = Array.isArray((data as { steps?: string[] }).steps) ? (data as { steps: string[] }).steps : [];
      const design = (data as { design?: string }).design || '';
      const sections = Array.isArray((data as { sections?: string[] }).sections) ? (data as { sections: string[] }).sections : [];
      const suggestions = Array.isArray((data as { suggestions?: Suggestion[] }).suggestions) ? (data as { suggestions: Suggestion[] }).suggestions : [];

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: generatedHtml ? tr('builderDone', lang) : (data as { message?: string }).message || tr('builderError', lang),
          isHtml: !!generatedHtml,
          tokens,
          intro,
          summary,
          steps,
          design,
          sections,
          suggestions,
          justGenerated: true,
        };
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: tr('builderError', lang) };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'site.html'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToFiles = async () => {
    if (!html) return;
    const session = getSession();
    if (!session) return;
    setSavingToFiles(true);
    setSaveToFilesDone(false);
    try {
      const base64 = btoa(unescape(encodeURIComponent(html)));
      await apiUploadFile(session, `site-${projectId || Date.now()}.html`, base64, false, projectId ? Number(projectId) : undefined);
      setSaveToFilesDone(true);
      setTimeout(() => setSaveToFilesDone(false), 2000);
    } catch {
      /* тихо игнорируем — не критично для UX */
    }
    setSavingToFiles(false);
  };

  const handlePublish = async () => {
    if (!html || !projectId) return;
    const session = getSession();
    if (!session) return;
    setPublishing(true);
    setPublishError('');
    try {
      const result = await apiPublishProject(session, projectId, projectTitle || 'site');
      trackGoal(GOALS.WEBSITE_PUBLISHED);
      setPublishedSlug(result.slug);
      setShowPublishModal(true);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : (lang === 'ru' ? 'Ошибка публикации' : 'Publish error'));
    }
    setPublishing(false);
  };

  const handleCopyCode = () => {
    // clipboard может быть недоступен (нет прав/старый браузер) — обрабатываем ошибку,
    // чтобы не показывать «Скопировано», когда копирование не произошло, и не ловить краш.
    navigator.clipboard?.writeText(html).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => toast({ variant: 'destructive', title: lang === 'ru' ? 'Не удалось скопировать' : 'Copy failed' })
    );
  };

  const handleClearChat = () => {
    setMessages([]);
    setHtml('');
    setCodeEditorValue('');
    setVersions([]);
    setTotalTokens(0);
    setPublishedSlug(null);
  };

  const restoreVersion = (v: Version) => {
    setHtml(v.html);
    setCodeEditorValue(v.html);
    setRightTab('preview');
    setIframeKey(k => k + 1);
    setShowVersions(false);
  };

  const openInNewTab = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Скрипт, внедряемый в HTML для режима редактирования
  const EDIT_SCRIPT = `
<script id="__roboweb_edit__">
(function() {
  var editMode = false;
  var highlighted = null;
  var selected = null;
  var ANY = '*';

  // ЗАЩИТА ОТ БИТЫХ КАРТИНОК: если <img> не загрузился (модель могла указать несуществующий
  // URL), подменяем его на гарантированно рабочую заглушку по размеру — вместо сломанного значка.
  function fixBrokenImage(img) {
    if (img.getAttribute('data-roboweb-fixed')) return;
    img.setAttribute('data-roboweb-fixed', '1');
    var w = img.getAttribute('width') || img.naturalWidth || img.clientWidth || 800;
    var h = img.getAttribute('height') || img.naturalHeight || img.clientHeight || 600;
    w = parseInt(w, 10) || 800; h = parseInt(h, 10) || 600;
    var seed = encodeURIComponent((img.getAttribute('alt') || 'photo').slice(0, 20));
    img.src = 'https://picsum.photos/seed/' + seed + '/' + w + '/' + h;
  }
  document.addEventListener('error', function(e) {
    var t = e.target;
    if (t && t.tagName === 'IMG') fixBrokenImage(t);
  }, true);
  // Проверяем уже загруженные к моменту старта скрипта картинки (могли сломаться до подписки).
  function scanBrokenImages() {
    var imgs = document.getElementsByTagName('img');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete && imgs[i].naturalWidth === 0) fixBrokenImage(imgs[i]);
    }
  }
  // srcdoc-документ часто уже готов к моменту запуска скрипта — DOMContentLoaded не сработает,
  // поэтому проверяем сразу по состоянию документа.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanBrokenImages);
  } else {
    scanBrokenImages();
  }
  // Подстраховка для медленно грузящихся картинок — повторная проверка чуть позже.
  setTimeout(scanBrokenImages, 1500);

  // В превью ссылки не должны навигировать внутри iframe. Из-за <base href="..."> на
  // фиктивный домен (см. PREVIEW_BASE в Builder.tsx) даже клик по "#section" браузер может
  // попытаться резолвить как переход на другой адрес — поэтому обрабатываем якоря вручную
  // через scrollIntoView, не полагаясь на встроенную навигацию по фрагменту.
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    e.preventDefault();
    e.stopPropagation();
    if (href.indexOf('#') === 0 && href.length > 1) {
      try {
        var target = document.getElementById(href.slice(1)) || document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch(err) {}
      return;
    }
    if (href === '#') return; // ссылка-заглушка ("#") — ничего не делаем
    // Внешние ссылки открываем в новой вкладке родителя, внутренние переходы игнорируем
    if (/^https?:/i.test(href)) {
      try { window.parent.postMessage({ type: 'ROBOWEB_OPEN_LINK', href: href }, '*'); } catch(err) {}
    }
  }, true);

  function getPath(el) {
    var path = [];
    var cur = el;
    while (cur && cur !== document.body) {
      var idx = Array.from(cur.parentNode ? cur.parentNode.children : []).indexOf(cur);
      path.unshift(cur.tagName.toLowerCase() + ':nth-child(' + (idx + 1) + ')');
      cur = cur.parentNode;
    }
    return path.join(' > ');
  }

  function getStyles(el) {
    var cs = window.getComputedStyle(el);
    return {
      color: rgbToHex(cs.color),
      backgroundColor: rgbToHex(cs.backgroundColor),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      textAlign: cs.textAlign,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      borderRadius: cs.borderRadius,
      opacity: cs.opacity,
      tag: el.tagName.toLowerCase(),
    };
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return 'transparent';
    var m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (!m) return rgb;
    return '#' + [m[1],m[2],m[3]].map(function(x){ return parseInt(x).toString(16).padStart(2,'0'); }).join('');
  }

  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'ROBOWEB_EDIT_MODE') {
      editMode = e.data.enabled;
      document.body.style.cursor = editMode ? 'crosshair' : '';
      if (!editMode) {
        if (highlighted) { highlighted.style.outline = ''; highlighted.style.boxShadow = ''; highlighted = null; }
        if (selected) { selected.style.outline = ''; selected.style.boxShadow = ''; selected = null; }
      }
    }
    if (e.data.type === 'ROBOWEB_APPLY_TEXT') {
      try { var el = document.querySelector(e.data.path); if (el) el.textContent = e.data.text; } catch(err) {}
    }
    if (e.data.type === 'ROBOWEB_APPLY_STYLE') {
      try {
        var el = document.querySelector(e.data.path);
        if (el) { el.style[e.data.prop] = e.data.value; }
      } catch(err) {}
    }
  });

  document.addEventListener('mouseover', function(e) {
    if (!editMode) return;
    var t = e.target;
    if (t === selected) return;
    if (highlighted && highlighted !== t) { highlighted.style.outline = ''; highlighted.style.boxShadow = ''; }
    t.style.outline = '2px dashed #4f6ef7';
    t.style.outlineOffset = '2px';
    t.style.boxShadow = '0 0 0 4px rgba(255,255,255,0.6)';
    highlighted = t;
  });

  document.addEventListener('mouseout', function(e) {
    if (!editMode) return;
    var t = e.target;
    if (t === highlighted && t !== selected) { t.style.outline = ''; t.style.boxShadow = ''; highlighted = null; }
  });

  document.addEventListener('click', function(e) {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    var t = e.target;
    if (selected && selected !== t) { selected.style.outline = ''; selected.style.boxShadow = ''; }
    selected = t;
    t.style.outline = '2px solid #4f6ef7';
    t.style.outlineOffset = '2px';
    t.style.boxShadow = '0 0 0 4px rgba(255,255,255,0.6)';
    var rect = t.getBoundingClientRect();
    window.parent.postMessage({
      type: 'ROBOWEB_CLICK',
      text: t.textContent || '',
      path: getPath(t),
      styles: getStyles(t),
      x: rect.left + rect.width / 2,
      y: rect.bottom,
    }, '*');
  }, true);
})();
</` + `script>`;

  // КЛЮЧЕВАЯ ЗАЩИТА: <base> с несуществующим доменом. Без него ЛЮБАЯ относительная ссылка
  // в сгенерированном сайте (href="/", href="/about", переход через форму или JS window.location)
  // резолвится браузером относительно текущей страницы редактора — то есть в корень roboweb.site —
  // и iframe (у которого есть allow-same-origin) послушно загружает туда весь проект целиком.
  // Перехват кликов по <a> отдельно НЕ спасает от переходов через формы/скрипты, поэтому <base>
  // обязателен: он делает так, что относительный путь ведёт в никуда, а не на настоящий сайт.
  const PREVIEW_BASE = '<base href="https://preview-sandbox.invalid/">';

  // HTML с внедрённым скриптом для режима редактирования
  const htmlWithEditScript = (rawHtml: string) => {
    if (!rawHtml) return rawHtml;
    const inject = PREVIEW_BASE + EDIT_SCRIPT;
    // Скрипт лучше вставлять внутрь <head> или в начало <body>. Вставка ПЕРЕД <!DOCTYPE>
    // переводит браузер в quirks mode и ломает вёрстку превью — поэтому так не делаем.
    if (/<head[\s>]/i.test(rawHtml)) {
      return rawHtml.replace(/<head([^>]*)>/i, `<head$1>${inject}`);
    }
    if (/<body[\s>]/i.test(rawHtml)) {
      return rawHtml.replace(/<body([^>]*)>/i, `<body$1>${inject}`);
    }
    // Нет ни head, ни body (обрезанный/невалидный HTML) — оборачиваем в корректный документ,
    // чтобы браузер не пытался достроить структуру сам и не показывал артефакты.
    return `<!DOCTYPE html><html><head>${inject}</head><body>${rawHtml}</body></html>`;
  };

  // Слушаем сообщения от iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data) return;
      // Внешняя ссылка из превью — открываем в новой вкладке, а не внутри iframe
      if (e.data.type === 'ROBOWEB_OPEN_LINK' && typeof e.data.href === 'string') {
        window.open(e.data.href, '_blank', 'noopener,noreferrer');
        return;
      }
      if (e.data.type !== 'ROBOWEB_CLICK') return;
      setEditPopover({ x: e.data.x, y: e.data.y, text: e.data.text, path: e.data.path });
      setEditValue(e.data.text);
      if (e.data.styles) setPropsPanel({ path: e.data.path, ...e.data.styles });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Включение/выключение edit-режима — шлём сообщение в iframe
  const toggleEditMode = () => {
    const next = !editMode;
    setEditMode(next);
    setEditPopover(null);
    iframeRef.current?.contentWindow?.postMessage({ type: 'ROBOWEB_EDIT_MODE', enabled: next }, '*');
  };

  // Сохраняем изменённый текст в HTML и обновляем превью
  const applyTextEdit = () => {
    if (!editPopover) return;
    iframeRef.current?.contentWindow?.postMessage({
      type: 'ROBOWEB_APPLY_TEXT',
      path: editPopover.path,
      text: editValue,
    }, '*');
    // Патчим исходный HTML через innerHTML замену
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    try {
      const el = doc.querySelector(editPopover.path);
      if (el) el.textContent = editValue;
    } catch { /* сложный path — игнорируем */ }
    const newHtml = doc.documentElement.outerHTML;
    setHtml(newHtml);
    setVersions(prev => [
      { html: newHtml, label: lang === 'ru' ? 'Правка текста' : 'Text edit', ts: Date.now() },
      ...prev.slice(0, 9),
    ]);
    setEditPopover(null);
  };

  // Применяем стиль через iframe + патчим HTML
  const applyStyle = (prop: string, value: string) => {
    if (!propsPanel) return;
    iframeRef.current?.contentWindow?.postMessage({ type: 'ROBOWEB_APPLY_STYLE', path: propsPanel.path, prop, value }, '*');
    setPropsPanel(prev => prev ? { ...prev, [prop]: value } : null);
    // Патчим HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    try {
      const el = doc.querySelector(propsPanel.path) as HTMLElement | null;
      if (el) (el.style as unknown as Record<string, string>)[prop] = value;
    } catch { /* ignore */ }
    const newHtml = doc.documentElement.outerHTML;
    setHtml(newHtml);
    setVersions(prev => [
      { html: newHtml, label: lang === 'ru' ? 'Правка стилей' : 'Style edit', ts: Date.now() },
      ...prev.slice(0, 9),
    ]);
  };

  // Голосовой ввод
  const toggleRecording = () => {
    const SpeechRecognitionAPI = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert(lang === 'ru' ? 'Голосовой ввод не поддерживается в вашем браузере' : 'Voice input not supported in your browser');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    // Останавливаем предыдущий экземпляр, если он ещё активен — чтобы не было двух распознаваний.
    recognitionRef.current?.abort();
    const rec = new SpeechRecognitionAPI();
    rec.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(transcript);
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  // Останавливаем распознавание голоса при уходе со страницы редактора —
  // иначе микрофон мог оставаться активным (утечка ресурса).
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Валидация типа: только изображения (защита от подмены расширения).
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: lang === 'ru' ? 'Можно загрузить только изображение' : 'Only images allowed' });
      e.target.value = '';
      return;
    }
    // Валидация размера: до 10 МБ, чтобы не перегрузить память браузера и запрос.
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({ variant: 'destructive', title: lang === 'ru' ? 'Файл слишком большой (макс. 10 МБ)' : 'File too large (max 10 MB)' });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedImage({ url: ev.target?.result as string, name: file.name });
      if (!input) setInput(lang === 'ru' ? 'Создай сайт по этому изображению' : 'Create a website based on this image');
    };
    // Обработка ошибки чтения — иначе битый файл молча попадал в запрос.
    reader.onerror = () => {
      toast({ variant: 'destructive', title: lang === 'ru' ? 'Не удалось прочитать файл' : 'Failed to read file' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || !session) return;
    setGeneratingImage(true);
    setImageGenError('');
    try {
      const result = await apiGenerateImage(session, imagePrompt.trim(), projectId ? Number(projectId) : undefined);
      setQuotaExceeded(false);
      if (typeof result.remaining === 'number') {
        setRemaining(result.remaining);
        if (result.remaining <= LOW_BALANCE_THRESHOLD) {
          toast({
            title: lang === 'ru' ? '⚡ Заканчиваются запросы к AI' : '⚡ AI requests running low',
            description: lang === 'ru'
              ? `Осталось ${result.remaining} запросов. Пополните энергию или смените тариф, чтобы не потерять доступ.`
              : `${result.remaining} requests left. Top up energy or upgrade your plan to avoid losing access.`,
          });
        }
      }
      setAttachedImage({ url: result.url, name: result.file_name, alreadyUploaded: true });
      setShowImageGen(false);
      setImagePrompt('');
      if (!input) setInput(lang === 'ru' ? 'Используй это изображение на сайте' : 'Use this image on the site');
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : tr('builderError', lang);
      const message = rawMessage === 'AI_SERVICE_UNAVAILABLE' ? tr('builderAiUnavailable', lang) : rawMessage;
      setImageGenError(message);
      if (rawMessage.includes('Лимит') || rawMessage.includes('limit')) {
        setQuotaExceeded(true);
        setRemaining(0);
      }
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleUseFileInChat = (file: { file_url: string; file_name: string }) => {
    setAttachedImage({ url: file.file_url, name: file.file_name, alreadyUploaded: true });
    setRightTab('preview');
    setSidebarOpen(true);
    if (!input) setInput(lang === 'ru' ? 'Используй это изображение на сайте' : 'Use this image on the site');
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const msgCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className={`flex flex-col h-screen bg-background overflow-hidden ${builderTheme === 'dark' ? 'dark' : ''}`}>

      {/* TOP BAR */}
      <header className="flex items-center justify-between gap-2 px-3 sm:px-4 h-14 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
            title={lang === 'ru' ? 'Свернуть чат' : 'Collapse chat'}
          >
            <Icon name="PanelLeft" size={15} />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={14} />
            </span>
            <span className="text-foreground hidden sm:block tracking-tight">Roboweb</span>
          </Link>
          {projectId && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary rounded-lg px-2.5 py-1.5 border border-border">
              <Icon name="Layers" size={11} />
              #{projectId}
            </span>
          )}
          {remaining !== null && (
            <Link
              to="/dashboard?tab=plan"
              title={lang === 'ru' ? `Осталось ${remaining} запросов. Нажмите, чтобы пополнить энергию` : `${remaining} requests left. Click to top up energy`}
              className={`hidden sm:flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-1 shrink-0 whitespace-nowrap transition-colors ${remaining <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'}`}
            >
              <Icon name="Zap" size={11} className="shrink-0" />
              {remaining}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Device switcher */}
          <div className="hidden lg:flex items-center gap-0.5 bg-secondary rounded-lg p-1 border border-border">
            {([
              ['desktop', 'Monitor', lang === 'ru' ? 'Компьютер' : 'Desktop'],
              ['tablet', 'Tablet', lang === 'ru' ? 'Планшет' : 'Tablet'],
              ['mobile', 'Smartphone', lang === 'ru' ? 'Телефон' : 'Mobile'],
            ] as const).map(([d, icon, deviceLabel]) => (
              <button key={d} onClick={() => setDevice(d)}
                className={`grid h-7 w-7 place-items-center rounded-md transition-all ${device === d ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'}`}
                title={deviceLabel}>
                <Icon name={icon} size={13} />
              </button>
            ))}
          </div>

          {/* Preview / Code / Core tabs */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1 border border-border shrink-0">
            {([['preview', 'Eye', tr('builderPreview', lang)], ['code', 'Code', tr('builderCode', lang)], ['core', 'Database', lang === 'ru' ? 'Ядро' : 'Core']] as const).map(([tab, icon, label]) => (
              <button key={tab} onClick={() => { setRightTab(tab); if (tab === 'code') setCodeEditorValue(html); }}
                title={label}
                className={`flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded-md text-xs font-medium transition-all ${rightTab === tab ? 'bg-card text-foreground border border-border shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'}`}>
                <Icon name={icon} size={13} />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-5 bg-border shrink-0" />

          {/* Versions */}
          {versions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowVersions(v => !v)}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground transition-colors text-muted-foreground"
                title={lang === 'ru' ? 'История версий' : 'Version history'}
              >
                <Icon name="History" size={13} />
                <span className="hidden sm:inline">{versions.length}</span>
              </button>
              {showVersions && (
                <div className="absolute right-0 top-10 z-50 w-72 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl p-2">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 py-1.5 mb-1">
                    {lang === 'ru' ? 'История версий' : 'Version history'}
                  </div>
                  {versions.map((v, i) => (
                    <button key={v.ts} onClick={() => restoreVersion(v)}
                      className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg hover:bg-secondary transition-colors text-left group">
                      <div className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5 text-xs font-bold">
                        {versions.length - i}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground truncate">{v.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(v.ts).toLocaleTimeString(lang === 'ru' ? 'ru' : 'en', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <Icon name="RotateCcw" size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Режим редактирования текста прямо на превью */}
          {html && rightTab === 'preview' && (
            <button onClick={toggleEditMode}
              className={`hidden sm:grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors ${
                editMode
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-secondary hover:bg-secondary/70 hover:text-foreground text-muted-foreground'
              }`}
              title={lang === 'ru' ? 'Изменить текст на сайте' : 'Edit text on the site'}>
              <Icon name="MousePointer" size={13} />
            </button>
          )}

          {/* Тема интерфейса редактора */}
          <button onClick={toggleBuilderTheme}
            className="hidden sm:grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground transition-colors text-muted-foreground"
            title={lang === 'ru' ? 'Тема интерфейса' : 'Interface theme'}>
            <Icon name={builderTheme === 'dark' ? 'Sun' : 'Moon'} size={13} />
          </button>

          {/* Refresh preview */}
          {html && (
            <button onClick={() => setIframeKey(k => k + 1)}
              className="hidden md:grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground transition-colors text-muted-foreground"
              title={lang === 'ru' ? 'Обновить превью' : 'Refresh preview'}>
              <Icon name="RefreshCw" size={13} />
            </button>
          )}

          {/* Open in new tab */}
          {html && (
            <button onClick={openInNewTab}
              className="hidden lg:grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground transition-colors text-muted-foreground"
              title={lang === 'ru' ? 'Открыть в новой вкладке' : 'Open in new tab'}>
              <Icon name="ExternalLink" size={13} />
            </button>
          )}

          <button onClick={handleDownload} disabled={!html}
            className="hidden md:flex items-center gap-1.5 h-8 px-2.5 shrink-0 rounded-lg text-xs border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground text-muted-foreground transition-colors disabled:opacity-30">
            <Icon name="Download" size={13} />
            <span className="hidden lg:inline">{tr('builderDownload', lang)}</span>
          </button>

          <button onClick={handleSaveToFiles} disabled={!html || savingToFiles}
            title={lang === 'ru' ? 'Сохранить в моё хранилище файлов' : 'Save to my file storage'}
            className="hidden md:flex items-center gap-1.5 h-8 px-2.5 shrink-0 rounded-lg text-xs border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground text-muted-foreground transition-colors disabled:opacity-30">
            <Icon name={savingToFiles ? 'Loader' : saveToFilesDone ? 'Check' : 'FolderOpen'} size={13} className={savingToFiles ? 'animate-spin' : ''} />
            <span className="hidden lg:inline">
              {saveToFilesDone ? (lang === 'ru' ? 'Сохранено' : 'Saved') : (lang === 'ru' ? 'В хранилище' : 'To storage')}
            </span>
          </button>

          <Button size="sm" disabled={!html || publishing || !projectId} onClick={publishedSlug ? () => setShowPublishModal(true) : handlePublish} className="h-8 rounded-lg text-xs px-2.5 gap-1.5 shrink-0">
            <Icon name={publishing ? 'Loader' : publishedSlug ? 'CheckCircle' : 'Globe'} size={13} className={publishing ? 'animate-spin' : ''} />
            <span className="hidden md:inline">
              {publishing ? (lang === 'ru' ? 'Публикуем…' : 'Publishing…') : publishedSlug ? (lang === 'ru' ? 'Опубликовано' : 'Published') : tr('builderPublish', lang)}
            </span>
          </Button>

          <button type="button" onClick={() => setShowDomainModal(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border border-border bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Icon name="Link" size={13} />
            <span className="hidden lg:inline">{lang === 'ru' ? 'Домен' : 'Domain'}</span>
          </button>

          <div className="hidden sm:block shrink-0">
            <LangSwitcher lang={lang} />
          </div>

          <div className="hidden sm:grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {initials}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Прозрачный оверлей поверх iframe во время ресайза чата — без него mousemove/mouseup
            "тонут" внутри iframe (у него свой контекст событий) и перетаскивание залипает. */}
        {isResizingChat && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}

        {/* LEFT — CHAT */}
        {sidebarOpen && (
          <div
            className="flex flex-col w-full shrink-0 bg-card sm:[width:var(--chat-w)]"
            style={{ '--chat-w': `${chatWidth}px` } as CSSProperties}
          >

            {/* Chat header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0 bg-background">
              <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
                <Icon name="Bot" size={17} />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">Roboweb AI</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-emerald-500 font-medium">● {lang === 'ru' ? 'онлайн' : 'online'}</span>
                </div>
              </div>
              {messages.length > 0 && (
                <button onClick={handleClearChat}
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title={lang === 'ru' ? 'Очистить чат' : 'Clear chat'}>
                  <Icon name="Trash2" size={14} />
                </button>
              )}
              {loading && (
                <div className="flex gap-1 ml-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {messages.length === 0 ? (
                <div className="pt-2">
                  {showEnergyBonus && (
                    <div className="flex items-start gap-2.5 bg-primary/10 border border-primary/20 rounded-xl px-3.5 py-3 mb-5 text-left">
                      <Icon name="Gift" size={16} className="text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {lang === 'ru' ? 'Дарим 10 энергии на старт!' : 'You got 10 free energy!'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lang === 'ru'
                            ? 'Попробуйте разные модели ИИ — Claude, GPT-4o и Gemini — на выбор.'
                            : 'Try different AI models — Claude, GPT-4o and Gemini — your choice.'}
                        </p>
                      </div>
                      <button onClick={dismissEnergyBonus} className="shrink-0 text-primary/60 hover:text-primary">
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                  )}

                  {/* Приветственное сообщение — вместо блоков с примерами сайтов */}
                  <div className="flex gap-2.5 justify-start">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 mt-0.5 shadow-sm">
                      <Icon name="Bot" size={15} />
                    </div>
                    <div className="flex-1 min-w-0 text-[14px] font-semibold leading-[1.55] text-foreground py-1">
                      {WELCOME_MESSAGE(lang)}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => {
                  const msgTime = new Date().toLocaleTimeString(lang === 'ru' ? 'ru' : 'en', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && (
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 mt-0.5 shadow-sm">
                          <Icon name="Bot" size={15} />
                        </div>
                      )}
                      <div className={`text-[14px] font-semibold leading-[1.55] ${
                        m.role === 'user'
                          ? 'max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 shadow-sm'
                          : 'flex-1 min-w-0 text-foreground py-1'
                      }`}>
                        {m.role === 'user' && (
                          <div className="text-[10px] text-primary-foreground/60 mb-1.5">{msgTime}</div>
                        )}
                        {m.role === 'assistant' && m.content === '' ? (
                          <GenerationProgress lang={lang} isEdit={!!m.isEdit} />
                        ) : m.isHtml ? (
                          <TypingReport
                            lang={lang}
                            intro={m.intro}
                            summary={m.summary}
                            steps={m.steps}
                            design={m.design}
                            sections={m.sections}
                            suggestions={m.suggestions}
                            isEdit={m.isEdit}
                            animate={!!m.justGenerated && i === messages.length - 1 && !loading}
                            onTick={() => scrollChatToBottom('auto')}
                            onSuggestion={(prompt) => sendMessage(prompt)}
                            suggestionsDisabled={loading}
                          />
                        ) : m.content}
                      </div>
                      {m.role === 'user' && (
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                          {initials}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick edits panel */}
            {showQuickEdits && html && (
              <div className="border-t border-border bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                  {lang === 'ru' ? 'Быстрые правки' : 'Quick edits'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_EDITS.map(e => (
                    <button key={e.label} onClick={() => sendMessage(e.prompt)}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 hover:border-border transition-all text-left">
                      <Icon name={e.icon} size={12} className="text-primary shrink-0" />
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section library panel — добавление готовых секций в один клик */}
            {showSectionLibrary && html && (
              <div className="border-t border-border bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                  {lang === 'ru' ? 'Добавить секцию' : 'Add section'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SECTION_LIBRARY.map(e => (
                    <button key={e.label} onClick={() => { sendMessage(e.prompt); setShowSectionLibrary(false); }}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-secondary border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all text-left">
                      <Icon name={e.icon} fallback="Square" size={12} className="text-primary shrink-0" />
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Low balance / quota banner */}
            {remaining !== null && remaining <= LOW_BALANCE_THRESHOLD && (
              <div className={`mx-3 mt-3 rounded-xl px-3 py-2.5 flex items-start gap-2 text-xs ${
                remaining <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              }`}>
                <Icon name={remaining <= 0 ? 'AlertCircle' : 'Zap'} size={14} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">
                    {remaining <= 0
                      ? (lang === 'ru' ? 'Лимит AI-запросов исчерпан' : 'AI request limit reached')
                      : (lang === 'ru' ? `Осталось ${remaining} запросов к AI` : `${remaining} AI requests left`)}
                  </p>
                  <p className="opacity-80 mt-0.5">
                    {lang === 'ru' ? 'Пополните энергию или смените тариф' : 'Top up energy or upgrade your plan'}
                  </p>
                </div>
                <Link to="/dashboard?tab=plan" className="shrink-0 font-semibold underline hover:no-underline">
                  {lang === 'ru' ? 'Тарифы' : 'Plans'}
                </Link>
              </div>
            )}

            {/* Подсказка: предложить более подходящую модель под тип запроса */}
            {showModelHint && suggestedModel && (
              <div className="mx-3 mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs bg-primary/10 text-primary">
                <Icon name="Sparkles" size={14} className="shrink-0" />
                <p className="flex-1">
                  {suggestedModel === 'gemini'
                    ? (lang === 'ru'
                        ? 'Для сложного и интерактивного сайта лучше подойдёт Gemini'
                        : 'Gemini is better suited for complex, interactive sites')
                    : (lang === 'ru'
                        ? 'Для бизнес-сайта или лендинга лучше подойдёт Claude'
                        : 'Claude is better suited for business sites and landings')}
                </p>
                <button
                  onClick={() => { setAiModel(suggestedModel); setDismissedModelHint(true); }}
                  className="shrink-0 font-semibold underline hover:no-underline">
                  {lang === 'ru' ? 'Переключить' : 'Switch'}
                </button>
                <button onClick={() => setDismissedModelHint(true)} className="shrink-0 text-primary/60 hover:text-primary">
                  <Icon name="X" size={13} />
                </button>
              </div>
            )}

            {/* Умное уточнение: предложить выбрать стиль дизайна для нового сайта */}
            {showStyleHint && (
              <div className="mx-3 mt-3 rounded-xl px-3 py-2.5 bg-secondary border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Palette" size={14} className="text-primary shrink-0" />
                  <p className="flex-1 text-xs text-foreground font-medium">
                    {lang === 'ru' ? 'Какой стиль дизайна предпочитаете?' : 'Which design style do you prefer?'}
                  </p>
                  <button onClick={() => setDismissedStyleHint(true)} className="shrink-0 text-muted-foreground hover:text-foreground">
                    <Icon name="X" size={13} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'minimal' as const, label: lang === 'ru' ? 'Минимализм' : 'Minimal' },
                    { id: 'premium' as const, label: lang === 'ru' ? 'Премиум' : 'Premium' },
                    { id: 'bright' as const, label: lang === 'ru' ? 'Яркий' : 'Bright' },
                    { id: 'dark' as const, label: lang === 'ru' ? 'Тёмный' : 'Dark' },
                  ].map(s => (
                    <button key={s.id}
                      onClick={() => { setSiteStyle(s.id); setDismissedStyleHint(true); }}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-background border border-border hover:border-primary hover:text-primary transition-colors">
                      {s.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setDismissedStyleHint(true)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    {lang === 'ru' ? 'Пусть решит ИИ' : 'Let AI decide'}
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border bg-background">
              {/* Прикреплённое изображение */}
              {attachedImage && (
                <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-secondary border border-border rounded-xl">
                  <img src={attachedImage.url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                  <span className="text-[11px] text-muted-foreground flex-1 truncate">
                    {attachedImage.name}
                    {attachedImage.alreadyUploaded && (
                      <span className="text-primary ml-1.5">· {lang === 'ru' ? 'из хранилища' : 'from storage'}</span>
                    )}
                  </span>
                  <button onClick={() => setAttachedImage(null)} className="text-muted-foreground hover:text-red-400 transition-colors">
                    <Icon name="X" size={13} />
                  </button>
                </div>
              )}

              <div className={`flex flex-col bg-secondary/50 border rounded-2xl transition-all ${isRecording ? 'border-red-500/50' : 'border-border focus-within:border-primary/50 focus-within:bg-secondary/70'}`}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? (lang === 'ru' ? '🎙 Говорите…' : '🎙 Speaking…') : tr('builderInputPlaceholder', lang)}
                  rows={1}
                  className={`w-full bg-transparent text-[15px] font-medium resize-none outline-none min-h-[52px] max-h-[220px] px-3.5 pt-3 pb-1.5 leading-relaxed ${isRecording ? 'text-red-400 placeholder:text-red-400/50' : 'text-foreground placeholder:text-muted-foreground/50'}`}
                />

                {/* Toolbar */}
                <div className="flex items-center flex-wrap gap-1 px-2 pb-2 pt-0.5">
                  {/* Быстрые правки */}
                  {html && (
                    <button onClick={() => { setShowQuickEdits(v => !v); setShowSectionLibrary(false); }}
                      className={`grid h-7 w-7 place-items-center rounded-lg transition-colors shrink-0 ${showQuickEdits ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                      title={lang === 'ru' ? 'Быстрые правки' : 'Quick edits'}>
                      <Icon name="Wand2" size={14} />
                    </button>
                  )}

                  {/* Библиотека секций — добавить готовый блок */}
                  {html && (
                    <button onClick={() => { setShowSectionLibrary(v => !v); setShowQuickEdits(false); }}
                      className={`grid h-7 w-7 place-items-center rounded-lg transition-colors shrink-0 ${showSectionLibrary ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                      title={lang === 'ru' ? 'Добавить секцию' : 'Add section'}>
                      <Icon name="LayoutGrid" fallback="Plus" size={14} />
                    </button>
                  )}

                  {/* Визуальный редактор */}
                  {html && (
                    <button onClick={toggleEditMode}
                      className={`grid h-7 w-7 place-items-center rounded-lg transition-colors shrink-0 ${editMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                      title={lang === 'ru' ? 'Визуальный редактор' : 'Visual editor'}>
                      <Icon name="MousePointer" size={14} />
                    </button>
                  )}

                  {/* Прикрепить изображение */}
                  <button onClick={() => imageInputRef.current?.click()}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                    title={lang === 'ru' ? 'Прикрепить изображение' : 'Attach image'}>
                    <Icon name="Image" size={14} />
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                  {/* Сгенерировать изображение через DALL-E */}
                  <button onClick={() => { setShowImageGen(true); setImageGenError(''); }}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                    title={lang === 'ru' ? 'Сгенерировать изображение (DALL-E)' : 'Generate image (DALL-E)'}>
                    <Icon name="ImagePlus" size={14} />
                  </button>

                  {/* Модель AI */}
                  <div className="relative shrink-0">
                    <button onClick={() => setShowModelMenu(v => !v)}
                      className="flex items-center gap-1 h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-[11px] font-semibold"
                      title={lang === 'ru' ? 'Модель AI' : 'AI model'}>
                      <Icon name="Cpu" size={13} />
                      <span className="hidden sm:inline">{aiModel === 'gpt-4o' ? 'GPT-4o' : aiModel === 'gemini' ? 'Gemini' : aiModel === 'opus' ? 'Opus 4.8' : aiModel === 'sonnet' ? 'Sonnet 5' : 'Claude'}</span>
                    </button>
                    {showModelMenu && (
                      <div className="absolute bottom-10 left-0 z-50 w-60 max-w-[calc(100vw-2rem)] bg-secondary border border-border rounded-2xl shadow-2xl p-1.5">
                        {[
                          {
                            id: 'gemini' as const,
                            label: 'Gemini',
                            desc: lang === 'ru' ? 'Быстрый и универсальный' : 'Fast & versatile',
                            hint: lang === 'ru'
                              ? 'Оптимальный выбор для большинства сайтов'
                              : 'Best choice for most websites',
                          },
                          {
                            id: 'claude' as const,
                            label: 'Claude',
                            desc: lang === 'ru' ? 'Точный и аккуратный' : 'Precise & polished',
                            hint: lang === 'ru'
                              ? 'Лучше для бизнес-сайтов и лендингов'
                              : 'Best for business sites and landings',
                          },
                          {
                            id: 'gpt-4o' as const,
                            label: 'GPT-4o',
                            desc: lang === 'ru' ? 'Креативный' : 'Creative',
                            hint: lang === 'ru'
                              ? 'Лучше для нестандартного дизайна'
                              : 'Best for bold, creative design',
                          },
                          {
                            id: 'sonnet' as const,
                            label: 'Sonnet 5',
                            desc: lang === 'ru' ? 'Мощный, медленнее' : 'Powerful, slower',
                            hint: lang === 'ru'
                              ? 'Максимальное качество для сложных сайтов'
                              : 'Top quality for complex sites',
                          },
                          {
                            id: 'opus' as const,
                            label: 'Opus 4.8',
                            desc: lang === 'ru' ? 'Флагман, медленный' : 'Flagship, slow',
                            hint: lang === 'ru'
                              ? 'Самая мощная модель. Лучше при таймауте 90 сек'
                              : 'Most powerful model. Best with 90s timeout',
                          },
                        ].map(m => (
                          <button key={m.id}
                            onClick={() => { setAiModel(m.id); setShowModelMenu(false); }}
                            className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl hover:bg-secondary/70 transition-colors text-left">
                            <div className={`grid h-6 w-6 place-items-center rounded-lg shrink-0 mt-0.5 ${aiModel === m.id ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}>
                              <Icon name={aiModel === m.id ? 'Check' : 'Cpu'} size={12} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-foreground">{m.label}</span>
                                {suggestedModel === m.id && aiModel !== m.id && (
                                  <span className="text-[9px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                                    {lang === 'ru' ? 'Рекомендуется' : 'Recommended'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                              <div className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">{m.hint}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Стиль сайта — только для создания нового (при правке html уже есть) */}
                  {!html && (
                    <div className="relative shrink-0">
                      <button onClick={() => setShowStyleMenu(v => !v)}
                        className={`flex items-center gap-1 h-7 px-2 rounded-lg transition-colors text-[11px] font-semibold ${siteStyle ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                        title={lang === 'ru' ? 'Стиль дизайна' : 'Design style'}>
                        <Icon name="Palette" size={13} />
                        <span className="hidden sm:inline">
                          {siteStyle === 'minimal' ? (lang === 'ru' ? 'Минимализм' : 'Minimal')
                            : siteStyle === 'premium' ? (lang === 'ru' ? 'Премиум' : 'Premium')
                            : siteStyle === 'bright' ? (lang === 'ru' ? 'Яркий' : 'Bright')
                            : siteStyle === 'dark' ? (lang === 'ru' ? 'Тёмный' : 'Dark')
                            : (lang === 'ru' ? 'Стиль' : 'Style')}
                        </span>
                      </button>
                      {showStyleMenu && (
                        <div className="absolute bottom-10 left-0 z-50 w-56 max-w-[calc(100vw-2rem)] bg-secondary border border-border rounded-2xl shadow-2xl p-1.5">
                          {[
                            { id: '' as const, icon: 'Wand2', label: lang === 'ru' ? 'Авто (под нишу)' : 'Auto', desc: lang === 'ru' ? 'ИИ подберёт стиль сам' : 'AI picks the style' },
                            { id: 'minimal' as const, icon: 'Minus', label: lang === 'ru' ? 'Минимализм' : 'Minimal', desc: lang === 'ru' ? 'Чисто, светло, воздушно' : 'Clean & airy' },
                            { id: 'premium' as const, icon: 'Crown', label: lang === 'ru' ? 'Премиум' : 'Premium', desc: lang === 'ru' ? 'Дорого и элегантно' : 'Luxury & elegant' },
                            { id: 'bright' as const, icon: 'Sparkles', label: lang === 'ru' ? 'Яркий' : 'Bright', desc: lang === 'ru' ? 'Сочно и энергично' : 'Vivid & energetic' },
                            { id: 'dark' as const, icon: 'Moon', label: lang === 'ru' ? 'Тёмный' : 'Dark', desc: lang === 'ru' ? 'Тёмный с акцентом' : 'Dark with accent' },
                          ].map(s => (
                            <button key={s.id}
                              onClick={() => { setSiteStyle(s.id); setShowStyleMenu(false); }}
                              className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl hover:bg-secondary/70 transition-colors text-left">
                              <div className={`grid h-6 w-6 place-items-center rounded-lg shrink-0 mt-0.5 ${siteStyle === s.id ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}>
                                <Icon name={siteStyle === s.id ? 'Check' : s.icon} fallback="Palette" size={12} />
                              </div>
                              <div>
                                <div className="text-xs font-medium text-foreground">{s.label}</div>
                                <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Расширения */}
                  <div className="relative shrink-0">
                    <button onClick={() => setShowExtensions(v => !v)}
                      className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${showExtensions ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                      title={lang === 'ru' ? 'Расширения' : 'Extensions'}>
                      <Icon name="Puzzle" size={14} />
                    </button>
                    {showExtensions && (
                      <div className="absolute bottom-10 left-0 z-50 w-60 bg-secondary border border-border rounded-2xl shadow-2xl p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">{lang === 'ru' ? 'Расширения' : 'Extensions'}</p>
                        {[
                          { icon: 'ShoppingCart', label: lang === 'ru' ? 'Интернет-магазин' : 'E-commerce', desc: lang === 'ru' ? 'Каталог, корзина, оплата' : 'Catalog, cart, checkout' },
                          { icon: 'MessageSquare', label: lang === 'ru' ? 'Онлайн-чат' : 'Live chat', desc: lang === 'ru' ? 'Виджет чата на сайте' : 'Chat widget on site' },
                          { icon: 'BarChart2', label: lang === 'ru' ? 'Аналитика' : 'Analytics', desc: lang === 'ru' ? 'Google Analytics, Яндекс' : 'Google Analytics, Yandex' },
                          { icon: 'CreditCard', label: lang === 'ru' ? 'Оплата' : 'Payments', desc: lang === 'ru' ? 'Stripe, ЮКасса' : 'Stripe, YooKassa' },
                          { icon: 'Mail', label: lang === 'ru' ? 'Email-рассылка' : 'Email list', desc: lang === 'ru' ? 'Форма подписки' : 'Subscription form' },
                        ].map(ext => (
                          <button key={ext.label}
                            onClick={() => { sendMessage(`Добавь расширение: ${ext.label}`); setShowExtensions(false); }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-secondary/70 transition-colors text-left group">
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                              <Icon name={ext.icon} size={13} />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-foreground group-hover:text-foreground">{ext.label}</div>
                              <div className="text-[10px] text-muted-foreground">{ext.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1" />

                  {input.length > 0 && <span className="text-[10px] text-muted-foreground/70 mr-1">{input.length}</span>}

                  {/* Голосовой ввод */}
                  <button onClick={toggleRecording}
                    className={`grid h-7 w-7 place-items-center rounded-lg transition-all shrink-0 ${isRecording ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                    title={lang === 'ru' ? (isRecording ? 'Остановить запись' : 'Голосовой ввод') : (isRecording ? 'Stop recording' : 'Voice input')}>
                    <Icon name={isRecording ? 'MicOff' : 'Mic'} size={14} />
                  </button>

                  {/* Отправить */}
                  <button onClick={() => sendMessage()}
                    disabled={loading || quotaExceeded || (!input.trim() && !attachedImage)}
                    title={quotaExceeded ? (lang === 'ru' ? 'Лимит AI-запросов исчерпан' : 'AI request limit reached') : (lang === 'ru' ? 'Отправить' : 'Send')}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 transition-all shrink-0 shadow-sm shadow-primary/20">
                    {loading ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground/70 mt-1.5 px-1">{tr('builderInputHint', lang)}</p>
            </div>

            {/* Overlay закрывает расширения */}
            {showExtensions && <div className="fixed inset-0 z-40" onClick={() => setShowExtensions(false)} />}
            {showModelMenu && <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />}
            {showStyleMenu && <div className="fixed inset-0 z-40" onClick={() => setShowStyleMenu(false)} />}
          </div>
        )}

        {/* Разделитель для изменения ширины панели чата мышкой */}
        {sidebarOpen && (
          <div
            onMouseDown={(e) => { e.preventDefault(); setIsResizingChat(true); }}
            className={`hidden sm:block relative w-1 shrink-0 cursor-col-resize group ${isResizingChat ? 'bg-primary' : 'bg-border hover:bg-primary/60'} transition-colors`}
            title={lang === 'ru' ? 'Потяните, чтобы изменить ширину чата' : 'Drag to resize chat panel'}
          >
            <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
          </div>
        )}

        {/* RIGHT — PREVIEW / CODE / CORE */}
        <div className="flex-1 flex flex-col bg-secondary/50 overflow-hidden">
          {rightTab === 'core' ? (
            projectId ? (
              <BuilderCorePanel lang={lang} projectId={parseInt(projectId, 10)} onUseFileInChat={handleUseFileInChat} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="h-20 w-20 rounded-3xl bg-card border border-border grid place-items-center mx-auto mb-6">
                  <Icon name="Database" size={32} className="text-muted-foreground/50" />
                </div>
                <h3 className="font-display font-bold text-foreground text-lg mb-2">
                  {lang === 'ru' ? 'Сначала сохраните проект' : 'Save your project first'}
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                  {lang === 'ru'
                    ? 'Ядро (база данных, секреты, хранилище) доступно только для сохранённых проектов'
                    : 'Core (database, secrets, storage) is only available for saved projects'}
                </p>
              </div>
            )
          ) : rightTab === 'preview' ? (
            <div className="flex-1 flex flex-col items-center overflow-hidden">
              {html ? (
                <>
                  {/* Подсказка в режиме редактирования */}
                  {editMode && (
                    <div className="w-full flex items-center justify-between gap-2 px-4 py-1.5 bg-primary/5 border-b border-primary/20 text-[11px] text-primary shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Icon name="MousePointer" size={11} />
                        {lang === 'ru' ? 'Кликните на любой текст для редактирования' : 'Click any text to edit'}
                      </span>
                      <button onClick={toggleEditMode} title={lang === 'ru' ? 'Закрыть' : 'Close'} className="hover:text-primary/70 transition-colors">
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  )}

                  <div className={`flex-1 flex overflow-hidden w-full ${device !== 'desktop' && !propsPanel ? 'justify-center bg-secondary/30 py-4' : ''}`}>
                    {/* iframe */}
                    <div
                      className={`relative overflow-hidden transition-all duration-500 bg-white ${device !== 'desktop' && !propsPanel ? 'rounded-2xl border border-border shadow-lg' : 'flex-1'}`}
                      style={{ maxWidth: propsPanel ? undefined : DEVICE_WIDTHS[device], width: device !== 'desktop' && !propsPanel ? DEVICE_WIDTHS[device] : '100%' }}
                    >
                      <iframe
                        ref={iframeRef}
                        key={iframeKey}
                        srcDoc={htmlWithEditScript(html)}
                        title={tr('builderPreview', lang)}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                        onLoad={() => {
                          // ГЛАВНАЯ ЗАЩИТА ОТ УХОДА В РЕДАКТОР: проверяем, куда именно загрузился iframe.
                          // Легитимная загрузка через srcDoc всегда имеет адрес "about:srcdoc". Если внутри
                          // превью произошла ЛЮБАЯ навигация (клик по ссылке, submit формы, JS location.href,
                          // meta-refresh — вообще любой способ, который не ловят точечные перехватчики кликов),
                          // адрес окна iframe сменится на что-то другое — и мы немедленно пересобираем iframe
                          // с исходным содержимым, не давая ему остаться на чужой странице.
                          try {
                            const win = iframeRef.current?.contentWindow;
                            const href = win?.location?.href;
                            if (href && href !== 'about:srcdoc' && !href.startsWith('about:')) {
                              setIframeKey(k => k + 1);
                            }
                          } catch {
                            // contentWindow.location недоступен (кросс-origin переход) — это ТОЧНО означает,
                            // что iframe покинул песочницу и ушёл на реальный домен. Тоже пересобираем.
                            setIframeKey(k => k + 1);
                          }
                        }}
                      />
                      {/* Popover редактирования текста */}
                      {editPopover && (
                        <div
                          className="absolute z-50 bg-card border border-border rounded-2xl shadow-2xl p-3 w-64 max-w-[calc(100vw-2rem)]"
                          style={{ left: Math.max(8, Math.min(editPopover.x - 128, 9999)), top: Math.min(editPopover.y + 8, 9999) }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Icon name="Type" size={12} />
                              {lang === 'ru' ? 'Текст' : 'Text'}
                            </span>
                            <button onClick={() => setEditPopover(null)} title={lang === 'ru' ? 'Закрыть' : 'Close'} className="text-muted-foreground hover:text-foreground transition-colors">
                              <Icon name="X" size={13} />
                            </button>
                          </div>
                          <textarea
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-full text-xs rounded-xl border border-border bg-secondary text-foreground px-3 py-2 resize-none outline-none focus:border-primary/50 transition-colors"
                            rows={2}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); applyTextEdit(); }
                              if (e.key === 'Escape') setEditPopover(null);
                            }}
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={applyTextEdit} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                              <Icon name="Check" size={12} />
                              {lang === 'ru' ? 'Сохранить' : 'Save'}
                            </button>
                            <button onClick={() => setEditPopover(null)} className="px-3 text-xs text-muted-foreground hover:text-foreground rounded-xl border border-border hover:bg-secondary transition-colors">
                              {lang === 'ru' ? 'Отмена' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Панель свойств элемента */}
                    {propsPanel && editMode && (
                      <div className="w-44 sm:w-56 shrink-0 border-l border-border bg-card overflow-y-auto flex flex-col">
                        {/* Заголовок */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0 bg-background">
                          <span className="text-xs font-semibold flex items-center gap-1.5">
                            <Icon name="Sliders" size={12} className="text-primary" />
                            <span className="font-mono text-primary">&lt;{propsPanel.tag}&gt;</span>
                          </span>
                          <button onClick={() => setPropsPanel(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <Icon name="X" size={13} />
                          </button>
                        </div>

                        <div className="p-3 space-y-4 text-xs">
                          {/* Цвет текста */}
                          <div>
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-semibold mb-2">
                              {lang === 'ru' ? 'Текст' : 'Text'}
                            </p>
                            <div className="flex items-center gap-2">
                              <input type="color"
                                value={propsPanel.color === 'transparent' ? '#000000' : propsPanel.color}
                                onChange={e => applyStyle('color', e.target.value)}
                                className="h-7 w-7 rounded-lg border border-border cursor-pointer bg-secondary shrink-0"
                              />
                              <span className="font-mono text-[11px] text-muted-foreground">{propsPanel.color}</span>
                            </div>
                          </div>

                          {/* Фон */}
                          <div>
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-semibold mb-2">
                              {lang === 'ru' ? 'Фон' : 'Background'}
                            </p>
                            <div className="flex items-center gap-2">
                              <input type="color"
                                value={propsPanel.backgroundColor === 'transparent' ? '#ffffff' : propsPanel.backgroundColor}
                                onChange={e => applyStyle('backgroundColor', e.target.value)}
                                className="h-7 w-7 rounded-lg border border-border cursor-pointer bg-secondary shrink-0"
                              />
                              <span className="font-mono text-[11px] text-muted-foreground truncate">{propsPanel.backgroundColor}</span>
                            </div>
                          </div>

                          {/* Размер шрифта */}
                          <div>
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-semibold mb-2">
                              {lang === 'ru' ? 'Размер шрифта' : 'Font size'}
                            </p>
                            <div className="flex items-center gap-2">
                              <input type="range" min="8" max="96" step="1"
                                value={parseInt(propsPanel.fontSize) || 16}
                                onChange={e => applyStyle('fontSize', e.target.value + 'px')}
                                className="flex-1 accent-primary"
                              />
                              <span className="font-mono text-[11px] w-10 text-right shrink-0 text-muted-foreground">{propsPanel.fontSize}</span>
                            </div>
                          </div>

                          {/* Жирность */}
                          <div>
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-semibold mb-2">
                              {lang === 'ru' ? 'Жирность' : 'Font weight'}
                            </p>
                            <div className="flex gap-1 flex-wrap">
                              {[['400', lang === 'ru' ? 'Норм' : 'Normal'], ['600', lang === 'ru' ? 'Полужирный' : 'Semi'], ['700', lang === 'ru' ? 'Жирный' : 'Bold'], ['900', lang === 'ru' ? 'Чёрный' : 'Black']].map(([w, label]) => (
                                <button key={w} onClick={() => applyStyle('fontWeight', w)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${propsPanel.fontWeight === w ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70'}`}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Выравнивание */}
                          <div>
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-semibold mb-2">
                              {lang === 'ru' ? 'Выравнивание' : 'Align'}
                            </p>
                            <div className="flex gap-1">
                              {[['left', 'AlignLeft'], ['center', 'AlignCenter'], ['right', 'AlignRight']].map(([align, icon]) => (
                                <button key={align} onClick={() => applyStyle('textAlign', align)}
                                  className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-all ${propsPanel.textAlign === align ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70'}`}>
                                  <Icon name={icon} size={13} />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Скругление */}
                          <div>
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-semibold mb-2">
                              {lang === 'ru' ? 'Скругление' : 'Border radius'}
                            </p>
                            <div className="flex items-center gap-2">
                              <input type="range" min="0" max="48" step="1"
                                value={parseInt(propsPanel.borderRadius) || 0}
                                onChange={e => applyStyle('borderRadius', e.target.value + 'px')}
                                className="flex-1 accent-primary"
                              />
                              <span className="font-mono text-[11px] w-10 text-right shrink-0 text-muted-foreground">{propsPanel.borderRadius}</span>
                            </div>
                          </div>

                          {/* Прозрачность */}
                          <div>
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-semibold mb-2">
                              {lang === 'ru' ? 'Прозрачность' : 'Opacity'}
                            </p>
                            <div className="flex items-center gap-2">
                              <input type="range" min="0" max="1" step="0.05"
                                value={parseFloat(propsPanel.opacity) || 1}
                                onChange={e => applyStyle('opacity', e.target.value)}
                                className="flex-1 accent-primary"
                              />
                              <span className="font-mono text-[11px] w-10 text-right shrink-0 text-muted-foreground">{Math.round(parseFloat(propsPanel.opacity) * 100)}%</span>
                            </div>
                          </div>

                          {/* Отступы */}
                          <div>
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-semibold mb-2">
                              {lang === 'ru' ? 'Отступы (padding)' : 'Padding'}
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {([['paddingTop', '↑'], ['paddingBottom', '↓'], ['paddingLeft', '←'], ['paddingRight', '→']] as const).map(([prop, arrow]) => (
                                <div key={prop} className="flex items-center gap-1.5">
                                  <span className="text-muted-foreground w-4 text-center">{arrow}</span>
                                  <input
                                    type="number" min="0" max="200"
                                    value={parseInt((propsPanel as Record<string, string>)[prop]) || 0}
                                    onChange={e => applyStyle(prop, e.target.value + 'px')}
                                    className="w-full text-[11px] border border-border rounded-lg px-1.5 py-1 bg-secondary text-muted-foreground outline-none focus:border-primary/50 font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <div className="relative mb-6">
                    <div className="h-20 w-20 rounded-3xl bg-card border border-border grid place-items-center mx-auto">
                      <Icon name="Globe" size={32} className="text-muted-foreground/50" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/10 border border-primary/20 grid place-items-center">
                      <Icon name="Sparkles" size={11} className="text-primary" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-2">{tr('builderPreviewEmpty', lang)}</h3>
                  <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">{tr('builderPreviewEmptyDesc', lang)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Code editor toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="FileCode" size={13} />
                  <span className="font-mono font-medium text-muted-foreground">index.html</span>
                  {codeEditorValue && (
                    <span className="text-muted-foreground/70">
                      · {codeEditorValue.length.toLocaleString()} {lang === 'ru' ? 'символов' : 'chars'}
                    </span>
                  )}
                  {codeEditorValue !== html && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400 inline-block" />
                      {lang === 'ru' ? 'Не сохранено' : 'Unsaved'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Применить изменения */}
                  {codeEditorValue !== html && (
                    <button
                      onClick={() => {
                        setHtml(codeEditorValue);
                        setVersions(prev => [
                          { html: codeEditorValue, label: lang === 'ru' ? 'Ручное редактирование' : 'Manual edit', ts: Date.now() },
                          ...prev.slice(0, 9),
                        ]);
                        setIframeKey(k => k + 1);
                        setCodeApplied(true);
                        setTimeout(() => setCodeApplied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Icon name={codeApplied ? 'Check' : 'Play'} size={13} />
                      {codeApplied
                        ? (lang === 'ru' ? 'Применено!' : 'Applied!')
                        : (lang === 'ru' ? 'Применить' : 'Apply')}
                    </button>
                  )}
                  {/* Сбросить */}
                  {codeEditorValue !== html && (
                    <button
                      onClick={() => setCodeEditorValue(html)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon name="RotateCcw" size={13} />
                      {lang === 'ru' ? 'Сбросить' : 'Reset'}
                    </button>
                  )}
                  {codeEditorValue && (
                    <>
                      <div className="w-px h-4 bg-border" />
                      <button onClick={handleCopyCode}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Icon name={copied ? 'Check' : 'Copy'} size={13} />
                        {copied ? (lang === 'ru' ? 'Скопировано!' : 'Copied!') : tr('builderCopy', lang)}
                      </button>
                      <div className="w-px h-4 bg-border" />
                      <button onClick={handleDownload}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Icon name="Download" size={13} />
                        {tr('builderDownload', lang)}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Редактор */}
              <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
                {codeEditorValue !== undefined ? (
                  <textarea
                    value={codeEditorValue}
                    onChange={e => setCodeEditorValue(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full resize-none bg-transparent text-[#d4d4d4] font-mono text-xs leading-relaxed p-4 outline-none border-none"
                    placeholder={lang === 'ru' ? '<!-- Вставьте или введите HTML код -->' : '<!-- Paste or type HTML code -->'}
                    style={{ tabSize: 2 }}
                    onKeyDown={e => {
                      // Tab вставляет 2 пробела
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const el = e.currentTarget;
                        const start = el.selectionStart;
                        const end = el.selectionEnd;
                        const newVal = codeEditorValue.substring(0, start) + '  ' + codeEditorValue.substring(end);
                        setCodeEditorValue(newVal);
                        requestAnimationFrame(() => {
                          el.selectionStart = el.selectionEnd = start + 2;
                        });
                      }
                      // Ctrl+Enter — применить
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        setHtml(codeEditorValue);
                        setVersions(prev => [
                          { html: codeEditorValue, label: lang === 'ru' ? 'Ручное редактирование' : 'Manual edit', ts: Date.now() },
                          ...prev.slice(0, 9),
                        ]);
                        setIframeKey(k => k + 1);
                        setCodeApplied(true);
                        setTimeout(() => setCodeApplied(false), 2000);
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/40 text-sm">
                    {tr('builderCodeEmpty', lang)}
                  </div>
                )}
              </div>

              {/* Подсказка */}
              <div className="px-4 py-1.5 bg-[#1e1e1e] border-t border-white/10 text-[10px] text-white/40 flex items-center gap-3 shrink-0">
                <span>Tab → отступ</span>
                <span>·</span>
                <span>{lang === 'ru' ? 'Ctrl+Enter → применить' : 'Ctrl+Enter → apply'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdowns */}
      {showVersions && <div className="fixed inset-0 z-40" onClick={() => setShowVersions(false)} />}

      {/* Publish success modal */}
      {showPublishModal && publishedSlug && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPublishModal(false)}>
          <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
              <Icon name="CheckCircle" size={24} />
            </div>
            <h3 className="font-display font-bold text-lg text-center mb-1">
              {lang === 'ru' ? 'Сайт опубликован!' : 'Site published!'}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {lang === 'ru' ? 'Ваш сайт доступен по ссылке:' : 'Your site is available at:'}
            </p>
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5 mb-4">
              <Icon name="Link" size={14} className="text-muted-foreground shrink-0" />
              <span className="text-xs font-mono truncate flex-1">{window.location.origin}/site/{publishedSlug}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/site/${publishedSlug}`); }}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon name="Copy" size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowPublishModal(false)}>
                {lang === 'ru' ? 'Закрыть' : 'Close'}
              </Button>
              <Button asChild className="flex-1 rounded-xl">
                <a href={`/site/${publishedSlug}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="ExternalLink" size={14} className="mr-1.5" />
                  {lang === 'ru' ? 'Открыть' : 'Open'}
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Publish error toast */}
      {publishError && (
        <div className="fixed bottom-4 right-4 z-[60] bg-destructive text-destructive-foreground rounded-xl px-4 py-3 shadow-xl flex items-center gap-2 text-sm max-w-sm">
          <Icon name="AlertCircle" size={15} className="shrink-0" />
          <span className="flex-1">{publishError}</span>
          <button onClick={() => setPublishError('')}><Icon name="X" size={14} /></button>
        </div>
      )}

      {/* Generate image (DALL-E) modal */}
      {showImageGen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => !generatingImage && setShowImageGen(false)}>
          <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
              <Icon name="ImagePlus" size={22} />
            </div>
            <h3 className="font-display font-bold text-lg text-center mb-1">
              {lang === 'ru' ? 'Сгенерировать изображение' : 'Generate an image'}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {lang === 'ru' ? 'Опишите картинку словами — DALL-E создаст её и добавит в чат' : 'Describe the image in words — DALL-E will create it and attach it to chat'}
            </p>
            <textarea
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              placeholder={lang === 'ru' ? 'Например: минималистичный логотип кофейни с чашкой' : 'E.g.: minimalist coffee shop logo with a cup'}
              rows={3}
              disabled={generatingImage}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm resize-none outline-none focus:border-primary/50 mb-3 disabled:opacity-60"
            />
            {imageGenError && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5 mb-3">
                <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
                <span>{imageGenError}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" disabled={generatingImage} onClick={() => setShowImageGen(false)}>
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button className="flex-1 rounded-xl" disabled={generatingImage || quotaExceeded || !imagePrompt.trim()} onClick={handleGenerateImage}>
                {generatingImage
                  ? <><Icon name="Loader" size={14} className="mr-1.5 animate-spin" />{lang === 'ru' ? 'Создаём…' : 'Generating…'}</>
                  : <><Icon name="Sparkles" size={14} className="mr-1.5" />{lang === 'ru' ? 'Создать' : 'Generate'}</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BuilderDomainModal
        open={showDomainModal}
        onOpenChange={setShowDomainModal}
        lang={lang}
        projectId={projectId ? Number(projectId) : null}
      />
    </div>
  );
}