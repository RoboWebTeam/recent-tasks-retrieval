import { useEffect, useRef } from 'react';

interface Props {
  botUsername: string;
  authUrl: string;
  className?: string;
}

/** Официальный виджет Telegram Login. Рендерит кнопку через telegram-widget.js
 * и после успешной авторизации редиректит на authUrl с параметрами id, hash и т.д. */
export default function TelegramLoginButton({ botUsername, authUrl, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-auth-url', authUrl);
    script.setAttribute('data-request-access', 'write');
    container.appendChild(script);
  }, [botUsername, authUrl]);

  return <div ref={ref} className={className || 'flex items-center justify-center h-11 overflow-hidden'} />;
}
