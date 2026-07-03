import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { tr, type Lang } from '@/lib/i18n';
import { type User } from '@/lib/auth';

const ENERGY_PACKAGES = [
  { code: 'small', requests: 10, price: 290 },
  { code: 'medium', requests: 30, price: 690 },
  { code: 'large', requests: 100, price: 1990 },
];

interface PlanLabelItem {
  label: string;
  color: string;
  requests: string;
}

interface DashboardPlanTabProps {
  lang: Lang;
  user: User | null;
  plan: PlanLabelItem;
  buyingEnergy: string | null;
  energyError: string;
  handleBuyEnergy: (code: string, requests: number, price: number) => void;
}

export default function DashboardPlanTab({
  lang, user, plan, buyingEnergy, energyError, handleBuyEnergy,
}: DashboardPlanTabProps) {
  return (
    <div>
      <h1 className="font-display font-black text-2xl mb-6">{lang === 'ru' ? 'Тарифный план' : 'Pricing Plan'}</h1>
      <div className="rounded-2xl border border-primary bg-card p-6 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${plan.color}`}>{plan.label}</span>
            <span className="text-xs text-muted-foreground">{tr('currentPlan', lang)}</span>
          </div>
          <h3 className="font-display font-bold text-xl">{lang === 'ru' ? 'Ваш план' : 'Your plan'}: {plan.label}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {(user?.requests_used ?? 0)} / {user?.requests_limit ?? plan.requests} {lang === 'ru' ? 'запросов к AI использовано в этом месяце' : 'AI requests used this month'}
          </p>
        </div>
        <Button className="rounded-xl font-semibold shrink-0" asChild>
          <Link to="/pricing">{tr('upgradePlan', lang)}</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600">
              <Icon name="Zap" size={16} />
            </div>
            <div>
              <p className="font-display font-bold text-sm">{lang === 'ru' ? 'Энергия' : 'Energy'}</p>
              <p className="text-xs text-muted-foreground">
                {lang === 'ru' ? `Доступно докупленных запросов: ${user?.energy_balance ?? 0}` : `Available extra requests: ${user?.energy_balance ?? 0}`}
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {lang === 'ru'
            ? 'Когда лимит тарифа заканчивается, дополнительные обращения к AI списываются из энергии.'
            : 'When your plan limit runs out, extra AI requests are deducted from energy.'}
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {ENERGY_PACKAGES.map(pkg => (
            <div key={pkg.code} className="rounded-xl border border-border p-4 flex flex-col items-center text-center gap-2">
              <div className="font-display font-black text-xl">{pkg.requests}</div>
              <p className="text-xs text-muted-foreground">{lang === 'ru' ? 'запросов' : 'requests'}</p>
              <p className="text-sm font-semibold">{pkg.price.toLocaleString()} ₽</p>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-xs w-full"
                disabled={buyingEnergy === pkg.code}
                onClick={() => handleBuyEnergy(pkg.code, pkg.requests, pkg.price)}
              >
                {buyingEnergy === pkg.code
                  ? <Icon name="Loader" size={13} className="animate-spin" />
                  : (lang === 'ru' ? 'Купить' : 'Buy')}
              </Button>
            </div>
          ))}
        </div>
        {energyError && (
          <p className="text-xs text-destructive mt-3">{energyError}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { id: 'free', name: tr('planFree', lang), price: lang === 'ru' ? 'Бесплатно' : 'Free', requests: lang === 'ru' ? '10 запросов разово' : '10 requests once', features: lang === 'ru' ? ['Облачный хостинг', 'До 3 проектов', 'БД 128 МБ', 'Хранилище 512 МБ'] : ['Cloud hosting', 'Up to 3 projects', '128 MB DB', '512 MB storage'], current: user?.plan === 'free' },
          { id: 'premium', name: tr('planPremium', lang), price: '999 ₽/мес', requests: `40 ${tr('requestsMonthly', lang)}`, features: lang === 'ru' ? ['Подключение домена', 'До 3 проектов', 'БД 128 МБ', 'Хранилище 512 МБ'] : ['Custom domain', 'Up to 3 projects', '128 MB DB', '512 MB storage'], current: user?.plan === 'premium', hot: true },
          { id: 'pro', name: tr('planPro', lang), price: lang === 'ru' ? 'от 2 999 ₽/мес' : 'from 2 999 ₽/mo', requests: lang === 'ru' ? '60–800 запросов на выбор' : '60–800 requests, your pick', features: lang === 'ru' ? ['Приоритетная поддержка', '5–50 проектов', 'БД 1–10 ГБ', 'Хранилище 5–100 ГБ'] : ['Priority support', '5–50 projects', '1–10 GB DB', '5–100 GB storage'], current: (user?.plan ?? '').startsWith('pro_') },
        ].map(p => (
          <div key={p.id} className={`rounded-2xl border p-5 ${p.current ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
            {p.hot && <span className="inline-block bg-primary text-primary-foreground text-xs font-bold rounded-full px-2.5 py-0.5 mb-2">{lang === 'ru' ? 'Популярный' : 'Popular'}</span>}
            <h3 className="font-display font-bold text-lg">{p.name}</h3>
            <div className="font-display font-black text-2xl my-2">{p.price}</div>
            <p className="text-xs text-primary font-semibold mb-3">{p.requests}</p>
            <ul className="space-y-1.5 mb-4">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Icon name="Check" size={13} className="text-emerald-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
            {p.current ? (
              <Button className="w-full rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary" disabled>
                {tr('currentPlanBtn', lang)}
              </Button>
            ) : (
              <Button className="w-full rounded-xl text-sm font-semibold" asChild>
                <Link to="/pricing">{tr('selectPlan', lang)}</Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}