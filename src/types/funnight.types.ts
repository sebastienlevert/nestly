export type GameCategory = 'strategy' | 'party' | 'cooperative' | 'card' | 'dice' | 'trivia' | 'family' | 'kids' | 'other';

export interface BoardGame {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  estimatedMinutes: number;
  category: GameCategory;
  isFavorite: boolean;
  createdAt: string;
}

export interface FunNightActivity {
  type: 'activity' | 'movie';
  title: string;
  description: string;
  ageRating?: string;
}

export interface FunNightPlan {
  id: string;
  date: string;
  game: BoardGame | null;
  dinnerTitle: string;
  dinnerDescription: string;
  dinnerIngredients: string[];
  dinnerInstructions: string[];
  activity: FunNightActivity;
  isCompleted: boolean;
  rating: number;
  notes: string;
  createdAt: string;
}

export interface FunNightState {
  games: BoardGame[];
  history: FunNightPlan[];
  currentPlan: FunNightPlan | null;
  isGenerating: boolean;
  isSpinning: boolean;
  error: string | null;
}

export interface FunNightContextType extends FunNightState {
  addGame: (game: Omit<BoardGame, 'id' | 'createdAt' | 'isFavorite'>) => void;
  updateGame: (id: string, updates: Partial<BoardGame>) => void;
  removeGame: (id: string) => void;
  toggleFavoriteGame: (id: string) => void;
  generateFunNight: () => Promise<void>;
  saveFunNight: (plan: FunNightPlan) => void;
  completeFunNight: (id: string, rating: number, notes: string) => void;
  spinWheel: () => Promise<BoardGame | null>;
}
