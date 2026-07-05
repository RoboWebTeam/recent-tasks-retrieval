import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/icon';
import {
  SUPPORT_CHAT_URL, unwrap,
  type SupportConversation, type SupportMessage, type QuickReply, type AutoReplySettings, type UserProjectSummary,
} from './adminTypes';
import { AdminSupportChatSidebar } from './AdminSupportChatSidebar';
import { AdminSupportChatConversation } from './AdminSupportChatConversation';
import { AdminSupportChatModals } from './AdminSupportChatModals';

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
      <div className="rounded-2xl border border-border overflow-hidden flex flex-col sm:flex-row h-[75vh] sm:h-[600px]">
        <AdminSupportChatSidebar
          conversations={conversations}
          activeId={activeId}
          unreadTotal={unreadTotal}
          search={search}
          setSearch={setSearch}
          unreadOnly={unreadOnly}
          setUnreadOnly={setUnreadOnly}
          onOpenSettings={() => setShowSettings(true)}
          onOpenConversation={openConversation}
        />

        <AdminSupportChatConversation
          activeId={activeId}
          activeConv={activeConv}
          messages={messages}
          messagesLoading={messagesLoading}
          messagesEndRef={messagesEndRef}
          userInfo={userInfo}
          userProjects={userProjects}
          reply={reply}
          setReply={setReply}
          sending={sending}
          showQuickReplies={showQuickReplies}
          setShowQuickReplies={setShowQuickReplies}
          quickReplies={quickReplies}
          onCloseActive={() => setActiveId(null)}
          onToggleStatus={handleToggleStatus}
          onSendReply={handleSendReply}
          onKeyDown={handleKeyDown}
          onOpenManageReplies={() => setShowManageReplies(true)}
        />
      </div>

      <AdminSupportChatModals
        showManageReplies={showManageReplies}
        setShowManageReplies={setShowManageReplies}
        quickReplies={quickReplies}
        newReplyTitle={newReplyTitle}
        setNewReplyTitle={setNewReplyTitle}
        newReplyText={newReplyText}
        setNewReplyText={setNewReplyText}
        onSaveQuickReply={handleSaveQuickReply}
        onDeleteQuickReply={handleDeleteQuickReply}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        settings={settings}
        setSettings={setSettings}
        savingSettings={savingSettings}
        onSaveSettings={handleSaveSettings}
      />
    </>
  );
}
