import React, { useRef, useEffect, useCallback } from 'react';
import { addDays, startOfDay } from 'date-fns';
import { dateHelpers } from '../../utils/dateHelpers';
import { useLocale } from '../../contexts/LocaleContext';

interface DateStripProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const VISIBLE_DAYS = 60; // 30 before + 30 after today
const DAY_WIDTH = 44; // px per day pill
const GAP = 4;

export const DateStrip: React.FC<DateStripProps> = ({ currentDate, onDateChange }) => {
  const { locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; scrollLeft: number } | null>(null);
  const today = startOfDay(new Date());

  // Generate days: 30 days before today to 30 days after
  const days = Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(today, i - 30));

  // Scroll to selected date
  const scrollToDate = useCallback((date: Date, smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    const dayIndex = days.findIndex(d => dateHelpers.isSameDay(d, date));
    if (dayIndex < 0) return;
    const targetScroll = dayIndex * (DAY_WIDTH + GAP) - el.clientWidth / 2 + DAY_WIDTH / 2;
    if (smooth) {
      el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    } else {
      el.scrollLeft = targetScroll;
    }
  }, [days]);

  // Scroll to current date on mount and when it changes
  useEffect(() => {
    scrollToDate(currentDate, false);
  }, []); // only on mount — instant scroll

  useEffect(() => {
    scrollToDate(currentDate, true);
  }, [currentDate, scrollToDate]);

  // Touch handlers for momentum-free swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      scrollLeft: el.scrollLeft,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    const start = touchStartRef.current;
    if (!el || !start) return;
    const dx = start.x - e.touches[0].clientX;
    el.scrollLeft = start.scrollLeft + dx;
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleDayClick = (day: Date) => {
    onDateChange(day);
  };

  const formatDayName = (date: Date) => {
    return dateHelpers.formatDate(date, 'EEEEE', locale); // single letter: M, T, W...
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto py-1 px-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {days.map((day) => {
        const isSelected = dateHelpers.isSameDay(day, currentDate);
        const isToday = dateHelpers.isToday(day);
        const dayNum = day.getDate();
        const showMonth = dayNum === 1;

        return (
          <button
            key={day.toISOString()}
            onClick={() => handleDayClick(day)}
            className={`flex flex-col items-center justify-center shrink-0 rounded-lg transition-colors ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : isToday
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
            }`}
            style={{ width: DAY_WIDTH, height: 48 }}
          >
            <span className="text-[10px] leading-none font-medium uppercase">
              {showMonth
                ? dateHelpers.formatDate(day, 'MMM', locale).slice(0, 3)
                : formatDayName(day)}
            </span>
            <span className={`text-sm leading-tight font-semibold ${isToday && !isSelected ? 'underline underline-offset-2' : ''}`}>
              {dayNum}
            </span>
          </button>
        );
      })}
    </div>
  );
};
