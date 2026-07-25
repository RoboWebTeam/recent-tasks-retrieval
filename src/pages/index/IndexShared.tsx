import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { SEND_EMAIL_URL } from './indexData';
import { getLang } from '@/lib/i18n';

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

// --- Components ---

export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

/** Единый заголовок секции: надзаголовок (eyebrow) → H2 (с опц. акцентом) → описание.
 *  Убирает дублирование блока eyebrow+h2+p по ~9 секциям и держит отступы одинаковыми. */
export function SectionHeading({
  eyebrow, title, accent, desc, gradient = false, align = 'center', className = '',
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  accent?: React.ReactNode;
  desc?: React.ReactNode;
  gradient?: boolean;
  align?: 'center' | 'left';
  className?: string;
}) {
  const isCenter = align === 'center';
  return (
    <div className={`${isCenter ? 'text-center max-w-2xl mx-auto px-2' : ''} ${className}`}>
      {eyebrow && (
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</span>
      )}
      <h2 className={`mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.1] text-balance ${gradient ? 'inline-block text-gradient' : ''}`}>
        {title}{accent ? <> <span className="text-gradient">{accent}</span></> : null}
      </h2>
      {desc && (
        <p className={`mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed ${isCenter ? '' : 'max-w-xl'}`}>{desc}</p>
      )}
    </div>
  );
}

export function EmailForm({ dark = false, placeholder, btnText }: {
  dark?: boolean;
  placeholder?: string;
  btnText?: string;
}) {
  const lang = getLang();
  const navigate = useNavigate();
  const resolvedPlaceholder = placeholder ?? (lang === 'ru' ? 'Ваш e-mail' : 'Your e-mail');
  const resolvedBtnText = btnText ?? (lang === 'ru' ? 'Начать бесплатно' : 'Start for free');
  const [email, setEmail] = useState('');

  // Горячий трафик не должен упираться в «мы свяжемся с вами»: письмо-лид уходит фоном,
  // а пользователь мгновенно попадает в регистрацию с уже подставленным e-mail.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    fetch(SEND_EMAIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value }),
    }).catch(() => {/* лид не критичен для перехода */});
    navigate(`/register?email=${encodeURIComponent(value)}`);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder={resolvedPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label={lang === 'ru' ? 'Ваш e-mail' : 'Your e-mail'}
          className={`h-12 rounded-full px-5 ${
            dark
              ? 'bg-white/10 border-white/20 text-background placeholder:text-background/50'
              : 'bg-background border-border'
          }`}
        />
        <Button
          type="submit"
          size="lg"
          className={`h-12 rounded-full font-semibold px-8 whitespace-nowrap w-full sm:w-auto transition-all ${
            dark ? '' : 'shadow-xl shadow-primary/25'
          }`}
        >
          {resolvedBtnText} <Icon name="ArrowRight" size={16} className="ml-1 animate-bounce-x" />
        </Button>
      </form>
    </div>
  );
}