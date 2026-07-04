import { useEffect, useRef, useState } from 'react';

interface Props {
  botUsername: string;
  authUrl: string;
  className?: string;
}

/** Официальный виджет Telegram Login. Рендерит кнопку через telegram-widget.js
 * и после успешной авторизации редиректит на authUrl с параметрами id, hash и т.д.
 * Если виджет не смог загрузиться (скрипт заблокирован, нет сети, домен бота не привязан
 * в @BotFather) — показываем аккуратный запасной вариант вместо пустого места/битой иконки. */
export default function TelegramLoginButton({ botUsername, authUrl, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';
    setFailed(false);

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-auth-url', authUrl);
    script.setAttribute('data-request-access', 'write');
    script.onerror = () => setFailed(true);
    container.appendChild(script);

    // Виджет Telegram рендерит себя как <iframe> внутри контейнера.
    // Если через несколько секунд iframe так и не появился — считаем, что виджет не загрузился.
    const timer = setTimeout(() => {
      if (!container.querySelector('iframe')) setFailed(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [botUsername, authUrl]);

  if (failed) {
    return (
      <div
        title="Telegram Login временно недоступен — не удалось загрузить виджет"
        className={className || 'flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-dashed border-border bg-secondary/40 text-muted-foreground text-sm font-medium cursor-not-allowed select-none'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" opacity="0.5">
          <circle cx="12" cy="12" r="12" fill="#2AABEE" />
          <path d="M5.5 11.5L17 7L14 18L10.5 14.5L8 16.5L8.5 13L14 9.5L8 12.5L5.5 11.5Z" fill="white" />
        </svg>
        Telegram недоступен
      </div>
    );
  }

  return <div ref={ref} className={className || 'flex items-center justify-center h-11 overflow-hidden'} />;
}