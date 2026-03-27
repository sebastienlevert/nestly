import React, { useRef, useState, useCallback } from 'react';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({
  children,
  onDelete,
  threshold = 80,
  className = '',
  disabled = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    // Only allow swiping left (positive diff)
    const clamped = Math.max(0, Math.min(diff, 120));
    setOffset(clamped);
  }, [swiping]);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (offset >= threshold) {
      // Animate out then delete
      setOffset(300);
      setTimeout(() => {
        onDelete();
        setOffset(0);
      }, 200);
    } else {
      setOffset(0);
    }
  }, [offset, threshold, onDelete]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Red background revealed on swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-destructive text-destructive-foreground"
        style={{ width: Math.max(offset, 0) }}
      >
        {offset >= threshold && (
          <span className="text-sm font-medium whitespace-nowrap">Delete</span>
        )}
      </div>

      {/* Content */}
      <div
        ref={ref}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-card"
        style={{
          transform: `translateX(-${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};
