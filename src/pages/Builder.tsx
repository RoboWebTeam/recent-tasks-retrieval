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
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
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
        updated[updated.length - 1] = { role: 'assistant', content: generatedHtml, isHtml: true, tokens };
        return updated;
      });

    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: tr('builderNoConnection', lang) };
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

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const msgCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* TOP BAR */}
      <header className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-border shrink-0 bg-card shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="grid h-8 w-8 place-items-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title={lang === 'ru' ? 'Свернуть чат' : 'Collapse chat'}
          >
            <Icon name="PanelLeft" size={17} />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-base">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={14} />
            </span>
            <span className="text-foreground hidden sm:block">Roboweb</span>
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
              {totalTokens > 0 && <span className="text-muted-foreground/60 ml-1">· {(totalTokens / 1000).toFixed(1)}k tokens</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Device switcher */}
          <div className="hidden md:flex items-center gap-0.5 bg-secondary rounded-xl p-1 border border-border">
            {([['desktop', 'Monitor'], ['tablet', 'Tablet'], ['mobile', 'Smartphone']] as const).map(([d, icon]) => (
              <button key={d} onClick={() => setDevice(d)}
                className={`grid h-7 w-7 place-items-center rounded-lg transition-all ${device === d ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                title={d}>
                <Icon name={icon} size={14} />
              </button>
            ))}
          </div>

          {/* Preview / Code tabs */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-xl p-1 border border-border">
            {([['preview', 'Eye', tr('builderPreview', lang)], ['code', 'Code', tr('builderCode', lang)]] as const).map(([tab, icon, label]) => (
              <button key={tab} onClick={() => setRightTab(tab)}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${rightTab === tab ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
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
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium border border-border bg-secondary hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                title={lang === 'ru' ? 'История версий' : 'Version history'}
              >
                <Icon name="History" size={13} />
                <span className="hidden sm:inline">{versions.length}</span>
              </button>
              {showVersions && (
                <div className="absolute right-0 top-10 z-50 w-72 bg-card border border-border rounded-2xl shadow-2xl p-2">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mb-1">
                    {lang === 'ru' ? 'История версий' : 'Version history'}
                  </div>
                  {versions.map((v, i) => (
                    <button key={v.ts} onClick={() => restoreVersion(v)}
                      className="w-full flex items-start gap-2 px-2.5 py-2 rounded-xl hover:bg-secondary transition-colors text-left group">
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
              className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-secondary hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
              title={lang === 'ru' ? 'Обновить превью' : 'Refresh preview'}>
              <Icon name="RefreshCw" size={13} />
            </button>
          )}

          {/* Open in new tab */}
          {html && (
            <button onClick={openInNewTab}
              className="hidden sm:grid h-8 w-8 place-items-center rounded-xl border border-border bg-secondary hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
              title={lang === 'ru' ? 'Открыть в новой вкладке' : 'Open in new tab'}>
              <Icon name="ExternalLink" size={13} />
            </button>
          )}

          <Button size="sm" variant="outline" onClick={handleDownload} disabled={!html}
            className="h-8 rounded-xl text-xs px-2.5 gap-1.5 hidden sm:flex">
            <Icon name="Download" size={13} />
            <span className="hidden md:inline">{tr('builderDownload', lang)}</span>
          </Button>

          <Button size="sm" disabled={!html} className="h-8 rounded-xl text-xs px-2.5 gap-1.5">
            <Icon name="Globe" size={13} />
            <span className="hidden md:inline">{tr('builderPublish', lang)}</span>
          </Button>

          <LangSwitcher lang={lang} />

          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground text-xs font-bold shrink-0">
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
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0 bg-gradient-to-r from-primary/5 to-secondary">
              <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 shadow-sm">
                <Icon name="Bot" size={17} />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">Roboweb AI</div>
                <div className="text-xs text-emerald-600 font-semibold">● {lang === 'ru' ? 'онлайн' : 'online'}</div>
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
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-secondary/30">
              {messages.length === 0 ? (
                <div className="pt-2">
                  <div className="text-center mb-5">
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
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-1 mb-1.5">{group.cat}</p>
                        <div className="space-y-1">
                          {group.items.map(s => (
                            <button key={s} onClick={() => sendMessage(s)}
                              className="w-full text-left text-xs text-foreground/80 hover:text-foreground bg-card hover:bg-background border border-border rounded-xl px-3 py-2 transition-all hover:shadow-sm hover:border-primary/30 group">
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
                messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 mt-0.5 shadow-sm">
                        <Icon name="Bot" size={14} />
                      </div>
                    )}
                    <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card text-foreground rounded-bl-sm border border-border'
                    }`}>
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
                          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                            <Icon name="CheckCircle" size={13} /> {tr('builderReady', lang)}
                          </div>
                          <p className="text-muted-foreground text-xs">{tr('builderReadyDesc', lang)}</p>
                          {m.tokens && m.tokens > 0 && (
                            <p className="text-[10px] text-muted-foreground/60">{m.tokens.toLocaleString()} tokens</p>
                          )}
                          <div className="flex gap-3 mt-2">
                            <button onClick={() => setRightTab('preview')} className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
                              <Icon name="Eye" size={11} /> {tr('builderPreview', lang)}
                            </button>
                            <button onClick={() => setRightTab('code')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                              <Icon name="Code" size={11} /> {tr('builderCode', lang)}
                            </button>
                            <button onClick={handleDownload} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick edits panel */}
            {showQuickEdits && html && (
              <div className="border-t border-border bg-secondary/40 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                  {lang === 'ru' ? 'Быстрые правки' : 'Quick edits'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_EDITS.map(e => (
                    <button key={e.label} onClick={() => sendMessage(e.prompt)}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-card border border-border text-xs text-foreground/80 hover:text-foreground hover:bg-background hover:border-primary/30 transition-all text-left">
                      <Icon name={e.icon} size={12} className="text-primary shrink-0" />
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              {html && (
                <button onClick={() => setShowQuickEdits(v => !v)}
                  className={`w-full flex items-center justify-center gap-1.5 text-xs mb-2 py-1.5 rounded-xl border transition-colors ${showQuickEdits ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                  <Icon name="Wand2" size={12} />
                  {lang === 'ru' ? 'Быстрые правки' : 'Quick edits'}
                  <Icon name={showQuickEdits ? 'ChevronDown' : 'ChevronUp'} size={11} />
                </button>
              )}
              <div className="flex items-end gap-2 bg-background border border-border rounded-2xl px-3.5 py-2.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tr('builderInputPlaceholder', lang)}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[20px] max-h-[160px]"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-all shrink-0 shadow-sm shadow-primary/20"
                >
                  {loading ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                </button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2">{tr('builderInputHint', lang)}</p>
            </div>
          </div>
        )}

        {/* RIGHT — PREVIEW / CODE */}
        <div className="flex-1 flex flex-col bg-secondary/30 overflow-hidden">
          {rightTab === 'preview' ? (
            <div className="flex-1 flex flex-col items-center overflow-hidden">
              {html ? (
                <>
                  {/* Preview toolbar */}
                  <div className="w-full flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="font-mono text-[11px] bg-secondary border border-border rounded-md px-2 py-0.5 text-muted-foreground">
                        {lang === 'ru' ? 'предпросмотр' : 'preview'} · {device}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
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
                  <div className="flex-1 w-full overflow-hidden transition-all duration-500" style={{ maxWidth: DEVICE_WIDTHS[device] }}>
                    <iframe
                      key={iframeKey}
                      srcDoc={html}
                      title={tr('builderPreview', lang)}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <div className="relative mb-6">
                    <div className="h-20 w-20 rounded-3xl bg-card border border-border grid place-items-center mx-auto shadow-sm">
                      <Icon name="Globe" size={32} className="text-muted-foreground/40" />
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
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="FileCode" size={13} />
                  <span className="font-mono font-medium">index.html</span>
                  {html && <span className="text-muted-foreground/50">· {html.length.toLocaleString()} {lang === 'ru' ? 'символов' : 'chars'}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {html && (
                    <>
                      <button onClick={handleCopyCode}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${copied ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}>
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
              <div className="flex-1 overflow-auto p-4 bg-card">
                {html ? (
                  <pre className="text-xs text-primary/70 font-mono whitespace-pre-wrap break-all leading-relaxed">
                    {html}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {tr('builderCodeEmpty', lang)}
                  </div>
                )}
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
