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
}

type RightTab = 'preview' | 'code';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

const SUGGESTIONS_RU = [
  'Лендинг для кофейни с меню и формой заказа',
  'Сайт-визитка для фотографа',
  'Лендинг для фитнес-тренера',
  'Интернет-магазин одежды',
  'Сайт для барбершопа с записью',
  'Лендинг для онлайн-курсов',
];

const SUGGESTIONS_EN = [
  'Coffee shop landing with menu and order form',
  'Portfolio website for a photographer',
  'Landing page for a fitness trainer',
  'Online clothing store',
  'Barbershop website with booking',
  'Landing page for online courses',
];

export default function Builder() {
  const lang = getLang();
  const SUGGESTIONS = lang === 'ru' ? SUGGESTIONS_RU : SUGGESTIONS_EN;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const session = getSession();
  const user = getStoredUser();

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
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

    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': session!,
        },
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
      setHtml(generatedHtml);
      setRightTab('preview');
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: generatedHtml, isHtml: true };
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

  const handleCopyCode = () => { navigator.clipboard.writeText(html); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* TOP BAR */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0 bg-card shadow-sm">
        <div className="flex items-center gap-3">
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
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden md:flex items-center gap-0.5 bg-secondary rounded-xl p-1 border border-border">
            {([['desktop', 'Monitor'], ['tablet', 'Tablet'], ['mobile', 'Smartphone']] as const).map(([d, icon]) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`grid h-7 w-7 place-items-center rounded-lg transition-all ${device === d ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                title={d}
              >
                <Icon name={icon} size={14} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 bg-secondary rounded-xl p-1 border border-border">
            {([['preview', 'Eye', tr('builderPreview', lang)], ['code', 'Code', tr('builderCode', lang)]] as const).map(([tab, icon, label]) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium transition-all ${rightTab === tab ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon name={icon} size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border mx-0.5" />

          <Button size="sm" variant="outline" onClick={handleDownload} disabled={!html}
            className="h-8 rounded-xl text-xs px-3 gap-1.5">
            <Icon name="Download" size={13} />
            <span className="hidden sm:inline">{tr('builderDownload', lang)}</span>
          </Button>

          <Button size="sm" disabled={!html} className="h-8 rounded-xl text-xs px-3 gap-1.5">
            <Icon name="Globe" size={13} />
            <span className="hidden sm:inline">{tr('builderPublish', lang)}</span>
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
              <div>
                <div className="text-sm font-bold text-foreground">Roboweb AI</div>
                <div className="text-xs text-emerald-600 font-semibold">● {lang === 'ru' ? 'онлайн' : 'online'}</div>
              </div>
              {loading && (
                <div className="ml-auto flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30">
              {messages.length === 0 ? (
                <div className="pt-4">
                  <div className="text-center mb-6">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3 border border-primary/20">
                      <Icon name="Sparkles" size={24} />
                    </div>
                    <h2 className="font-display font-bold text-lg text-foreground">
                      {tr('builderHello', lang)}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{tr('builderWelcome', lang)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider px-1 font-semibold mb-3">
                      {tr('builderTryTitle', lang)}
                    </p>
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="w-full text-left text-sm text-foreground/80 hover:text-foreground bg-card hover:bg-secondary border border-border rounded-xl px-3.5 py-2.5 transition-all hover:shadow-sm hover:border-primary/30 group"
                      >
                        <span className="flex items-start gap-2">
                          <Icon name="Sparkles" size={13} className="text-primary shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {s}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                            {[0,1,2].map(i => (
                              <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                            ))}
                          </span>
                        </div>
                      ) : m.isHtml ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                            <Icon name="CheckCircle" size={13} /> {tr('builderReady', lang)}
                          </div>
                          <p className="text-muted-foreground text-xs">{tr('builderReadyDesc', lang)}</p>
                          <div className="flex gap-3 mt-2">
                            <button onClick={() => setRightTab('preview')} className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
                              <Icon name="Eye" size={11} /> {tr('builderPreview', lang)}
                            </button>
                            <button onClick={() => setRightTab('code')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                              <Icon name="Code" size={11} /> {tr('builderCode', lang)}
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

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              <div className="flex items-end gap-2 bg-background border border-border rounded-2xl px-3.5 py-2.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tr('builderPlaceholder', lang)}
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
              <p className="text-center text-[10px] text-muted-foreground mt-2">{tr('builderHint', lang)}</p>
            </div>
          </div>
        )}

        {/* RIGHT — PREVIEW / CODE */}
        <div className="flex-1 flex flex-col bg-secondary/30 overflow-hidden">
          {rightTab === 'preview' ? (
            <div className="flex-1 flex flex-col items-center overflow-hidden">
              {html ? (
                <div className="flex-1 w-full overflow-hidden transition-all duration-500" style={{ maxWidth: DEVICE_WIDTHS[device] }}>
                  <iframe
                    srcDoc={html}
                    title={tr('builderPreview', lang)}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
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
                {html && (
                  <button onClick={handleCopyCode} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Copy" size={13} /> {tr('builderCopy', lang)}
                  </button>
                )}
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
    </div>
  );
}
