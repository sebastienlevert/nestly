import React, { useEffect } from 'react';
import { Check, CheckSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useTask } from '../contexts/TaskContext';
import { LoginButton } from '../components/auth/LoginButton';
import { TaskList } from '../components/tasks/TaskList';

export const TasksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const { isSyncing, syncTasks, lastSyncTime, isLoading } = useTask();

  // Trigger first sync when page is opened
  useEffect(() => {
    if (isAuthenticated && !lastSyncTime) {
      syncTasks();
    }
  }, [isAuthenticated, lastSyncTime, syncTasks]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <CheckSquare size={64} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t.tasks.taskManagement}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t.tasks.signInMessage}
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header — same style as calendar */}
      <div className="bg-card border-b border-border">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3">
          {/* Spacer */}
          <div className="flex-1 min-w-0" />

          {/* Sync status */}
          <div className="flex items-center">
            {(isSyncing || isLoading) ? (
              <div className="w-9 h-9 flex items-center justify-center">
                <Loader2 size={18} className="text-primary animate-spin" />
              </div>
            ) : lastSyncTime ? (
              <div className="w-9 h-9 flex items-center justify-center text-green-500">
                <Check size={18} strokeWidth={3} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 w-full">
        <TaskList />
      </div>
    </div>
  );
};
