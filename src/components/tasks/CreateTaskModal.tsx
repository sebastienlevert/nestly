import React, { useState } from 'react';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { CreateTaskInput } from '../../types/task.types';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerField } from '@/components/ui/date-picker-field';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const { lists, selectedLists, listSettings, createTask } = useTask();
  const { accounts } = useAuth();
  const { t } = useLocale();

  // Only show selected lists that allow editing
  const editableLists = lists.filter(
    list => selectedLists.includes(list.id) && (listSettings[list.id]?.allowTopLevelEdit !== false)
  );

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    importance: 'normal' as 'low' | 'normal' | 'high',
    dueDate: '',
    listId: editableLists[0]?.id || '',
    accountId: editableLists[0]?.accountId || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleListChange = (listId: string) => {
    const selectedList = editableLists.find(list => list.id === listId);
    if (selectedList) {
      setFormData(prev => ({
        ...prev,
        listId,
        accountId: selectedList.accountId,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const input: CreateTaskInput = {
        title: formData.title,
        body: formData.body || undefined,
        importance: formData.importance,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        listId: formData.listId,
        accountId: formData.accountId,
      };

      await createTask(input);
      onClose();

      // Reset form
      setFormData({
        title: '',
        body: '',
        importance: 'normal',
        dueDate: '',
        listId: editableLists[0]?.id || '',
        accountId: editableLists[0]?.accountId || '',
      });
    } catch (err: any) {
      setError(err.message || t.tasks.failedToCreate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.tasks.createTask}</DialogTitle>
          <DialogDescription>
            {t.tasks.addTaskDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-4">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="taskTitle">{t.tasks.taskTitle} *</Label>
              <Input
                id="taskTitle"
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t.tasks.taskTitlePlaceholder}
                required
                autoFocus
              />
            </div>

            {/* List Selection */}
            <div className="space-y-2">
              <Label htmlFor="list">{t.tasks.list} *</Label>
              <select
                id="list"
                value={formData.listId}
                onChange={e => handleListChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {editableLists.map(list => {
                  const account = accounts.find(acc => acc.homeAccountId === list.accountId);
                  return (
                    <option key={list.id} value={list.id}>
                      {list.displayName} ({account?.email || t.events.unknown})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Importance */}
            <div className="space-y-2">
              <Label htmlFor="importance">{t.tasks.importance}</Label>
              <select
                id="importance"
                value={formData.importance}
                onChange={e => setFormData(prev => ({ ...prev, importance: e.target.value as any }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="low">{t.tasks.importanceLow}</option>
                <option value="normal">{t.tasks.importanceNormal}</option>
                <option value="high">{t.tasks.importanceHigh}</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>{t.tasks.dueDate}</Label>
              <DatePickerField
                value={formData.dueDate}
                onChange={v => setFormData(prev => ({ ...prev, dueDate: v }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t.tasks.notes}</Label>
              <Textarea
                id="notes"
                value={formData.body}
                onChange={e => setFormData(prev => ({ ...prev, body: e.target.value }))}
                rows={3}
                placeholder={t.tasks.notesPlaceholder}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t.actions.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t.actions.creating : t.tasks.createTask}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
