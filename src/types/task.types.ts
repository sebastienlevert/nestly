export interface TodoList {
  id: string;
  displayName: string;
  isOwner: boolean;
  isShared: boolean;
  accountId: string;
}

export interface ChecklistItem {
  id: string;
  displayName: string;
  isChecked: boolean;
  taskId: string;
  listId: string;
  accountId: string;
  createdDateTime?: string;
}

export interface TodoListSettings {
  allowTopLevelEdit: boolean;
}

export interface TodoTask {
  id: string;
  listId: string;
  accountId: string;
  title: string;
  body?: {
    content: string;
    contentType: string;
  };
  importance: 'low' | 'normal' | 'high';
  status: 'notStarted' | 'inProgress' | 'completed' | 'waitingOnOthers' | 'deferred';
  isReminderOn: boolean;
  reminderDateTime?: {
    dateTime: string;
    timeZone: string;
  };
  dueDateTime?: {
    dateTime: string;
    timeZone: string;
  };
  completedDateTime?: {
    dateTime: string;
    timeZone: string;
  };
  createdDateTime: string;
  lastModifiedDateTime: string;
  checklistItemCount?: number;
}

export interface CreateTaskInput {
  title: string;
  body?: string;
  importance?: 'low' | 'normal' | 'high';
  dueDate?: Date;
  listId: string;
  accountId: string;
}

export interface TaskState {
  lists: TodoList[];
  tasks: TodoTask[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  selectedLists: string[];
  listSettings: Record<string, TodoListSettings>;
}

export interface TaskContextType extends TaskState {
  syncTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<TodoTask>;
  updateTask: (taskId: string, updates: Partial<TodoTask>) => Promise<void>;
  deleteTask: (taskId: string, accountId: string) => Promise<void>;
  toggleTaskComplete: (task: TodoTask) => Promise<void>;
  toggleList: (listId: string) => void;
  setListSettings: (listId: string, settings: TodoListSettings) => void;
  getChecklistItems: (task: TodoTask) => Promise<ChecklistItem[]>;
  createChecklistItem: (task: TodoTask, displayName: string) => Promise<ChecklistItem>;
  deleteChecklistItem: (task: TodoTask, itemId: string) => Promise<void>;
  toggleChecklistItem: (task: TodoTask, item: ChecklistItem) => Promise<ChecklistItem>;
  updateChecklistItem: (task: TodoTask, item: ChecklistItem, updates: { displayName: string }) => Promise<ChecklistItem>;
}
