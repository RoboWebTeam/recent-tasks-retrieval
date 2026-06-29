import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { apiLogin, setSession, storeUser } from '@/lib/auth';
import { getLang, tr } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';

const Login = () => {
  const lang = getLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(email.trim().toLowerCase(), password);
      if (!data.session_id || !data.user) {
        throw new Error(`${tr('builderError', lang)}: ${JSON.stringify(data)}`);
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

  const features = lang === 'ru'
    ? ['47 секунд — средняя сборка сайта', '12 000+ созданных сайтов', 'Поддержка 24/7 в Telegram']
    : ['47 seconds — average build time', '12 000+ websites created', '24/7 Telegram support'];

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
          <h2 className="font-display font-black text-4xl leading-tight whitespace-pre-line">
            {tr('loginHeroTitle', lang)}
          </h2>
          <p className="text-background/70 text-lg">{tr('loginHeroDesc', lang)}</p>
          <div className="space-y-3">
            {features.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-background/80">
                <Icon name="CheckCircle" size={16} className="text-accent shrink-0" />
                {f}
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
            <h1 className="font-display font-black text-2xl sm:text-3xl">
              {lang === 'ru' ? 'Войти в аккаунт' : 'Sign in to account'}
            </h1>
            <p className="text-muted-foreground mt-2">{tr('enterAccount', lang)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tr('email', lang)}</label>
              <Input
                type="email"
                placeholder={tr('emailPlaceholder', lang)}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tr('password', lang)}</label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder={tr('passwordPlaceholder', lang)}
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
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
                <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
                <span className="break-all">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={loading}>
              {loading
                ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />{tr('signingIn', lang)}</>
                : tr('signIn', lang)}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {tr('noAccount', lang)}{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              {tr('signUpLink', lang)}
            </Link>
          </p>
          <p className="mt-3 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              <Icon name="ArrowLeft" size={12} /> {tr('backHome', lang)}
            </Link>
          </p>

          {/* Lang switcher desktop */}
          <div className="hidden lg:flex justify-center mt-6">
            <LangSwitcher lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
