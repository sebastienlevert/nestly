import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, AlertCircle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { TodoTask, ChecklistItem } from '../../types/task.types';
import { dateHelpers } from '../../utils/dateHelpers';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TaskDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: TodoTask | null;
  allowEdit: boolean;
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  isOpen,
  onClose,
  task,
  allowEdit: _allowEdit,
}) => {
  const { getChecklistItems, createChecklistItem, deleteChecklistItem, toggleChecklistItem, lists } = useTask();
  const { locale, t } = useLocale();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      loadItems();
    } else {
      setItems([]);
      setNewItemName('');
    }
  }, [isOpen, task?.id]);

  const loadItems = async () => {
    if (!task) return;
    setIsLoading(true);
    try {
      const fetchedItems = await getChecklistItems(task);
      setItems(fetchedItems);
    } catch (err) {
      console.error('Failed to load checklist items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newItemName.trim()) return;
    setIsAdding(true);
    try {
      const newItem = await createChecklistItem(task, newItemName.trim());
      setItems(prev => [...prev, newItem]);
      setNewItemName('');
    } catch (err) {
      console.error('Failed to add checklist item:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!task) return;
    try {
      await deleteChecklistItem(task, itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    if (!task) return;
    try {
      const updated = await toggleChecklistItem(task, item);
      setItems(prev => prev.map(i => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  if (!task) return null;

  const list = lists.find(l => l.id === task.listId);
  const checkedCount = items.filter(i => i.isChecked).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title || t.tasks.taskDetails}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Task title */}
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {task.importance === 'high' && <AlertCircle size={20} className="text-red-600 flex-shrink-0" />}
              {task.title}
            </h3>
          </div>

          {/* List badge */}
          {list && (
            <Badge variant="secondary" className="text-xs">
              {list.displayName}
            </Badge>
          )}

          {/* Due date */}
          {task.dueDateTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon size={16} />
              <span>{t.tasks.due}: {dateHelpers.formatDate(task.dueDateTime.dateTime, 'PPP', locale)}</span>
            </div>
          )}

          {/* Notes */}
          {task.body?.content && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {task.body.content}
            </div>
          )}

          <Separator />

          {/* Checklist items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground">
                {t.tasks.checklistItems}
                {items.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({checkedCount}/{items.length})
                  </span>
                )}
              </h4>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {items.length === 0 && !isLoading && (
                  <p className="text-sm text-muted-foreground py-2">{t.tasks.noChecklistItems}</p>
                )}

                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <button
                      onClick={() => handleToggleItem(item)}
                      className="touch-target flex-shrink-0"
                      aria-label={item.isChecked ? t.actions.markIncomplete : t.actions.markComplete}
                    >
                      {item.isChecked ? (
                        <CheckCircle2 size={22} className="text-green-600" />
                      ) : (
                        <Circle size={22} className="text-muted-foreground hover:text-primary" />
                      )}
                    </button>

                    <span className={`flex-1 text-sm ${item.isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.displayName}
                    </span>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="btn-icon p-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      aria-label={t.tasks.deleteChecklistItem}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {/* Add new item form */}
                <form onSubmit={handleAddItem} className="flex items-center gap-2 pt-2">
                  <Plus size={20} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={t.tasks.addChecklistItem}
                    className="flex-1 h-9"
                    disabled={isAdding}
                  />
                  {newItemName.trim() && (
                    <Button type="submit" size="sm" disabled={isAdding}>
                      {isAdding ? <Loader2 size={16} className="animate-spin" /> : t.actions.add}
                    </Button>
                  )}
                </form>
              </div>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
