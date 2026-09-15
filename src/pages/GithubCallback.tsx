import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGithubConnect, getSession, getStoredUser, storeUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

export default function GithubCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const isConnectMode = new URLSearchParams(window.location.search).get('state') === 'connect';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      setError('Код авторизации не найден');
      return;
    }

    // Подключение GitHub к уже авторизованному аккаунту (из профиля) —
    // не создаёт новую сессию и не меняет текущего пользователя
    if (state === 'connect') {
      const session = getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }
      apiGithubConnect(session, code)
        .then((data) => {
          const user = getStoredUser();
          if (user) storeUser({ ...user, github_login: data.github_login });
          navigate('/dashboard?tab=profile');
        })
        .catch((err: Error) => {
          setError(err.message);
        });
      return;
    }

    // Вход через GitHub отключён (199-ФЗ: запрет авторизации через иностранные сервисы).
    // Сюда можно попасть только по старой ссылке или из закладки — показываем внятную причину
    // и путь дальше, а не бесконечный спиннер. Привязка для экспорта кода (выше) работает.
    setError('Вход через GitHub больше недоступен. Войдите по почте или через Яндекс ID.');
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="flex items-center gap-2 text-destructive">
          <Icon name="AlertCircle" size={20} />
          <span>{error}</span>
        </div>
        <button
          onClick={() => navigate(isConnectMode ? '/dashboard?tab=profile' : '/login')}
          className="text-sm text-primary hover:underline"
        >
          {isConnectMode ? 'Вернуться в профиль' : 'Вернуться на страницу входа'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Icon name="Loader" size={32} className="animate-spin text-primary" />
      <p className="text-muted-foreground">
        Подключаем GitHub-аккаунт...
      </p>
    </div>
  );
}