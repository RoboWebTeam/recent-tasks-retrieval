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

  // Auto-resize textarea
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

    // Добавляем placeholder ответа
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

      // Платформа может обернуть ответ в { statusCode, body }
      let data: Record<string, unknown> = raw;
      if (raw.body !== undefined) {
        data = typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body as Record<string, unknown>;
      }
      const statusCode = typeof raw.statusCode === 'number' ? raw.statusCode : res.status;
      const ok = statusCode >= 200 && statusCode < 300;

      if (!ok) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: (data as { error?: string }).error || tr('builderError', lang),
          };
          return updated;
        });
        return;
      }

      const generatedHtml = (data as { html?: string }).html || '';
      setHtml(generatedHtml);
      setRightTab('preview');

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: generatedHtml,
          isHtml: true,
        };
        return updated;
      });

    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: tr('builderNoConnection', lang),
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(html);
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-white overflow-hidden">

      {/* TOP BAR */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-white/10 shrink-0 bg-[#0f1117]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white/10 transition-colors"
            title={lang === 'ru' ? 'Свернуть чат' : 'Collapse chat'}
          >
            <Icon name="PanelLeft" size={16} className="text-white/60" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-bold">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary text-white">
              <Icon name="Bot" size={13} />
            </span>
            <span className="text-white/90">Roboweb</span>
          </Link>
          {projectId && (
            <span className="text-xs text-white/40 hidden sm:block">/ {tr('builderProject', lang)} #{projectId}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Device switcher */}
          <div className="hidden md:flex items-center gap-0.5 bg-white/5 rounded-lg p-1">
            {([['desktop', 'Monitor'], ['tablet', 'Tablet'], ['mobile', 'Smartphone']] as const).map(([d, icon]) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`grid h-6 w-6 place-items-center rounded-md transition-colors ${device === d ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}
                title={d}
              >
                <Icon name={icon} size={13} />
              </button>
            ))}
          </div>

          {/* Right tabs */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1">
            {([['preview', 'Eye', tr('builderPreview', lang)], ['code', 'Code', tr('builderCode', lang)]] as const).map(([tab, icon, label]) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-medium transition-colors ${rightTab === tab ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                <Icon name={icon} size={12} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-white/10" />

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={!html}
            className="h-7 rounded-lg text-xs border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white px-3 gap-1.5"
          >
            <Icon name="Download" size={13} />
            <span className="hidden sm:inline">{tr('builderDownload', lang)}</span>
          </Button>

          <Button
            size="sm"
            disabled={!html}
            className="h-7 rounded-lg text-xs px-3 gap-1.5 bg-primary hover:bg-primary/90"
          >
            <Icon name="Globe" size={13} />
            <span className="hidden sm:inline">{tr('builderPublish', lang)}</span>
          </Button>

          <LangSwitcher lang={lang} dark />

          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-white text-xs font-bold shrink-0">
            {initials}
          </div>
        </div>
      </header>

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — CHAT */}
        {sidebarOpen && (
          <div className="flex flex-col w-full sm:w-[340px] lg:w-[380px] shrink-0 border-r border-white/10 bg-[#0f1117]">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="pt-6">
                  <div className="text-center mb-6">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/20 text-primary mx-auto mb-3">
                      <Icon name="Sparkles" size={22} />
                    </div>
                    <h2 className="font-display font-bold text-base text-white">{tr('builderHello', lang)}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</h2>
                    <p className="text-xs text-white/50 mt-1">{tr('builderWelcome', lang)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/30 uppercase tracking-wider px-1">{tr('builderTryTitle', lang)}</p>
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="w-full text-left text-xs text-white/60 hover:text-white/90 bg-white/5 hover:bg-white/10 rounded-xl px-3.5 py-2.5 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="grid h-6 w-6 place-items-center rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5">
                        <Icon name="Bot" size={13} />
                      </div>
                    )}
                    <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white/8 text-white/90 rounded-bl-sm border border-white/10'
                    }`}>
                      {m.role === 'assistant' && m.content === '' ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span className="text-white/50 text-xs">{tr('builderGenerating', lang)}</span>
                          <span className="flex gap-1">
                            {[0,1,2].map(i => (
                              <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" style={{animationDelay: `${i * 0.15}s`}} />
                            ))}
                          </span>
                        </div>
                      ) : m.isHtml ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                            <Icon name="CheckCircle" size={13} /> {tr('builderReady', lang)}
                          </div>
                          <p className="text-white/60 text-xs">{tr('builderReadyDesc', lang)}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => setRightTab('preview')} className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <Icon name="Eye" size={11} /> {tr('builderPreview', lang)}
                            </button>
                            <button onClick={() => setRightTab('code')} className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 hover:underline">
                              <Icon name="Code" size={11} /> {tr('builderCode', lang)}
                            </button>
                          </div>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                    {m.role === 'user' && (
                      <div className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-white/70 text-xs font-bold shrink-0 mt-0.5">
                        {initials}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex items-end gap-2 bg-white/8 border border-white/15 rounded-2xl px-3.5 py-2.5 focus-within:border-primary/50 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tr('builderInputPlaceholder', lang)}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 resize-none outline-none min-h-[20px] max-h-[160px]"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Icon name={loading ? 'Loader' : 'Send'} size={13} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
              <p className="text-[11px] text-white/25 text-center mt-2">{tr('builderInputHint', lang)}</p>
            </div>
          </div>
        )}

        {/* RIGHT — PREVIEW / CODE */}
        <div className="flex-1 flex flex-col bg-[#0a0b0f] overflow-hidden">
          {rightTab === 'preview' ? (
            <div className="flex-1 flex flex-col items-center overflow-hidden">
              {html ? (
                <div
                  className="flex-1 w-full overflow-hidden transition-all duration-500"
                  style={{ maxWidth: DEVICE_WIDTHS[device] }}
                >
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
                    <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 grid place-items-center mx-auto">
                      <Icon name="Globe" size={32} className="text-white/20" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary/20 border border-primary/30 grid place-items-center">
                      <Icon name="Sparkles" size={10} className="text-primary" />
                    </div>
                  </div>
                  <h3 className="text-white/40 font-medium text-sm mb-2">{tr('builderPreviewEmpty', lang)}</h3>
                  <p className="text-white/20 text-xs max-w-xs">{tr('builderPreviewEmptyDesc', lang)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Code toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-[#0f1117] shrink-0">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Icon name="FileCode" size={13} />
                  <span>index.html</span>
                  {html && <span className="text-white/20">· {html.length.toLocaleString()} {lang === 'ru' ? 'символов' : 'chars'}</span>}
                </div>
                {html && (
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
                  >
                    <Icon name="Copy" size={13} /> {tr('builderCopy', lang)}
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto p-4">
                {html ? (
                  <pre className="text-xs text-emerald-400/80 font-mono whitespace-pre-wrap break-all leading-relaxed">
                    {html}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-white/20 text-sm">
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