import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { ScoreboardState, ScoreboardContextType, ScoreSession, ScorePlayer, ScoringMode, ScoreEntry } from '../types/funnight.types';
import { StorageService } from '../services/storage.service';

const ScoreboardContext = createContext<ScoreboardContextType | undefined>(undefined);

export const useScoreboard = () => {
  const context = useContext(ScoreboardContext);
  if (!context) {
    throw new Error('useScoreboard must be used within a ScoreboardProvider');
  }
  return context;
};

interface ScoreboardProviderProps {
  children: ReactNode;
}

export const ScoreboardProvider: React.FC<ScoreboardProviderProps> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<ScoreSession | null>(null);
  const [pastSessions, setPastSessions] = useState<ScoreSession[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    const stored = StorageService.getGameScores() as ScoreboardState;
    if (stored) {
      setCurrentSession(stored.currentSession || null);
      setPastSessions(stored.pastSessions || []);
    }
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    const handleCloudRestore = () => {
      const stored = StorageService.getGameScores() as ScoreboardState;
      if (stored) {
        setCurrentSession(stored.currentSession || null);
        setPastSessions(stored.pastSessions || []);
      }
    };
    window.addEventListener('cloud-sync-loaded', handleCloudRestore);
    return () => window.removeEventListener('cloud-sync-loaded', handleCloudRestore);
  }, []);

  const notifyChange = () => window.dispatchEvent(new CustomEvent('planner-data-changed'));

  const persist = useCallback((session: ScoreSession | null, past: ScoreSession[]) => {
    if (!initializedRef.current) return;
    StorageService.setGameScores({ currentSession: session, pastSessions: past });
    notifyChange();
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    persist(currentSession, pastSessions);
  }, [currentSession, pastSessions, persist]);

  const startSession = useCallback((gameId: string, gameName: string, scoringMode: ScoringMode, players: ScorePlayer[]) => {
    const session: ScoreSession = {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      gameName,
      scoringMode,
      players,
      entries: [],
      round: 1,
      phase: 'playing',
      createdAt: new Date().toISOString(),
    };
    setCurrentSession(session);
  }, []);

  const addScoreEntry = useCallback((playerId: string, value: number) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      const entry: ScoreEntry = { playerId, value, round: prev.round, timestamp: Date.now() };
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, score: p.score + value } : p
        ),
        entries: [...prev.entries, entry],
      };
    });
  }, []);

  const nextRound = useCallback(() => {
    setCurrentSession(prev => prev ? { ...prev, round: prev.round + 1 } : prev);
  }, []);

  const finishSession = useCallback(() => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      const finished = { ...prev, phase: 'finished' as const, finishedAt: new Date().toISOString() };
      setPastSessions(past => [finished, ...past].slice(0, 50));
      return null;
    });
  }, []);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setPastSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const value: ScoreboardContextType = {
    currentSession,
    pastSessions,
    startSession,
    addScoreEntry,
    nextRound,
    finishSession,
    clearSession,
    deleteSession,
  };

  return <ScoreboardContext.Provider value={value}>{children}</ScoreboardContext.Provider>;
};
