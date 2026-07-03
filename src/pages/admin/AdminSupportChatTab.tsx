import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { SUPPORT_CHAT_URL, unwrap, type SupportConversation, type SupportMessage } from './adminTypes';

const POLL_INTERVAL = 7000;

interface AdminSupportChatTabProps {
  adminKey: string;
}

export function AdminSupportChatTab({ adminKey }: AdminSupportChatTabProps) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${SUPPORT_CHAT_URL}?list=conversations`, { headers: { 'x-admin-key': adminKey } });
      const data = await unwrap(await res.json());
      if (!data.error) setConversations((data.conversations as SupportConversation[]) || []);
    } catch { /* тихо */ }
    setLoading(false);
  }, [adminKey]);

  const loadMessages = useCallback(async (convId: number, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await fetch(`${SUPPORT_CHAT_URL}?conversation_id=${convId}`, { headers: { 'x-admin-key': adminKey } });
      const data = await unwrap(await res.json());
      if (!data.error) setMessages((data.messages as SupportMessage[]) || []);
    } catch { /* тихо */ }
    if (!silent) setMessagesLoading(false);
  }, [adminKey]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (activeId === null) return;
    loadMessages(activeId);
    const interval = setInterval(() => loadMessages(activeId, true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (id: number) => {
    setActiveId(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread_by_admin: false } : c));
  };

  const handleSendReply = async () => {
    const text = reply.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setReply('');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'admin', text, created_at: new Date().toISOString() }]);
    try {
      await fetch(SUPPORT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ conversation_id: activeId, text }),
      });
      loadConversations();
    } catch { /* тихо */ }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); }
  };

  const handleToggleStatus = async () => {
    if (!activeId) return;
    const conv = conversations.find(c => c.id === activeId);
    const newStatus = conv?.status === 'closed' ? 'open' : 'closed';
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, status: newStatus } : c));
    try {
      await fetch(SUPPORT_CHAT_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ conversation_id: activeId, status: newStatus }),
      });
    } catch { /* тихо */ }
  };

  const activeConv = conversations.find(c => c.id === activeId);
  const unreadTotal = conversations.filter(c => c.unread_by_admin).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
        <Icon name="Loader" size={18} className="animate-spin" /> Загружаем чаты…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden flex h-[600px]">
      {/* Список бесед */}
      <div className="w-full sm:w-80 border-r border-border shrink-0 flex flex-col bg-secondary/20">
        <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
          <p className="text-sm font-semibold">Диалоги</p>
          {unreadTotal > 0 && (
            <span className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5">{unreadTotal}</span>
          )}
        </div>
        <div className={`flex-1 overflow-y-auto ${activeId ? 'hidden sm:block' : ''}`}>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Icon name="MessageCircle" size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Пока нет сообщений от посетителей</p>
            </div>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`w-full flex items-start gap-2.5 px-4 py-3 text-left border-b border-border transition-colors ${
                  activeId === c.id ? 'bg-card' : 'hover:bg-card/50'
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 font-bold text-xs ${
                  c.unread_by_admin ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {(c.name || 'Г').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm truncate ${c.unread_by_admin ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                      {c.name || 'Гость'}
                    </p>
                    {c.status === 'closed' && <Icon name="CheckCircle" size={12} className="text-muted-foreground shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.email || c.visitor_id.slice(0, 12)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(c.last_message_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {c.unread_by_admin && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Активная беседа */}
      <div className={`flex-1 flex flex-col ${!activeId ? 'hidden sm:flex' : ''}`}>
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <Icon name="MessageCircle" size={40} className="text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Выберите диалог слева, чтобы ответить</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
              <button onClick={() => setActiveId(null)} className="sm:hidden text-muted-foreground">
                <Icon name="ArrowLeft" size={18} />
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0">
                {(activeConv?.name || 'Г').slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{activeConv?.name || 'Гость'}</p>
                <p className="text-xs text-muted-foreground truncate">{activeConv?.email || 'без e-mail'}</p>
              </div>
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  activeConv?.status === 'closed'
                    ? 'bg-secondary text-muted-foreground hover:text-foreground'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon name={activeConv?.status === 'closed' ? 'RotateCcw' : 'CheckCircle'} size={13} />
                {activeConv?.status === 'closed' ? 'Открыть' : 'Закрыть'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-background">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Icon name="Loader" size={16} className="animate-spin" /> Загрузка…
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] text-sm leading-relaxed px-3.5 py-2.5 ${
                      m.sender === 'admin'
                        ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                        : 'bg-secondary border border-border text-foreground rounded-2xl rounded-bl-sm'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-border bg-card shrink-0">
              <div className="flex items-end gap-2 bg-secondary/50 border border-border rounded-2xl px-3 py-2 focus-within:border-primary/50 transition-colors">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ответить…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm resize-none outline-none max-h-24 text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!reply.trim() || sending}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 transition-all shrink-0"
                >
                  <Icon name={sending ? 'Loader' : 'Send'} size={14} className={sending ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
