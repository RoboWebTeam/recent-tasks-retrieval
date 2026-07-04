import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiYandexOAuth, setSession, storeUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { trackGoal, GOALS } from '@/lib/analytics';

export default function YandexCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setError('Код авторизации не найден');
      return;
    }

    apiYandexOAuth(code)
      .then((data: Record<string, unknown>) => {
        setSession(data.session_id as string);
        storeUser(data.user as Parameters<typeof storeUser>[0]);
        trackGoal(GOALS.OAUTH_YANDEX_SUCCESS);
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
      <p className="text-muted-foreground">Выполняем вход через Яндекс...</p>
    </div>
  );
}