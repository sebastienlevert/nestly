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

interface DayViewProps {
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

export const DayView: React.FC<DayViewProps> = ({ currentDate, onCreateEvent, onEventClick }) => {
  const { events, getEventsForDateRange, calendars, ensureDateRange } = useCalendar();
  const { locale, t } = useLocale();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  // Scroll to current hour when viewing today, otherwise 7 AM
  const scrollTargetHour = useMemo(() => {
    if (dateHelpers.isToday(currentDate)) {
      return Math.max(new Date().getHours() - 1, 0);
    }
    return 7;
  }, [currentDate]);
  const [allDayDialogOpen, setAllDayDialogOpen] = useState(false);

  const MAX_VISIBLE_ALL_DAY = 3; // Show max 3 all-day events before "+X more" button

  const dayStart = useMemo(() => {
    return dateHelpers.getDayStart(currentDate);
  }, [currentDate]);

  const dayEnd = useMemo(() => {
    return dateHelpers.getDayEnd(currentDate);
  }, [currentDate]);

  // Ensure events are loaded for the visible day
  useEffect(() => {
    ensureDateRange(dayStart, dayEnd);
  }, [dayStart, dayEnd, ensureDateRange]);

  const dayEvents = useMemo(() => {
    return getEventsForDateRange(dayStart, dayEnd);
  }, [dayStart, dayEnd, events]);

  // Separate all-day events from timed events
  const allDayEvents = useMemo(() => {
    return dayEvents.filter(event => event.isAllDay);
  }, [dayEvents]);

  const timedEvents = useMemo(() => {
    return dayEvents.filter(event => !event.isAllDay);
  }, [dayEvents]);

  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  // Scroll to target hour on mount and when date changes
  useEffect(() => {
    if (scrollTargetRef.current) {
      scrollTargetRef.current.scrollIntoView({ block: 'start' });
    }
  }, [currentDate]);

  // Calculate event positions with overlap handling (only for timed events)
  const positionedEvents = useMemo((): PositionedEvent[] => {
    const HOUR_HEIGHT = 70; // Must match minHeight in JSX

    const positioned: PositionedEvent[] = timedEvents.map(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      // Clamp to current day boundaries
      const clampedStart = eventStart < dayStart ? dayStart : eventStart;
      const clampedEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

      // Calculate position
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
        height: Math.max(duration * HOUR_HEIGHT, 40), // Minimum 40px height
        left: 0,
        width: 100,
      };
    });

    // Sort by start time, then by duration (longer events first)
    positioned.sort((a, b) => {
      if (a.top !== b.top) return a.top - b.top;
      return b.height - a.height;
    });

    // Detect overlaps and assign columns
    const columns: PositionedEvent[][] = [];

    positioned.forEach(event => {
      // Find a column where this event doesn't overlap
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

    return positioned;
  }, [timedEvents]);

  const handleSlotClick = (hour: number) => {
    if (onCreateEvent) {
      const slotDate = new Date(currentDate);
      slotDate.setHours(hour, 0, 0, 0);
      onCreateEvent(slotDate, hour);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="flex">
            <div className="w-24 flex-shrink-0 py-2 px-3 text-sm font-medium text-muted-foreground border-r border-border flex items-center justify-end">
              {t.calendar.allDay}
            </div>
            <div className="flex-1 py-1 px-3 space-y-1">
              {allDayEvents.slice(0, MAX_VISIBLE_ALL_DAY).map(event => {
                const calendar = calendars.find(cal => cal.id === event.calendarId);
                const eventColor = calendar?.color || '#0ea5e9';

                return (
                  <div
                    key={event.id}
                    className="rounded px-3 py-1 text-sm cursor-pointer transition-opacity hover:opacity-80 truncate"
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
              {allDayEvents.length > MAX_VISIBLE_ALL_DAY && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full text-sm hover:bg-muted/50"
                  onClick={() => setAllDayDialogOpen(true)}
                >
                  +{allDayEvents.length - MAX_VISIBLE_ALL_DAY} {t.calendar.more}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-background">
        <div className="flex min-h-full">
          {/* Hour labels */}
          <div className="w-24 flex-shrink-0 bg-card border-r border-border">
            {hours.map(hour => (
              <div
                key={hour}
                ref={hour === scrollTargetHour ? scrollTargetRef : null}
                className="p-2 text-sm text-muted-foreground text-right border-b border-border"
                style={{ minHeight: '70px' }}
              >
                {dateHelpers.formatDate(new Date(2000, 0, 1, hour), 'h a', locale)}
              </div>
            ))}
          </div>

          {/* Events area */}
          <div className="flex-1 relative">
            {/* Hour slots (background grid) */}
            {hours.map(hour => (
              <div
                key={hour}
                className={`border-b border-border cursor-pointer transition-colors hover:bg-secondary/20 touch-optimized bg-card`}
                style={{ minHeight: '70px' }}
                onClick={() => handleSlotClick(hour)}
              >
                {positionedEvents.length === 0 && (
                  <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Plus size={18} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Positioned events (absolute overlay) */}
            {positionedEvents.map(({ event, top, height, left, width }) => (
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
        </div>
      </div>

      {/* All-day events dialog */}
      <Dialog open={allDayDialogOpen} onOpenChange={setAllDayDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {t.calendar.allDayEvents} - {dateHelpers.formatDate(currentDate, 'EEEE, MMMM d', locale)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {allDayEvents.map(event => (
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
