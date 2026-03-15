import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import type { MemoryPhoto } from '../../types/memory.types';

interface MemoryCarouselProps {
  photos: MemoryPhoto[];
}

export const MemoryCarousel: React.FC<MemoryCarouselProps> = ({ photos }) => {
  const { t } = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((index + photos.length) % photos.length);
        setIsFading(false);
      }, 300);
    },
    [photos.length],
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (isPaused || photos.length <= 1) return;

    timerRef.current = setInterval(goNext, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goNext, photos.length]);

  const formatYearsAgo = (yearAgo: number): string => {
    if (yearAgo === 1) return t.memories.yearsAgo.replace('{count}', '1');
    return t.memories.yearsAgoPlural.replace('{count}', String(yearAgo));
  };

  if (photos.length === 0) {
    return (
      <div className="relative w-full bg-card rounded-xl flex items-center justify-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <Camera size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t.memories.noPhotos}</p>
        </div>
      </div>
    );
  }

  const photo = photos[currentIndex];

  return (
    <div
      className="relative w-full bg-black rounded-xl overflow-hidden select-none"
      style={{ height: '50vh' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Photo */}
      <img
        src={photo.downloadUrl || photo.thumbnailUrl}
        alt={photo.name}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Year badge */}
      <div className="absolute top-4 left-4 bg-black/60 text-white text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
        {formatYearsAgo(photo.yearAgo)}
      </div>

      {/* Photo name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10">
        <p className="text-white text-sm truncate">{photo.name}</p>
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Next photo"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to photo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
