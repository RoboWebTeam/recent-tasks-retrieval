import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { SEND_EMAIL_URL } from './indexData';
import { getLang, tr } from '@/lib/i18n';

// --- Hooks ---

export function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

export function useCounter(target: number, duration = 1800, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let startTs = 0;
    const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      setVal(Math.round(target * easeOutExpo(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

// --- Components ---

export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-opacity duration-700 ${shown ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}

export function CounterStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, shown } = useReveal();
  const count = useCounter(value, 1600, shown);
  const done = shown && count >= value;
  return (
    <div ref={ref} className="text-center">
      <div className={`font-display font-bold text-2xl sm:text-3xl text-gradient tabular-nums ${done ? 'counter-pop' : ''}`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function EmailForm({ dark = false, placeholder, btnText }: {
  dark?: boolean;
  placeholder?: string;
  btnText?: string;
}) {
  const lang = getLang();
  const resolvedPlaceholder = placeholder ?? (lang === 'ru' ? 'Ваш e-mail' : 'Your e-mail');
  const resolvedBtnText = btnText ?? (lang === 'ru' ? 'Начать бесплатно' : 'Start for free');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(SEND_EMAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { setStatus('success'); setEmail(''); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };

  if (status === 'success') {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold animate-slide-up ${
        dark ? 'bg-white/10 border border-white/20 text-background' : 'bg-primary/10 border border-primary/20 text-primary'
      }`}>
        <Icon name="CheckCircle" size={20} />
        {tr('successEmail', lang)}
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder={resolvedPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`h-12 rounded-full px-5 ${
            dark
              ? 'bg-white/10 border-white/20 text-background placeholder:text-background/50'
              : 'bg-background border-border'
          }`}
        />
        <Button
          type="submit"
          size="lg"
          disabled={status === 'loading'}
          className={`h-12 rounded-full font-semibold px-8 whitespace-nowrap w-full sm:w-auto transition-all ${
            dark ? '' : 'shadow-xl shadow-primary/25'
          }`}
        >
          {status === 'loading'
            ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />{tr('sending', lang)}</>
            : <>{resolvedBtnText} <Icon name="ArrowRight" size={16} className="ml-1 animate-bounce-x" /></>
          }
        </Button>
      </form>
      {status === 'error' && (
        <p className={`mt-2 text-sm text-center ${dark ? 'text-rose-700 dark:text-rose-300' : 'text-rose-500'}`}>
          {tr('errorSend', lang)}
        </p>
      )}
    </div>
  );
}