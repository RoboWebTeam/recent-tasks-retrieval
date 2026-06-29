import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { apiRegister, setSession, storeUser } from '@/lib/auth';
import { getLang, tr } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';

const Register = () => {
  const lang = getLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister(email.trim().toLowerCase(), password, name.trim());
      if (!data.session_id || !data.user) {
        throw new Error(lang === 'ru' ? 'Неверный ответ сервера. Попробуйте ещё раз.' : 'Invalid server response. Please try again.');
      }
      setSession(data.session_id as string);
      storeUser(data.user as Parameters<typeof storeUser>[0]);
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
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground text-background p-12 relative overflow-hidden">
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
          <p className="text-background/70 text-lg">{tr('registerHeroDesc', lang)}</p>
          <div className="grid grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-background/80 bg-white/5 rounded-xl px-3 py-2.5">
                <Icon name={f.icon} size={15} className="text-accent shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-background/40">© 2026 Roboweb</p>
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

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading
                ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />{tr('creatingAccount', lang)}</>
                : <><Icon name="Sparkles" size={15} className="mr-1.5" />{tr('createAccount', lang)}</>}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {tr('termsAgree', lang)}{' '}
              <span className="text-primary cursor-pointer hover:underline">{tr('termsLink', lang)}</span>
            </p>
          </form>

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

          <div className="hidden lg:flex justify-center mt-6">
            <LangSwitcher lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
