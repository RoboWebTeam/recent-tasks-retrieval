import Icon from '@/components/ui/icon';
import { type Lang } from '@/lib/i18n';

interface BuilderCoreFunctionsProps {
  lang: Lang;
}

export default function BuilderCoreFunctions({ lang }: BuilderCoreFunctionsProps) {
  const isRu = lang === 'ru';

  return (
    <div className="p-4">
      <div className="rounded-2xl border border-dashed border-border p-10 text-center max-w-md mx-auto">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
          <Icon name="Zap" size={26} />
        </div>
        <h3 className="font-display font-bold text-lg mb-2">{isRu ? 'Функции скоро' : 'Functions coming soon'}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isRu
            ? 'Сейчас доступны База данных, Секреты и Хранилище для этого проекта. Раздел с готовыми интеграциями (форма → email, счётчики и т.п.) появится здесь позже.'
            : 'Database, Secrets and Storage are available for this project right now. A set of ready-made integrations (form → email, counters, etc.) will appear here later.'}
        </p>
      </div>
    </div>
  );
}
