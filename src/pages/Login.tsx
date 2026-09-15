import { useState, useEffect} from 'react';
import { ErrorNote, PageTitle } from '@/components/ui/primitives';
import { LogoMark } from '@/components/Logo';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { apiLogin, setSession, storeUser } from '@/lib/auth';
import { getLang, tr } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { trackGoal, GOALS } from '@/lib/analytics';
import { AuthSidePanel } from '@/components/AuthSidePanel';
import { setSeo } from '@/lib/seo';

const Login = () => {
  // Своя пара «заголовок + описание»: раньше страница отдавала мета-теги главной.
  useEffect(() => {
    const ru = getLang() === 'ru';
    setSeo({
      title: ru ? 'Вход в личный кабинет' : 'Sign in to your account',
      description: ru ? 'Войдите в кабинет Roboweb, чтобы продолжить работу над проектами, опубликовать сайт, подключить свой домен и выгрузить код.' : 'Sign in to Roboweb to keep building your projects, publish a site, connect a domain and export your code.',
      url: '/login',
      noindex: true,
    });
  }, []);

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
      trackGoal(GOALS.LOGIN_SUCCESS);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tr('builderError', lang));
    } finally {
      setLoading(false);
    }
  };

  const features = lang === 'ru'
    ? ['Код Next.js + Prisma — в вашем GitHub', 'Данные — в вашей PostgreSQL', 'Поддержка в Telegram']
    : ['Next.js + Prisma code — in your GitHub', 'Data — in your PostgreSQL', 'Support on Telegram'];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — живой B2B-блок: конвейер агентов, доверие, реквизиты */}
      <AuthSidePanel lang={lang} mode="login" />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="lg:hidden flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-xl">
                <LogoMark size={32} />
                Roboweb
              </Link>
              <div className="flex items-center gap-2"><ThemeToggle /><LangSwitcher lang={lang} /></div>
            </div>
            <PageTitle>
              {lang === 'ru' ? 'Войти в аккаунт' : 'Sign in to account'}
            </PageTitle>
            <p className="text-muted-foreground mt-2">{tr('enterAccount', lang)}</p>
            {/* Мобильная версия: коротко о ценности (панель слева скрыта) */}
            <div className="lg:hidden mt-4 flex flex-wrap gap-2">
              {(lang === 'ru'
                ? ['Код в GitHub / GitFlic', 'Данные в вашей PostgreSQL', 'Работает 24/7']
                : ['Code in GitHub / GitFlic', 'Data in your PostgreSQL', 'Works 24/7']
              ).map(c => (
                <span key={c} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-2xs font-medium text-muted-foreground">
                  <Icon name="Check" size={12} className="text-primary" />{c}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{tr('email', lang)}</label>
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
              <label className="text-sm font-medium mb-2 block">{tr('password', lang)}</label>
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
              <ErrorNote>{error}</ErrorNote>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold glow-hover" disabled={loading}>
              {loading
                ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />{tr('signingIn', lang)}</>
                : tr('signIn', lang)}
            </Button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Icon name="ShieldCheck" size={13} className="text-primary shrink-0" />
              {lang === 'ru' ? 'Защищённое соединение · ваши данные и код остаются вашими' : 'Secure connection · your data and code stay yours'}
            </p>
          </form>

          {/* Social auth */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground shrink-0">{lang === 'ru' ? 'или войдите через' : 'or continue with'}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  const clientId = 'cfa33cfc717d4e948af52a29acc46002';
                  const redirectUri = encodeURIComponent(window.location.origin + '/auth/yandex/callback');
                  window.location.href = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
                }}
                className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
                title="Яндекс"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
                  <path d="M13.4 6H12C10.1 6 8.9 7 8.9 8.8C8.9 10.4 9.7 11.3 11.2 12.3L12.2 12.9L8.8 18H11.1L14.2 13.3L15.2 13.9C16.3 14.6 16.9 15.2 16.9 16.4C16.9 17.5 16.1 18.2 14.9 18.2H14.1V20H15C17.4 20 19 18.5 19 16.3C19 14.4 17.9 13.3 16.3 12.3L15.3 11.7C14 10.9 13.4 10.2 13.4 8.8C13.4 7.7 14.1 7 15.3 7H16.1V6H13.4Z" fill="white"/>
                </svg>
                <span>{lang === 'ru' ? 'Войти через Яндекс ID' : 'Sign in with Yandex ID'}</span>
              </button>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default Login;