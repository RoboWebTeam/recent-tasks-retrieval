import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { type Lang } from '@/lib/i18n';
import {
  getSession,
  apiGetProjectTables, apiCreateProjectTable, apiDeleteProjectTable,
  apiGetProjectRows, apiAddProjectRow, apiUpdateProjectRow, apiDeleteProjectRow,
  type ProjectTable, type ProjectRow, type ProjectTableColumn,
} from '@/lib/auth';

interface BuilderCoreDatabaseProps {
  lang: Lang;
  projectId: number;
}

export default function BuilderCoreDatabase({ lang, projectId }: BuilderCoreDatabaseProps) {
  const isRu = lang === 'ru';
  const session = getSession();

  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<ProjectTable | null>(null);
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newColumns, setNewColumns] = useState<ProjectTableColumn[]>([{ name: '', type: 'text' }]);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [rowFormOpen, setRowFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProjectRow | null>(null);
  const [rowFormValues, setRowFormValues] = useState<Record<string, string>>({});
  const [savingRow, setSavingRow] = useState(false);

  const loadTables = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiGetProjectTables(session, projectId);
      setTables(data);
    } catch { /* пустой список */ }
    setLoading(false);
  }, [session, projectId]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const loadRows = useCallback(async (table: ProjectTable) => {
    if (!session) return;
    setRowsLoading(true);
    try {
      const data = await apiGetProjectRows(session, projectId, table.id);
      setRows(data);
    } catch { setRows([]); }
    setRowsLoading(false);
  }, [session, projectId]);

  const openTable = (table: ProjectTable) => {
    setSelectedTable(table);
    loadRows(table);
  };

  const handleCreateTable = async () => {
    if (!session) return;
    const name = newTableName.trim();
    const cols = newColumns.filter(c => c.name.trim());
    if (!name) { setCreateError(isRu ? 'Укажите имя таблицы' : 'Enter table name'); return; }
    if (cols.length === 0) { setCreateError(isRu ? 'Добавьте хотя бы одну колонку' : 'Add at least one column'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const table = await apiCreateProjectTable(session, projectId, name, cols);
      setTables(prev => [table, ...prev]);
      setCreateOpen(false);
      setNewTableName('');
      setNewColumns([{ name: '', type: 'text' }]);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : (isRu ? 'Ошибка создания таблицы' : 'Error creating table'));
    }
    setCreating(false);
  };

  const handleDeleteTable = async (table: ProjectTable) => {
    if (!session) return;
    await apiDeleteProjectTable(session, projectId, table.id);
    setTables(prev => prev.filter(t => t.id !== table.id));
    if (selectedTable?.id === table.id) setSelectedTable(null);
  };

  const openAddRow = () => {
    if (!selectedTable) return;
    const init: Record<string, string> = {};
    selectedTable.columns.forEach(c => { init[c.name] = ''; });
    setRowFormValues(init);
    setEditingRow(null);
    setRowFormOpen(true);
  };

  const openEditRow = (row: ProjectRow) => {
    if (!selectedTable) return;
    const init: Record<string, string> = {};
    selectedTable.columns.forEach(c => { init[c.name] = String(row.data[c.name] ?? ''); });
    setRowFormValues(init);
    setEditingRow(row);
    setRowFormOpen(true);
  };

  const handleSaveRow = async () => {
    if (!session || !selectedTable) return;
    setSavingRow(true);
    const data: Record<string, unknown> = {};
    selectedTable.columns.forEach(c => {
      const raw = rowFormValues[c.name] ?? '';
      data[c.name] = c.type === 'number' ? Number(raw) || 0 : c.type === 'boolean' ? raw === 'true' : raw;
    });
    try {
      if (editingRow) {
        const updated = await apiUpdateProjectRow(session, projectId, selectedTable.id, editingRow.id, data);
        setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        const created = await apiAddProjectRow(session, projectId, selectedTable.id, data);
        setRows(prev => [created, ...prev]);
        setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, rows_count: t.rows_count + 1 } : t));
      }
      setRowFormOpen(false);
    } catch { /* оставляем форму открытой */ }
    setSavingRow(false);
  };

  const handleDeleteRow = async (row: ProjectRow) => {
    if (!session || !selectedTable) return;
    await apiDeleteProjectRow(session, projectId, selectedTable.id, row.id);
    setRows(prev => prev.filter(r => r.id !== row.id));
    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, rows_count: Math.max(0, t.rows_count - 1) } : t));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Icon name="Loader" size={18} className="animate-spin" />
        {isRu ? 'Загрузка…' : 'Loading…'}
      </div>
    );
  }

  // Таблица строк выбранной таблицы
  if (selectedTable) {
    return (
      <div className="p-4">
        <button onClick={() => setSelectedTable(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <Icon name="ArrowLeft" size={13} /> {isRu ? 'Все таблицы' : 'All tables'}
        </button>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Icon name="Table" size={16} className="text-primary" />
            {selectedTable.table_name}
          </h3>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={openAddRow}>
            <Icon name="Plus" size={14} /> {isRu ? 'Добавить запись' : 'Add row'}
          </Button>
        </div>

        {rowsLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Icon name="Loader" size={16} className="animate-spin" /> {isRu ? 'Загрузка…' : 'Loading…'}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Icon name="Inbox" size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{isRu ? 'Записей пока нет' : 'No rows yet'}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  {selectedTable.columns.map(c => (
                    <th key={c.name} className="text-left px-3 py-2 font-semibold text-muted-foreground text-xs whitespace-nowrap">{c.name}</th>
                  ))}
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    {selectedTable.columns.map(c => (
                      <td key={c.name} className="px-3 py-2 text-xs truncate max-w-[200px]">{String(row.data[c.name] ?? '')}</td>
                    ))}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEditRow(row)} className="grid h-6 w-6 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Icon name="Pencil" size={12} />
                        </button>
                        <button onClick={() => handleDeleteRow(row)} className="grid h-6 w-6 place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Icon name="Trash2" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={rowFormOpen} onOpenChange={setRowFormOpen}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display font-bold">{editingRow ? (isRu ? 'Изменить запись' : 'Edit row') : (isRu ? 'Новая запись' : 'New row')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedTable.columns.map(c => (
                <div key={c.name}>
                  <label className="text-xs font-medium mb-1 block">{c.name} <span className="text-muted-foreground">({c.type})</span></label>
                  <Input
                    value={rowFormValues[c.name] ?? ''}
                    onChange={e => setRowFormValues(prev => ({ ...prev, [c.name]: e.target.value }))}
                    className="h-9 rounded-xl"
                  />
                </div>
              ))}
              <Button className="w-full rounded-xl" disabled={savingRow} onClick={handleSaveRow}>
                {savingRow ? <Icon name="Loader" size={14} className="mr-1.5 animate-spin" /> : null}
                {isRu ? 'Сохранить' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Список таблиц
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-base">{isRu ? 'База данных проекта' : 'Project database'}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{isRu ? 'Простые таблицы для хранения данных сайта (заявки, заказы и т.п.)' : 'Simple tables for storing site data (leads, orders, etc.)'}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) { setCreateError(''); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5 shrink-0">
              <Icon name="Plus" size={14} /> {isRu ? 'Таблица' : 'Table'}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display font-bold">{isRu ? 'Новая таблица' : 'New table'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">{isRu ? 'Имя таблицы' : 'Table name'}</label>
                <Input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="leads" className="h-9 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">{isRu ? 'Колонки' : 'Columns'}</label>
                <div className="space-y-2">
                  {newColumns.map((col, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={col.name}
                        onChange={e => setNewColumns(prev => prev.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))}
                        placeholder={isRu ? 'имя' : 'name'}
                        className="h-9 rounded-xl flex-1"
                      />
                      <select
                        value={col.type}
                        onChange={e => setNewColumns(prev => prev.map((c, idx) => idx === i ? { ...c, type: e.target.value as ProjectTableColumn['type'] } : c))}
                        className="h-9 rounded-xl border border-border bg-secondary text-sm px-2"
                      >
                        <option value="text">text</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                      {newColumns.length > 1 && (
                        <button onClick={() => setNewColumns(prev => prev.filter((_, idx) => idx !== i))} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                          <Icon name="X" size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setNewColumns(prev => [...prev, { name: '', type: 'text' }])} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Icon name="Plus" size={12} /> {isRu ? 'Ещё колонка' : 'Add column'}
                  </button>
                </div>
              </div>
              {createError && (
                <p className="text-sm text-destructive flex items-center gap-1.5"><Icon name="AlertCircle" size={14} /> {createError}</p>
              )}
              <Button className="w-full rounded-xl" disabled={creating} onClick={handleCreateTable}>
                {creating ? <Icon name="Loader" size={14} className="mr-1.5 animate-spin" /> : null}
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Icon name="Database" size={28} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-4">{isRu ? 'Таблиц пока нет' : 'No tables yet'}</p>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" size={14} /> {isRu ? 'Создать таблицу' : 'Create table'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tables.map(t => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow">
              <button onClick={() => openTable(t)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon name="Table" size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.table_name}</p>
                  <p className="text-xs text-muted-foreground">{t.columns.length} {isRu ? 'колонок' : 'columns'} · {t.rows_count} {isRu ? 'записей' : 'rows'}</p>
                </div>
              </button>
              <button onClick={() => handleDeleteTable(t)} className="shrink-0 grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
