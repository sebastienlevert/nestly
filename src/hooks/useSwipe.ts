import { useRef, useCallback, type RefObject } from 'react';

interface SwipeHandlers {
  ref: RefObject<HTMLDivElement | null>;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const SWIPE_THRESHOLD = 50;
const SWIPE_MAX_VERTICAL = 100;
const DAMPING = 0.4;
const SLIDE_OUT_PX = 120;
const SLIDE_OUT_MS = 200;

export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
): SwipeHandlers {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragging.current = false;
    const el = ref.current;
    if (el) {
      el.style.transition = 'none';
      el.style.transform = '';
      el.style.opacity = '';
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const rawDx = e.touches[0].clientX - startX.current;
    const dy = Math.abs(e.touches[0].clientY - startY.current);

    if (Math.abs(rawDx) > 10 && Math.abs(rawDx) > dy) {
      dragging.current = true;
      e.preventDefault();
      const el = ref.current;
      if (el) {
        const dampened = rawDx * DAMPING;
        el.style.transform = `translateX(${dampened}px)`;
        // Subtle opacity fade as you drag further
        el.style.opacity = String(Math.max(0.5, 1 - Math.abs(dampened) / 300));
      }
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const el = ref.current;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current);

    // Bounce back if no valid swipe
    if (!dragging.current || dy > SWIPE_MAX_VERTICAL || Math.abs(dx) < SWIPE_THRESHOLD) {
      if (el) {
        el.style.transition = `transform ${SLIDE_OUT_MS}ms ease-out, opacity ${SLIDE_OUT_MS}ms ease-out`;
        el.style.transform = 'translateX(0)';
        el.style.opacity = '1';
      }
      return;
    }

    // Slide out in swipe direction, then update date & reset
    const direction = dx < 0 ? -1 : 1;
    if (el) {
      el.style.transition = `transform ${SLIDE_OUT_MS}ms ease-in, opacity ${SLIDE_OUT_MS}ms ease-in`;
      el.style.transform = `translateX(${direction * SLIDE_OUT_PX}px)`;
      el.style.opacity = '0.2';
    }

    setTimeout(() => {
      if (el) {
        el.style.transition = 'none';
        el.style.transform = 'translateX(0)';
        el.style.opacity = '1';
      }
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    }, SLIDE_OUT_MS);
  }, [onSwipeLeft, onSwipeRight]);

  return { ref, onTouchStart, onTouchMove, onTouchEnd };
}
