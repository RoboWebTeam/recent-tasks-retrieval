import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { tr, type Lang } from '@/lib/i18n';
import { type User, type Order } from '@/lib/auth';

interface PlanLabelItem {
  label: string;
  color: string;
  requests: string;
}

interface DashboardProfileTabProps {
  lang: Lang;
  user: User;
  plan: PlanLabelItem;
  projectsCount: number;
  setTab: (t: 'projects' | 'profile' | 'plan') => void;

  nameValue: string;
  setNameValue: (v: string) => void;
  nameSaving: boolean;
  nameSaved: boolean;
  handleSaveName: () => void;

  oldPassword: string;
  setOldPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  pwSaving: boolean;
  pwError: string;
  pwSaved: boolean;
  handleChangePassword: (e: React.FormEvent) => void;

  orders: Order[];

  handleLogout: () => void;

  deleteOpen: boolean;
  setDeleteOpen: (v: boolean) => void;
  deletePassword: string;
  setDeletePassword: (v: string) => void;
  deleteError: string;
  deleting: boolean;
  handleDeleteAccount: () => void;
}

export default function DashboardProfileTab({
  lang, user, plan, projectsCount, setTab,
  nameValue, setNameValue, nameSaving, nameSaved, handleSaveName,
  oldPassword, setOldPassword, newPassword, setNewPassword, pwSaving, pwError, pwSaved, handleChangePassword,
  orders,
  handleLogout,
  deleteOpen, setDeleteOpen, deletePassword, setDeletePassword, deleteError, deleting, handleDeleteAccount,
}: DashboardProfileTabProps) {
  return (
    <div className="max-w-lg">
      <h1 className="font-display font-black text-2xl mb-6">{tr('profile', lang)}</h1>

      <div className="rounded-2xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground font-display font-black text-xl">
            {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div className="font-display font-bold text-lg">{user.name}</div>
            <div className="text-muted-foreground text-sm">{user.email}</div>
            <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${plan.color}`}>
              {plan.label}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{lang === 'ru' ? 'Имя' : 'Name'}</label>
            <div className="flex gap-2">
              <Input
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                className="h-10 rounded-xl"
              />
              <Button
                size="sm"
                className="rounded-xl shrink-0"
                disabled={nameSaving || !nameValue.trim() || nameValue.trim() === user.name}
                onClick={handleSaveName}
              >
                {nameSaving ? <Icon name="Loader" size={14} className="animate-spin" /> : nameSaved ? <Icon name="Check" size={14} /> : (lang === 'ru' ? 'Сохранить' : 'Save')}
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-secondary/50 px-4 py-3">
            <div className="text-xs text-muted-foreground mb-0.5">E-mail</div>
            <div className="font-medium">{user.email}</div>
          </div>
          {user.created_at && (
            <div className="rounded-xl bg-secondary/50 px-4 py-3">
              <div className="text-xs text-muted-foreground mb-0.5">{tr('registeredAt', lang)}</div>
              <div className="font-medium">{new Date(user.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          )}
        </div>
      </div>

      {/* Смена пароля */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-4">
        <h3 className="font-display font-bold text-sm mb-4">{lang === 'ru' ? 'Смена пароля' : 'Change password'}</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <Input
            type="password"
            placeholder={lang === 'ru' ? 'Текущий пароль' : 'Current password'}
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            required
            className="h-10 rounded-xl"
          />
          <Input
            type="password"
            placeholder={lang === 'ru' ? 'Новый пароль' : 'New password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="h-10 rounded-xl"
          />
          {pwError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
              <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
              <span>{pwError}</span>
            </div>
          )}
          {pwSaved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2.5">
              <Icon name="CheckCircle" size={15} />
              <span>{lang === 'ru' ? 'Пароль изменён' : 'Password changed'}</span>
            </div>
          )}
          <Button type="submit" variant="outline" size="sm" className="rounded-xl" disabled={pwSaving}>
            {pwSaving ? <Icon name="Loader" size={14} className="mr-1.5 animate-spin" /> : null}
            {lang === 'ru' ? 'Изменить пароль' : 'Change password'}
          </Button>
        </form>
      </div>

      {/* История платежей */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-4">
        <h3 className="font-display font-bold text-sm mb-4">{lang === 'ru' ? 'История платежей' : 'Payment history'}</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{lang === 'ru' ? 'Платежей пока нет' : 'No payments yet'}</p>
        ) : (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.order_number} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {o.order_type === 'energy'
                      ? (lang === 'ru' ? `Энергия +${o.energy_amount}` : `Energy +${o.energy_amount}`)
                      : (o.plan ? o.plan : (lang === 'ru' ? 'Тариф' : 'Plan'))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.created_at ? new Date(o.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US') : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{o.amount.toLocaleString()} ₽</p>
                  <span className={`text-xs font-medium ${o.status === 'paid' ? 'text-emerald-600' : o.status === 'canceled' ? 'text-destructive' : 'text-amber-600'}`}>
                    {o.status === 'paid' ? (lang === 'ru' ? 'Оплачено' : 'Paid') : o.status === 'canceled' ? (lang === 'ru' ? 'Отменено' : 'Canceled') : (lang === 'ru' ? 'В обработке' : 'Pending')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-sm">{tr('projects', lang)}</div>
          <div className="text-muted-foreground text-xs">{projectsCount} {tr('created', lang)}</div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setTab('projects')}>
          {tr('goTo', lang)}
        </Button>
      </div>

      <Button variant="outline" className="w-full rounded-xl text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5" onClick={handleLogout}>
        <Icon name="LogOut" size={15} className="mr-2" /> {tr('logout', lang)}
      </Button>

      {/* Удаление аккаунта */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-3 rounded-xl text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5">
            <Icon name="Trash2" size={15} className="mr-2" /> {lang === 'ru' ? 'Удалить аккаунт' : 'Delete account'}
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">{lang === 'ru' ? 'Удалить аккаунт?' : 'Delete account?'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {lang === 'ru'
              ? 'Это действие необратимо. Все ваши сайты будут отвязаны от аккаунта.'
              : 'This action cannot be undone. All your sites will be unlinked from the account.'}
          </p>
          <Input
            type="password"
            placeholder={lang === 'ru' ? 'Введите пароль для подтверждения' : 'Enter password to confirm'}
            value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
            className="h-10 rounded-xl"
          />
          {deleteError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
              <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}
          <Button
            variant="destructive"
            className="w-full rounded-xl"
            disabled={deleting || !deletePassword}
            onClick={handleDeleteAccount}
          >
            {deleting ? <Icon name="Loader" size={14} className="mr-1.5 animate-spin" /> : null}
            {lang === 'ru' ? 'Удалить безвозвратно' : 'Delete permanently'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
