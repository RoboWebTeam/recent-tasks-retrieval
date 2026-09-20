import { useState, useEffect, useRef } from 'react';
import { ErrorNote, PageTitle } from '@/components/ui/primitives';
import { LogoMark } from '@/components/Logo';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { apiRequestPasswordReset, apiPasswordResetStatus, apiConfirmPasswordReset } from '@/lib/auth';
import { getLang, tr } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { AuthSidePanel } from '@/components/AuthSidePanel';
import { setSeo } from '@/lib/seo';

type Stage = 'form' | 'pending' | 'approved' | 'rejected' | 'expired' | 'saved';

const ForgotPassword = () => {
  useEffect(() => {
    const ru = getLang() === 'ru';
    setSeo({
      title: ru ? 'Восстановление пароля' : 'Reset your password',
      description: ru ? 'Восстановите доступ к аккаунту Roboweb.' : 'Recover access to your Roboweb account.',
      url: '/forgot-password',
      noindex: true,
    });
  }, []);

  const lang = getLang();
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reqId, setReqId] = useState('');
  const [poll, setPoll] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollTimer.current) clearInterval(pollTimer.current); }, []);

  const startPolling = (id: string, pollToken: string) => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const s = await apiPasswordResetStatus(id, pollToken);
        if (s.status === 'approved') {
          setStage('approved');
          if (pollTimer.current) clearInterval(pollTimer.current);
        } else if (s.status === 'rejected') {
          setStage('rejected');
          if (pollTimer.current) clearInterval(pollTimer.current);
        } else if (s.status === 'expired') {
          setStage('expired');
          if (pollTimer.current) clearInterval(pollTimer.current);
        }
      } catch {
        // сетевой сбой одного опроса — не критично, попробуем на следующем тике
      }
    }, 3000);
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { id, poll: pollToken } = await apiRequestPasswordReset(email.trim().toLowerCase());
      setReqId(id);
      setPoll(pollToken);
      setStage('pending');
      startPolling(id, pollToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tr('builderError', lang));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(tr('errorPassword', lang));
      return;
    }
    setLoading(true);
    try {
      await apiConfirmPasswordReset(reqId, poll, password);
      setStage('saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tr('builderError', lang));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStage('form');
    setEmail('');
    setPassword('');
    setError('');
    setReqId('');
    setPoll('');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AuthSidePanel lang={lang} mode="login" />

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
          </div>

          {stage === 'form' && (
            <>
              <PageTitle>{tr('forgotPasswordTitle', lang)}</PageTitle>
              <p className="text-muted-foreground mt-2">{tr('forgotPasswordDesc', lang)}</p>
              <form onSubmit={handleRequest} className="space-y-4 mt-6">
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
                {error && <ErrorNote>{error}</ErrorNote>}
                <Button type="submit" className="w-full h-11 rounded-xl font-semibold glow-hover" disabled={loading}>
                  {loading
                    ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />{tr('sendingRequest', lang)}</>
                    : tr('sendRequest', lang)}
                </Button>
              </form>
            </>
          )}

          {stage === 'pending' && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Icon name="Loader" size={24} className="text-primary animate-spin" />
              </div>
              <PageTitle>{tr('resetPendingTitle', lang)}</PageTitle>
              <p className="text-muted-foreground mt-2">{tr('resetPendingDesc', lang)}</p>
              <p className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {tr('resetPendingWait', lang)}
              </p>
            </div>
          )}

          {stage === 'approved' && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <Icon name="CheckCircle2" size={24} className="text-success" />
              </div>
              <PageTitle>{tr('resetApprovedTitle', lang)}</PageTitle>
              <p className="text-muted-foreground mt-2">{tr('resetApprovedDesc', lang)}</p>
              <form onSubmit={handleConfirm} className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">{tr('newPassword', lang)}</label>
                  <div className="relative">
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder={tr('minChars', lang)}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl pr-10"
                      autoFocus
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
                {error && <ErrorNote>{error}</ErrorNote>}
                <Button type="submit" className="w-full h-11 rounded-xl font-semibold glow-hover" disabled={loading}>
                  {loading
                    ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" />{tr('savingPassword', lang)}</>
                    : tr('saveNewPassword', lang)}
                </Button>
              </form>
            </>
          )}

          {stage === 'saved' && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <Icon name="CheckCircle2" size={24} className="text-success" />
              </div>
              <PageTitle>{tr('passwordSaved', lang)}</PageTitle>
              <Link to="/login">
                <Button className="w-full h-11 rounded-xl font-semibold glow-hover mt-6">{tr('signIn', lang)}</Button>
              </Link>
            </div>
          )}

          {stage === 'rejected' && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <Icon name="XCircle" size={24} className="text-destructive" />
              </div>
              <PageTitle>{tr('resetRejectedTitle', lang)}</PageTitle>
              <p className="text-muted-foreground mt-2">{tr('resetRejectedDesc', lang)}</p>
              <Button variant="outline" onClick={reset} className="w-full h-11 rounded-xl font-semibold mt-6">
                {tr('requestAgain', lang)}
              </Button>
            </div>
          )}

          {stage === 'expired' && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
                <Icon name="Clock" size={24} className="text-warning" />
              </div>
              <PageTitle>{tr('resetExpiredTitle', lang)}</PageTitle>
              <p className="text-muted-foreground mt-2">{tr('resetExpiredDesc', lang)}</p>
              <Button onClick={reset} className="w-full h-11 rounded-xl font-semibold glow-hover mt-6">
                {tr('requestAgain', lang)}
              </Button>
            </div>
          )}

          <p className="mt-6 text-center">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              <Icon name="ArrowLeft" size={12} /> {tr('backToLogin', lang)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
