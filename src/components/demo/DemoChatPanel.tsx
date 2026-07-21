import { useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface ScriptStep {
  time: number;
  type: string;
  text?: string;
  value?: number;
  label?: string;
}

interface Props {
  lang: 'ru' | 'en';
  running: boolean;
  progress: number;
  progressLabel: string;
  visibleSteps: ScriptStep[];
}

export function DemoChatPanel({ lang, running, progress, progressLabel, visibleSteps }: Props) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [visibleSteps]);

  return (
    <div className="flex flex-col w-full md:w-[300px] lg:w-[340px] md:shrink-0 border-b md:border-b-0 md:border-r border-slate-100 bg-white max-h-[45vh] md:max-h-none">

      {/* Chat header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 shrink-0 bg-gradient-to-r from-primary/5 to-blue-50">
        <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shrink-0 shadow-sm">
          <Icon name="Bot" size={17} />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800">Roboweb AI</div>
          <div className="text-xs text-emerald-500 font-semibold">● {lang === 'ru' ? 'онлайн' : 'online'}</div>
        </div>
        {running && (
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0 bg-slate-50/50">
        {/* Welcome */}
        <div className="flex gap-2 justify-start animate-fade-in">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white shrink-0 mt-0.5 text-xs">
            <Icon name="Bot" size={12} />
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white border border-slate-100 shadow-sm px-3.5 py-2.5 text-xs text-slate-700 leading-relaxed">
            {lang === 'ru' ? 'Опишите ваш проект — соберу рабочий сайт с бэкендом и кодом на Next.js + Prisma.' : 'Describe your project — I\'ll build a working site with a backend and Next.js + Prisma code.'}
          </div>
        </div>

        {visibleSteps.filter(s => s.type === 'user' || s.type === 'bot' || s.type === 'done').map((step, i) => (
          <div key={i} className={`flex gap-2 ${step.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {step.type !== 'user' && (
              <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white shrink-0 mt-0.5">
                <Icon name="Bot" size={12} />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl text-xs leading-relaxed whitespace-pre-line px-3.5 py-2.5 ${
              step.type === 'user'
                ? 'bg-primary text-white rounded-br-sm shadow-sm'
                : step.type === 'done'
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 font-semibold rounded-bl-sm'
                  : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-sm'
            }`}>
              {step.text}
            </div>
            {step.type === 'user' && (
              <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-slate-600 text-xs font-bold shrink-0 mt-0.5">
                U
              </div>
            )}
          </div>
        ))}

        {running && (
          <div className="flex gap-2 justify-start">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white shrink-0 mt-0.5">
              <Icon name="Bot" size={12} />
            </div>
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">{progressLabel}</span>
            <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Decorative input */}
      <div className="p-3 border-t border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2">
          <span className="text-xs text-slate-300 flex-1">{lang === 'ru' ? 'Опишите ваш сайт…' : 'Describe your website…'}</span>
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-primary/20 text-primary">
            <Icon name="Send" size={11} />
          </div>
        </div>
      </div>
    </div>
  );
}