import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  SUPPORT_CHAT_URL, unwrap,
  type SupportConversation, type SupportMessage, type QuickReply, type AutoReplySettings, type UserProjectSummary,
} from './adminTypes';

const POLL_INTERVAL = 7000;

interface AdminSupportChatTabProps {
  adminKey: string;
}

function MessageBubble({ m }: { m: SupportMessage }) {
  const isAdmin = m.sender === 'admin';
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] text-sm leading-relaxed px-3.5 py-2.5 ${
        isAdmin ? 'bg-primary text-white rounded-2xl rounded-br-sm' : 'bg-secondary border border-border text-foreground rounded-2xl rounded-bl-sm'
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

export function AdminSupportChatTab({ adminKey }: AdminSupportChatTabProps) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Шаблоны ответов
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showManageReplies, setShowManageReplies] = useState(false);
  const [newReplyTitle, setNewReplyTitle] = useState('');
  const [newReplyText, setNewReplyText] = useState('');

  // Проекты пользователя
  const [userInfo, setUserInfo] = useState<{ plan: string; email: string; name: string } | null>(null);
  const [userProjects, setUserProjects] = useState<UserProjectSummary[]>([]);

  // Настройки автоответа
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AutoReplySettings>({ enabled: false, text: '', start_hour: 9, end_hour: 20 });
  const [savingSettings, setSavingSettings] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const q = new URLSearchParams({ list: 'conversations' });
      if (search.trim()) q.set('search', search.trim());
      if (unreadOnly) q.set('unread_only', '1');
      const res = await fetch(`${SUPPORT_CHAT_URL}?${q.toString()}`, { headers: { 'x-admin-key': adminKey } });
      const data = await unwrap(await res.json());
      if (!data.error) setConversations((data.conversations as SupportConversation[]) || []);
    } catch { /* тихо */ }
    setLoading(false);
  }, [adminKey, search, unreadOnly]);

  const loadMessages = useCallback(async (convId: number, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await fetch(`${SUPPORT_CHAT_URL}?conversation_id=${convId}`, { headers: { 'x-admin-key': adminKey } });
      const data = await unwrap(await res.json());
      if (!data.error) setMessages((data.messages as SupportMessage[]) || []);
    } catch { /* тихо */ }
    if (!silent) setMessagesLoading(false);
  }, [adminKey]);

  const loadQuickReplies = useCallback(async () => {
    try {
      const res = await fetch(`${SUPPORT_CHAT_URL}?list=quick-replies`, { headers: { 'x-admin-key': adminKey } });
      const data = await unwrap(await res.json());
      if (!data.error) setQuickReplies((data.quick_replies as QuickReply[]) || []);
    } catch { /* тихо */ }
  }, [adminKey]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${SUPPORT_CHAT_URL}?settings=1`, { headers: { 'x-admin-key': adminKey } });
      const data = await unwrap(await res.json());
      if (!data.error && data.settings) setSettings(data.settings as AutoReplySettings);
    } catch { /* тихо */ }
  }, [adminKey]);

  const loadUserProjects = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`${SUPPORT_CHAT_URL}?user_projects=${userId}`, { headers: { 'x-admin-key': adminKey } });
      const data = await unwrap(await res.json());
      if (!data.error) {
        setUserInfo(data.user as typeof userInfo);
        setUserProjects((data.projects as UserProjectSummary[]) || []);
      }
    } catch { /* тихо */ }
  }, [adminKey]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => { loadQuickReplies(); loadSettings(); }, [loadQuickReplies, loadSettings]);

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
    setShowQuickReplies(false);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread_by_admin: false } : c));
    const conv = conversations.find(c => c.id === id);
    setUserInfo(null);
    setUserProjects([]);
    if (conv?.user_id) loadUserProjects(conv.user_id);
  };

  const handleSendReply = async (textOverride?: string) => {
    const text = (textOverride ?? reply).trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setReply('');
    setShowQuickReplies(false);
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

  const handleSaveQuickReply = async () => {
    if (!newReplyTitle.trim() || !newReplyText.trim()) return;
    try {
      await fetch(SUPPORT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ action: 'save_quick_reply', title: newReplyTitle.trim(), text: newReplyText.trim() }),
      });
      setNewReplyTitle('');
      setNewReplyText('');
      loadQuickReplies();
    } catch { /* тихо */ }
  };

  const handleDeleteQuickReply = async (id: number) => {
    setQuickReplies(prev => prev.filter(r => r.id !== id));
    try {
      await fetch(SUPPORT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ action: 'delete_quick_reply', id }),
      });
    } catch { /* тихо */ }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch(SUPPORT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ action: 'save_settings', ...settings }),
      });
      setShowSettings(false);
    } catch { /* тихо */ }
    setSavingSettings(false);
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
    <>
      <div className="rounded-2xl border border-border overflow-hidden flex h-[600px]">
        {/* Список бесед */}
        <div className="w-full sm:w-80 border-r border-border shrink-0 flex flex-col bg-secondary/20">
          <div className="px-4 py-3 border-b border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Диалоги</p>
              <div className="flex items-center gap-1.5">
                {unreadTotal > 0 && (
                  <span className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5">{unreadTotal}</span>
                )}
                <button onClick={() => setShowSettings(true)} title="Настройки автоответа" className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Settings" size={14} />
                </button>
              </div>
            </div>
            <div className="relative">
              <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по имени/email…"
                className="pl-8 h-8 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={() => setUnreadOnly(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                unreadOnly ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Filter" size={11} /> Только непрочитанные
            </button>
          </div>
          <div className={`flex-1 overflow-y-auto ${activeId ? 'hidden sm:block' : ''}`}>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Icon name="MessageCircle" size={32} className="text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Ничего не найдено</p>
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

              {/* Проекты и тариф пользователя */}
              {activeConv?.user_id && (userInfo || userProjects.length > 0) && (
                <div className="px-4 py-2.5 border-b border-border bg-secondary/30 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {userInfo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold">
                        <Icon name="CreditCard" size={11} /> {userInfo.plan}
                      </span>
                    )}
                    {userProjects.map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                        <Icon name="Layers" size={11} /> {p.title}
                      </span>
                    ))}
                    {userProjects.length === 0 && !userInfo && (
                      <span className="text-muted-foreground">Загрузка данных пользователя…</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-background">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                    <Icon name="Loader" size={16} className="animate-spin" /> Загрузка…
                  </div>
                ) : (
                  messages.map(m => <MessageBubble key={m.id} m={m} />)
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Панель быстрых ответов */}
              {showQuickReplies && (
                <div className="border-t border-border bg-secondary/50 p-3 max-h-40 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Шаблоны ответов</p>
                    <button onClick={() => setShowManageReplies(true)} className="text-xs text-primary hover:underline">Управлять</button>
                  </div>
                  {quickReplies.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Нет шаблонов — добавьте первый</p>
                  ) : (
                    <div className="space-y-1">
                      {quickReplies.map(r => (
                        <button key={r.id} onClick={() => handleSendReply(r.text)}
                          className="w-full text-left text-xs px-2.5 py-2 rounded-xl bg-card border border-border hover:border-primary/40 transition-all">
                          <span className="font-semibold text-foreground">{r.title}</span>
                          <p className="text-muted-foreground truncate mt-0.5">{r.text}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 border-t border-border bg-card shrink-0">
                <div className="flex items-end gap-2 bg-secondary/50 border border-border rounded-2xl px-3 py-2 focus-within:border-primary/50 transition-colors">
                  <button
                    onClick={() => setShowQuickReplies(v => !v)}
                    className={`shrink-0 mb-0.5 transition-colors ${showQuickReplies ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Шаблоны ответов"
                  >
                    <Icon name="Zap" size={16} />
                  </button>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ответить…"
                    rows={1}
                    className="flex-1 bg-transparent text-sm resize-none outline-none max-h-24 text-foreground placeholder:text-muted-foreground/60"
                  />
                  <button
                    onClick={() => handleSendReply()}
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

      {/* Модалка управления шаблонами */}
      <Dialog open={showManageReplies} onOpenChange={setShowManageReplies}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Шаблоны быстрых ответов</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {quickReplies.map(r => (
              <div key={r.id} className="flex items-start gap-2 rounded-xl border border-border p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.text}</p>
                </div>
                <button onClick={() => handleDeleteQuickReply(r.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <Input value={newReplyTitle} onChange={e => setNewReplyTitle(e.target.value)} placeholder="Название (например «Приветствие»)" className="h-9 rounded-xl text-sm" />
            <textarea
              value={newReplyText}
              onChange={e => setNewReplyText(e.target.value)}
              placeholder="Текст ответа…"
              rows={2}
              className="w-full text-sm rounded-xl border border-border px-3 py-2 outline-none focus:border-primary/50 resize-none"
            />
            <button
              onClick={handleSaveQuickReply}
              disabled={!newReplyTitle.trim() || !newReplyText.trim()}
              className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity"
            >
              Добавить шаблон
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модалка настроек автоответа */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Автоответ в нерабочее время</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <button
              onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                settings.enabled ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              Автоответ включён
              <Icon name={settings.enabled ? 'ToggleRight' : 'ToggleLeft'} size={22} />
            </button>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Текст автоответа</label>
              <textarea
                value={settings.text}
                onChange={e => setSettings(s => ({ ...s, text: e.target.value }))}
                rows={3}
                className="w-full text-sm rounded-xl border border-border px-3 py-2 outline-none focus:border-primary/50 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Рабочий день с</label>
                <Input type="number" min={0} max={23} value={settings.start_hour} onChange={e => setSettings(s => ({ ...s, start_hour: Number(e.target.value) }))} className="h-9 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">До</label>
                <Input type="number" min={0} max={23} value={settings.end_hour} onChange={e => setSettings(s => ({ ...s, end_hour: Number(e.target.value) }))} className="h-9 rounded-xl text-sm" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Время указывается по Москве (UTC+3). Автоответ отправляется только на первое сообщение нового посетителя.</p>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              {savingSettings ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
