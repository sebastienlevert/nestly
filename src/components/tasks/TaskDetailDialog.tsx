import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Calendar as CalendarIcon, Loader2, Pencil } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { TodoTask, ChecklistItem } from '../../types/task.types';
import { dateHelpers } from '../../utils/dateHelpers';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SwipeToDelete } from '../ui/swipe-to-delete';

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
  allowEdit,
}) => {
  const { getChecklistItems, createChecklistItem, deleteChecklistItem, toggleChecklistItem, updateChecklistItem, updateTask } = useTask();
  const { locale, t } = useLocale();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const itemsEndRef = useRef<HTMLDivElement>(null);

  // Task editing state
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editImportance, setEditImportance] = useState<'low' | 'normal' | 'high'>('normal');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Checklist item inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const editItemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && task) {
      loadItems();
      setIsEditingTask(false);
    } else {
      setItems([]);
      setNewItemName('');
      setIsEditingTask(false);
      setEditingItemId(null);
    }
  }, [isOpen, task?.id]);

  useEffect(() => {
    if (editingItemId && editItemInputRef.current) {
      editItemInputRef.current.focus();
      editItemInputRef.current.select();
    }
  }, [editingItemId]);

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

  const handleStartEditTask = () => {
    if (!task) return;
    setEditTitle(task.title || '');
    setEditImportance(task.importance || 'normal');
    setEditNotes(task.body?.content || '');
    if (task.dueDateTime?.dateTime) {
      const d = new Date(task.dueDateTime.dateTime);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setEditDueDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditDueDate('');
    }
    setIsEditingTask(true);
  };

  const handleCancelEditTask = () => {
    setIsEditingTask(false);
  };

  const handleSaveTask = async () => {
    if (!task || !editTitle.trim()) return;
    setIsSavingTask(true);
    try {
      const updates: Partial<TodoTask> = {};
      if (editTitle.trim() !== task.title) updates.title = editTitle.trim();
      if (editImportance !== task.importance) updates.importance = editImportance;

      const currentNotes = task.body?.content || '';
      if (editNotes !== currentNotes) {
        updates.body = { content: editNotes, contentType: 'text' };
      }

      if (editDueDate) {
        const newDue = {
          dateTime: new Date(editDueDate + 'T00:00:00').toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        const currentDue = task.dueDateTime?.dateTime;
        if (!currentDue || new Date(currentDue).toDateString() !== new Date(editDueDate + 'T00:00:00').toDateString()) {
          updates.dueDateTime = newDue;
        }
      } else if (task.dueDateTime) {
        updates.dueDateTime = undefined;
      }

      if (Object.keys(updates).length > 0) {
        await updateTask(task.id, updates);
      }
      setIsEditingTask(false);
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setIsSavingTask(false);
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
      setTimeout(() => {
        newItemInputRef.current?.focus();
        itemsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
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
    } finally {
      setItemToDelete(null);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    if (!task) return;
    try {
      if (navigator.vibrate) navigator.vibrate(10);
      const updated = await toggleChecklistItem(task, item);
      setItems(prev => prev.map(i => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  const handleStartEditItem = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.displayName);
  };

  const handleSaveEditItem = async (item: ChecklistItem) => {
    if (!task || !editingItemName.trim()) {
      setEditingItemId(null);
      return;
    }
    if (editingItemName.trim() === item.displayName) {
      setEditingItemId(null);
      return;
    }
    try {
      const updated = await updateChecklistItem(task, item, { displayName: editingItemName.trim() });
      setItems(prev => prev.map(i => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error('Failed to update checklist item:', err);
    } finally {
      setEditingItemId(null);
    }
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemName('');
  };

  if (!task) return null;

  const checkedCount = items.filter(i => i.isChecked).length;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          {isEditingTask ? (
            <DialogTitle className="text-xl">{t.tasks.editTask}</DialogTitle>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-xl flex-1">{task.title || t.tasks.taskDetails}</DialogTitle>
              {allowEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStartEditTask}
                  aria-label={t.actions.edit}
                  className="flex-shrink-0"
                >
                  <Pencil size={18} />
                </Button>
              )}
            </div>
          )}
        </DialogHeader>

        <DialogBody className="space-y-2 pt-2">
          {isEditingTask ? (
            <div className="space-y-4">
              {/* Edit Title */}
              <div className="space-y-2">
                <Label htmlFor="editTaskTitle">{t.tasks.taskTitle} *</Label>
                <Input
                  id="editTaskTitle"
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder={t.tasks.taskTitlePlaceholder}
                  required
                  autoFocus
                />
              </div>

              {/* Edit Importance */}
              <div className="space-y-2">
                <Label htmlFor="editImportance">{t.tasks.importance}</Label>
                <select
                  id="editImportance"
                  value={editImportance}
                  onChange={e => setEditImportance(e.target.value as 'low' | 'normal' | 'high')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="low">{t.tasks.importanceLow}</option>
                  <option value="normal">{t.tasks.importanceNormal}</option>
                  <option value="high">{t.tasks.importanceHigh}</option>
                </select>
              </div>

              {/* Edit Due Date */}
              <div className="space-y-2">
                <Label>{t.tasks.dueDate}</Label>
                <DatePickerField
                  value={editDueDate}
                  onChange={v => setEditDueDate(v)}
                />
              </div>

              {/* Edit Notes */}
              <div className="space-y-2">
                <Label htmlFor="editNotes">{t.tasks.notes}</Label>
                <Textarea
                  id="editNotes"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder={t.tasks.notesPlaceholder}
                />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          {/* Checklist items (always visible) */}
          {!isEditingTask && (
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
                    <SwipeToDelete
                      key={item.id}
                      onDelete={() => setItemToDelete(item.id)}
                    >
                      <div
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

                        {editingItemId === item.id ? (
                          <form
                            className="flex-1 flex items-center gap-2"
                            onSubmit={(e) => { e.preventDefault(); handleSaveEditItem(item); }}
                          >
                            <Input
                              ref={editItemInputRef}
                              type="text"
                              value={editingItemName}
                              onChange={e => setEditingItemName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Escape') handleCancelEditItem(); }}
                              onBlur={() => handleSaveEditItem(item)}
                              className="flex-1 h-8 text-sm"
                            />
                          </form>
                        ) : (
                          <span
                            className={`flex-1 text-sm cursor-pointer ${item.isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                            onClick={() => allowEdit && handleStartEditItem(item)}
                            role={allowEdit ? 'button' : undefined}
                            tabIndex={allowEdit ? 0 : undefined}
                            onKeyDown={allowEdit ? (e) => { if (e.key === 'Enter') handleStartEditItem(item); } : undefined}
                            aria-label={allowEdit ? t.tasks.editChecklistItem : undefined}
                          >
                            {item.displayName}
                          </span>
                        )}

                        {editingItemId !== item.id && (
                          <button
                            onClick={() => setItemToDelete(item.id)}
                            className="btn-icon p-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            aria-label={t.tasks.deleteChecklistItem}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </SwipeToDelete>
                  ))}

                  <div ref={itemsEndRef} />
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="justify-stretch">
          {isEditingTask ? (
            <div className="flex items-center gap-2 w-full justify-end">
              <Button type="button" variant="secondary" onClick={handleCancelEditTask} disabled={isSavingTask}>
                {t.actions.cancel}
              </Button>
              <Button type="button" onClick={handleSaveTask} disabled={isSavingTask || !editTitle.trim()}>
                {isSavingTask ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                {isSavingTask ? t.actions.saving : t.actions.save}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAddItem} className="flex items-center gap-2 w-full">
              <Plus size={20} className="text-muted-foreground flex-shrink-0" />
              <Input
                ref={newItemInputRef}
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={t.tasks.addChecklistItem}
                className="flex-1"
                disabled={isAdding}
              />
              {newItemName.trim() && (
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? <Loader2 size={16} className="animate-spin" /> : t.actions.add}
                </Button>
              )}
            </form>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete)}
        title={t.tasks.deleteChecklistItem}
        message={t.tasks.deleteChecklistItemConfirm || 'Are you sure you want to delete this item?'}
        confirmText={t.actions.delete}
        cancelText={t.actions.cancel}
      />
    </>
  );
};
