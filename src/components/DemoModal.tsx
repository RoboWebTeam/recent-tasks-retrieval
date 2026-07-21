import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { getSession } from '@/lib/auth';
import { DemoChatPanel } from './demo/DemoChatPanel';
import { DemoPreviewPanel } from './demo/DemoPreviewPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  lang: 'ru' | 'en';
}

const SCRIPT_RU = [
  { time: 2,  type: 'user', text: 'Нужен сайт для кофейни «Brew & Co» — меню, онлайн-заказ и заявки в базу.' },
  { time: 5,  type: 'bot',  text: 'Принял. Проектирую страницы, схему базы данных и серверную логику.' },
  { time: 8,  type: 'progress', value: 18, label: 'Проектирую структуру и схему БД' },
  { time: 11, type: 'bot',  text: 'Структура: меню по категориям, онлайн-заказ, форма заявки. Заказы пишутся в PostgreSQL.' },
  { time: 15, type: 'progress', value: 38, label: 'Собираю фронтенд и каталог' },
  { time: 18, type: 'bot',  text: 'Каталог меню из базы, корзина и оформление заказа подключены.' },
  { time: 22, type: 'progress', value: 60, label: 'Настраиваю бэкенд' },
  { time: 25, type: 'bot',  text: 'Серверная логика готова: заявки сохраняются и видны в панели проекта.' },
  { time: 29, type: 'progress', value: 78, label: 'Готовлю экспорт кода' },
  { time: 32, type: 'user', text: 'Добавь онлайн-бронирование столика.' },
  { time: 35, type: 'bot',  text: 'Готово: бронирование пишет в базу дату, время и контакт гостя.' },
  { time: 38, type: 'progress', value: 92, label: 'Финальная сборка' },
  { time: 41, type: 'progress', value: 100, label: 'Публикация и упаковка репозитория' },
  { time: 43, type: 'done', text: 'Готово: рабочий сайт с бэкендом. Код Next.js + Prisma — в вашем GitHub, данные — в вашей PostgreSQL.' },
];

const SCRIPT_EN = [
  { time: 2,  type: 'user', text: 'I need a site for coffee shop "Brew & Co" — menu, online ordering and leads to a database.' },
  { time: 5,  type: 'bot',  text: 'Got it. Designing the pages, the database schema and server logic.' },
  { time: 8,  type: 'progress', value: 18, label: 'Designing structure and DB schema' },
  { time: 11, type: 'bot',  text: 'Structure: menu by category, online ordering, a lead form. Orders are written to PostgreSQL.' },
  { time: 15, type: 'progress', value: 38, label: 'Building frontend and catalog' },
  { time: 18, type: 'bot',  text: 'Menu catalog from the database, cart and checkout wired up.' },
  { time: 22, type: 'progress', value: 60, label: 'Wiring the backend' },
  { time: 25, type: 'bot',  text: 'Server logic ready: leads are saved and visible in the project dashboard.' },
  { time: 29, type: 'progress', value: 78, label: 'Preparing code export' },
  { time: 32, type: 'user', text: 'Add online table booking.' },
  { time: 35, type: 'bot',  text: 'Done: booking writes the date, time and guest contact to the database.' },
  { time: 38, type: 'progress', value: 92, label: 'Final build' },
  { time: 41, type: 'progress', value: 100, label: 'Publishing and packaging the repo' },
  { time: 43, type: 'done', text: 'Done: a working site with a backend. Next.js + Prisma code — in your GitHub, data — in your PostgreSQL.' },
];

const TOTAL = 47;

export default function DemoModal({ open, onClose, lang }: Props) {
  const SCRIPT = lang === 'ru' ? SCRIPT_RU : SCRIPT_EN;

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [visibleSteps, setVisibleSteps] = useState<typeof SCRIPT>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setElapsed(0); setRunning(false); setFinished(false);
    setProgress(0); setProgressLabel(''); setVisibleSteps([]);
  };

  useEffect(() => {
    if (open) { reset(); setTimeout(() => setRunning(true), 500); }
    else reset();
  }, [open]);

  useEffect(() => {
    if (!running || finished) return;
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = +(e + 0.1).toFixed(1);
        if (next >= TOTAL) { setFinished(true); setRunning(false); clearInterval(intervalRef.current!); return TOTAL; }
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current!);
  }, [running, finished]);

  useEffect(() => {
    const steps = SCRIPT.filter(s => s.time <= elapsed && s.type !== 'progress');
    setVisibleSteps(prev => steps.length > prev.length ? steps : prev);
    const lp = [...SCRIPT].reverse().find(s => s.type === 'progress' && s.time <= elapsed) as { value?: number; label?: string } | undefined;
    if (lp) { setProgress(lp.value ?? 0); setProgressLabel(lp.label ?? ''); }
  }, [elapsed]);

  if (!open) return null;

  const pct = Math.min((elapsed / TOTAL) * 100, 100);
  const timeLeft = Math.max(0, TOTAL - elapsed).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-5xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200"
        style={{ maxHeight: '95vh', background: '#f8fafc' }}>

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
              <Icon name="Globe" size={12} className="text-slate-400" />
              <span className="text-slate-500 text-xs font-mono">roboweb.dev</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {running && (
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                {lang === 'ru' ? 'Создаю' : 'Building'} {timeLeft}s
              </div>
            )}
            {finished && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full">
                <Icon name="CheckCircle" size={13} />
                {lang === 'ru' ? 'Рабочий сайт + код в GitHub' : 'Working site + code in GitHub'}
              </div>
            )}
            <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <Icon name="X" size={15} />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-1 bg-slate-100 shrink-0">
          <div className="h-full bg-gradient-to-r from-blue-500 via-primary to-amber-400 transition-all duration-100 rounded-full"
            style={{ width: `${pct}%` }} />
        </div>

        {/* MAIN */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          <DemoChatPanel
            lang={lang}
            running={running}
            progress={progress}
            progressLabel={progressLabel}
            visibleSteps={visibleSteps}
          />
          <DemoPreviewPanel
            lang={lang}
            progress={progress}
          />
        </div>

        {/* FOOTER */}
        {finished && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-slate-100 bg-white shrink-0 animate-fade-in">
            <div className="text-xs sm:text-sm text-slate-500">
              {lang === 'ru' ? 'Рабочий сайт с бэкендом и код на Next.js + Prisma. Попробуйте сами.' : 'A working site with a backend and Next.js + Prisma code. Try it yourself.'}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100 shrink-0">
                <Icon name="RotateCcw" size={13} /> {lang === 'ru' ? 'Ещё раз' : 'Replay'}
              </button>
              <a href={getSession() ? '/builder' : '/register'} className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 text-xs font-semibold bg-primary text-white rounded-full px-4 sm:px-5 py-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                {lang === 'ru' ? 'Создать свой сайт' : 'Create my site'}
                <Icon name="ArrowRight" size={13} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}