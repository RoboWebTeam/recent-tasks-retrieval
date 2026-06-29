import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  open: boolean;
  onClose: () => void;
  lang: 'ru' | 'en';
}

const SCRIPT_RU = [
  { time: 0,  type: 'title',    text: 'Смотри, как Roboweb создаёт сайт за 47 секунд' },
  { time: 2,  type: 'user',     text: 'Привет! Мне нужен лендинг для фитнес-клуба «MaxFit». Современный дизайн, тёмные тона.' },
  { time: 5,  type: 'bot',      text: 'Отлично! Анализирую нишу, подбираю структуру и цветовую палитру…' },
  { time: 8,  type: 'progress', value: 15, label: 'Генерирую структуру сайта' },
  { time: 10, type: 'bot',      text: '💪 Структура готова!\n→ Герой с CTA\n→ Программы тренировок\n→ Тренеры\n→ Цены и запись\n→ Отзывы\n→ Контакты' },
  { time: 14, type: 'progress', value: 35, label: 'Создаю дизайн и типографику' },
  { time: 16, type: 'bot',      text: '🎨 Применяю тёмный дизайн: акцент — жёлтый Energy, шрифт Montserrat Bold, фоновые частицы…' },
  { time: 20, type: 'progress', value: 55, label: 'Пишу продающие тексты' },
  { time: 22, type: 'bot',      text: '✍️ Тексты написаны: заголовки, описания программ, призывы к действию. SEO-оптимизированы.' },
  { time: 26, type: 'progress', value: 72, label: 'Добавляю анимации и адаптив' },
  { time: 28, type: 'bot',      text: '✨ Анимации, hover-эффекты и мобильная адаптация готовы. Сайт отлично выглядит на всех устройствах.' },
  { time: 32, type: 'progress', value: 88, label: 'Финальная сборка' },
  { time: 34, type: 'user',     text: 'Добавь форму записи на пробную тренировку!' },
  { time: 37, type: 'bot',      text: '⚡ Готово! Форма добавлена с полями: имя, телефон, удобное время. Подключена к вашей почте.' },
  { time: 40, type: 'progress', value: 100, label: 'Сайт опубликован' },
  { time: 42, type: 'done',     text: '🚀 Ваш сайт MaxFit опубликован!\nmaxfit.roboweb.site\n\n⏱ Время: 47 секунд\n📱 Адаптивный\n⚡ SEO готов' },
];

const SCRIPT_EN = [
  { time: 0,  type: 'title',    text: 'Watch Roboweb build a site in 47 seconds' },
  { time: 2,  type: 'user',     text: 'Hi! I need a landing for fitness club "MaxFit". Modern design, dark tones.' },
  { time: 5,  type: 'bot',      text: 'Great! Analyzing niche, picking structure and color palette…' },
  { time: 8,  type: 'progress', value: 15, label: 'Generating site structure' },
  { time: 10, type: 'bot',      text: '💪 Structure ready!\n→ Hero with CTA\n→ Training programs\n→ Coaches\n→ Pricing & booking\n→ Reviews\n→ Contacts' },
  { time: 14, type: 'progress', value: 35, label: 'Creating design & typography' },
  { time: 16, type: 'bot',      text: '🎨 Applying dark design: Energy yellow accent, Montserrat Bold, particle backgrounds…' },
  { time: 20, type: 'progress', value: 55, label: 'Writing sales copy' },
  { time: 22, type: 'bot',      text: '✍️ Copy written: headlines, program descriptions, CTAs. SEO-optimized.' },
  { time: 26, type: 'progress', value: 72, label: 'Adding animations & responsive' },
  { time: 28, type: 'bot',      text: '✨ Animations, hover effects and mobile layout ready. Looks perfect on all devices.' },
  { time: 32, type: 'progress', value: 88, label: 'Final build' },
  { time: 34, type: 'user',     text: 'Add a free trial workout sign-up form!' },
  { time: 37, type: 'bot',      text: '⚡ Done! Form added: name, phone, preferred time. Connected to your email.' },
  { time: 40, type: 'progress', value: 100, label: 'Site published' },
  { time: 42, type: 'done',     text: '🚀 Your MaxFit site is live!\nmaxfit.roboweb.site\n\n⏱ Time: 47 seconds\n📱 Responsive\n⚡ SEO ready' },
];

const SITE_PREVIEW_FRAMES = [
  { bg: '#0a0a0a', accent: '#f59e0b', label: 'Hero section' },
  { bg: '#111111', accent: '#f59e0b', label: 'Programs' },
  { bg: '#0f0f0f', accent: '#f59e0b', label: 'Coaches' },
  { bg: '#0a0a0a', accent: '#f59e0b', label: 'Pricing' },
  { bg: '#111111', accent: '#f59e0b', label: 'Contacts' },
];

export default function DemoModal({ open, onClose, lang }: Props) {
  const SCRIPT = lang === 'ru' ? SCRIPT_RU : SCRIPT_EN;
  const TOTAL = 47;

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [visibleSteps, setVisibleSteps] = useState<typeof SCRIPT>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setElapsed(0);
    setRunning(false);
    setFinished(false);
    setProgress(0);
    setProgressLabel('');
    setVisibleSteps([]);
    setFrameIdx(0);
  };

  useEffect(() => {
    if (open) { reset(); setTimeout(() => setRunning(true), 600); }
    else { reset(); }
  }, [open]);

  useEffect(() => {
    if (!running || finished) return;
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 0.1;
        if (next >= TOTAL) {
          setFinished(true);
          setRunning(false);
          clearInterval(intervalRef.current!);
          return TOTAL;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current!);
  }, [running, finished]);

  useEffect(() => {
    const steps = SCRIPT.filter(s => s.time <= elapsed && s.type !== 'title');
    setVisibleSteps(prev => {
      if (steps.length > prev.length) return steps;
      return prev;
    });
    const lastProgress = [...SCRIPT].reverse().find(s => s.type === 'progress' && s.time <= elapsed) as { value?: number; label?: string } | undefined;
    if (lastProgress) {
      setProgress(lastProgress.value ?? 0);
      setProgressLabel(lastProgress.label ?? '');
    }
    setFrameIdx(Math.min(Math.floor(elapsed / 10), SITE_PREVIEW_FRAMES.length - 1));
  }, [elapsed]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleSteps]);

  if (!open) return null;

  const pct = Math.min((elapsed / TOTAL) * 100, 100);
  const timeLeft = Math.max(0, TOTAL - elapsed).toFixed(1);
  const frame = SITE_PREVIEW_FRAMES[frameIdx];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-5xl bg-[#0d0d10] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        style={{ maxHeight: '90vh' }}>

        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-white/50 text-xs font-mono">roboweb.site — {lang === 'ru' ? 'Создание сайта' : 'Site builder'}</span>
          </div>
          <div className="flex items-center gap-3">
            {running && (
              <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {lang === 'ru' ? 'Создаю сайт' : 'Building'} — {timeLeft}s
              </div>
            )}
            {finished && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Icon name="CheckCircle" size={14} /> {lang === 'ru' ? 'Готово за 47 сек!' : 'Done in 47 sec!'}
              </div>
            )}
            <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Timeline bar */}
        <div className="h-0.5 bg-white/5 shrink-0 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-[hsl(88,70%,50%)] transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* LEFT — Chat */}
          <div className="flex flex-col w-full sm:w-[340px] lg:w-[380px] shrink-0 border-r border-white/8">
            {/* Chat header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8 shrink-0">
              <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-primary text-white shrink-0">
                <Icon name="Bot" size={16} />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0d10]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Roboweb AI</div>
                <div className="text-xs text-white/40">{lang === 'ru' ? 'онлайн' : 'online'}</div>
              </div>
              {running && (
                <div className="ml-auto flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce"
                      style={{animationDelay:`${i*0.15}s`}} />
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {visibleSteps.filter(s => s.type === 'user' || s.type === 'bot' || s.type === 'done').map((step, i) => (
                <div key={i} className={`flex gap-2 ${step.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {step.type !== 'user' && (
                    <div className="grid h-6 w-6 place-items-center rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5">
                      <Icon name="Bot" size={12} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    step.type === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : step.type === 'done'
                        ? 'bg-gradient-to-br from-emerald-500/20 to-primary/20 border border-emerald-500/30 text-white font-medium rounded-bl-sm'
                        : 'bg-white/8 text-white/85 rounded-bl-sm border border-white/8'
                  }`}>
                    {step.text}
                  </div>
                  {step.type === 'user' && (
                    <div className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-white/60 text-xs font-bold shrink-0 mt-0.5">
                      U
                    </div>
                  )}
                </div>
              ))}

              {running && (
                <div className="flex gap-2 justify-start animate-fade-in">
                  <div className="grid h-6 w-6 place-items-center rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5">
                    <Icon name="Bot" size={12} />
                  </div>
                  <div className="bg-white/8 border border-white/8 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce"
                        style={{animationDelay:`${i*0.2}s`}} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div className="px-4 py-3 border-t border-white/8 shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/50">{progressLabel}</span>
                  <span className="text-xs font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(88,70%,50%)] transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Input (decorative) */}
            <div className="p-3 border-t border-white/8 shrink-0">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2">
                <span className="text-xs text-white/25 flex-1">{lang === 'ru' ? 'Опишите ваш сайт…' : 'Describe your website…'}</span>
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-primary/30 text-primary">
                  <Icon name="Send" size={11} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Live preview */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Preview topbar */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-white/30 font-mono bg-white/5 rounded-lg px-3 py-1.5 flex-1">
                <Icon name="Globe" size={12} className="text-white/20" />
                maxfit.roboweb.site
              </div>
              <div className="flex gap-1.5">
                {['Monitor','Tablet','Smartphone'].map((d, i) => (
                  <div key={d} className={`grid h-6 w-6 place-items-center rounded-md ${i===0?'bg-white/15 text-white':'text-white/20'}`}>
                    <Icon name={d} size={12} />
                  </div>
                ))}
              </div>
            </div>

            {/* Site preview */}
            <div className="flex-1 overflow-hidden relative" style={{background: frame.bg}}>

              {progress === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">
                    <Icon name="Globe" size={28} className="text-white/15" />
                  </div>
                  <p className="text-white/20 text-sm">{lang === 'ru' ? 'Превью появится здесь' : 'Preview will appear here'}</p>
                </div>
              ) : (
                <div className="h-full overflow-hidden flex flex-col">
                  {/* Fake nav */}
                  <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg" style={{background: frame.accent}} />
                      <div className="w-16 h-3 rounded-full bg-white/20" />
                    </div>
                    <div className="hidden sm:flex gap-6">
                      {['w-12','w-16','w-10','w-14'].map((w,i) => (
                        <div key={i} className={`${w} h-2.5 rounded-full bg-white/15`} />
                      ))}
                    </div>
                    <div className="h-8 w-20 rounded-full" style={{background: frame.accent, opacity: 0.9}} />
                  </div>

                  {/* Hero */}
                  {progress >= 15 && (
                    <div className="flex flex-col items-center justify-center flex-1 px-8 py-6 text-center animate-fade-in">
                      <div className="w-24 h-3 rounded-full bg-white/20 mb-3" />
                      <div className="w-64 h-8 rounded-xl bg-white/25 mb-2" />
                      <div className="w-48 h-6 rounded-xl bg-white/15 mb-4" />
                      <div className="flex gap-3 mb-6">
                        <div className="h-10 w-28 rounded-full" style={{background: frame.accent}} />
                        <div className="h-10 w-28 rounded-full border border-white/20" />
                      </div>

                      {/* Stats row */}
                      {progress >= 35 && (
                        <div className="flex gap-6 mt-2 animate-fade-in">
                          {['💪','🏃','⚡'].map((e,i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <span className="text-xl">{e}</span>
                              <div className="w-16 h-2 rounded-full bg-white/20" />
                              <div className="w-12 h-1.5 rounded-full bg-white/10" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cards section */}
                  {progress >= 55 && (
                    <div className="px-8 py-4 animate-fade-in">
                      <div className="grid grid-cols-3 gap-3">
                        {[0,1,2].map(i => (
                          <div key={i} className="rounded-xl border border-white/8 p-3" style={{background:'rgba(255,255,255,0.03)'}}>
                            <div className="h-6 w-6 rounded-lg mb-2" style={{background: frame.accent, opacity: 0.8}} />
                            <div className="w-full h-2 rounded-full bg-white/20 mb-1.5" />
                            <div className="w-4/5 h-1.5 rounded-full bg-white/10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form section */}
                  {progress >= 88 && (
                    <div className="px-8 py-4 animate-fade-in">
                      <div className="rounded-2xl border border-white/10 p-4 flex gap-3 items-end" style={{background:'rgba(255,255,255,0.04)'}}>
                        <div className="flex-1 h-9 rounded-xl bg-white/8 border border-white/10" />
                        <div className="flex-1 h-9 rounded-xl bg-white/8 border border-white/10" />
                        <div className="h-9 w-24 rounded-xl" style={{background: frame.accent}} />
                      </div>
                    </div>
                  )}

                  {/* Published badge */}
                  {progress === 100 && (
                    <div className="absolute top-4 right-4 animate-fade-in">
                      <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-full px-3 py-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {lang === 'ru' ? 'Опубликован' : 'Published'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: restart / close */}
        {finished && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/10 bg-white/3 shrink-0 animate-fade-in">
            <div className="text-sm text-white/50">
              {lang === 'ru'
                ? '🎉 Сайт создан за 47 секунд. Хотите попробовать?'
                : '🎉 Site built in 47 seconds. Want to try?'}
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                <Icon name="RotateCcw" size={13} /> {lang === 'ru' ? 'Ещё раз' : 'Replay'}
              </button>
              <a href="/register" className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white rounded-full px-4 py-1.5 hover:bg-primary/90 transition-colors">
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
