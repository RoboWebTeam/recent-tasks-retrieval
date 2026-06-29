import Icon from '@/components/ui/icon';
import { DemoSitePreview } from './DemoSitePreview';

interface Props {
  lang: 'ru' | 'en';
  progress: number;
}

export function DemoPreviewPanel({ lang, progress }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
          {progress >= 100 ? (
            <Icon name="Lock" size={11} className="text-emerald-500 shrink-0" />
          ) : (
            <Icon name="Globe" size={11} className="text-slate-300 shrink-0" />
          )}
          <span className="text-xs font-mono text-slate-400 truncate">
            {progress >= 100 ? 'https://brewco.roboweb.site' : 'brewco.roboweb.site'}
          </span>
          {progress >= 100 && (
            <span className="ml-auto bg-emerald-100 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
              LIVE
            </span>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(['Monitor', 'Smartphone'] as const).map((d, i) => (
            <div key={d} className={`grid h-6 w-6 place-items-center rounded-md text-xs ${i === 0 ? 'bg-slate-200 text-slate-600' : 'text-slate-300'}`}>
              <Icon name={d} size={12} />
            </div>
          ))}
        </div>
      </div>

      {/* Site preview */}
      <div className="flex-1 overflow-hidden min-h-0">
        {progress === 0 ? (
          <div className="h-full bg-slate-50 flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center">
              <Icon name="Globe" size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm">{lang === 'ru' ? 'Начните диалог — сайт появится здесь' : 'Start the chat — site will appear here'}</p>
          </div>
        ) : (
          <DemoSitePreview progress={progress} lang={lang} />
        )}
      </div>
    </div>
  );
}