import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { openaiService } from '../services/openai.service';
import type { LoveNote, GratitudeEntry, DailySpark, LoveBoardContextType } from '../types/loveboard.types';
import { StorageService } from '../services/storage.service';

const LoveBoardContext = createContext<LoveBoardContextType | undefined>(undefined);

export const useLoveBoard = () => {
  const context = useContext(LoveBoardContext);
  if (!context) {
    throw new Error('useLoveBoard must be used within a LoveBoardProvider');
  }
  return context;
};

interface LoveBoardProviderProps {
  children: ReactNode;
}

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const LoveBoardProvider: React.FC<LoveBoardProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [currentSpark, setCurrentSpark] = useState<DailySpark | null>(null);
  const [isGeneratingSpark, setIsGeneratingSpark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Load data from storage on mount
  useEffect(() => {
    const storedNotes = StorageService.getLoveNotes();
    const storedGratitude = StorageService.getGratitudeEntries();
    const storedSpark = StorageService.getDailySpark();
    setNotes(storedNotes);
    setGratitudeEntries(storedGratitude);

    // Only restore today's cached spark — don't generate a new one eagerly
    if (storedSpark && storedSpark.generatedAt === getTodayDateString()) {
      setCurrentSpark(storedSpark);
    }
    initializedRef.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-read from localStorage when cloud sync restores data
  useEffect(() => {
    const handleCloudRestore = () => {
      setNotes(StorageService.getLoveNotes());
      setGratitudeEntries(StorageService.getGratitudeEntries());
    };
    window.addEventListener('cloud-sync-loaded', handleCloudRestore);
    return () => window.removeEventListener('cloud-sync-loaded', handleCloudRestore);
  }, []);

  const notifyChange = () => window.dispatchEvent(new CustomEvent('planner-data-changed'));

  // Save to storage whenever data changes
  useEffect(() => {
    if (!initializedRef.current) return;
    StorageService.setLoveNotes(notes);
    notifyChange();
  }, [notes]);

  useEffect(() => {
    if (!initializedRef.current) return;
    StorageService.setGratitudeEntries(gratitudeEntries);
    notifyChange();
  }, [gratitudeEntries]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (currentSpark) {
      StorageService.setDailySpark(currentSpark);
      notifyChange();
    }
  }, [currentSpark]);

  const generateNewSpark = async () => {
    setIsGeneratingSpark(true);
    setError(null);

    try {
      const result = await openaiService.generateDailySpark(4, ['photos', 'travelling', 'board games', 'music', 'good food']);
      const spark: DailySpark = {
        id: `spark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: result.type as DailySpark['type'],
        content: result.content,
        generatedAt: getTodayDateString(),
      };
      setCurrentSpark(spark);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate daily spark';
      setError(errorMessage);
    } finally {
      setIsGeneratingSpark(false);
    }
  };

  const addNote = useCallback((note: Omit<LoveNote, 'id' | 'createdAt'>) => {
    const newNote: LoveNote = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  const togglePinNote = useCallback((id: string) => {
    setNotes(prev =>
      prev.map(note => (note.id === id ? { ...note, isPinned: !note.isPinned } : note))
    );
  }, []);

  const addGratitude = useCallback((entry: Omit<GratitudeEntry, 'id' | 'createdAt'>) => {
    const newEntry: GratitudeEntry = {
      ...entry,
      id: `gratitude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setGratitudeEntries(prev => [...prev, newEntry]);
  }, []);

  const generateDailySpark = useCallback(async () => {
    await generateNewSpark();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshSpark = useCallback(async () => {
    await generateNewSpark();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: LoveBoardContextType = {
    notes,
    gratitudeEntries,
    currentSpark,
    isGeneratingSpark,
    error,
    addNote,
    deleteNote,
    togglePinNote,
    addGratitude,
    generateDailySpark,
    refreshSpark,
  };

  return <LoveBoardContext.Provider value={value}>{children}</LoveBoardContext.Provider>;
};
