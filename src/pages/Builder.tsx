import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getSession, getStoredUser } from '@/lib/auth';
import { getLang, tr } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';

const GENERATE_URL = 'https://functions.poehali.dev/64b3e52e-6bb5-4d4e-b7ee-e3840af35990';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isHtml?: boolean;
  tokens?: number;
}

interface Version {
  html: string;
  label: string;
  ts: number;
}

type RightTab = 'preview' | 'code';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

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

const SUGGESTIONS_RU = [
  { cat: 'Услуги', items: ['Лендинг для кофейни с меню и формой заказа', 'Сайт для барбершопа с записью онлайн', 'Лендинг для фитнес-тренера с отзывами'] },
  { cat: 'Бизнес', items: ['Сайт-визитка для юриста', 'Лендинг для агентства недвижимости', 'Корпоративный сайт IT-компании'] },
  { cat: 'Магазин', items: ['Интернет-магазин одежды', 'Лендинг для продажи курсов', 'Магазин handmade товаров'] },
  { cat: 'Портфолио', items: ['Сайт-портфолио для фотографа', 'Портфолио дизайнера', 'Личный сайт разработчика'] },
];

const SUGGESTIONS_EN = [
  { cat: 'Services', items: ['Coffee shop landing with menu and order form', 'Barbershop website with online booking', 'Fitness trainer landing with reviews'] },
  { cat: 'Business', items: ['Lawyer business card site', 'Real estate agency landing', 'IT company corporate site'] },
  { cat: 'Store', items: ['Online clothing store', 'Landing page for online courses', 'Handmade products store'] },
  { cat: 'Portfolio', items: ['Portfolio site for a photographer', 'Designer portfolio', 'Developer personal site'] },
];

export default function Builder() {
  const lang = getLang();
  const SUGGESTIONS = lang === 'ru' ? SUGGESTIONS_RU : SUGGESTIONS_EN;
  const QUICK_EDITS = lang === 'ru' ? QUICK_EDITS_RU : QUICK_EDITS_EN;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState('');
  const [rightTab, setRightTab] = useState<RightTab>('preview');
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showQuickEdits, setShowQuickEdits] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [codeApplied, setCodeApplied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ url: string; name: string } | null>(null);
  const [showExtensions, setShowExtensions] = useState(false);
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const session = getSession();
  const user = getStoredUser();

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); }
  }, [session, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const sendMessage = async (text?: string) => {
    const rawContent = (text || input).trim();
    const imageNote = attachedImage ? `\n[Изображение прикреплено: ${attachedImage.name}]` : '';
    const content = rawContent + imageNote;
    if (!content.trim() || loading) return;
    setInput('');
    setAttachedImage(null);
    setShowQuickEdits(false);

    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': session! },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          project_id: projectId,
        }),
      });

      const raw = await res.json();
      let data: Record<string, unknown> = raw;
      if (raw.body !== undefined) {
        data = typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body as Record<string, unknown>;
      }
      const statusCode = typeof raw.statusCode === 'number' ? raw.statusCode : res.status;
      const ok = statusCode >= 200 && statusCode < 300;

      if (!ok) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: (data as { error?: string }).error || tr('builderError', lang) };
          return updated;
        });
        return;
      }

      const generatedHtml = (data as { html?: string }).html || '';
      const tokens = (data as { tokens?: number }).tokens || 0;

      // Сохраняем версию
      if (generatedHtml) {
        setVersions(prev => [
          { html: generatedHtml, label: content.slice(0, 40) + (content.length > 40 ? '…' : ''), ts: Date.now() },
          ...prev.slice(0, 9),
        ]);
        setTotalTokens(t => t + tokens);
      }

      setHtml(generatedHtml);
      setRightTab('preview');
      setIframeKey(k => k + 1);

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: generatedHtml ? tr('builderDone', lang) : (data as { message?: string }).message || tr('builderError', lang),
          isHtml: !!generatedHtml,
          tokens,
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setHtml('');
    setVersions([]);
    setTotalTokens(0);
  };

  const restoreVersion = (v: Version) => {
    setHtml(v.html);
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
        if (highlighted) { highlighted.style.outline = ''; highlighted = null; }
        if (selected) { selected.style.outline = ''; selected = null; }
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
    if (highlighted && highlighted !== t) highlighted.style.outline = '';
    t.style.outline = '2px dashed #4f6ef7';
    t.style.outlineOffset = '2px';
    highlighted = t;
  });

  document.addEventListener('mouseout', function(e) {
    if (!editMode) return;
    var t = e.target;
    if (t === highlighted && t !== selected) { t.style.outline = ''; highlighted = null; }
  });

  document.addEventListener('click', function(e) {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    var t = e.target;
    if (selected && selected !== t) selected.style.outline = '';
    selected = t;
    t.style.outline = '2px solid #4f6ef7';
    t.style.outlineOffset = '2px';
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

  // HTML с внедрённым скриптом для режима редактирования
  const htmlWithEditScript = (rawHtml: string) => {
    if (!rawHtml) return rawHtml;
    const hasHead = /<head[\s>]/i.test(rawHtml);
    if (hasHead) return rawHtml.replace(/<head([^>]*)>/i, `<head$1>${EDIT_SCRIPT}`);
    return EDIT_SCRIPT + rawHtml;
  };

  // Слушаем сообщения от iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'ROBOWEB_CLICK') return;
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedImage({ url: ev.target?.result as string, name: file.name });
      if (!input) setInput(lang === 'ru' ? 'Создай сайт по этому изображению' : 'Create a website based on this image');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const msgCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* TOP BAR */}
      <header className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-2 sm:gap-3">
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
          {msgCount > 0 && (
            <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="MessageSquare" size={11} />
              {msgCount} {lang === 'ru' ? 'запросов' : 'requests'}
              {totalTokens > 0 && <span className="text-muted-foreground/50 ml-1">· {(totalTokens / 1000).toFixed(1)}k tokens</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Device switcher */}
          <div className="hidden md:flex items-center gap-0.5 bg-secondary rounded-lg p-1 border border-border">
            {([['desktop', 'Monitor'], ['tablet', 'Tablet'], ['mobile', 'Smartphone']] as const).map(([d, icon]) => (
              <button key={d} onClick={() => setDevice(d)}
                className={`grid h-7 w-7 place-items-center rounded-md transition-all ${device === d ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'}`}
                title={d}>
                <Icon name={icon} size={13} />
              </button>
            ))}
          </div>

          {/* Preview / Code tabs */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1 border border-border">
            {([['preview', 'Eye', tr('builderPreview', lang)], ['code', 'Code', tr('builderCode', lang)]] as const).map(([tab, icon, label]) => (
              <button key={tab} onClick={() => { setRightTab(tab); if (tab === 'code') setCodeEditorValue(html); }}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-all ${rightTab === tab ? 'bg-card text-foreground border border-border shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'}`}>
                <Icon name={icon} size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border" />

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
                <div className="absolute right-0 top-10 z-50 w-72 bg-card border border-border rounded-xl shadow-2xl p-2">
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

          {/* Refresh preview */}
          {html && (
            <button onClick={() => setIframeKey(k => k + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground transition-colors text-muted-foreground"
              title={lang === 'ru' ? 'Обновить превью' : 'Refresh preview'}>
              <Icon name="RefreshCw" size={13} />
            </button>
          )}

          {/* Open in new tab */}
          {html && (
            <button onClick={openInNewTab}
              className="hidden sm:grid h-8 w-8 place-items-center rounded-lg border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground transition-colors text-muted-foreground"
              title={lang === 'ru' ? 'Открыть в новой вкладке' : 'Open in new tab'}>
              <Icon name="ExternalLink" size={13} />
            </button>
          )}

          <button onClick={handleDownload} disabled={!html}
            className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs border border-border bg-secondary hover:bg-secondary/70 hover:text-foreground text-muted-foreground transition-colors disabled:opacity-30">
            <Icon name="Download" size={13} />
            <span className="hidden md:inline">{tr('builderDownload', lang)}</span>
          </button>

          <Button size="sm" disabled={!html} className="h-8 rounded-lg text-xs px-2.5 gap-1.5">
            <Icon name="Globe" size={13} />
            <span className="hidden md:inline">{tr('builderPublish', lang)}</span>
          </Button>

          <Link to="/settings/domain"
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border border-border bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Icon name="Link" size={13} />
            <span className="hidden lg:inline">{lang === 'ru' ? 'Домен' : 'Domain'}</span>
          </Link>

          <LangSwitcher lang={lang} />

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {initials}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — CHAT */}
        {sidebarOpen && (
          <div className="flex flex-col w-full sm:w-[340px] lg:w-[380px] shrink-0 border-r border-border bg-card">

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
                  {msgCount > 0 && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-[10px] text-muted-foreground">{msgCount} {lang === 'ru' ? 'сообщ.' : 'msg'}</span>
                    </>
                  )}
                  {totalTokens > 0 && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-[10px] text-muted-foreground">{(totalTokens / 1000).toFixed(1)}k tok</span>
                    </>
                  )}
                </div>
              </div>
              {messages.length > 0 && (
                <button onClick={handleClearChat}
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
              {messages.length === 0 ? (
                <div className="pt-2">
                  <div className="text-center mb-6">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3 border border-primary/20">
                      <Icon name="Sparkles" size={24} />
                    </div>
                    <h2 className="font-display font-bold text-lg text-foreground">
                      {tr('builderHello', lang)}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{tr('builderWelcome', lang)}</p>
                  </div>

                  {/* Categorized suggestions */}
                  <div className="space-y-3">
                    {SUGGESTIONS.map(group => (
                      <div key={group.cat}>
                        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-semibold px-1 mb-1.5">{group.cat}</p>
                        <div className="space-y-1">
                          {group.items.map(s => (
                            <button key={s} onClick={() => sendMessage(s)}
                              className="w-full text-left text-xs text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/70 border border-border hover:border-primary/50 rounded-xl px-3 py-2.5 transition-all group">
                              <span className="flex items-center gap-2">
                                <Icon name="ArrowRight" size={11} className="text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {s}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => {
                  const msgTime = new Date().toLocaleTimeString(lang === 'ru' ? 'ru' : 'en', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && (
                        <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 mt-0.5 shadow-sm">
                          <Icon name="Bot" size={14} />
                        </div>
                      )}
                      <div className={`max-w-[88%] text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-primary text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-sm'
                          : 'bg-secondary border border-border text-foreground rounded-2xl rounded-bl-sm px-3.5 py-2.5'
                      }`}>
                        {m.role === 'user' && (
                          <div className="text-[10px] text-white/50 mb-1">{msgTime}</div>
                        )}
                        {m.role === 'assistant' && m.content === '' ? (
                          <div className="flex items-center gap-1.5 py-0.5">
                            <span className="text-muted-foreground text-xs">{tr('builderGenerating', lang)}</span>
                            <span className="flex gap-1">
                              {[0,1,2].map(j => (
                                <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay:`${j*0.15}s`}} />
                              ))}
                            </span>
                          </div>
                        ) : m.isHtml ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                              <Icon name="CheckCircle" size={13} /> {tr('builderReady', lang)}
                            </div>
                            <p className="text-muted-foreground text-xs">{tr('builderReadyDesc', lang)}</p>
                            {m.tokens && m.tokens > 0 && (
                              <p className="text-[10px] text-muted-foreground">{m.tokens.toLocaleString()} tokens</p>
                            )}
                            <div className="flex gap-2 mt-2.5 pt-2 border-t border-border">
                              <button onClick={() => setRightTab('preview')}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-semibold bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors">
                                <Icon name="Eye" size={11} /> {tr('builderPreview', lang)}
                              </button>
                              <button onClick={() => { setRightTab('code'); setCodeEditorValue(html); }}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/70 px-2.5 py-1 rounded-lg transition-colors">
                                <Icon name="Code" size={11} /> {tr('builderCode', lang)}
                              </button>
                              <button onClick={handleDownload}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/70 px-2.5 py-1 rounded-lg transition-colors">
                                <Icon name="Download" size={11} /> {tr('builderDownload', lang)}
                              </button>
                            </div>
                          </div>
                        ) : m.content}
                      </div>
                      {m.role === 'user' && (
                        <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5 shadow-sm">
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

            {/* Input */}
            <div className="p-3 border-t border-border bg-background">
              {/* Прикреплённое изображение */}
              {attachedImage && (
                <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-secondary border border-border rounded-xl">
                  <img src={attachedImage.url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                  <span className="text-[11px] text-muted-foreground flex-1 truncate">{attachedImage.name}</span>
                  <button onClick={() => setAttachedImage(null)} className="text-muted-foreground hover:text-red-400 transition-colors">
                    <Icon name="X" size={13} />
                  </button>
                </div>
              )}

              <div className={`flex items-end gap-1.5 bg-secondary/50 border rounded-2xl px-3 py-2.5 transition-all ${isRecording ? 'border-red-500/50' : 'border-border focus-within:border-primary/50'}`}>
                {/* Быстрые правки */}
                {html && (
                  <button onClick={() => setShowQuickEdits(v => !v)}
                    className={`grid h-7 w-7 place-items-center rounded-lg transition-colors shrink-0 mb-0.5 ${showQuickEdits ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-muted-foreground hover:bg-secondary/70'}`}
                    title={lang === 'ru' ? 'Быстрые правки' : 'Quick edits'}>
                    <Icon name="Wand2" size={14} />
                  </button>
                )}

                {/* Визуальный редактор */}
                {html && (
                  <button onClick={toggleEditMode}
                    className={`grid h-7 w-7 place-items-center rounded-lg transition-colors shrink-0 mb-0.5 ${editMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-muted-foreground hover:bg-secondary/70'}`}
                    title={lang === 'ru' ? 'Визуальный редактор' : 'Visual editor'}>
                    <Icon name="MousePointer" size={14} />
                  </button>
                )}

                {/* Прикрепить изображение */}
                <button onClick={() => imageInputRef.current?.click()}
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-secondary/70 transition-colors shrink-0 mb-0.5"
                  title={lang === 'ru' ? 'Прикрепить изображение' : 'Attach image'}>
                  <Icon name="Image" size={14} />
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                {/* Расширения */}
                <div className="relative shrink-0 mb-0.5">
                  <button onClick={() => setShowExtensions(v => !v)}
                    className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${showExtensions ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-muted-foreground hover:bg-secondary/70'}`}
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

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? (lang === 'ru' ? '🎙 Говорите…' : '🎙 Speaking…') : tr('builderInputPlaceholder', lang)}
                  rows={1}
                  className={`flex-1 bg-transparent text-sm resize-none outline-none min-h-[20px] max-h-[160px] ${isRecording ? 'text-red-400 placeholder:text-red-400/50' : 'text-foreground placeholder:text-muted-foreground/50'}`}
                />

                {/* Голосовой ввод */}
                <button onClick={toggleRecording}
                  className={`grid h-7 w-7 place-items-center rounded-lg transition-all shrink-0 mb-0.5 ${isRecording ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-muted-foreground hover:text-muted-foreground hover:bg-secondary/70'}`}
                  title={lang === 'ru' ? (isRecording ? 'Остановить запись' : 'Голосовой ввод') : (isRecording ? 'Stop recording' : 'Voice input')}>
                  <Icon name={isRecording ? 'MicOff' : 'Mic'} size={14} />
                </button>

                {/* Отправить */}
                <button onClick={() => sendMessage()}
                  disabled={loading || (!input.trim() && !attachedImage)}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 transition-all shrink-0 shadow-sm shadow-primary/20">
                  {loading ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-1.5 px-1">
                <p className="text-[10px] text-muted-foreground/70">{tr('builderInputHint', lang)}</p>
                {input.length > 0 && <span className="text-[10px] text-muted-foreground/70">{input.length}</span>}
              </div>
            </div>

            {/* Overlay закрывает расширения */}
            {showExtensions && <div className="fixed inset-0 z-40" onClick={() => setShowExtensions(false)} />}
          </div>
        )}

        {/* RIGHT — PREVIEW / CODE */}
        <div className="flex-1 flex flex-col bg-secondary/50 overflow-hidden">
          {rightTab === 'preview' ? (
            <div className="flex-1 flex flex-col items-center overflow-hidden">
              {html ? (
                <>
                  {/* Preview toolbar */}
                  <div className="w-full flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="font-mono text-[11px] bg-secondary border border-border rounded-md px-2 py-0.5 text-muted-foreground">
                        {lang === 'ru' ? 'предпросмотр' : 'preview'} · {device}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Кнопка режима редактирования текста */}
                      <button
                        onClick={toggleEditMode}
                        className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all ${
                          editMode
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                        title={lang === 'ru' ? 'Режим редактирования текста' : 'Text edit mode'}
                      >
                        <Icon name="MousePointer" size={11} />
                        {editMode
                          ? (lang === 'ru' ? 'Редактирование' : 'Editing')
                          : (lang === 'ru' ? 'Изменить текст' : 'Edit text')}
                      </button>
                      <button onClick={() => setIframeKey(k => k + 1)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary">
                        <Icon name="RefreshCw" size={11} /> {lang === 'ru' ? 'Обновить' : 'Refresh'}
                      </button>
                      <button onClick={openInNewTab}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary">
                        <Icon name="ExternalLink" size={11} /> {lang === 'ru' ? 'В новой вкладке' : 'New tab'}
                      </button>
                    </div>
                  </div>

                  {/* Подсказка в режиме редактирования */}
                  {editMode && (
                    <div className="w-full flex items-center justify-between gap-2 px-4 py-1.5 bg-primary/5 border-b border-primary/20 text-[11px] text-primary shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Icon name="MousePointer" size={11} />
                        {lang === 'ru' ? 'Кликните на любой текст для редактирования' : 'Click any text to edit'}
                      </span>
                      <button onClick={toggleEditMode} className="hover:text-primary/70 transition-colors">
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  )}

                  <div className="flex-1 flex overflow-hidden w-full">
                    {/* iframe */}
                    <div className="flex-1 relative overflow-hidden transition-all duration-500" style={{ maxWidth: propsPanel ? undefined : DEVICE_WIDTHS[device] }}>
                      <iframe
                        ref={iframeRef}
                        key={iframeKey}
                        srcDoc={htmlWithEditScript(html)}
                        title={tr('builderPreview', lang)}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                      />
                      {/* Popover редактирования текста */}
                      {editPopover && (
                        <div
                          className="absolute z-50 bg-card border border-border rounded-2xl shadow-2xl p-3 w-64"
                          style={{ left: Math.min(editPopover.x - 128, 9999), top: Math.min(editPopover.y + 8, 9999) }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Icon name="Type" size={12} />
                              {lang === 'ru' ? 'Текст' : 'Text'}
                            </span>
                            <button onClick={() => setEditPopover(null)} className="text-muted-foreground hover:text-foreground transition-colors">
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
                      <div className="w-56 shrink-0 border-l border-border bg-card overflow-y-auto flex flex-col">
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
                    <span className="text-amber-500 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
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
                        className={`flex items-center gap-1.5 text-xs transition-colors ${copied ? 'text-emerald-400' : 'text-muted-foreground hover:text-foreground'}`}>
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
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {tr('builderCodeEmpty', lang)}
                  </div>
                )}
              </div>

              {/* Подсказка */}
              <div className="px-4 py-1.5 bg-[#1e1e1e] border-t border-white/5 text-[10px] text-white/30 flex items-center gap-3 shrink-0">
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
    </div>
  );
}
