import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { tr, type Lang } from '@/lib/i18n';
import { type User, getRemainingRequests, LOW_BALANCE_THRESHOLD } from '@/lib/auth';
import { PLAN_PRICING_URL, FALLBACK_PRO_PLANS, PRO_PLAN_DETAILS, getProRequestsLabel, type ProPlanOption } from '@/data/proPlans';
import { ENERGY_PRICING_URL, FALLBACK_ENERGY_PACKAGES, type EnergyPackage } from '@/data/energyPackages';

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
  const [proPlans, setProPlans] = useState<ProPlanOption[]>(FALLBACK_PRO_PLANS);
  const [proIndex, setProIndex] = useState(0);
  const selectedPro = proPlans[proIndex] ?? proPlans[0];
  const [energyPackages, setEnergyPackages] = useState<EnergyPackage[]>(FALLBACK_ENERGY_PACKAGES);
  const remaining = getRemainingRequests(user);
  const lowBalance = remaining !== null && remaining <= LOW_BALANCE_THRESHOLD;

  useEffect(() => {
    fetch(PLAN_PRICING_URL)
      .then(r => r.json())
      .then(raw => {
        const d = raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
        if (Array.isArray(d.plans) && d.plans.length > 0) setProPlans(d.plans);
      })
      .catch(() => {/* остаёмся на резервных ценах */});

    fetch(ENERGY_PRICING_URL)
      .then(r => r.json())
      .then(raw => {
        const d = raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
        if (Array.isArray(d.packages) && d.packages.length > 0) setEnergyPackages(d.packages);
      })
      .catch(() => {/* остаёмся на резервных ценах */});
  }, []);

  return (
    <div>
      <h1 className="font-display font-black text-xl sm:text-2xl mb-6">{lang === 'ru' ? 'Тарифный план' : 'Pricing Plan'}</h1>

      {lowBalance && (
        <div className={`rounded-2xl px-4 py-3 mb-4 flex items-start gap-2.5 text-sm ${
          remaining! <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-800'
        }`}>
          <Icon name={remaining! <= 0 ? 'AlertCircle' : 'Zap'} size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {remaining! <= 0
                ? (lang === 'ru' ? 'Лимит AI-запросов исчерпан' : 'AI request limit reached')
                : (lang === 'ru' ? `Осталось ${remaining} запросов к AI` : `${remaining} AI requests left`)}
            </p>
            <p className="opacity-80 mt-0.5">
              {lang === 'ru' ? 'Купите энергию ниже или смените тариф, чтобы не потерять доступ к AI.' : 'Buy energy below or upgrade your plan to keep AI access.'}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-primary bg-card p-4 sm:p-6 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
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
        <Button className="rounded-xl font-semibold w-full sm:w-auto shrink-0" asChild>
          <Link to="/pricing">{tr('upgradePlan', lang)}</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 mb-6">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {energyPackages.map(pkg => (
            <div key={pkg.code} className="rounded-xl border border-border p-2.5 sm:p-4 flex flex-col items-center text-center gap-1.5 sm:gap-2">
              <div className="font-display font-black text-lg sm:text-xl">{pkg.requests}</div>
              <p className="text-[11px] sm:text-xs text-muted-foreground">{lang === 'ru' ? 'запросов' : 'requests'}</p>
              <p className="text-xs sm:text-sm font-semibold">{pkg.price.toLocaleString()} ₽</p>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-xs w-full px-2"
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
          { id: 'premium', name: tr('planPremium', lang), price: '990 ₽/мес', requests: `40 ${tr('requestsMonthly', lang)}`, features: lang === 'ru' ? ['Свой домен + экспорт кода в GitHub', 'Фуллстек-бэкенд: формы, каталог, корзина', 'До 3 проектов', 'БД 128 МБ'] : ['Custom domain + code export to GitHub', 'Fullstack backend: forms, catalog, cart', 'Up to 3 projects', '128 MB DB'], current: user?.plan === 'premium', hot: true },
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

        {/* Pro — интерактивная карточка с выбором количества запросов */}
        <div className={`rounded-2xl border p-5 ${(user?.plan ?? '').startsWith('pro_') ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <h3 className="font-display font-bold text-lg">{tr('planPro', lang)}</h3>
          <div className="font-display font-black text-2xl my-2">{selectedPro.price.toLocaleString()} ₽/{lang === 'ru' ? 'мес' : 'mo'}</div>
          <p className="text-xs text-primary font-semibold mb-2">{getProRequestsLabel(selectedPro.requests, lang)}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {proPlans.map((p, i) => (
              <button
                key={p.plan_code}
                onClick={() => setProIndex(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  proIndex === i ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.requests}
              </button>
            ))}
          </div>
          <ul className="space-y-1.5 mb-4">
            {(lang === 'ru' ? ['Приоритетная поддержка'] : ['Priority support']).map(f => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Icon name="Check" size={13} className="text-emerald-500 shrink-0" />{f}
              </li>
            ))}
            {(PRO_PLAN_DETAILS[selectedPro.plan_code]?.[lang] ?? []).map(f => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Icon name="Check" size={13} className="text-emerald-500 shrink-0" />{f}
              </li>
            ))}
          </ul>
          {user?.plan === selectedPro.plan_code ? (
            <Button className="w-full rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary" disabled>
              {tr('currentPlanBtn', lang)}
            </Button>
          ) : (
            <Button className="w-full rounded-xl text-sm font-semibold" asChild>
              <Link to="/pricing">{tr('selectPlan', lang)}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}