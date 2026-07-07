import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';
import {
  getSession,
  apiGetProjectFunctions, apiToggleProjectFunction, apiDeleteProjectFunction,
  type ProjectFunction,
} from '@/lib/auth';

interface BuilderCoreFunctionsProps {
  lang: Lang;
  projectId: number;
}

export default function BuilderCoreFunctions({ lang, projectId }: BuilderCoreFunctionsProps) {
  const isRu = lang === 'ru';
  const session = getSession();

  const [fns, setFns] = useState<ProjectFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setFns(await apiGetProjectFunctions(session, projectId));
    } catch { /* пусто */ }
    setLoading(false);
  }, [session, projectId]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (f: ProjectFunction) => {
    if (!session) return;
    setFns(prev => prev.map(x => x.id === f.id ? { ...x, enabled: !x.enabled } : x));
    try { await apiToggleProjectFunction(session, projectId, f.id, !f.enabled); }
    catch { setFns(prev => prev.map(x => x.id === f.id ? { ...x, enabled: f.enabled } : x)); }
  };

  const remove = async (f: ProjectFunction) => {
    if (!session) return;
    await apiDeleteProjectFunction(session, projectId, f.id);
    setFns(prev => prev.filter(x => x.id !== f.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Icon name="Loader" size={18} className="animate-spin" /> {isRu ? 'Загрузка…' : 'Loading…'}
      </div>
    );
  }

  if (fns.length === 0) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-dashed border-border p-10 text-center max-w-md mx-auto">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
            <Icon name="Zap" size={26} />
          </div>
          <h3 className="font-bold text-lg mb-2">{isRu ? 'Серверных функций пока нет' : 'No server functions yet'}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isRu
              ? 'Попросите в чате логику на сервере — например «добавь калькулятор стоимости доставки» или «оформление заказа с записью в базу». ИИ создаст серверную функцию, и она появится здесь.'
              : 'Ask in chat for server logic — e.g. “add a delivery cost calculator” or “order checkout that saves to the database”. The AI will create a server function and it will appear here.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="font-bold text-base">{isRu ? 'Серверные функции' : 'Server functions'}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRu ? 'Логика на сервере, которую сайт вызывает: расчёты, проверки, оформление заказов.' : 'Server-side logic the site calls: calculations, checks, order processing.'}
        </p>
      </div>
      <div className="space-y-2">
        {fns.map(f => (
          <div key={f.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <div className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 ${f.enabled ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                <Icon name="Zap" size={16} />
              </div>
              <button onClick={() => setOpenId(openId === f.id ? null : f.id)} className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-semibold font-sans truncate">{f.name}</code>
                  {f.reads && f.reads.length > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-secondary text-muted-foreground text-[10px] px-1.5 py-0.5">
                      <Icon name="Database" size={9} /> {f.reads.join(', ')}
                    </span>
                  )}
                </div>
                {f.description && <p className="text-xs text-muted-foreground truncate">{f.description}</p>}
              </button>
              {/* Переключатель вкл/выкл */}
              <button onClick={() => toggle(f)} title={f.enabled ? (isRu ? 'Выключить' : 'Disable') : (isRu ? 'Включить' : 'Enable')}
                className={`shrink-0 h-6 w-10 rounded-full transition-colors relative ${f.enabled ? 'bg-primary' : 'bg-secondary'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${f.enabled ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
              <button onClick={() => remove(f)} className="shrink-0 grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
            {openId === f.id && (
              <pre className="text-[11px] leading-relaxed bg-secondary/50 border-t border-border p-3 overflow-x-auto"><code>{f.code}</code></pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
