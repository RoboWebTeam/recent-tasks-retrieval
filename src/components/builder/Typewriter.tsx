import { useState, useEffect, useRef } from 'react';

/**
 * Эффект печатающей машинки: печатает текст по буквам один раз (при монтировании).
 * Используется для приветственного сообщения в чате редактора.
 */
export default function Typewriter({
  text, speed = 16, className = '',
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // печатаем ровно один раз
    started.current = true;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className={className}>
      {shown}
      {!done && <span className="inline-block w-[2px] h-[1em] align-[-2px] bg-primary/70 animate-pulse ml-[1px]" />}
    </span>
  );
}
