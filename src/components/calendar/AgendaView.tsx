import React, { useMemo, useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import { dateHelpers } from '../../utils/dateHelpers';
import type { CalendarEvent } from '../../types/calendar.types';
import { EventCard } from './EventCard';
import { addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AgendaViewProps {
  currentDate: Date;
  onCreateEvent?: (date: Date, hour: number) => void;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ currentDate, onCreateEvent, onDateChange, onEventClick }) => {
  const { events, getEventsForDateRange, ensureDateRange } = useCalendar();
  const { locale, t } = useLocale();
  const [expandedDay, setExpandedDay] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);

  const MAX_VISIBLE_EVENTS = 3;

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

  // Top row: Mon–Thu, Bottom row: Fri–Sun + next week preview
  const topRow = weekDays.slice(0, 4);
  const bottomRow = weekDays.slice(4, 7);

  const renderDayCell = (day: Date) => {
    const isToday = dateHelpers.isToday(day);
    const dayEvents = getEventsForDay(day);
    const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
    const remainingCount = dayEvents.length - MAX_VISIBLE_EVENTS;

    return (
      <div
        key={day.toISOString()}
        className={`flex flex-col border border-border rounded-xl overflow-hidden ${
          isToday ? 'ring-2 ring-primary bg-secondary/50' : 'bg-card'
        }`}
      >
        {/* Day header */}
        <div
          className={`px-4 py-3 border-b border-border flex items-center justify-between ${
            isToday ? 'bg-primary/10' : 'bg-muted/30'
          }`}
        >
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {dateHelpers.formatDate(day, 'd')}
            </span>
            <span className={`text-base font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {locale === 'en'
                ? dateHelpers.formatDate(day, 'EEE', locale).charAt(0).toUpperCase() + dateHelpers.formatDate(day, 'EEE', locale).slice(1)
                : dateHelpers.formatDate(day, 'EEE', locale)}
            </span>
          </div>
          <button
            onClick={() => handleDayClick(day)}
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Events */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleEvents.map(event => {
            const eventEnd = new Date(event.end.dateTime);
            const isPast = eventEnd < new Date();

            return (
              <EventCard
                key={event.id}
                event={event}
                compact
                isPast={isPast}
                onClick={() => onEventClick?.(event)}
              />
            );
          })}
          {remainingCount > 0 && (
            <button
              onClick={() => setExpandedDay({ date: day, events: dayEvents })}
              className="w-full rounded-lg p-4 text-base font-medium text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground transition-colors cursor-pointer text-center"
            >
              +{remainingCount} {t.calendar.more}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background p-4 gap-4">
      {/* Top row: Mon–Thu (4 cells) */}
      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        {topRow.map(day => renderDayCell(day))}
      </div>

      {/* Bottom row: Fri–Sun (3 cells) + Next week preview (1 cell) */}
      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        {bottomRow.map(day => renderDayCell(day))}

        {/* Next week preview tile */}
        <div
          className="flex flex-col border border-border rounded-xl overflow-hidden bg-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={handleGoToNextWeek}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">
                {nextWeekHeader.days}
              </span>
              <span className="text-base font-medium text-muted-foreground">
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
                    <span className="text-sm font-bold text-foreground">
                      {dateHelpers.formatDate(day, 'd')}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
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
      </div>

      {/* Expanded day dialog */}
      <Dialog open={!!expandedDay} onOpenChange={(open) => !open && setExpandedDay(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          {expandedDay && (
            <>
              <DialogHeader className="px-5 pt-5 pb-0">
                <DialogTitle className="text-2xl font-bold">
                  {locale === 'fr-CA'
                    ? dateHelpers.formatDate(expandedDay.date, 'd MMMM', locale)
                    : dateHelpers.formatDate(expandedDay.date, 'MMMM d', locale)}
                </DialogTitle>
              </DialogHeader>
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                {expandedDay.events.map(event => {
                  const eventEnd = new Date(event.end.dateTime);
                  const isPast = eventEnd < new Date();

                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact
                      isPast={isPast}
                      onClick={() => {
                        setExpandedDay(null);
                        onEventClick?.(event);
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
