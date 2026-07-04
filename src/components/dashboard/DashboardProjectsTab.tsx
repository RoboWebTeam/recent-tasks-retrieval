import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { tr, type Lang } from '@/lib/i18n';
import { type Project } from '@/lib/auth';

interface StatusConfigItem {
  label: string;
  color: string;
  icon: string;
}

interface DashboardProjectsTabProps {
  lang: Lang;
  projects: Project[];
  STATUS_CONFIG: Record<string, StatusConfigItem>;
  dialogOpen: boolean;
  setDialogOpen: (v: boolean) => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newDesc: string;
  setNewDesc: (v: string) => void;
  createError: string;
  creating: boolean;
  handleCreateProject: (e: React.FormEvent) => void;
}

export default function DashboardProjectsTab({
  lang, projects, STATUS_CONFIG,
  dialogOpen, setDialogOpen, newTitle, setNewTitle, newDesc, setNewDesc,
  createError, creating, handleCreateProject,
}: DashboardProjectsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl">{tr('myProjects', lang)}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{projects.length} {lang === 'ru' ? `проект${projects.length === 1 ? '' : projects.length < 5 ? 'а' : 'ов'}` : `project${projects.length === 1 ? '' : 's'}`}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-semibold gap-2">
              <Icon name="Plus" size={16} /> {tr('newProject', lang)}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display font-bold">{tr('newProject', lang)}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{tr('projectName', lang)}</label>
                <Input
                  placeholder={tr('projectNamePlaceholder', lang)}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                  className="h-10 rounded-xl"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{tr('description', lang)} <span className="text-muted-foreground font-normal">({tr('optional', lang)})</span></label>
                <Input
                  placeholder={tr('descriptionPlaceholder', lang)}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              {createError && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
                  <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}
              <Button type="submit" className="w-full rounded-xl font-semibold" disabled={creating}>
                {creating ? <><Icon name="Loader" size={15} className="mr-2 animate-spin" />{tr('creating', lang)}</> : <><Icon name="Sparkles" size={15} className="mr-1.5" />{tr('createAndOpen', lang)}</>}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
            <Icon name="Sparkles" size={28} />
          </div>
          <h3 className="font-display font-bold text-lg mb-2">{tr('noProjects', lang)}</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            {tr('noProjectsDesc', lang)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20" onClick={() => setDialogOpen(true)}>
              <Icon name="Sparkles" size={16} /> {tr('createWithAI', lang)}
            </Button>
            <Link to="/builder">
              <Button variant="outline" className="rounded-xl font-semibold gap-2 w-full sm:w-auto">
                <Icon name="MessageSquare" size={16} /> {tr('openBuilder', lang)}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const s = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon name="Globe" size={18} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {(p.chat_count ?? 0) > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-primary/10 text-primary"
                        title={lang === 'ru' ? 'Есть история переписки с ассистентом' : 'Has chat history with assistant'}
                      >
                        <Icon name="MessageSquare" size={11} />
                        {p.chat_count}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.color}`}>
                      <Icon name={s.icon} size={11} className={p.status === 'building' ? 'animate-spin' : ''} />
                      {s.label}
                    </span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-base mb-1 line-clamp-1">{p.title}</h3>
                {p.description && (
                  <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/settings/domain"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline"
                    >
                      <Icon name="Link" size={11} /> {lang === 'ru' ? 'Домен' : 'Domain'}
                    </Link>
                    <Link
                      to={`/builder?project=${p.id}`}
                      className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Icon name="Sparkles" size={12} /> {tr('openInEditor', lang)}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* New project card */}
          <button
            onClick={() => setDialogOpen(true)}
            className="rounded-2xl border border-dashed border-border p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all min-h-[160px]"
          >
            <Icon name="Plus" size={24} />
            <span className="text-sm font-medium">{tr('newProject', lang)}</span>
          </button>
        </div>
      )}
    </div>
  );
}