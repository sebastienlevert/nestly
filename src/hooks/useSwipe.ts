import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const SWIPE_THRESHOLD = 50;
const SWIPE_MAX_VERTICAL = 100;

export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current);

    // Ignore if mostly vertical (scrolling)
    if (dy > SWIPE_MAX_VERTICAL) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    if (dx < 0) onSwipeLeft();
    else onSwipeRight();
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchEnd };
}
