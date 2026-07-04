import { tr, type Lang } from '@/lib/i18n';

interface Props {
  lang: Lang;
  isEdit: boolean;
}

/**
 * Простой индикатор ожидания ответа ИИ во время генерации/правки сайта.
 */
export default function GenerationProgress({ lang }: Props) {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className="text-muted-foreground text-[14px] font-medium">{tr('builderGenerating', lang)}</span>
      <span className="flex gap-1">
        {[0, 1, 2].map(j => (
          <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
        ))}
      </span>
    </div>
  );
}