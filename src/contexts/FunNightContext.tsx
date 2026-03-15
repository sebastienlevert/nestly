import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { openaiService } from '../services/openai.service';
import type { BoardGame, FunNightPlan, FunNightContextType } from '../types/funnight.types';
import { StorageService } from '../services/storage.service';

const FunNightContext = createContext<FunNightContextType | undefined>(undefined);

export const useFunNight = () => {
  const context = useContext(FunNightContext);
  if (!context) {
    throw new Error('useFunNight must be used within a FunNightProvider');
  }
  return context;
};

interface FunNightProviderProps {
  children: ReactNode;
}

export const FunNightProvider: React.FC<FunNightProviderProps> = ({ children }) => {
  const [games, setGames] = useState<BoardGame[]>([]);
  const [history, setHistory] = useState<FunNightPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<FunNightPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from storage on mount
  useEffect(() => {
    const storedGames = StorageService.getBoardGames();
    const storedHistory = StorageService.getFunNightHistory();
    setGames(storedGames);
    setHistory(storedHistory);
  }, []);

  const notifyChange = () => window.dispatchEvent(new CustomEvent('planner-data-changed'));

  // Save to storage whenever data changes
  useEffect(() => {
    StorageService.setBoardGames(games);
    notifyChange();
  }, [games]);

  useEffect(() => {
    StorageService.setFunNightHistory(history);
    notifyChange();
  }, [history]);

  const addGame = useCallback((game: Omit<BoardGame, 'id' | 'createdAt' | 'isFavorite'>) => {
    const newGame: BoardGame = {
      ...game,
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };
    setGames(prev => [...prev, newGame]);
  }, []);

  const updateGame = useCallback((id: string, updates: Partial<BoardGame>) => {
    setGames(prev =>
      prev.map(game => (game.id === id ? { ...game, ...updates } : game))
    );
  }, []);

  const removeGame = useCallback((id: string) => {
    setGames(prev => prev.filter(game => game.id !== id));
  }, []);

  const toggleFavoriteGame = useCallback((id: string) => {
    setGames(prev =>
      prev.map(game =>
        game.id === id ? { ...game, isFavorite: !game.isFavorite } : game
      )
    );
  }, []);

  const spinWheel = useCallback((): Promise<BoardGame | null> => {
    return new Promise(resolve => {
      if (games.length === 0) {
        resolve(null);
        return;
      }

      setIsSpinning(true);
      setTimeout(() => {
        const randomGame = games[Math.floor(Math.random() * games.length)];
        setIsSpinning(false);
        resolve(randomGame);
      }, 2000);
    });
  }, [games]);

  const generateFunNight = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const gameNames = games.map(g => g.name);
      if (gameNames.length === 0) {
        throw new Error('Add some games to your library first');
      }

      const response = await openaiService.generateFunNightPlan(gameNames, 4);

      const matchedGame = games.find(
        g => g.name.toLowerCase() === response.game?.toLowerCase()
      ) ?? null;

      const plan: FunNightPlan = {
        id: `funnight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString().split('T')[0],
        game: matchedGame,
        dinnerTitle: response.dinner.title,
        dinnerDescription: response.dinner.description,
        dinnerIngredients: response.dinner.ingredients,
        dinnerInstructions: response.dinner.instructions,
        activity: {
          type: response.activity.type,
          title: response.activity.title,
          description: response.activity.description,
        },
        isCompleted: false,
        rating: 0,
        notes: '',
        createdAt: new Date().toISOString(),
      };

      setCurrentPlan(plan);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate fun night plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [games]);

  const saveFunNight = useCallback((plan: FunNightPlan) => {
    setHistory(prev => [plan, ...prev]);
    setCurrentPlan(null);
  }, []);

  const completeFunNight = useCallback((id: string, rating: number, notes: string) => {
    setHistory(prev =>
      prev.map(plan =>
        plan.id === id ? { ...plan, isCompleted: true, rating, notes } : plan
      )
    );
  }, []);

  const value: FunNightContextType = {
    games,
    history,
    currentPlan,
    isGenerating,
    isSpinning,
    error,
    addGame,
    updateGame,
    removeGame,
    toggleFavoriteGame,
    generateFunNight,
    saveFunNight,
    completeFunNight,
    spinWheel,
  };

  return <FunNightContext.Provider value={value}>{children}</FunNightContext.Provider>;
};
