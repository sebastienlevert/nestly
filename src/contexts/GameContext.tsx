import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { oneDriveGamesService } from '../services/onedrive-games.service';
import type { GamesData, GameSession, GameTemplate } from '../types/game.types';
import { BUILT_IN_GAMES } from '../types/game.types';

interface GameContextType {
  sessions: GameSession[];
  customTemplates: GameTemplate[];
  allTemplates: GameTemplate[];
  isLoading: boolean;
  isSyncing: boolean;

  createSession: (gameId: string, gameName: string, playerNames: string[], hasRounds: boolean, scoringCategories?: string[]) => GameSession;
  updateSession: (session: GameSession) => void;
  deleteSession: (sessionId: string) => void;
  addRound: (sessionId: string) => void;
  updateScore: (sessionId: string, playerIndex: number, roundIndex: number, score: number) => void;
  finishGame: (sessionId: string, notes?: string) => void;
  addCustomTemplate: (template: Omit<GameTemplate, 'id' | 'isBuiltIn'>) => void;
  syncToCloud: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accounts, getAccessToken } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [customTemplates, setCustomTemplates] = useState<GameTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const initialSyncDone = useRef(false);

  const allTemplates = [...BUILT_IN_GAMES, ...customTemplates];

  const getToken = useCallback(async (): Promise<string | null> => {
    if (accounts.length === 0) return null;
    try {
      return await getAccessToken(accounts[0].homeAccountId);
    } catch {
      return null;
    }
  }, [accounts, getAccessToken]);

  // Build the data object for saving
  const buildData = useCallback((): GamesData => ({
    customTemplates,
    sessions,
  }), [customTemplates, sessions]);

  // Save to OneDrive
  const syncToCloud = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setIsSyncing(true);
    await oneDriveGamesService.write(token, buildData());
    setIsSyncing(false);
  }, [getToken, buildData]);

  // Auto-save whenever data changes (after initial load)
  const dataLoaded = useRef(false);
  useEffect(() => {
    if (!dataLoaded.current) return;
    // Debounce the cloud sync
    const timer = setTimeout(() => { syncToCloud(); }, 2000);
    return () => clearTimeout(timer);
  }, [sessions, customTemplates]);

  // Load: cache first → OneDrive in background
  useEffect(() => {
    if (accounts.length === 0 || initialSyncDone.current) return;
    initialSyncDone.current = true;

    (async () => {
      setIsLoading(true);

      // 1. Load from IndexedDB cache (instant)
      const cached = await oneDriveGamesService.getCached();
      if (cached) {
        setSessions(cached.sessions || []);
        setCustomTemplates(cached.customTemplates || []);
      }

      // 2. Sync from OneDrive in background
      const token = await getToken();
      if (token) {
        setIsSyncing(true);
        const remote = await oneDriveGamesService.read(token);
        if (remote) {
          setSessions(remote.sessions || []);
          setCustomTemplates(remote.customTemplates || []);
        } else if (!cached) {
          // No remote data — push empty structure
          await oneDriveGamesService.write(token, oneDriveGamesService.getEmpty());
        }
        setIsSyncing(false);
      }

      setIsLoading(false);
      dataLoaded.current = true;
    })();
  }, [accounts, getToken]);

  const createSession = useCallback((gameId: string, gameName: string, playerNames: string[], hasRounds: boolean, scoringCategories?: string[]): GameSession => {
    const numSlots = scoringCategories ? scoringCategories.length : (hasRounds ? 1 : 1);
    const session: GameSession = {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      gameName,
      playedAt: new Date().toISOString(),
      players: playerNames.map(name => ({
        name,
        roundScores: new Array(numSlots).fill(0),
        totalScore: 0,
      })),
      rounds: numSlots,
      scoringCategories,
      isActive: true,
    };
    setSessions(prev => [session, ...prev]);
    return session;
  }, []);

  const updateSession = useCallback((session: GameSession) => {
    setSessions(prev => prev.map(s => s.id === session.id ? session : s));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const addRound = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        rounds: s.rounds + 1,
        players: s.players.map(p => ({
          ...p,
          roundScores: [...p.roundScores, 0],
        })),
      };
    }));
  }, []);

  const updateScore = useCallback((sessionId: string, playerIndex: number, roundIndex: number, score: number) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const players = s.players.map((p, i) => {
        if (i !== playerIndex) return p;
        const roundScores = [...p.roundScores];
        roundScores[roundIndex] = score;
        return { ...p, roundScores, totalScore: roundScores.reduce((a, b) => a + b, 0) };
      });
      return { ...s, players };
    }));
  }, []);

  const finishGame = useCallback((sessionId: string, notes?: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return { ...s, isActive: false, notes: notes || s.notes };
    }));
  }, []);

  const addCustomTemplate = useCallback((template: Omit<GameTemplate, 'id' | 'isBuiltIn'>) => {
    const newTemplate: GameTemplate = {
      ...template,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isBuiltIn: false,
    };
    setCustomTemplates(prev => [...prev, newTemplate]);
  }, []);

  return (
    <GameContext.Provider value={{
      sessions,
      customTemplates,
      allTemplates,
      isLoading,
      isSyncing,
      createSession,
      updateSession,
      deleteSession,
      addRound,
      updateScore,
      finishGame,
      addCustomTemplate,
      syncToCloud,
    }}>
      {children}
    </GameContext.Provider>
  );
};
