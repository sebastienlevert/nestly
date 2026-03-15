import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePhoto } from './PhotoContext';
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

const getMonthDay = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

export const MemoryProvider: React.FC<MemoryProviderProps> = ({ children }) => {
  const { accounts, getAccessToken } = useAuth();
  const { selectedFolderId } = usePhoto();

  const [todayMemories, setTodayMemories] = useState<MemoryDay | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDateState] = useState<Date>(new Date());

  const loadMemoriesForDate = useCallback(async (date: Date) => {
    if (accounts.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const monthDay = getMonthDay(date);
      const currentYear = date.getFullYear();
      const allPhotos: MemoryPhoto[] = [];
      const yearsSet = new Set<number>();

      // Photo memories — recursively scan selected folder and subfolders
      if (selectedFolderId && accounts.length > 0) {
        try {
          const token = await getAccessToken(accounts[0].homeAccountId);
          const allImages = await onedriveService.getImagesFromFolder(selectedFolderId, token);

          for (const item of allImages) {
            // Use photo taken date from EXIF, or fall back to file created date
            const photoDate = (item as any).photo?.takenDateTime
              || (item as any).createdDateTime;
            if (!photoDate) continue;

            const itemDate = new Date(photoDate);
            const itemMonthDay = getMonthDay(itemDate);

            if (itemMonthDay === monthDay) {
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
                  width: (thumbnail?.large as any)?.width || (item as any).photo?.width,
                  height: (thumbnail?.large as any)?.height || (item as any).photo?.height,
                });
              }
            }
          }
        } catch {
          // Photo fetch failed — continue without photos
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
  }, [accounts, getAccessToken, selectedFolderId]);

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateState(date);
    loadMemoriesForDate(date);
  }, [loadMemoriesForDate]);

  // Auto-load on mount when accounts are available
  useEffect(() => {
    if (accounts.length > 0) {
      loadMemoriesForDate(new Date());
    }
  }, [accounts.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
