import React, { useState, useEffect } from 'react';
import { Check, CheckSquare, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useTask } from '../contexts/TaskContext';
import { LoginButton } from '../components/auth/LoginButton';
import { TaskList } from '../components/tasks/TaskList';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { Button } from '@/components/ui/button';

export const TasksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const { isSyncing, syncTasks, lastSyncTime, isLoading } = useTask();
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              onClick={() => setShowCompleted(false)}
              variant={!showCompleted ? 'default' : 'secondary'}
              className="h-10 sm:h-11 text-sm sm:text-base"
            >
              {t.tasks.active}
            </Button>
            <Button
              onClick={() => setShowCompleted(true)}
              variant={showCompleted ? 'default' : 'secondary'}
              className="h-10 sm:h-11 text-sm sm:text-base"
            >
              {t.tasks.completed}
            </Button>
          </div>

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

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            {t.actions.newTask}
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <TaskList showCompleted={showCompleted} />
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
