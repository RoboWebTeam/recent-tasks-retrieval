import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  /** скорость: символов за тик (по умолчанию 2) */
  speed?: number;
  className?: string;
  /** вызывается при каждом обновлении текста — чтобы родитель мог проскроллить чат вниз */
  onTick?: () => void;
}

/**
 * Постепенно «печатает» текст по буквам — делает появление ответа ИИ живым.
 * Эффект проигрывается один раз для конкретного текста; при смене text печать начинается заново.
 */
export default function TypewriterText({ text, speed = 2, className, onTick }: Props) {
  const [shown, setShown] = useState('');
  const doneFor = useRef<string>('');

  useEffect(() => {
    // Если этот текст уже был напечатан ранее (например при перерисовке) — показываем сразу целиком
    if (doneFor.current === text) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + speed, text.length);
      setShown(text.slice(0, i));
      onTick?.();
      if (i >= text.length) {
        doneFor.current = text;
        clearInterval(timer);
      }
    }, 16);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  return <span className={className}>{shown}</span>;
}
