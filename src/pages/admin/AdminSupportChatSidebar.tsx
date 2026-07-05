import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { type SupportConversation } from './adminTypes';

interface AdminSupportChatSidebarProps {
  conversations: SupportConversation[];
  activeId: number | null;
  unreadTotal: number;
  search: string;
  setSearch: (v: string) => void;
  unreadOnly: boolean;
  setUnreadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenSettings: () => void;
  onOpenConversation: (id: number) => void;
}

export function AdminSupportChatSidebar({
  conversations, activeId, unreadTotal, search, setSearch, unreadOnly, setUnreadOnly,
  onOpenSettings, onOpenConversation,
}: AdminSupportChatSidebarProps) {
  return (
    <div className="w-full sm:w-80 max-h-[40vh] sm:max-h-none border-b sm:border-b-0 sm:border-r border-border shrink-0 flex flex-col bg-secondary/20">
      <div className="px-4 py-3 border-b border-border bg-card space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Диалоги</p>
          <div className="flex items-center gap-1.5">
            {unreadTotal > 0 && (
              <span className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5">{unreadTotal}</span>
            )}
            <button onClick={onOpenSettings} title="Настройки автоответа" className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
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
              onClick={() => onOpenConversation(c.id)}
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
  );
}
