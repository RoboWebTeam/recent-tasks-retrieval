import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { getSession, getStoredUser } from '@/lib/auth';
import { getLang } from '@/lib/i18n';

const SUPPORT_CHAT_URL = 'https://functions.poehali.dev/0ddd7998-ad2d-433a-a6ef-5801b4ed059b';
const POLL_INTERVAL = 7000;

interface ChatMessage {
  id: number;
  sender: 'visitor' | 'admin';
  text: string;
  created_at: string;
  file_url?: string | null;
  file_type?: string | null;
  file_name?: string | null;
}

function getVisitorId(): string {
  const key = 'roboweb_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

async function unwrap(res: Response) {
  const raw = await res.json();
  return raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
}

function MessageBubble({ m }: { m: ChatMessage }) {
  const isVisitor = m.sender === 'visitor';
  return (
    <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] text-sm leading-relaxed px-3.5 py-2.5 ${
        isVisitor ? 'bg-primary text-white rounded-2xl rounded-br-sm' : 'bg-secondary border border-border text-foreground rounded-2xl rounded-bl-sm'
      }`}>
        {m.file_url && m.file_type === 'image' && (
          <a href={m.file_url} target="_blank" rel="noopener noreferrer">
            <img src={m.file_url} alt={m.file_name || ''} className="rounded-xl max-w-full max-h-48 mb-1.5 object-cover" />
          </a>
        )}
        {m.file_url && m.file_type !== 'image' && (
          <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mb-1.5 underline underline-offset-2">
            <Icon name="Paperclip" size={13} /> {m.file_name}
          </a>
        )}
        {m.text}
      </div>
    </div>
  );
}

export default function SupportChatWidget() {
  const lang = getLang();
  const isRu = lang === 'ru';
  const visitorId = getVisitorId();
  const user = getStoredUser();
  const session = getSession();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMsgCountRef = useRef(0);

  const loadMessages = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`${SUPPORT_CHAT_URL}?visitor_id=${visitorId}`);
      const data = await unwrap(res);
      const msgs: ChatMessage[] = data.messages || [];
      setMessages(msgs);
      if (silent && msgs.length > lastMsgCountRef.current) {
        const newOnes = msgs.slice(lastMsgCountRef.current);
        if (newOnes.some(m => m.sender === 'admin') && !open) {
          setHasUnread(true);
        }
      }
      lastMsgCountRef.current = msgs.length;
    } catch { /* тихо */ }
  }, [visitorId, open]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => loadMessages(true), POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      loadMessages();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedFile({ url: ev.target?.result as string, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || sending) return;

    if (messages.length === 0 && !user && !name.trim()) {
      setShowNameForm(true);
      return;
    }

    setSending(true);
    setUploading(!!attachedFile);
    setInput('');
    const pendingFile = attachedFile;
    setAttachedFile(null);
    setMessages(prev => [...prev, {
      id: Date.now(), sender: 'visitor', text, created_at: new Date().toISOString(),
      file_url: pendingFile?.url, file_type: 'image', file_name: pendingFile?.name,
    }]);
    try {
      await fetch(SUPPORT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { 'x-session-id': session } : {}) },
        body: JSON.stringify({
          visitor_id: visitorId, text, name: name.trim(), email: email.trim(),
          ...(pendingFile ? { file_name: pendingFile.name, file_content: pendingFile.url.split(',')[1] || '' } : {}),
        }),
      });
      loadMessages();
    } catch { /* тихо */ }
    setSending(false);
    setUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-[100] grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-105 transition-transform"
        aria-label="Chat"
      >
        <Icon name={open ? 'X' : 'MessageCircle'} size={24} />
        {hasUnread && !open && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive border-2 border-background" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[100] w-[calc(100vw-2.5rem)] sm:w-96 h-[70vh] sm:h-[520px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-primary text-primary-foreground shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 shrink-0">
              <Icon name="Headphones" size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Roboweb {isRu ? 'поддержка' : 'support'}</p>
              <p className="text-[11px] text-white/70">{isRu ? 'Обычно отвечаем быстро' : 'We usually reply fast'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-background">
            {messages.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
                  <Icon name="MessageCircle" size={22} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {isRu ? 'Здравствуйте! 👋' : 'Hello! 👋'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Напишите вопрос — ответим в ближайшее время' : 'Send us a message — we\'ll reply shortly'}
                </p>
              </div>
            ) : (
              messages.map(m => <MessageBubble key={m.id} m={m} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Name/email form (только для первого сообщения гостя) */}
          {showNameForm && (
            <div className="p-3 border-t border-border bg-secondary/50 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {isRu ? 'Представьтесь, чтобы мы могли ответить' : 'Tell us who you are so we can reply'}
              </p>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={isRu ? 'Ваше имя' : 'Your name'} className="h-9 rounded-xl text-sm" />
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className="h-9 rounded-xl text-sm" />
              <button
                onClick={() => { setShowNameForm(false); handleSend(); }}
                disabled={!name.trim()}
                className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity"
              >
                {isRu ? 'Продолжить' : 'Continue'}
              </button>
            </div>
          )}

          {/* Input */}
          {!showNameForm && (
            <div className="p-3 border-t border-border bg-background shrink-0">
              {attachedFile && (
                <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-secondary border border-border rounded-xl">
                  <img src={attachedFile.url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                  <span className="text-[11px] text-muted-foreground flex-1 truncate">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Icon name="X" size={13} />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2 bg-secondary/50 border border-border rounded-2xl px-3 py-2 focus-within:border-primary/50 transition-colors">
                <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-0.5">
                  <Icon name="Paperclip" size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRu ? 'Напишите сообщение…' : 'Type a message…'}
                  rows={1}
                  className="flex-1 bg-transparent text-sm resize-none outline-none max-h-24 text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedFile) || sending}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 transition-all shrink-0"
                >
                  <Icon name={sending || uploading ? 'Loader' : 'Send'} size={14} className={sending || uploading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
