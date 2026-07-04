import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getLang } from '@/lib/i18n';
import { trackGoal, GOALS } from '@/lib/analytics';

const ORDER_STATUS_URL = 'https://functions.poehali.dev/0883717d-f728-467e-b5d2-c91fb10bf3e6';

const PLAN_NAMES: Record<string, { ru: string; en: string }> = {
  premium: { ru: 'Премиум', en: 'Premium' },
  pro_60: { ru: 'Профи', en: 'Pro' },
  pro_80: { ru: 'Профи', en: 'Pro' },
  pro_200: { ru: 'Профи', en: 'Pro' },
  pro_400: { ru: 'Профи', en: 'Pro' },
  pro_800: { ru: 'Профи', en: 'Pro' },
};

export default function OrderStatus() {
  const lang = getLang();
  const isRu = lang === 'ru';
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');

  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'canceled' | 'error'>('loading');
  const [plan, setPlan] = useState('');
  const [orderType, setOrderType] = useState('plan');
  const [energyAmount, setEnergyAmount] = useState(0);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!orderNumber) {
      setStatus('error');
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const check = () => {
      fetch(`${ORDER_STATUS_URL}?order_number=${encodeURIComponent(orderNumber)}`)
        .then(r => r.json())
        .then(raw => {
          const data = raw.body !== undefined
            ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body)
            : raw;

          if (data.error) {
            setStatus('error');
            return;
          }

          setPlan(data.plan || '');
          setOrderType(data.order_type || 'plan');
          setEnergyAmount(data.energy_amount || 0);

          if (data.status === 'paid') {
            if (!trackedRef.current) {
              trackedRef.current = true;
              trackGoal(GOALS.PAYMENT_SUCCESS, { order_type: data.order_type || 'plan' });
            }
            setStatus('paid');
          } else if (data.status === 'canceled') {
            setStatus('canceled');
          } else if (attempts < maxAttempts) {
            attempts += 1;
            setTimeout(check, 2000);
          } else {
            setStatus('pending');
          }
        })
        .catch(() => setStatus('error'));
    };

    check();
  }, [orderNumber]);

  const planName = plan ? (PLAN_NAMES[plan]?.[lang] || plan) : '';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Icon name="Loader" size={40} className="animate-spin text-primary mx-auto mb-4" />
            <h1 className="font-display font-bold text-xl mb-2">
              {isRu ? 'Проверяем оплату…' : 'Checking payment…'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRu ? 'Это займёт несколько секунд' : 'This will take a few seconds'}
            </p>
          </>
        )}

        {status === 'paid' && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-4">
              <Icon name="CheckCircle" size={32} />
            </div>
            <h1 className="font-display font-bold text-2xl mb-2">
              {isRu ? 'Оплата прошла успешно!' : 'Payment successful!'}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {orderType === 'energy'
                ? (isRu ? `Энергия начислена: +${energyAmount} запросов к AI.` : `Energy credited: +${energyAmount} AI requests.`)
                : (isRu ? `Тариф «${planName}» активирован на вашем аккаунте.` : `The "${planName}" plan has been activated on your account.`)}
            </p>
            <Button asChild className="rounded-xl font-semibold">
              <Link to="/dashboard">
                {isRu ? 'Перейти в кабинет' : 'Go to dashboard'}
                <Icon name="ArrowRight" size={15} className="ml-1.5" />
              </Link>
            </Button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600 mx-auto mb-4">
              <Icon name="Clock" size={32} />
            </div>
            <h1 className="font-display font-bold text-xl mb-2">
              {isRu ? 'Платёж обрабатывается' : 'Payment is processing'}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {isRu
                ? 'Обычно это занимает не более пары минут. Тариф активируется автоматически.'
                : 'This usually takes no more than a couple of minutes. The plan will activate automatically.'}
            </p>
            <Button variant="outline" asChild className="rounded-xl font-semibold">
              <Link to="/dashboard?tab=plan">{isRu ? 'Перейти в кабинет' : 'Go to dashboard'}</Link>
            </Button>
          </>
        )}

        {status === 'canceled' && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive mx-auto mb-4">
              <Icon name="XCircle" size={32} />
            </div>
            <h1 className="font-display font-bold text-xl mb-2">
              {isRu ? 'Платёж отменён' : 'Payment canceled'}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {isRu ? 'Оплата не прошла. Попробуйте ещё раз.' : 'Payment failed. Please try again.'}
            </p>
            <Button asChild className="rounded-xl font-semibold">
              <Link to="/pricing">{isRu ? 'Вернуться к тарифам' : 'Back to pricing'}</Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-muted-foreground mx-auto mb-4">
              <Icon name="AlertCircle" size={32} />
            </div>
            <h1 className="font-display font-bold text-xl mb-2">
              {isRu ? 'Заказ не найден' : 'Order not found'}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {isRu ? 'Проверьте ссылку или обратитесь в поддержку.' : 'Check the link or contact support.'}
            </p>
            <Button asChild className="rounded-xl font-semibold">
              <Link to="/pricing">{isRu ? 'Вернуться к тарифам' : 'Back to pricing'}</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}