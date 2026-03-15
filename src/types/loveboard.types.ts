export interface LoveNote {
  id: string;
  message: string;
  author: string;
  emoji?: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
}

export type SparkType = 'conversation' | 'activity' | 'question' | 'challenge';

export interface DailySpark {
  id: string;
  type: SparkType;
  content: string;
  generatedAt: string;
}

export interface GratitudeEntry {
  id: string;
  message: string;
  author: string;
  createdAt: string;
}

export interface LoveBoardState {
  notes: LoveNote[];
  gratitudeEntries: GratitudeEntry[];
  currentSpark: DailySpark | null;
  isGeneratingSpark: boolean;
  error: string | null;
}

export interface LoveBoardContextType extends LoveBoardState {
  addNote: (note: Omit<LoveNote, 'id' | 'createdAt'>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  addGratitude: (entry: Omit<GratitudeEntry, 'id' | 'createdAt'>) => void;
  generateDailySpark: () => Promise<void>;
  refreshSpark: () => Promise<void>;
}
