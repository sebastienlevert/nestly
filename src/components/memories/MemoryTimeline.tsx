import React, { useMemo } from 'react';
import { Image } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import type { MemoryDay, MemoryPhoto } from '../../types/memory.types';

interface MemoryTimelineProps {
  memories: MemoryDay;
}

interface YearGroup {
  yearAgo: number;
  photos: MemoryPhoto[];
}

export const MemoryTimeline: React.FC<MemoryTimelineProps> = ({ memories }) => {
  const { t } = useLocale();

  const yearGroups = useMemo<YearGroup[]>(() => {
    const groupMap = new Map<number, YearGroup>();

    for (const photo of memories.photos) {
      if (!groupMap.has(photo.yearAgo)) {
        groupMap.set(photo.yearAgo, { yearAgo: photo.yearAgo, photos: [] });
      }
      groupMap.get(photo.yearAgo)!.photos.push(photo);
    }

    return Array.from(groupMap.values()).sort((a, b) => a.yearAgo - b.yearAgo);
  }, [memories.photos]);

  const formatYearsAgo = (yearAgo: number): string => {
    if (yearAgo === 1) return t.memories.yearsAgo.replace('{count}', '1');
    return t.memories.yearsAgoPlural.replace('{count}', String(yearAgo));
  };

  if (yearGroups.length === 0) return null;

  return (
    <div className="space-y-6">
      {yearGroups.map((group) => (
        <div key={group.yearAgo} className="relative">
          {/* Year header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-full">
              {formatYearsAgo(group.yearAgo)}
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Photo thumbnails */}
          {group.photos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Image size={14} />
                {t.memories.fromYourPhotos}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {group.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.downloadUrl || photo.thumbnailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-background hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
