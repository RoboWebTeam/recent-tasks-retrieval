import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { type QuickReply, type AutoReplySettings } from './adminTypes';

interface AdminSupportChatModalsProps {
  showManageReplies: boolean;
  setShowManageReplies: (v: boolean) => void;
  quickReplies: QuickReply[];
  newReplyTitle: string;
  setNewReplyTitle: (v: string) => void;
  newReplyText: string;
  setNewReplyText: (v: string) => void;
  onSaveQuickReply: () => void;
  onDeleteQuickReply: (id: number) => void;

  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  settings: AutoReplySettings;
  setSettings: React.Dispatch<React.SetStateAction<AutoReplySettings>>;
  savingSettings: boolean;
  onSaveSettings: () => void;
}

export function AdminSupportChatModals({
  showManageReplies, setShowManageReplies, quickReplies,
  newReplyTitle, setNewReplyTitle, newReplyText, setNewReplyText,
  onSaveQuickReply, onDeleteQuickReply,
  showSettings, setShowSettings, settings, setSettings, savingSettings, onSaveSettings,
}: AdminSupportChatModalsProps) {
  return (
    <>
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
                <button onClick={() => onDeleteQuickReply(r.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
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
              onClick={onSaveQuickReply}
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
              onClick={onSaveSettings}
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
