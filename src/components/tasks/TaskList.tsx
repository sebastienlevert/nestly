import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, AlertCircle, ChevronRight } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { TodoTask } from '../../types/task.types';
import { dateHelpers } from '../../utils/dateHelpers';
import { TaskDetailDialog } from './TaskDetailDialog';

export const TaskList: React.FC = () => {
  const { tasks, lists, toggleTaskComplete, deleteTask, listSettings } = useTask();
  const { accounts } = useAuth();
  const { locale, t } = useLocale();
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);

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
      await toggleTaskComplete(task);
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleDelete = async (e: React.MouseEvent, task: TodoTask) => {
    e.stopPropagation();
    if (confirm(t.tasks.deleteConfirm)) {
      try {
        await deleteTask(task.id, task.accountId);
      } catch (error) {
        // Error is handled in context
      }
    }
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-muted-foreground" />
        <p>{t.tasks.noActiveTasks}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([listId, listTasks]) => {
          const list = lists.find(l => l.id === listId);
          const account = accounts.find(a => a.homeAccountId === list?.accountId);
          const settings = listSettings[listId] || { allowTopLevelEdit: true };
          const allowEdit = settings.allowTopLevelEdit;

          return (
            <div key={listId} className="border border-border rounded-xl overflow-hidden bg-card">
              <h3 className="text-base font-semibold text-foreground px-4 py-3 bg-muted/30 border-b border-border">
                {list?.displayName || t.events.unknown}
                {account && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({account.email})
                  </span>
                )}
              </h3>

              <div className="divide-y divide-border">
                {listTasks.map(task => (
                  <div
                    key={task.id}
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

                    {/* Right side: delete or chevron */}
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
                ))}
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
    </>
  );
};
