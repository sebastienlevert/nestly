import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { onedriveService } from '../services/onedrive.service';
import type { MemoryPhoto, MemoryDay, MemoryContextType } from '../types/memory.types';

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};

interface MemoryProviderProps {
  children: ReactNode;
}

export const MemoryProvider: React.FC<MemoryProviderProps> = ({ children }) => {
  const { accounts, getAccessToken } = useAuth();

  const [todayMemories, setTodayMemories] = useState<MemoryDay | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDateState] = useState<Date>(new Date());

  const loadMemoriesForDate = useCallback(async (date: Date) => {
    if (accounts.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentYear = date.getFullYear();
      const allPhotos: MemoryPhoto[] = [];
      const yearsSet = new Set<number>();

      // Use server-side search to find photos from this date in past years
      const token = await getAccessToken(accounts[0].homeAccountId);
      const matchingPhotos = await onedriveService.getMemoryPhotosForDate(
        token,
        date.getMonth() + 1,
        date.getDate()
      );

      for (const item of matchingPhotos) {
        const photoDate = item.photo?.takenDateTime || item.createdDateTime;
        if (!photoDate) continue;

        const itemDate = new Date(photoDate);
        const yearAgo = currentYear - itemDate.getFullYear();
        if (yearAgo > 0) {
          yearsSet.add(yearAgo);
          const thumbnail = item.thumbnails?.[0];
          allPhotos.push({
            id: item.id,
            name: item.name,
            thumbnailUrl: thumbnail?.large?.url || thumbnail?.medium?.url || '',
            downloadUrl: thumbnail?.large?.url || '',
            takenDate: photoDate,
            yearAgo,
            width: thumbnail?.large?.width,
            height: thumbnail?.large?.height,
          });
        }
      }

      const memoryDay: MemoryDay = {
        date: date.toISOString(),
        photos: allPhotos,
        yearsWithMemories: Array.from(yearsSet).sort((a, b) => a - b),
      };

      setTodayMemories(memoryDay);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load memories';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accounts, getAccessToken]);

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateState(date);
    loadMemoriesForDate(date);
  }, [loadMemoriesForDate]);

  const value: MemoryContextType = {
    todayMemories,
    isLoading,
    error,
    selectedDate,
    loadMemoriesForDate,
    setSelectedDate,
  };

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>;
};
