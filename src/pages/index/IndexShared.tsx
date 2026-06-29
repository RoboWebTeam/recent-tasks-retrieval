import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { SEND_EMAIL_URL } from './indexData';

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
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
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
      className={`transition-all duration-700 ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

export function CounterStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, shown } = useReveal();
  const count = useCounter(value, 1600, shown);
  return (
    <div ref={ref} className="text-center">
      <div className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function EmailForm({ dark = false, placeholder = 'Ваш e-mail', btnText = 'Начать бесплатно' }: {
  dark?: boolean;
  placeholder?: string;
  btnText?: string;
}) {
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
        Заявка принята! Мы свяжемся с вами.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder={placeholder}
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
            ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />Отправляем…</>
            : <>{btnText} <Icon name="ArrowRight" size={16} className="ml-1 animate-bounce-x" /></>
          }
        </Button>
      </form>
      {status === 'error' && (
        <p className={`mt-2 text-sm text-center ${dark ? 'text-rose-300' : 'text-rose-500'}`}>
          Ошибка отправки. Попробуйте ещё раз.
        </p>
      )}
    </div>
  );
}
