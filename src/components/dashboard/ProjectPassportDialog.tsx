import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Lang } from '@/lib/i18n';
import { type Project } from '@/lib/auth';

type ProjectStat = { id: number; views: number; visitors: number; leads: number; new_leads: number };

/** «Паспорт проекта» — сводный отчёт по одному проекту: что он приносит,
 *  что с ним делали и где лежит код. Всё из реальных полей проекта и статистики. */
export function ProjectPassportDialog({
  project, stat, lang, open, onOpenChange,
}: {
  project: Project | null;
  stat?: ProjectStat;
  lang: Lang;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const ru = lang === 'ru';
  if (!project) return null;

  const fmt = (d: string) => new Date(d).toLocaleDateString(ru ? 'ru-RU' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const conversion = stat && stat.visitors > 0 ? ((stat.leads / stat.visitors) * 100).toFixed(1) : null;
  const isPublished = project.status === 'published';

  // Вехи строим только из достоверных данных проекта
  const milestones = [
    {
      icon: 'Sparkles', done: true,
      title: ru ? 'Проект создан' : 'Project created',
      sub: fmt(project.created_at),
    },
    {
      icon: 'MessageSquare', done: (project.chat_count ?? 0) > 0,
      title: ru ? 'Доработки в диалоге' : 'Refined in chat',
      sub: (project.chat_count ?? 0) > 0
        ? `${project.chat_count} ${ru ? 'сообщений с ИИ-командой' : 'messages with the AI team'}`
        : (ru ? 'пока не было правок' : 'no edits yet'),
    },
    {
      icon: 'RefreshCw', done: true,
      title: ru ? 'Последнее изменение' : 'Last updated',
      sub: fmt(project.updated_at || project.created_at),
    },
    {
      icon: 'Globe', done: isPublished,
      title: ru ? 'Опубликован' : 'Published',
      sub: isPublished
        ? (ru ? 'доступен по ссылке, SSL включён' : 'live with SSL enabled')
        : (ru ? 'ещё не опубликован' : 'not published yet'),
    },
  ];

  const metrics = [
    { label: ru ? 'Заявки' : 'Leads', value: stat?.leads ?? 0, icon: 'Inbox', accent: true },
    { label: ru ? 'Посетители' : 'Visitors', value: stat?.visitors ?? 0, icon: 'Users' },
    { label: ru ? 'Просмотры' : 'Views', value: stat?.views ?? 0, icon: 'Eye' },
    { label: ru ? 'Конверсия' : 'Conversion', value: conversion ? `${conversion}%` : '—', icon: 'TrendingUp' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-lg pr-6">
            {ru ? 'Паспорт проекта' : 'Project passport'}
          </DialogTitle>
        </DialogHeader>

        {/* Шапка проекта */}
        <div className="mt-1">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(258,76%,64%)] text-white shrink-0">
              <Icon name="Layers" size={20} />
            </span>
            <div className="min-w-0">
              <div className="font-display font-bold text-base truncate">{project.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {project.description || (ru ? 'Без описания' : 'No description')}
              </div>
            </div>
          </div>
        </div>

        {/* Что приносит */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-2">
            <h4 className="font-display font-bold text-sm">{ru ? 'Результат за 30 дней' : 'Results in 30 days'}</h4>
            {stat && stat.new_leads > 0 && (
              <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                +{stat.new_leads} {ru ? 'новых заявок' : 'new leads'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {metrics.map(m => (
              <div key={m.label} className="rounded-xl border border-border bg-background/50 p-2.5 text-center">
                <Icon name={m.icon} size={14} className={`mx-auto ${m.accent ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-display font-bold text-base mt-1 tabular-nums">
                  {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* История работы */}
        <div className="mt-5">
          <h4 className="font-display font-bold text-sm mb-2.5">{ru ? 'История работы' : 'Work history'}</h4>
          <div className="space-y-0">
            {milestones.map((m, i) => (
              <div key={m.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`grid h-7 w-7 place-items-center rounded-full shrink-0 ${
                    m.done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-border'
                  }`}>
                    <Icon name={m.done ? m.icon : 'Circle'} size={13} />
                  </span>
                  {i < milestones.length - 1 && <span className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="pb-3 min-w-0">
                  <div className={`text-sm font-semibold ${m.done ? '' : 'text-muted-foreground'}`}>{m.title}</div>
                  <div className="text-[11px] text-muted-foreground">{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Технический паспорт */}
        <div className="mt-2 rounded-2xl border border-border bg-background/50 p-3.5">
          <h4 className="font-display font-bold text-sm mb-2">{ru ? 'Технические данные' : 'Technical details'}</h4>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{ru ? 'Стек' : 'Stack'}</dt>
              <dd className="font-semibold text-right">Next.js + Prisma · PostgreSQL</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{ru ? 'Код проекта' : 'Project code'}</dt>
              <dd className="font-semibold text-right">GitHub / GitFlic</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{ru ? 'Данные' : 'Data'}</dt>
              <dd className="font-semibold text-right">{ru ? 'ваша база, HTTPS/SSL' : 'your database, HTTPS/SSL'}</dd>
            </div>
            {project.url && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{ru ? 'Адрес' : 'Address'}</dt>
                <dd className="font-semibold text-right truncate max-w-[220px]">{project.url}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Действия */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to={`/analytics?site=${encodeURIComponent(project.url || '')}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs font-semibold hover:bg-background transition-colors">
            <Icon name="BarChart2" size={14} /> {ru ? 'Аналитика' : 'Analytics'}
          </Link>
          <Link to={`/leads?site=${encodeURIComponent(project.url || '')}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs font-semibold hover:bg-background transition-colors">
            <Icon name="Inbox" size={14} /> {ru ? 'Заявки' : 'Leads'}
          </Link>
          <Link to={`/builder?project=${project.id}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-2.5 text-xs font-semibold glow-hover">
            <Icon name="Sparkles" size={14} /> {ru ? 'Открыть редактор' : 'Open editor'}
          </Link>
          {isPublished && project.slug ? (
            <a href={`/site/${project.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs font-semibold hover:bg-background transition-colors">
              <Icon name="ExternalLink" size={14} /> {ru ? 'Открыть проект' : 'Open project'}
            </a>
          ) : (
            <span className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground">
              {ru ? 'Не опубликован' : 'Not published'}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
