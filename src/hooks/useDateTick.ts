import { useEffect, useRef, useCallback } from 'react';

/**
 * Fires a callback whenever the calendar date changes (e.g. midnight crossover).
 * Uses setTimeout-to-midnight for precision and a visibilitychange listener
 * to catch tablet sleep/wake scenarios where the timeout wouldn't fire.
 */
export const useDateTick = (onDateChange: () => void) => {
  const lastDateRef = useRef<string>(new Date().toDateString());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkAndNotify = useCallback(() => {
    const now = new Date();
    const currentDateStr = now.toDateString();

    if (currentDateStr !== lastDateRef.current) {
      lastDateRef.current = currentDateStr;
      onDateChange();
    }
  }, [onDateChange]);

  const scheduleMidnightCheck = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // Add 1 second buffer past midnight to avoid edge-case race
    const msUntilMidnight = tomorrow.getTime() - now.getTime() + 1000;

    timerRef.current = setTimeout(() => {
      checkAndNotify();
      scheduleMidnightCheck();
    }, msUntilMidnight);
  }, [checkAndNotify]);

  useEffect(() => {
    scheduleMidnightCheck();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndNotify();
        scheduleMidnightCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [scheduleMidnightCheck, checkAndNotify]);
};
