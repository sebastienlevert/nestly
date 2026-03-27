import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, AlertCircle, ChevronRight, Plus } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { TodoTask } from '../../types/task.types';
import { dateHelpers } from '../../utils/dateHelpers';
import { TaskDetailDialog } from './TaskDetailDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { TaskListSkeleton } from '../ui/skeleton';
import { SwipeToDelete } from '../ui/swipe-to-delete';

export const TaskList: React.FC = () => {
  const { tasks, lists, toggleTaskComplete, deleteTask, listSettings, createTask, isLoading } = useTask();
  const { locale, t } = useLocale();
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<TodoTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const quickAddInputRef = useRef<HTMLInputElement>(null);

  const filteredTasks = tasks.filter(task => task.status !== 'completed');

  // Group tasks by list
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.listId]) {
      acc[task.listId] = [];
    }
    acc[task.listId].push(task);
    return acc;
  }, {} as Record<string, TodoTask[]>);

  const handleToggle = async (e: React.MouseEvent, task: TodoTask) => {
    e.stopPropagation();
    try {
      if (navigator.vibrate) navigator.vibrate(10);
      await toggleTaskComplete(task);
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleDelete = (e: React.MouseEvent, task: TodoTask) => {
    e.stopPropagation();
    setTaskToDelete(task);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete.id, taskToDelete.accountId);
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  const handleQuickAdd = async (listId: string) => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    try {
      await createTask({ title, listId, accountId: list.accountId });
      setNewTaskTitle('');
      // Keep input open for rapid entry; refocus
      setTimeout(() => quickAddInputRef.current?.focus(), 50);
    } catch {
      // Error handled in context
    }
  };

  if (isLoading && tasks.length === 0) {
    return <TaskListSkeleton />;
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CheckCircle2 size={56} className="mx-auto mb-4 text-green-500/50" />
        <p className="text-lg font-medium text-foreground mb-1">{t.tasks.noActiveTasks}</p>
        <p className="text-sm">{t.tasks.allCaughtUp || 'All caught up!'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([listId, listTasks]) => {
          const list = lists.find(l => l.id === listId);
          const settings = listSettings[listId] || { allowTopLevelEdit: true };
          const allowEdit = settings.allowTopLevelEdit;

          return (
            <div key={listId} className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="flex items-center px-4 py-3 bg-muted/30 border-b border-border">
                <h3 className="text-2xl font-bold text-foreground flex-1">
                  {list?.displayName || t.events.unknown}
                </h3>
                {allowEdit && (
                  <button
                    onClick={() => {
                      setAddingToListId(addingToListId === listId ? null : listId);
                      setNewTaskTitle('');
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    aria-label={t.actions.newTask}
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>

              <div className="divide-y divide-border">
                {listTasks.map(task => (
                  <SwipeToDelete
                    key={task.id}
                    onDelete={() => setTaskToDelete(task)}
                    disabled={!allowEdit}
                  >
                    <div
                      onClick={() => setSelectedTask(task)}
                      className={`flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer ${allowEdit ? 'px-3 py-2 sm:px-4 sm:py-2.5' : 'p-3 sm:p-4'}`}
                    >
                    {/* Checkbox — only if editing allowed */}
                    {allowEdit && (
                      <button
                        onClick={(e) => handleToggle(e, task)}
                        className="flex-shrink-0"
                        aria-label={task.status === 'completed' ? t.actions.markIncomplete : t.actions.markComplete}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 size={24} className="text-green-600" />
                        ) : (
                          <Circle size={24} className="text-muted-foreground hover:text-primary-600" />
                        )}
                      </button>
                    )}

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`font-medium ${
                            task.status === 'completed'
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {task.title}
                          {task.checklistItemCount && task.checklistItemCount > 0 && (
                            <span className="text-muted-foreground font-normal ml-1">({task.checklistItemCount})</span>
                          )}
                        </p>

                        {task.importance === 'high' && (
                          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                        )}
                      </div>

                      {task.body?.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.body.content}
                        </p>
                      )}

                      {task.dueDateTime && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <CalendarIcon size={14} />
                          <span>
                            {t.tasks.due} {dateHelpers.formatDate(task.dueDateTime.dateTime, 'PPP', locale)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right side: delete in normal mode, chevron in grocery mode */}
                    {allowEdit ? (
                      <button
                        onClick={(e) => handleDelete(e, task)}
                        className="btn-icon text-red-600 hover:bg-destructive/10 flex-shrink-0"
                        aria-label="Delete task"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <ChevronRight size={20} className="text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                  </div>
                  </SwipeToDelete>
                ))}
                {addingToListId === listId && (
                  <div className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5 bg-muted/20">
                    <Circle size={24} className="text-muted-foreground/40 flex-shrink-0" />
                    <input
                      ref={quickAddInputRef}
                      type="text"
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(listId);
                        if (e.key === 'Escape') { setAddingToListId(null); setNewTaskTitle(''); }
                      }}
                      onBlur={() => { if (!newTaskTitle.trim()) { setAddingToListId(null); setNewTaskTitle(''); } }}
                      placeholder={t.actions.newTask + '...'}
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-sm font-medium"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        allowEdit={
          selectedTask
            ? (listSettings[selectedTask.listId] || { allowTopLevelEdit: true }).allowTopLevelEdit
            : true
        }
      />

      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t.tasks.deleteTask || 'Delete Task'}
        message={t.tasks.deleteConfirm}
        confirmText={t.actions.delete}
        cancelText={t.actions.cancel}
        isLoading={isDeleting}
      />
    </>
  );
};
