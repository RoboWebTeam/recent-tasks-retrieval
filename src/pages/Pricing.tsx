import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getLang } from '@/lib/i18n';
import { getSession, getStoredUser } from '@/lib/auth';

const YOOKASSA_URL = 'https://functions.poehali.dev/4fec45e4-aaef-4bc4-ba3c-7a43dfc964bc';

const getLangData = (isRu: boolean) => ({
  title: isRu ? 'Тарифы' : 'Pricing',
  subtitle: isRu ? 'Выберите план, который подходит вашему бизнесу' : 'Choose the plan that fits your business',
  monthly: isRu ? 'Месяц' : 'Monthly',
  yearly: isRu ? 'Год' : 'Yearly',
  save: isRu ? 'Экономия 30%' : 'Save 30%',
  popular: isRu ? 'Популярный' : 'Popular',
  cta: isRu ? 'Начать бесплатно' : 'Start free',
  ctaPaid: isRu ? 'Выбрать тариф' : 'Choose plan',
  faq: isRu ? 'Частые вопросы' : 'FAQ',
  plans: [
    {
      id: 'free',
      name: isRu ? 'Пробный' : 'Free',
      price: { monthly: 0, yearly: 0 },
      currency: isRu ? '₽' : '$',
      desc: isRu ? 'Попробуйте Roboweb бесплатно' : 'Try Roboweb for free',
      color: 'border-border',
      badge: null,
      features: [
        isRu ? '3 AI-генерации в месяц' : '3 AI generations/month',
        isRu ? '1 сайт' : '1 website',
        isRu ? 'Публикация на roboweb.site' : 'Publish on roboweb.site',
        isRu ? 'Скачать HTML' : 'Download HTML',
        isRu ? 'Базовые шаблоны' : 'Basic templates',
      ],
      disabled: [
        isRu ? 'Свой домен' : 'Custom domain',
        isRu ? 'Аналитика' : 'Analytics',
        isRu ? 'Форма заявок' : 'Lead forms',
        isRu ? 'Приоритетная поддержка' : 'Priority support',
      ],
    },
    {
      id: 'premium',
      name: isRu ? 'Премиум' : 'Premium',
      price: { monthly: 1490, yearly: 990 },
      currency: isRu ? '₽' : '$',
      yearlyPrice: { monthly: 29, yearly: 19 },
      desc: isRu ? 'Для малого бизнеса и фрилансеров' : 'For small business & freelancers',
      color: 'border-primary',
      badge: isRu ? 'Популярный' : 'Popular',
      features: [
        isRu ? '40 AI-генераций в месяц' : '40 AI generations/month',
        isRu ? '5 сайтов' : '5 websites',
        isRu ? 'Свой домен + SSL' : 'Custom domain + SSL',
        isRu ? 'Аналитика посещений' : 'Visit analytics',
        isRu ? 'Форма заявок на почту' : 'Lead forms to email',
        isRu ? 'История версий (10)' : 'Version history (10)',
        isRu ? 'Быстрые правки' : 'Quick edits',
        isRu ? 'Поддержка в Telegram' : 'Telegram support',
      ],
      disabled: [
        isRu ? 'Безлимитные сайты' : 'Unlimited sites',
        isRu ? 'Белый лейбл' : 'White label',
      ],
    },
    {
      id: 'pro',
      name: isRu ? 'Профи' : 'Pro',
      price: { monthly: 3490, yearly: 2490 },
      currency: isRu ? '₽' : '$',
      yearlyPrice: { monthly: 69, yearly: 49 },
      desc: isRu ? 'Для агентств и профессионалов' : 'For agencies & professionals',
      color: 'border-foreground',
      badge: null,
      features: [
        isRu ? '60 AI-генераций в месяц' : '60 AI generations/month',
        isRu ? 'Безлимитные сайты' : 'Unlimited websites',
        isRu ? 'Свой домен + SSL' : 'Custom domain + SSL',
        isRu ? 'Продвинутая аналитика' : 'Advanced analytics',
        isRu ? 'Форма заявок + CRM' : 'Lead forms + CRM',
        isRu ? 'Безлимитная история версий' : 'Unlimited version history',
        isRu ? 'Белый лейбл' : 'White label',
        isRu ? 'Приоритетная поддержка 24/7' : 'Priority support 24/7',
        isRu ? 'API-доступ' : 'API access',
      ],
      disabled: [],
    },
  ],
  faqs: [
    {
      q: isRu ? 'Могу ли я отменить подписку в любой момент?' : 'Can I cancel my subscription anytime?',
      a: isRu ? 'Да, вы можете отменить подписку в любой момент. Сайты останутся доступны до конца оплаченного периода.' : 'Yes, you can cancel anytime. Your sites remain accessible until the end of the paid period.',
    },
    {
      q: isRu ? 'Что происходит с сайтами после окончания подписки?' : 'What happens to my sites after subscription ends?',
      a: isRu ? 'Сайты переходят в режим только для чтения. Вы не можете редактировать их, но они остаются онлайн на нашем домене. Свой домен отключается.' : 'Sites go into read-only mode. You can\'t edit them, but they stay online on our domain. Custom domain is disconnected.',
    },
    {
      q: isRu ? 'Есть ли пробный период для платных тарифов?' : 'Is there a trial for paid plans?',
      a: isRu ? 'Пробный тариф бесплатен без ограничения по времени. Для платных тарифов — 7-дневный возврат средств без вопросов.' : 'The Free plan has no time limit. For paid plans — 7-day money-back guarantee, no questions asked.',
    },
    {
      q: isRu ? 'Какие способы оплаты принимаются?' : 'What payment methods are accepted?',
      a: isRu ? 'Карты Visa, Mastercard, МИР, СБП, ЮMoney, криптовалюта. Оплата через безопасный платёжный шлюз.' : 'Visa, Mastercard, bank transfer, crypto. Payment through a secure payment gateway.',
    },
  ],
});

export default function Pricing() {
  const lang = getLang();
  const isRu = lang === 'ru';
  const data = getLangData(isRu);
  const navigate = useNavigate();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [payError, setPayError] = useState('');
  const session = getSession();
  const user = getStoredUser();

  const handleSelectPlan = async (planId: string, priceRub: number) => {
    if (!session || !user) {
      navigate(`/register?plan=${planId}&billing=${billing}`);
      return;
    }
    setPayingPlan(planId);
    setPayError('');
    try {
      const planLabel = planId === 'premium' ? (isRu ? 'Премиум' : 'Premium') : (isRu ? 'Профи' : 'Pro');
      const res = await fetch(YOOKASSA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: priceRub,
          user_email: user.email,
          user_name: user.name,
          description: `Тариф «${planLabel}» (${billing === 'yearly' ? (isRu ? 'год' : 'yearly') : (isRu ? 'месяц' : 'monthly')})`,
          return_url: `${window.location.origin}/pricing/status`,
          plan: planId,
          billing_period: billing,
          user_id: user.id,
        }),
      });
      const raw = await res.json();
      const dataRes = raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
      if (!res.ok || dataRes.error) {
        throw new Error(dataRes.error || (isRu ? 'Ошибка создания платежа' : 'Payment creation error'));
      }
      if (dataRes.payment_url) {
        window.location.href = dataRes.payment_url;
      }
    } catch (e) {
      setPayError(e instanceof Error ? e.message : (isRu ? 'Ошибка оплаты' : 'Payment error'));
    }
    setPayingPlan(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-base">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Icon name="Bot" size={14} />
            </span>
            Roboweb
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isRu ? 'Войти' : 'Sign in'}
            </Link>
            <Button size="sm" className="rounded-xl" asChild>
              <Link to="/register">{isRu ? 'Начать бесплатно' : 'Start free'}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-14 md:py-20 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            {data.title}
          </span>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight mb-4">
            {data.subtitle}
          </h1>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-2xl p-1.5 mt-4">
            {(['monthly', 'yearly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${billing === b ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
                {b === 'monthly' ? data.monthly : data.yearly}
                {b === 'yearly' && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                    {data.save}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {data.plans.map(plan => {
            const price = isRu
              ? plan.price[billing]
              : (plan.yearlyPrice ? plan.yearlyPrice[billing] : plan.price[billing]);
            const isPopular = !!plan.badge;
            const isFree = plan.id === 'free';
            const isPro = plan.id === 'pro';

            return (
              <div key={plan.id} className={`relative flex flex-col rounded-3xl border-2 bg-card p-6 transition-all ${isPopular ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]' : plan.color}`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className={`inline-flex items-center gap-2 text-sm font-bold mb-2 ${isPro ? 'text-foreground' : isPopular ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`grid h-7 w-7 place-items-center rounded-xl text-xs ${isPro ? 'bg-foreground text-background' : isPopular ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
                      <Icon name={isFree ? 'Gift' : isPopular ? 'Zap' : 'Crown'} size={14} />
                    </div>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black text-foreground">
                      {price === 0 ? (isRu ? 'Бесплатно' : 'Free') : price.toLocaleString()}
                    </span>
                    {price > 0 && (
                      <>
                        <span className="text-lg font-bold text-muted-foreground">{plan.currency}</span>
                        <span className="text-sm text-muted-foreground">/{isRu ? 'мес' : 'mo'}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                </div>

                {isFree ? (
                  <Button
                    className="w-full h-11 rounded-xl font-semibold mb-6"
                    variant="outline"
                    asChild
                  >
                    <Link to="/register">
                      {data.cta}
                      <Icon name="ArrowRight" size={15} className="ml-1.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className={`w-full h-11 rounded-xl font-semibold mb-6 ${isPro ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
                    variant={isPopular ? 'default' : 'default'}
                    disabled={payingPlan === plan.id}
                    onClick={() => handleSelectPlan(plan.id, plan.price[billing])}
                  >
                    {payingPlan === plan.id
                      ? <><Icon name="Loader" size={15} className="mr-1.5 animate-spin" />{isRu ? 'Переходим к оплате…' : 'Redirecting…'}</>
                      : <>{data.ctaPaid}<Icon name="ArrowRight" size={15} className="ml-1.5" /></>}
                  </Button>
                )}

                <div className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm">
                      <Icon name="CheckCircle" size={15} className={`shrink-0 mt-0.5 ${isPopular ? 'text-primary' : isPro ? 'text-foreground' : 'text-emerald-500'}`} />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                  {plan.disabled.map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm opacity-40">
                      <Icon name="X" size={15} className="shrink-0 mt-0.5 text-muted-foreground" />
                      <span className="text-muted-foreground line-through">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {payError && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-2xl px-4 py-3 mb-8 text-sm max-w-lg mx-auto">
            <Icon name="AlertCircle" size={15} className="shrink-0" />
            <span className="flex-1">{payError}</span>
            <button onClick={() => setPayError('')}><Icon name="X" size={14} /></button>
          </div>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {[
            { icon: 'Shield', label: isRu ? 'Безопасная оплата' : 'Secure payment' },
            { icon: 'RefreshCw', label: isRu ? 'Возврат за 7 дней' : '7-day refund' },
            { icon: 'Lock', label: isRu ? 'SSL на всех тарифах' : 'SSL on all plans' },
            { icon: 'Headphones', label: isRu ? 'Поддержка 24/7' : 'Support 24/7' },
          ].map(b => (
            <div key={b.label} className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl text-center">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon name={b.icon} size={17} />
              </div>
              <p className="text-xs font-semibold text-foreground">{b.label}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-black text-2xl text-center mb-6">{data.faq}</h2>
          <div className="space-y-3">
            {data.faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm hover:bg-secondary/50 transition-colors"
                >
                  {faq.q}
                  <Icon name={openFaq === i ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0 ml-3" />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-primary to-violet-500 p-8 md:p-12 text-center text-white">
          <h2 className="font-display font-black text-3xl mb-3">
            {isRu ? 'Начните прямо сейчас' : 'Start right now'}
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            {isRu ? 'Первый сайт бесплатно. Без карты.' : 'First site free. No card required.'}
          </p>
          <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-10 h-13 shadow-xl" asChild>
            <Link to="/register">
              {isRu ? 'Создать сайт бесплатно' : 'Create site for free'}
              <Icon name="ArrowRight" size={18} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}