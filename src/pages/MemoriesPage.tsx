import React, { useMemo, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useMemory } from '../contexts/MemoryContext';
import { usePhoto } from '../contexts/PhotoContext';
import { LoginButton } from '../components/auth/LoginButton';
import { MemoryCarousel } from '../components/memories/MemoryCarousel';
import { MemoryTimeline } from '../components/memories/MemoryTimeline';

export const MemoriesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const { todayMemories, isLoading, selectedDate, setSelectedDate, loadMemoriesForDate } = useMemory();
  const { selectedFolderId } = usePhoto();

  // Load memories on-demand when page is visited
  useEffect(() => {
    if (isAuthenticated && selectedFolderId && !todayMemories && !isLoading) {
      loadMemoriesForDate(selectedDate);
    }
  }, [isAuthenticated, selectedFolderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPhotos = (todayMemories?.photos.length ?? 0) > 0;

  const stats = useMemo(() => {
    if (!todayMemories) return null;
    const photoCount = todayMemories.photos.length;
    const yearCount = todayMemories.yearsWithMemories.length;
    if (photoCount === 0) return null;
    return { photoCount, yearCount };
  }, [todayMemories]);

  const formattedDate = format(selectedDate, 'MMMM d');

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Camera size={64} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t.memories.title}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t.memories.signInMessage}
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        {/* Date navigation */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="rounded-full p-2 hover:bg-card transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Previous day"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </button>
          <span className="text-lg font-semibold text-foreground min-w-[160px] text-center">
            {formattedDate}
          </span>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="rounded-full p-2 hover:bg-card transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Next day"
          >
            <ChevronRight size={24} className="text-foreground" />
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <Camera size={22} className="text-primary" />
          <h1 className="text-xl font-bold text-foreground">{t.memories.onThisDay}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{t.memories.subtitle}</p>

        {/* Stats */}
        {stats && (
          <p className="text-xs text-muted-foreground mb-3">
            {stats.photoCount} photo{stats.photoCount !== 1 ? 's' : ''} across{' '}
            {t.memories.yearsOfMemories.replace('{count}', String(stats.yearCount))}
          </p>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.memories.loadingMemories}</p>
          </div>
        </div>
      )}

      {/* No photo folder selected */}
      {!isLoading && !selectedFolderId && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <FolderOpen size={48} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t.memories.selectPhotoFolder}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && selectedFolderId && (
        <div className="flex-1 px-4 pb-6 space-y-6">
          {/* Empty state */}
          {!hasPhotos && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center max-w-sm">
                <Camera size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t.memories.noMemories}</p>
              </div>
            </div>
          )}

          {/* Carousel */}
          {hasPhotos && <MemoryCarousel photos={todayMemories!.photos} />}

          {/* Timeline */}
          {hasPhotos && <MemoryTimeline memories={todayMemories!} />}
        </div>
      )}
    </div>
  );
};
