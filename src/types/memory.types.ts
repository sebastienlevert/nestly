export interface MemoryPhoto {
  id: string;
  name: string;
  thumbnailUrl: string;
  downloadUrl: string;
  takenDate: string;
  yearAgo: number;
  width?: number;
  height?: number;
}

export interface MemoryDay {
  date: string;
  photos: MemoryPhoto[];
  yearsWithMemories: number[];
}

export interface MemoryState {
  todayMemories: MemoryDay | null;
  isLoading: boolean;
  error: string | null;
  selectedDate: Date;
}

export interface MemoryContextType extends MemoryState {
  loadMemoriesForDate: (date: Date) => Promise<void>;
  setSelectedDate: (date: Date) => void;
}
