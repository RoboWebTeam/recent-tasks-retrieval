import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiTelegramOAuth, setSession, storeUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { trackGoal, GOALS } from '@/lib/analytics';

export default function TelegramCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // Telegram передаёт данные в hash или query params
    const params = new URLSearchParams(
      window.location.hash ? window.location.hash.slice(1) : window.location.search.slice(1)
    );

    const tgData: Record<string, string> = {};
    params.forEach((v, k) => { tgData[k] = v; });

    if (!tgData.hash) {
      setError('Данные авторизации не найдены');
      return;
    }

    apiTelegramOAuth(tgData)
      .then((data: Record<string, unknown>) => {
        setSession(data.session_id as string);
        storeUser(data.user as Parameters<typeof storeUser>[0]);
        trackGoal(GOALS.OAUTH_TELEGRAM_SUCCESS);
        navigate('/dashboard');
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="flex items-center gap-2 text-destructive">
          <Icon name="AlertCircle" size={20} />
          <span>{error}</span>
        </div>
        <button onClick={() => navigate('/login')} className="text-sm text-primary hover:underline">
          Вернуться на страницу входа
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Icon name="Loader" size={32} className="animate-spin text-primary" />
      <p className="text-muted-foreground">Выполняем вход через Telegram...</p>
    </div>
  );
}