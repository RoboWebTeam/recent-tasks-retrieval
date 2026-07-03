import Icon from '@/components/ui/icon';
import {
  type SupportConversation, type SupportMessage, type QuickReply, type UserProjectSummary,
} from './adminTypes';

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

interface AdminSupportChatConversationProps {
  activeId: number | null;
  activeConv: SupportConversation | undefined;
  messages: SupportMessage[];
  messagesLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  userInfo: { plan: string; email: string; name: string } | null;
  userProjects: UserProjectSummary[];
  reply: string;
  setReply: (v: string) => void;
  sending: boolean;
  showQuickReplies: boolean;
  setShowQuickReplies: React.Dispatch<React.SetStateAction<boolean>>;
  quickReplies: QuickReply[];
  onCloseActive: () => void;
  onToggleStatus: () => void;
  onSendReply: (textOverride?: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onOpenManageReplies: () => void;
}

export function AdminSupportChatConversation({
  activeId, activeConv, messages, messagesLoading, messagesEndRef, userInfo, userProjects,
  reply, setReply, sending, showQuickReplies, setShowQuickReplies, quickReplies,
  onCloseActive, onToggleStatus, onSendReply, onKeyDown, onOpenManageReplies,
}: AdminSupportChatConversationProps) {
  return (
    <div className={`flex-1 flex flex-col ${!activeId ? 'hidden sm:flex' : ''}`}>
      {!activeId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <Icon name="MessageCircle" size={40} className="text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">Выберите диалог слева, чтобы ответить</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            <button onClick={onCloseActive} className="sm:hidden text-muted-foreground">
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
              onClick={onToggleStatus}
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
                <button onClick={onOpenManageReplies} className="text-xs text-primary hover:underline">Управлять</button>
              </div>
              {quickReplies.length === 0 ? (
                <p className="text-xs text-muted-foreground">Нет шаблонов — добавьте первый</p>
              ) : (
                <div className="space-y-1">
                  {quickReplies.map(r => (
                    <button key={r.id} onClick={() => onSendReply(r.text)}
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
                onKeyDown={onKeyDown}
                placeholder="Ответить…"
                rows={1}
                className="flex-1 bg-transparent text-sm resize-none outline-none max-h-24 text-foreground placeholder:text-muted-foreground/60"
              />
              <button
                onClick={() => onSendReply()}
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
  );
}
