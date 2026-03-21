import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import { dateHelpers } from '../../utils/dateHelpers';
import type { CalendarEvent } from '../../types/calendar.types';
import { EventCard } from './EventCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WeekViewProps {
  currentDate: Date;
  onCreateEvent?: (date: Date, hour: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
}

export const WeekView: React.FC<WeekViewProps> = ({ currentDate, onCreateEvent, onEventClick }) => {
  const { events, getEventsForDateRange, calendars, ensureDateRange } = useCalendar();
  const { locale, t } = useLocale();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sevenAmRef = useRef<HTMLDivElement>(null);
  const [allDayDialogOpen, setAllDayDialogOpen] = useState(false);
  const [selectedDayAllDayEvents, setSelectedDayAllDayEvents] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);

  const MAX_VISIBLE_ALL_DAY = 2; // Show max 2 all-day events before "+X more" button

  const currentWeekStart = useMemo(() => {
    return dateHelpers.getWeekStart(currentDate);
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return dateHelpers.getWeekDays(currentWeekStart);
  }, [currentWeekStart]);

  const weekEnd = useMemo(() => {
    return dateHelpers.getWeekEnd(currentWeekStart);
  }, [currentWeekStart]);

  // Ensure events are loaded for the visible week
  useEffect(() => {
    ensureDateRange(currentWeekStart, weekEnd);
  }, [currentWeekStart, weekEnd, ensureDateRange]);

  const weekEvents = useMemo(() => {
    return getEventsForDateRange(currentWeekStart, weekEnd);
  }, [currentWeekStart, weekEnd, events]);

  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  // Scroll to 7AM on mount and when date changes
  useEffect(() => {
    if (sevenAmRef.current) {
      sevenAmRef.current.scrollIntoView({ block: 'start' });
    }
  }, [currentDate]);

  // Calculate all-day events for each day
  const dayAllDayEvents = useMemo((): Map<string, CalendarEvent[]> => {
    const result = new Map<string, CalendarEvent[]>();

    weekDays.forEach(day => {
      const dayKey = day.toISOString();
      const dayStart = dateHelpers.getDayStart(day);
      const dayEnd = dateHelpers.getDayEnd(day);

      // Get all-day events for this day
      const allDayEvents = weekEvents.filter(event => {
        if (!event.isAllDay) return false;
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        return eventStart < dayEnd && eventEnd > dayStart;
      });

      result.set(dayKey, allDayEvents);
    });

    return result;
  }, [weekDays, weekEvents]);

  // Calculate positioned events for each day (only timed events)
  const dayPositionedEvents = useMemo((): Map<string, PositionedEvent[]> => {
    const HOUR_HEIGHT = 70; // Must match minHeight in JSX
    const result = new Map<string, PositionedEvent[]>();

    weekDays.forEach(day => {
      const dayKey = day.toISOString();
      const dayStart = dateHelpers.getDayStart(day);
      const dayEnd = dateHelpers.getDayEnd(day);

      // Get timed events for this day (exclude all-day events)
      const dayEvents = weekEvents.filter(event => {
        if (event.isAllDay) return false;
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        return eventStart < dayEnd && eventEnd > dayStart;
      });

      // Calculate positions
      const positioned: PositionedEvent[] = dayEvents.map(event => {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        // Clamp to day boundaries
        const clampedStart = eventStart < dayStart ? dayStart : eventStart;
        const clampedEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

        const startHour = clampedStart.getHours();
        const startMinutes = clampedStart.getMinutes();
        const endHour = clampedEnd.getHours();
        const endMinutes = clampedEnd.getMinutes();

        const startOffset = startHour + startMinutes / 60;
        const endOffset = endHour + endMinutes / 60;
        const duration = endOffset - startOffset;

        return {
          event,
          top: startOffset * HOUR_HEIGHT,
          height: Math.max(duration * HOUR_HEIGHT, 40),
          left: 0,
          width: 100,
        };
      });

      // Sort by start time, then by duration
      positioned.sort((a, b) => {
        if (a.top !== b.top) return a.top - b.top;
        return b.height - a.height;
      });

      // Detect overlaps and assign columns
      const columns: PositionedEvent[][] = [];

      positioned.forEach(event => {
        let placed = false;
        for (const column of columns) {
          const hasOverlap = column.some(e => {
            return event.top < e.top + e.height && event.top + event.height > e.top;
          });

          if (!hasOverlap) {
            column.push(event);
            placed = true;
            break;
          }
        }

        if (!placed) {
          columns.push([event]);
        }
      });

      // Calculate widths and left positions
      const totalColumns = columns.length;
      columns.forEach((column, columnIndex) => {
        column.forEach(event => {
          event.width = 100 / totalColumns;
          event.left = (100 / totalColumns) * columnIndex;
        });
      });

      result.set(dayKey, positioned);
    });

    return result;
  }, [weekDays, weekEvents]);

  const handleSlotClick = (day: Date, hour: number) => {
    if (onCreateEvent) {
      const slotDate = new Date(day);
      slotDate.setHours(hour, 0, 0, 0);
      onCreateEvent(slotDate, hour);
    }
  };

  const handleShowAllDayEvents = (day: Date, events: CalendarEvent[]) => {
    setSelectedDayAllDayEvents({ date: day, events });
    setAllDayDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b border-border bg-card sticky top-0 z-10">
        <div className="w-20 flex-shrink-0 p-2 text-right pr-2 text-sm font-medium text-muted-foreground border-r border-border flex items-center justify-end">{t.calendar.time}</div>
        {weekDays.map((day, index) => {
          const isToday = dateHelpers.isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`p-3 text-center ${
                isToday ? 'flex-[2] bg-secondary' : 'flex-1'
              } ${index > 0 ? 'border-l border-border' : ''}`}
            >
              <div className="text-base font-medium text-muted-foreground">
                {dateHelpers.formatDate(day, 'EEE', locale)}
              </div>
              <div
                className={`text-2xl font-semibold mt-1 ${
                  isToday ? 'text-foreground' : 'text-foreground'
                }`}
              >
                {dateHelpers.formatDate(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events section */}
      {Array.from(dayAllDayEvents.values()).some(events => events.length > 0) && (
        <div className="border-b border-border bg-card">
          <div className="flex">
            <div className="w-20 flex-shrink-0 py-2 px-2 text-sm font-medium text-muted-foreground border-r border-border flex items-center justify-end">
              {t.calendar.allDay}
            </div>
            {weekDays.map((day, dayIndex) => {
              const isToday = dateHelpers.isToday(day);
              const allDayEvents = dayAllDayEvents.get(day.toISOString()) || [];
              const visibleEvents = allDayEvents.slice(0, MAX_VISIBLE_ALL_DAY);
              const remainingCount = allDayEvents.length - MAX_VISIBLE_ALL_DAY;

              return (
                <div
                  key={day.toISOString()}
                  className={`${dayIndex > 0 ? 'border-l border-border' : ''} ${
                    isToday ? 'flex-[2] bg-secondary/80' : 'flex-1'
                  } py-0.5 px-2 space-y-0.5`}
                >
                  {visibleEvents.map(event => {
                    const calendar = calendars.find(cal => cal.id === event.calendarId);
                    const eventColor = calendar?.color || '#0ea5e9';

                    return (
                      <div
                        key={event.id}
                        className="rounded px-2 py-1 text-sm cursor-pointer transition-opacity hover:opacity-80 truncate"
                        style={{
                          backgroundColor: `${eventColor}40`,
                          color: eventColor,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        {event.subject}
                      </div>
                    );
                  })}
                  {remainingCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-full text-sm hover:bg-muted/50 py-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowAllDayEvents(day, allDayEvents);
                      }}
                    >
                      +{remainingCount} {t.calendar.more}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-background"
      >
        <div className="flex min-h-full">
          {/* Hour labels */}
          <div className="w-20 flex-shrink-0 bg-card border-r border-border">
            {hours.map(hour => (
              <div
                key={hour}
                ref={hour === 7 ? sevenAmRef : null}
                className="p-2 text-sm text-muted-foreground text-right pr-2 border-b border-border"
                style={{ minHeight: '70px' }}
              >
                {dateHelpers.formatDate(new Date(2000, 0, 1, hour), 'h a', locale)}              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const isToday = dateHelpers.isToday(day);
            const positioned = dayPositionedEvents.get(day.toISOString()) || [];

            return (
              <div
                key={day.toISOString()}
                className={`${dayIndex > 0 ? 'border-l border-border' : ''} ${
                  isToday ? 'flex-[2]' : 'flex-1'
                } relative`}
              >
                {/* Hour slots (background grid) */}
                {hours.map(hour => (
                  <div
                    key={hour}
                    className={`border-b border-border cursor-pointer transition-colors hover:bg-secondary/20 touch-optimized ${
                      isToday ? 'bg-secondary/80' : 'bg-card'
                    }`}
                    style={{ minHeight: '70px' }}
                    onClick={() => handleSlotClick(day, hour)}
                  >
                    {positioned.length === 0 && (
                      <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus size={16} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Positioned events (absolute overlay) */}
                {positioned.map(({ event, top, height, left, width }) => (
                  <div
                    key={event.id}
                    className="absolute p-1"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `${left}%`,
                      width: `${width}%`,
                    }}
                  >
                    <div className="h-full">
                      <EventCard
                        event={event}
                        compact
                        onClick={() => onEventClick?.(event)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* All-day events dialog */}
      <Dialog open={allDayDialogOpen} onOpenChange={setAllDayDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {t.calendar.allDayEvents} - {selectedDayAllDayEvents ? dateHelpers.formatDate(selectedDayAllDayEvents.date, 'EEEE, MMMM d', locale) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedDayAllDayEvents?.events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => {
                  setAllDayDialogOpen(false);
                  onEventClick?.(event);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
