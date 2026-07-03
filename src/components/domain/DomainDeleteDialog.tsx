import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { type Domain } from '@/lib/auth';

interface DomainDeleteDialogProps {
  isRu: boolean;
  deleteTarget: Domain | null;
  setDeleteTarget: (d: Domain | null) => void;
  deleting: boolean;
  onDelete: () => void;
}

export default function DomainDeleteDialog({
  isRu, deleteTarget, setDeleteTarget, deleting, onDelete,
}: DomainDeleteDialogProps) {
  return (
    <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display font-bold">{isRu ? 'Удалить домен?' : 'Delete domain?'}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isRu
            ? `Домен ${deleteTarget?.domain} будет отключён от сайта.`
            : `Domain ${deleteTarget?.domain} will be disconnected from the site.`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteTarget(null)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button variant="destructive" className="flex-1 rounded-xl" disabled={deleting} onClick={onDelete}>
            {deleting ? <Icon name="Loader" size={14} className="mr-1.5 animate-spin" /> : null}
            {isRu ? 'Удалить' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
