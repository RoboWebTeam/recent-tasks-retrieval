import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { apiRegister, setSession, storeUser } from '@/lib/auth';
import { getLang, tr } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';
import { trackGoal, GOALS } from '@/lib/analytics';

const Register = () => {
  const lang = getLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(tr('errorPassword', lang));
      return;
    }
    if (!agreed) {
      setError(lang === 'ru'
        ? 'Необходимо принять условия оферты и политику конфиденциальности'
        : 'You must accept the offer terms and privacy policy');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister(email.trim().toLowerCase(), password, name.trim());
      if (!data.session_id || !data.user) {
        throw new Error(tr('errorServer', lang));
      }
      setSession(data.session_id as string);
      storeUser(data.user as Parameters<typeof storeUser>[0]);
      trackGoal(GOALS.REGISTRATION_SUCCESS);
      localStorage.setItem('show_energy_bonus', '1');
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tr('builderError', lang));
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', tr('passwordWeak', lang), tr('passwordMedium', lang), tr('passwordStrong', lang)][strength];
  const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'][strength];

  const features = lang === 'ru'
    ? [{ icon: 'Zap', label: 'В 30 раз быстрее' }, { icon: 'Wallet', label: 'Бесплатный старт' }, { icon: 'Globe', label: 'SSL + хостинг' }, { icon: 'HeadphonesIcon', label: 'Поддержка 24/7' }]
    : [{ icon: 'Zap', label: '30× faster' }, { icon: 'Wallet', label: 'Free start' }, { icon: 'Globe', label: 'SSL + hosting' }, { icon: 'HeadphonesIcon', label: '24/7 support' }];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-card border border-border p-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Icon name="Bot" size={20} />
            </span>
            Roboweb
          </Link>
          <LangSwitcher lang={lang} dark />
        </div>
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-sm font-medium">
            <Icon name="Gift" size={14} className="text-accent" /> {tr('firstFree', lang)}
          </div>
          <h2 className="font-display font-black text-4xl leading-tight whitespace-pre-line">
            {tr('registerHeroTitle', lang)}
          </h2>
          <p className="text-muted-foreground text-lg">{tr('registerHeroDesc', lang)}</p>
          <div className="grid grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 rounded-xl px-3 py-2.5">
                <Icon name={f.icon} size={15} className="text-accent shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-muted-foreground">© 2026 Roboweb</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="lg:hidden flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-xl">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Icon name="Bot" size={18} />
                </span>
                Roboweb
              </Link>
              <LangSwitcher lang={lang} />
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl">{tr('createAccount', lang)}</h1>
            <p className="text-muted-foreground mt-2">{tr('freeNoCard', lang)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tr('yourName', lang)}</label>
              <Input
                type="text"
                placeholder={tr('namePlaceholder', lang)}
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="h-11 rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tr('email', lang)}</label>
              <Input
                type="email"
                placeholder={tr('emailPlaceholder', lang)}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tr('password', lang)}</label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder={tr('minChars', lang)}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= s ? strengthColor : 'bg-border'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength === 1 ? 'text-rose-500' : strength === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
                <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
                <span className="break-all">{error}</span>
              </div>
            )}

            <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => { setAgreed(e.target.checked); if (error) setError(''); }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
              />
              <span>
                {tr('termsAgree', lang)}{' '}
                <Link to="/oferta" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>{tr('termsLink', lang)}</Link>
                {', '}
                <Link to="/privacy" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                  {lang === 'ru' ? 'политикой конфиденциальности' : 'privacy policy'}
                </Link>
                {' '}{lang === 'ru' ? 'и' : 'and'}{' '}
                <Link to="/personal-data" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                  {lang === 'ru' ? 'согласием на обработку персональных данных' : 'personal data consent'}
                </Link>
              </span>
            </label>

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20" disabled={loading || !agreed}>
              {loading
                ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />{tr('creatingAccount', lang)}</>
                : <><Icon name="Sparkles" size={15} className="mr-1.5" />{tr('createAccount', lang)}</>}
            </Button>
          </form>

          {/* Social auth */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground shrink-0">{lang === 'ru' ? 'или войдите через' : 'or continue with'}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Yandex */}
              <button
                type="button"
                onClick={() => {
                  const clientId = 'cfa33cfc717d4e948af52a29acc46002';
                  const redirectUri = encodeURIComponent(window.location.origin + '/auth/yandex/callback');
                  window.location.href = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
                }}
                className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium group"
                title="Яндекс"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
                  <path d="M13.4 6H12C10.1 6 8.9 7 8.9 8.8C8.9 10.4 9.7 11.3 11.2 12.3L12.2 12.9L8.8 18H11.1L14.2 13.3L15.2 13.9C16.3 14.6 16.9 15.2 16.9 16.4C16.9 17.5 16.1 18.2 14.9 18.2H14.1V20H15C17.4 20 19 18.5 19 16.3C19 14.4 17.9 13.3 16.3 12.3L15.3 11.7C14 10.9 13.4 10.2 13.4 8.8C13.4 7.7 14.1 7 15.3 7H16.1V6H13.4Z" fill="white"/>
                </svg>
                <span className="hidden sm:inline">Яндекс</span>
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={() => window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23linVfsQ0G4M2cWrd&scope=user:email&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/github/callback')}`}
                className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium group"
                title="GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.865 20.166 8.839 21.489C9.339 21.582 9.521 21.278 9.521 21.016C9.521 20.782 9.513 20.179 9.509 19.38C6.727 19.985 6.139 18.022 6.139 18.022C5.685 16.862 5.031 16.56 5.031 16.56C4.121 15.938 5.098 15.95 5.098 15.95C6.101 16.019 6.629 16.978 6.629 16.978C7.521 18.514 8.97 18.073 9.539 17.821C9.63 17.172 9.889 16.732 10.175 16.482C7.954 16.229 5.62 15.373 5.62 11.525C5.62 10.428 6.01 9.531 6.649 8.831C6.546 8.577 6.203 7.553 6.747 6.173C6.747 6.173 7.587 5.903 9.497 7.201C10.295 6.978 11.15 6.866 12 6.862C12.85 6.866 13.706 6.978 14.505 7.201C16.413 5.903 17.252 6.173 17.252 6.173C17.797 7.553 17.454 8.577 17.351 8.831C17.992 9.531 18.379 10.428 18.379 11.525C18.379 15.383 16.042 16.226 13.813 16.474C14.172 16.783 14.491 17.394 14.491 18.323C14.491 19.652 14.479 20.721 14.479 21.016C14.479 21.28 14.659 21.587 15.167 21.487C19.137 20.162 22 16.418 22 12C22 6.477 17.523 2 12 2Z"/>
                </svg>
                <span className="hidden sm:inline">GitHub</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {tr('hasAccount', lang)}{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              {tr('signInLink', lang)}
            </Link>
          </p>
          <p className="mt-3 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              <Icon name="ArrowLeft" size={12} /> {tr('backHome', lang)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;