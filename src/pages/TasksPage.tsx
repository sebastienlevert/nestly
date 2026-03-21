import React, { useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useTask } from '../contexts/TaskContext';
import { LoginButton } from '../components/auth/LoginButton';
import { TaskList } from '../components/tasks/TaskList';

export const TasksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const { syncTasks, lastSyncTime } = useTask();

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
      {/* Task List */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 w-full">
        <TaskList />
      </div>
    </div>
  );
};
