import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { todoService } from '../services/todo.service';
import { StorageService } from '../services/storage.service';
import { cacheService } from '../services/idb-cache.service';
import { parallelLimit } from '../utils/parallelLimit';
import type { TodoList, TodoTask, CreateTaskInput, ChecklistItem, TodoListSettings, TaskContextType } from '../types/task.types';

const MAX_CONCURRENT = 4;

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const { accounts, getAccessToken } = useAuth();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>(() => {
    const settings = StorageService.getSettings();
    return settings.selectedTodoLists || [];
  });
  const [listSettings, setListSettingsState] = useState<Record<string, TodoListSettings>>(() => {
    const settings = StorageService.getSettings();
    return settings.todoListSettings || {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lazy sync — only load from cache on mount, don't hit the API until user opens Tasks
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (accounts.length === 0) return;

    // Load from IndexedDB cache for instant UI if user navigates to Tasks later
    const accountKey = accounts.map(a => a.homeAccountId).sort().join(',');
    (async () => {
      const cachedLists = await cacheService.get<TodoList[]>(`todo-lists:${accountKey}`);
      const cachedTasks = await cacheService.get<TodoTask[]>(`todo-tasks:${accountKey}`);
      if (cachedLists) {
        setLists(cachedLists.data);
        const settings = StorageService.getSettings();
        if (!settings.selectedTodoLists || settings.selectedTodoLists.length === 0) {
          setSelectedLists(cachedLists.data.map(l => l.id));
        }
      }
      if (cachedTasks) setTasks(cachedTasks.data);
      if (cachedLists || cachedTasks) setIsLoading(false);
    })();
  }, [accounts]);

  // Sync To Do lists and tasks from all accounts (called lazily on first access)
  const syncTasks = useCallback(async () => {
    if (accounts.length === 0) return;
    hasSyncedRef.current = true;

    try {
      setIsSyncing(true);
      setError(null);

      // Fetch lists from all accounts (max 4 concurrent)
      const listResults = await parallelLimit(
        accounts.map((account) => async () => {
          const accessToken = await getAccessToken(account.homeAccountId);
          return todoService.getTodoLists(accessToken, account.homeAccountId);
        }),
        MAX_CONCURRENT
      );
      const allLists: TodoList[] = listResults.flat();

      setLists(allLists);

      // If no persisted selection, select all lists by default
      const currentSettings = StorageService.getSettings();
      let activeSelectedLists = currentSettings.selectedTodoLists;
      if (!activeSelectedLists || activeSelectedLists.length === 0) {
        activeSelectedLists = allLists.map(list => list.id);
        setSelectedLists(activeSelectedLists);
        StorageService.setSettings({ ...currentSettings, selectedTodoLists: activeSelectedLists });
      }

      // Fetch tasks from all accounts (max 4 concurrent)
      const taskResults = await parallelLimit(
        accounts.map((account) => async () => {
          const accessToken = await getAccessToken(account.homeAccountId);
          const accountListIds = allLists
            .filter(list => list.accountId === account.homeAccountId)
            .map(list => list.id);
          return todoService.getAllTasks(accessToken, account.homeAccountId, accountListIds);
        }),
        MAX_CONCURRENT
      );
      const allTasks: TodoTask[] = taskResults.flat();

      setTasks(allTasks);
      setLastSyncTime(Date.now());

      // Cache to IndexedDB
      const accountKey = accounts.map(a => a.homeAccountId).sort().join(',');
      cacheService.set(`todo-lists:${accountKey}`, allLists);
      cacheService.set(`todo-tasks:${accountKey}`, allTasks);
    } catch (err) {
      console.error('Task sync failed:', err);
      setError('Failed to sync tasks. Please try again.');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, [accounts, getAccessToken]);

  // Create a new task
  const createTask = async (input: CreateTaskInput): Promise<TodoTask> => {
    try {
      const accessToken = await getAccessToken(input.accountId);
      const newTask = await todoService.createTask(input, accessToken);

      // Add to local state
      setTasks(prev => [newTask, ...prev]);

      return newTask;
    } catch (err) {
      console.error('Failed to create task:', err);
      throw new Error('Failed to create task. Please try again.');
    }
  };

  // Update an existing task
  const updateTask = async (taskId: string, updates: Partial<TodoTask>): Promise<void> => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const accessToken = await getAccessToken(task.accountId);
      await todoService.updateTask(task.listId, taskId, updates, accessToken);

      // Update local state
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, ...updates } : t))
      );
    } catch (err) {
      console.error('Failed to update task:', err);
      throw new Error('Failed to update task. Please try again.');
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string, accountId: string): Promise<void> => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const accessToken = await getAccessToken(accountId);
      await todoService.deleteTask(task.listId, taskId, accessToken);

      // Remove from local state
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw new Error('Failed to delete task. Please try again.');
    }
  };

  // Toggle task completion
  const toggleTaskComplete = async (task: TodoTask): Promise<void> => {
    try {
      const accessToken = await getAccessToken(task.accountId);
      const updatedTask = await todoService.toggleTaskComplete(task, accessToken);

      // Update local state
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? updatedTask : t))
      );
    } catch (err) {
      console.error('Failed to toggle task:', err);
      throw new Error('Failed to update task. Please try again.');
    }
  };

  // Toggle list visibility (persists to storage)
  const toggleList = (listId: string) => {
    setSelectedLists(prev => {
      const updated = prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId];
      const settings = StorageService.getSettings();
      StorageService.setSettings({ ...settings, selectedTodoLists: updated });
      return updated;
    });
  };

  // Set per-list settings (persists to storage)
  const setListSettings = (listId: string, newSettings: TodoListSettings) => {
    setListSettingsState(prev => {
      const updated = { ...prev, [listId]: newSettings };
      const settings = StorageService.getSettings();
      StorageService.setSettings({ ...settings, todoListSettings: updated });
      return updated;
    });
  };

  // Checklist item operations
  const getChecklistItems = async (task: TodoTask): Promise<ChecklistItem[]> => {
    const accessToken = await getAccessToken(task.accountId);
    return todoService.getChecklistItems(task.listId, task.id, accessToken, task.accountId);
  };

  const createChecklistItem = async (task: TodoTask, displayName: string): Promise<ChecklistItem> => {
    const accessToken = await getAccessToken(task.accountId);
    const newItem = await todoService.createChecklistItem(task.listId, task.id, displayName, accessToken, task.accountId);
    // Update parent task's checklist count in local state
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, checklistItemCount: (t.checklistItemCount || 0) + 1 } : t
    ));
    return newItem;
  };

  const deleteChecklistItem = async (task: TodoTask, itemId: string): Promise<void> => {
    const accessToken = await getAccessToken(task.accountId);
    await todoService.deleteChecklistItem(task.listId, task.id, itemId, accessToken);
    // Update parent task's checklist count in local state
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, checklistItemCount: Math.max((t.checklistItemCount || 1) - 1, 0) } : t
    ));
  };

  const toggleChecklistItem = async (task: TodoTask, item: ChecklistItem): Promise<ChecklistItem> => {
    const accessToken = await getAccessToken(task.accountId);
    return todoService.toggleChecklistItem(task.listId, task.id, item, accessToken);
  };

  const value: TaskContextType = {
    lists,
    tasks: tasks.filter(t => selectedLists.includes(t.listId)),
    isLoading,
    isSyncing,
    lastSyncTime,
    error,
    selectedLists,
    listSettings,
    syncTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleList,
    setListSettings,
    getChecklistItems,
    createChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
