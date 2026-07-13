import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getLang } from '@/lib/i18n';
import { getSession, getStoredUser } from '@/lib/auth';
import { PLAN_PRICING_URL, FALLBACK_PRO_PLANS, PRO_PLAN_DETAILS, type ProPlanOption } from '@/data/proPlans';
import { SiteFooter } from '@/components/SiteFooter';
import { trackGoal, GOALS } from '@/lib/analytics';
import { apiUrl } from '@/lib/apiConfig';

const YOOKASSA_URL = apiUrl('yookassa-yookassa');

const getLangData = (isRu: boolean) => ({
  title: isRu ? 'Тарифы' : 'Pricing',
  subtitle: isRu ? 'Выберите план, который подходит вашему бизнесу' : 'Choose the plan that fits your business',
  desc: isRu ? 'Прозрачные цены без скрытых часов и бесконечных правок.' : 'Transparent pricing with no hidden hours or endless revisions.',
  cta: isRu ? 'Начать бесплатно' : 'Start free',
  ctaPaid: isRu ? 'Выбрать тариф' : 'Choose plan',
  faq: isRu ? 'Частые вопросы' : 'FAQ',
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [payError, setPayError] = useState('');
  const [proPlans, setProPlans] = useState<ProPlanOption[]>(FALLBACK_PRO_PLANS);
  const [proIndex, setProIndex] = useState(0);
  const session = getSession();
  const user = getStoredUser();

  useEffect(() => {
    fetch(PLAN_PRICING_URL)
      .then(r => r.json())
      .then(raw => {
        const d = raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
        if (Array.isArray(d.plans) && d.plans.length > 0) {
          setProPlans(d.plans);
        }
      })
      .catch(() => {/* остаёмся на резервных ценах */});
  }, []);

  const selectedPro = proPlans[proIndex] ?? proPlans[0];

  const handleSelectPlan = async (planId: string, priceRub: number, planName: string) => {
    if (!session || !user) {
      navigate(`/register?plan=${planId}`);
      return;
    }
    setPayingPlan(planId);
    setPayError('');
    try {
      const res = await fetch(YOOKASSA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: priceRub,
          user_email: user.email,
          user_name: user.name,
          description: `Тариф «${planName}» (${isRu ? 'месяц' : 'monthly'})`,
          return_url: `${window.location.origin}/pricing/status`,
          plan: planId,
          billing_period: 'monthly',
          user_id: user.id,
        }),
      });
      const raw = await res.json();
      const dataRes = raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
      if (!res.ok || dataRes.error) {
        throw new Error(dataRes.error || (isRu ? 'Ошибка создания платежа' : 'Payment creation error'));
      }
      if (dataRes.payment_url) {
        trackGoal(GOALS.PAYMENT_INITIATED, { plan: planId });
        window.location.href = dataRes.payment_url;
      }
    } catch (e) {
      setPayError(e instanceof Error ? e.message : (isRu ? 'Ошибка оплаты' : 'Payment error'));
    }
    setPayingPlan(null);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-black text-lg sm:text-xl text-primary">
            <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={18} />
            </span>
            Roboweb
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="rounded-full font-semibold text-muted-foreground hover:text-foreground" asChild>
              <Link to="/login">{isRu ? 'Войти' : 'Sign in'}</Link>
            </Button>
            <Button size="sm" className="rounded-full font-semibold" asChild>
              <Link to="/register">{isRu ? 'Начать бесплатно' : 'Start free'}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute -top-24 -left-24 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -top-10 right-0 h-56 w-56 sm:h-80 sm:w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="container relative py-10 sm:py-16 md:py-20 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            <Icon name="Sparkles" size={13} /> {data.title}
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight mb-4 max-w-2xl mx-auto leading-[1.1]">
            {data.subtitle}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto">
            {data.desc}
          </p>
        </div>
      </section>

      <main className="container py-10 sm:py-14 md:py-20 max-w-6xl">
        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12 sm:mb-16 items-stretch">
          {/* Free */}
          <div className="relative flex flex-col rounded-3xl border-2 border-border bg-card p-6 hover:border-border/80 hover:shadow-lg transition-all">
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 text-sm font-bold mb-2 text-muted-foreground">
                <div className="grid h-7 w-7 place-items-center rounded-xl text-xs bg-secondary border border-border">
                  <Icon name="Gift" size={14} />
                </div>
                {isRu ? 'Пробный' : 'Free'}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-foreground">{isRu ? 'Бесплатно' : 'Free'}</span>
              </div>
              <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 mb-2">
                {isRu ? '10 запросов разово' : '10 requests once'}
              </span>
              <p className="text-sm text-muted-foreground">{isRu ? 'Попробуйте Roboweb бесплатно' : 'Try Roboweb for free'}</p>
            </div>

            <Button className="w-full h-11 rounded-xl font-semibold mb-6" variant="outline" asChild>
              <Link to="/register">
                {data.cta}
                <Icon name="ArrowRight" size={15} className="ml-1.5" />
              </Link>
            </Button>

            <div className="space-y-2.5 flex-1">
              {(isRu
                ? ['Облачный хостинг', 'До 3 проектов', 'База данных 128 МБ', 'Хранилище 512 МБ', '5 функций', '8 ч вычислений']
                : ['Cloud hosting', 'Up to 3 projects', '128 MB database', '512 MB storage', '5 functions', '8h compute']
              ).map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm">
                  <Icon name="CheckCircle" size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
              {(isRu ? ['Подключение домена', 'Скачивание кода'] : ['Custom domain', 'Code download']).map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm opacity-40">
                  <Icon name="X" size={15} className="shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="text-muted-foreground line-through">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-6 shadow-xl shadow-primary/10 sm:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Icon name="Star" size={11} className="fill-current" /> {isRu ? 'Популярный' : 'Popular'}
              </span>
            </div>
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 text-sm font-bold mb-2 text-primary">
                <div className="grid h-7 w-7 place-items-center rounded-xl text-xs bg-primary text-primary-foreground">
                  <Icon name="Zap" size={14} />
                </div>
                {isRu ? 'Премиум' : 'Premium'}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-foreground">990</span>
                <span className="text-lg font-bold text-muted-foreground">₽</span>
                <span className="text-sm text-muted-foreground">/{isRu ? 'мес' : 'mo'}</span>
              </div>
              <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 mb-2">
                {isRu ? '40 запросов ежемесячно' : '40 requests/month'}
              </span>
              <p className="text-sm text-muted-foreground">{isRu ? 'Для малого бизнеса и фрилансеров' : 'For small business & freelancers'}</p>
            </div>

            <Button
              className="w-full h-11 rounded-xl font-semibold mb-6 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              disabled={payingPlan === 'premium'}
              onClick={() => handleSelectPlan('premium', 990, isRu ? 'Премиум' : 'Premium')}
            >
              {payingPlan === 'premium'
                ? <><Icon name="Loader" size={15} className="mr-1.5 animate-spin" />{isRu ? 'Переходим к оплате…' : 'Redirecting…'}</>
                : <>{data.ctaPaid}<Icon name="ArrowRight" size={15} className="ml-1.5" /></>}
            </Button>

            <div className="space-y-2.5 flex-1">
              {(isRu
                ? ['Подключение домена', 'Бесплатные расширения', 'Облачный хостинг', 'До 3 проектов', 'База данных 128 МБ', 'Хранилище 512 МБ', '5 функций', '8 ч вычислений']
                : ['Custom domain', 'Free extensions', 'Cloud hosting', 'Up to 3 projects', '128 MB database', '512 MB storage', '5 functions', '8h compute']
              ).map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm">
                  <Icon name="CheckCircle" size={15} className="shrink-0 mt-0.5 text-primary" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro — объединённая карточка с выбором количества запросов */}
          <div className="relative flex flex-col rounded-3xl border-2 border-foreground bg-card p-6 hover:shadow-xl transition-all sm:col-span-2 lg:col-span-1">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-foreground text-background text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Icon name="Crown" size={11} /> {isRu ? 'Для профи' : 'For pros'}
              </span>
            </div>
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 text-sm font-bold mb-2 text-foreground">
                <div className="grid h-7 w-7 place-items-center rounded-xl text-xs bg-foreground text-background">
                  <Icon name="Crown" size={14} />
                </div>
                {isRu ? 'Профи' : 'Pro'}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-foreground">{selectedPro.price.toLocaleString()}</span>
                <span className="text-lg font-bold text-muted-foreground">₽</span>
                <span className="text-sm text-muted-foreground">/{isRu ? 'мес' : 'mo'}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{isRu ? 'Для агентств и профессионалов' : 'For agencies & professionals'}</p>

              {/* Выбор количества запросов */}
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                {isRu ? 'Запросов в месяц' : 'Requests per month'}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {proPlans.map((p, i) => (
                  <button
                    key={p.plan_code}
                    onClick={() => setProIndex(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      proIndex === i ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.requests}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-11 rounded-xl font-semibold mb-6 bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-transform"
              disabled={payingPlan === selectedPro.plan_code}
              onClick={() => handleSelectPlan(selectedPro.plan_code, selectedPro.price, isRu ? 'Профи' : 'Pro')}
            >
              {payingPlan === selectedPro.plan_code
                ? <><Icon name="Loader" size={15} className="mr-1.5 animate-spin" />{isRu ? 'Переходим к оплате…' : 'Redirecting…'}</>
                : <>{data.ctaPaid}<Icon name="ArrowRight" size={15} className="ml-1.5" /></>}
            </Button>

            <div className="space-y-2.5 flex-1">
              {(isRu
                ? ['Приоритетная поддержка', 'Все возможности Премиум', 'Облачный хостинг']
                : ['Priority support', 'All Premium features', 'Cloud hosting']
              ).map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm">
                  <Icon name="CheckCircle" size={15} className="shrink-0 mt-0.5 text-foreground" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
              {(PRO_PLAN_DETAILS[selectedPro.plan_code]?.[isRu ? 'ru' : 'en'] ?? []).map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm">
                  <Icon name="CheckCircle" size={15} className="shrink-0 mt-0.5 text-foreground" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {payError && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-2xl px-4 py-3 mb-8 text-sm max-w-lg mx-auto">
            <Icon name="AlertCircle" size={15} className="shrink-0" />
            <span className="flex-1">{payError}</span>
            <button onClick={() => setPayError('')}><Icon name="X" size={14} /></button>
          </div>
        )}

        {/* Compare with alternatives */}
        <div className="mb-12 sm:mb-16">
          <h2 className="font-display font-black text-xl sm:text-2xl text-center mb-6 sm:mb-8">
            {isRu ? 'Дешевле любого исполнителя' : 'Cheaper than any freelancer'}
          </h2>
          <div className="rounded-3xl border border-border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">{isRu ? 'Параметр' : 'Metric'}</th>
                  <th className="px-4 sm:px-6 py-3 font-bold text-primary">Roboweb</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-muted-foreground">{isRu ? 'Агентство' : 'Agency'}</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-muted-foreground">{isRu ? 'Фрилансер' : 'Freelancer'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: isRu ? 'Стоимость' : 'Cost', roboweb: isRu ? 'от 0 ₽' : 'from $0', agency: isRu ? 'от 80 000 ₽' : 'from $1000', freelancer: isRu ? 'от 15 000 ₽' : 'from $200' },
                  { label: isRu ? 'Срок' : 'Timeline', roboweb: isRu ? '47 секунд' : '47 seconds', agency: isRu ? '3–6 недель' : '3–6 weeks', freelancer: isRu ? '1–3 недели' : '1–3 weeks' },
                  { label: isRu ? 'Правки' : 'Revisions', roboweb: isRu ? 'Мгновенно' : 'Instant', agency: isRu ? 'Долго и дорого' : 'Slow & costly', freelancer: isRu ? 'По договору' : 'By contract' },
                  { label: isRu ? 'Хостинг' : 'Hosting', roboweb: isRu ? 'Включён' : 'Included', agency: isRu ? 'Отдельно' : 'Separate', freelancer: isRu ? 'Отдельно' : 'Separate' },
                ].map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary/10'}>
                    <td className="px-4 sm:px-6 py-3.5 font-semibold text-foreground whitespace-nowrap">{row.label}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-center font-bold text-primary whitespace-nowrap">{row.roboweb}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-center text-muted-foreground whitespace-nowrap">{row.agency}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-center text-muted-foreground whitespace-nowrap">{row.freelancer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-16">
          {[
            { icon: 'Shield', label: isRu ? 'Безопасная оплата' : 'Secure payment' },
            { icon: 'RefreshCw', label: isRu ? 'Возврат за 7 дней' : '7-day refund' },
            { icon: 'Lock', label: isRu ? 'SSL на всех тарифах' : 'SSL on all plans' },
            { icon: 'Headphones', label: isRu ? 'Поддержка 24/7' : 'Support 24/7' },
          ].map(b => (
            <div key={b.label} className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl text-center hover:border-primary/30 hover:shadow-md transition-all">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon name={b.icon} size={17} />
              </div>
              <p className="text-xs font-semibold text-foreground">{b.label}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="font-display font-black text-xl sm:text-2xl text-center mb-6">{data.faq}</h2>
          <div className="space-y-3">
            {data.faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left font-semibold text-sm hover:bg-secondary/50 transition-colors"
                >
                  {faq.q}
                  <Icon name={openFaq === i ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0 ml-3" />
                </button>
                {openFaq === i && (
                  <div className="px-4 sm:px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-violet-500 p-7 sm:p-10 md:p-14 text-center text-white">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-display font-black text-2xl sm:text-3xl mb-3">
              {isRu ? 'Начните прямо сейчас' : 'Start right now'}
            </h2>
            <p className="text-white/80 mb-8 text-base sm:text-lg">
              {isRu ? 'Первый сайт бесплатно. Без карты.' : 'First site free. No card required.'}
            </p>
            <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8 sm:px-10 h-12 sm:h-13 shadow-xl" asChild>
              <Link to="/register">
                {isRu ? 'Создать сайт бесплатно' : 'Create site for free'}
                <Icon name="ArrowRight" size={18} className="ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}