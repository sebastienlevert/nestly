import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import { dateHelpers } from '../../utils/dateHelpers';
import type { CalendarEvent } from '../../types/calendar.types';
import { EventCard } from './EventCard';
import { addDays } from 'date-fns';
import { useWeather } from '../../hooks/useWeather';
import { AgendaSkeleton } from '../ui/skeleton';

interface AgendaViewProps {
  currentDate: Date;
  onCreateEvent?: (date: Date, hour: number) => void;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ currentDate, onCreateEvent, onDateChange, onEventClick }) => {
  const { events, getEventsForDateRange, ensureDateRange, isLoading } = useCalendar();
  const { locale, t } = useLocale();
  const { getWeatherForDate } = useWeather();
  const gridRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const mobileListRef = useRef<HTMLDivElement>(null);

  // Always snap to the week start (Monday)
  const weekStart = useMemo(() => dateHelpers.getWeekStart(currentDate), [currentDate]);

  // 7 days of the current week (Mon–Sun)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Next week days for the preview tile
  const nextWeekStart = useMemo(() => dateHelpers.nextWeek(weekStart), [weekStart]);
  const nextWeekEnd = useMemo(() => addDays(nextWeekStart, 6), [nextWeekStart]);
  const nextWeekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(nextWeekStart, i));
  }, [nextWeekStart]);

  // Format next week header parts: day range (bold) + month(s) (lighter)
  const nextWeekHeader = useMemo(() => {
    const startDay = dateHelpers.formatDate(nextWeekStart, 'd');
    const endDay = dateHelpers.formatDate(nextWeekEnd, 'd');
    const startMonth = dateHelpers.formatDate(nextWeekStart, 'MMM', locale);
    const endMonth = dateHelpers.formatDate(nextWeekEnd, 'MMM', locale);
    const sameMonth = nextWeekStart.getMonth() === nextWeekEnd.getMonth();

    const capitalize = (s: string) => locale === 'en' ? s.charAt(0).toUpperCase() + s.slice(1) : s;

    if (sameMonth) {
      return { days: `${startDay}–${endDay}`, month: capitalize(startMonth) };
    }
    return { days: `${startDay}–${endDay}`, month: `${capitalize(startMonth)} – ${capitalize(endMonth)}` };
  }, [nextWeekStart, nextWeekEnd, locale]);

  // Fetch events for current week + next week (for preview)
  const rangeStart = useMemo(() => dateHelpers.getDayStart(weekDays[0]), [weekDays]);
  const rangeEnd = useMemo(() => dateHelpers.getDayEnd(nextWeekDays[nextWeekDays.length - 1]), [nextWeekDays]);

  // Ensure events are loaded for the visible range
  React.useEffect(() => {
    ensureDateRange(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd, ensureDateRange]);

  const rangeEvents = useMemo(() => {
    return getEventsForDateRange(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd, events]);

  const getEventsForDay = (day: Date): CalendarEvent[] => {
    const dayStart = dateHelpers.getDayStart(day);
    const dayEnd = dateHelpers.getDayEnd(day);

    return rangeEvents
      .filter(event => {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        return eventStart < dayEnd && eventEnd > dayStart;
      })
      .sort((a, b) => {
        const aStart = new Date(a.start.dateTime);
        const bStart = new Date(b.start.dateTime);
        return aStart.getTime() - bStart.getTime();
      });
  };

  // Collect all events from next week grouped by day for the preview tile
  const nextWeekByDay = useMemo(() => {
    return nextWeekDays.map(day => ({
      day,
      events: getEventsForDay(day),
    })).filter(d => d.events.length > 0);
  }, [nextWeekDays, rangeEvents]);

  const handleDayClick = (day: Date) => {
    if (onCreateEvent) {
      const hour = new Date().getHours();
      onCreateEvent(day, hour);
    }
  };

  const handleGoToNextWeek = () => {
    if (onDateChange) {
      onDateChange(nextWeekStart);
    }
  };

  // Auto-scroll each day cell to show the next upcoming event (desktop grid)
  const scrollToNextEvents = useCallback(() => {
    if (!gridRef.current) return;
    const containers = gridRef.current.querySelectorAll<HTMLElement>('[data-day-events]');
    containers.forEach(container => {
      const nextEvent = container.querySelector<HTMLElement>('[data-next-event]');
      if (nextEvent) {
        const containerRect = container.getBoundingClientRect();
        const eventRect = nextEvent.getBoundingClientRect();
        const paddingTop = parseFloat(getComputedStyle(container).paddingTop) || 0;
        container.scrollTop = Math.max(0, eventRect.top - containerRect.top + container.scrollTop - paddingTop);
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToNextEvents, 100);
    const interval = setInterval(scrollToNextEvents, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [rangeEvents, currentDate, scrollToNextEvents]);

  // Auto-scroll to today on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (mobileListRef.current) {
        mobileListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentDate]);

  // Top row: Mon–Thu, Bottom row: Fri–Sun + next week preview (desktop layout)
  const topRow = weekDays.slice(0, 4);
  const bottomRow = weekDays.slice(4, 7);

  const renderDayCell = (day: Date, isMobile = false) => {
    const isToday = dateHelpers.isToday(day);
    const dayEvents = getEventsForDay(day);
    const now = new Date();

    // Find the first event that hasn't ended yet (auto-scroll target)
    const firstUpcomingIdx = dayEvents.findIndex(event =>
      new Date(event.end.dateTime) >= now
    );

    const weather = getWeatherForDate(day);

    return (
      <div
        key={day.toISOString()}
        ref={isToday ? todayRef : undefined}
        className={`flex flex-col border border-border rounded-xl overflow-hidden ${
          isToday ? 'ring-2 ring-primary' : ''
        } bg-card`}
      >
        {/* Day header */}
        <div
          className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30"
        >
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {dateHelpers.formatDate(day, 'd')}
            </span>
            <span className={`text-lg font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {locale === 'en'
                ? dateHelpers.formatDate(day, 'EEE', locale).charAt(0).toUpperCase() + dateHelpers.formatDate(day, 'EEE', locale).slice(1)
                : dateHelpers.formatDate(day, 'EEE', locale)}
            </span>
            {isMobile && (
              <span className={`text-base ${isToday ? 'text-primary/70' : 'text-muted-foreground/70'}`}>
                {dateHelpers.formatDate(day, 'MMM', locale)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {weather && (
              <span
                className="flex items-center gap-1.5 text-sm text-muted-foreground select-none"
                title={`${t.weather?.conditions?.[weather.key as keyof typeof t.weather.conditions] ?? weather.key} — ${weather.high}°/${weather.low}°`}
              >
                <span className="text-xl leading-none">{weather.icon}</span>
                <span className="text-sm font-medium">{weather.high}°</span>
              </span>
            )}
            <button
              onClick={() => handleDayClick(day)}
              className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Events */}
        <div
          data-day-events
          className={`p-4 space-y-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isMobile ? '' : 'flex-1'
          }`}
        >
          {dayEvents.length === 0 && isMobile && (
            <p className="text-sm text-muted-foreground text-center py-2">{t.common.noResults}</p>
          )}
          {dayEvents.map((event, index) => {
            const eventEnd = new Date(event.end.dateTime);
            const isPast = eventEnd < now;

            return (
              <div
                key={event.id}
                {...(index === firstUpcomingIdx ? { 'data-next-event': 'true' } : {})}
              >
                <EventCard
                  event={event}
                  compact
                  isPast={isPast}
                  onClick={() => onEventClick?.(event)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNextWeekTile = () => (
    <div
      className="flex flex-col border border-border rounded-xl overflow-hidden bg-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
      onClick={handleGoToNextWeek}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {nextWeekHeader.days}
          </span>
          <span className="text-lg font-medium text-muted-foreground">
            {nextWeekHeader.month}
          </span>
        </div>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground">
          <ChevronRight size={24} />
        </div>
      </div>

      {/* Preview events grouped by day */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {nextWeekByDay.length > 0 ? (
          nextWeekByDay.map(({ day, events: dayEvents }) => (
            <div key={day.toISOString()}>
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-base font-bold text-foreground">
                  {dateHelpers.formatDate(day, 'd')}
                </span>
                <span className="text-base font-medium text-muted-foreground">
                  {locale === 'en'
                    ? dateHelpers.formatDate(day, 'EEE', locale).charAt(0).toUpperCase() + dateHelpers.formatDate(day, 'EEE', locale).slice(1)
                    : dateHelpers.formatDate(day, 'EEE', locale)}
                </span>
              </div>
              <div className="space-y-2">
                {dayEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-base">
            {t.common.noResults}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading && events.length === 0) {
    return <AgendaSkeleton />;
  }

  return (
    <div ref={gridRef} className="flex flex-col h-full bg-background">
      {/* Mobile: single column scrollable list */}
      <div ref={mobileListRef} className="lg:hidden flex-1 overflow-y-auto p-3 space-y-3">
        {weekDays.map(day => renderDayCell(day, true))}
        {renderNextWeekTile()}
      </div>

      {/* Desktop: 4-column grid */}
      <div className="hidden lg:flex flex-col h-full p-4 gap-4">
        {/* Top row: Mon–Thu */}
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          {topRow.map(day => renderDayCell(day))}
        </div>

        {/* Bottom row: Fri–Sun + Next week preview */}
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          {bottomRow.map(day => renderDayCell(day))}
          {renderNextWeekTile()}
        </div>
      </div>
    </div>
  );
};
