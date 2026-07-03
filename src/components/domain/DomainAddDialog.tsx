import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const BUY_DOMAIN_URL = 'https://www.reg.ru/domain/new';

interface DomainAddDialogProps {
  isRu: boolean;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  newDomain: string;
  setNewDomain: (v: string) => void;
  newDomainError: string;
  setNewDomainError: (v: string) => void;
  adding: boolean;
  onAddDomain: () => void;
}

export default function DomainAddDialog({
  isRu, addOpen, setAddOpen, newDomain, setNewDomain, newDomainError, setNewDomainError, adding, onAddDomain,
}: DomainAddDialogProps) {
  return (
    <div className="flex gap-2 shrink-0">
      <Button variant="outline" className="rounded-xl font-semibold gap-2" asChild>
        <a href={BUY_DOMAIN_URL} target="_blank" rel="noopener noreferrer">
          <Icon name="ShoppingCart" size={15} />
          {isRu ? 'Купить домен' : 'Buy domain'}
        </a>
      </Button>
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setNewDomain(''); setNewDomainError(''); } }}>
        <DialogTrigger asChild>
          <Button className="rounded-xl font-semibold gap-2">
            <Icon name="Plus" size={15} />
            {isRu ? 'Добавить домен' : 'Add domain'}
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">{isRu ? 'Новый домен' : 'New domain'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="relative">
              <Icon name="Globe" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={newDomain}
                onChange={e => { setNewDomain(e.target.value); setNewDomainError(''); }}
                onKeyDown={e => e.key === 'Enter' && onAddDomain()}
                placeholder="mysite.ru"
                className="h-11 rounded-xl pl-9"
                autoFocus
              />
            </div>
            {newDomainError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <Icon name="AlertCircle" size={14} /> {newDomainError}
              </p>
            )}
            <Button onClick={onAddDomain} disabled={adding || !newDomain.trim()} className="w-full h-11 rounded-xl font-semibold">
              {adding
                ? <><Icon name="Loader" size={15} className="mr-1.5 animate-spin" />{isRu ? 'Добавляем…' : 'Adding…'}</>
                : <>{isRu ? 'Добавить' : 'Add'}<Icon name="ArrowRight" size={15} className="ml-1.5" /></>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
