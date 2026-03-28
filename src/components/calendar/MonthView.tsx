import React, { useMemo, useEffect, useRef } from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import { dateHelpers } from '../../utils/dateHelpers';
import type { CalendarEvent } from '../../types/calendar.types';
import { EventCard } from './EventCard';

interface MonthViewProps {
  currentDate: Date;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ currentDate, onDateClick, onEventClick }) => {
  const { events, getEventsForDateRange, ensureDateRange } = useCalendar();
  const { locale } = useLocale();
  const todayRowRef = useRef<HTMLDivElement>(null);

  const calendarGrid = useMemo(() => {
    return dateHelpers.getMonthCalendarGrid(currentDate);
  }, [currentDate]);

  // Scroll to the week row containing today
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayRowRef.current) {
        todayRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentDate]);

  const gridStart = useMemo(() => dateHelpers.getDayStart(calendarGrid[0][0]), [calendarGrid]);
  const gridEnd = useMemo(() => dateHelpers.getDayEnd(calendarGrid[calendarGrid.length - 1][6]), [calendarGrid]);

  // Ensure events are loaded for the visible month grid
  useEffect(() => {
    ensureDateRange(gridStart, gridEnd);
  }, [gridStart, gridEnd, ensureDateRange]);

  const monthEvents = useMemo(() => {
    return getEventsForDateRange(gridStart, gridEnd);
  }, [gridStart, gridEnd, events]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dayStart = dateHelpers.getDayStart(date);
    const dayEnd = dateHelpers.getDayEnd(date);

    return monthEvents.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const isCurrentMonth = (date: Date) => {
    return dateHelpers.isSameMonth(date, currentDate);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b bg-card">
        {dateHelpers.getWeekDays(currentDate).map(day => (
          <div key={day.toISOString()} className="py-1.5 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0">
            {dateHelpers.formatDate(day, 'EEE', locale)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="flex flex-col h-full">
          {calendarGrid.map((week, weekIndex) => {
            // Check if this week contains today
            const containsToday = week.some(date => dateHelpers.isToday(date));

            return (
              <div
                key={weekIndex}
                ref={containsToday ? todayRowRef : undefined}
                className={`grid grid-cols-7 border-b flex-1`}
              >
                {week.map((date, dayIndex) => {
                const dayEvents = getEventsForDate(date);
                const isToday = dateHelpers.isToday(date);
                const inCurrentMonth = isCurrentMonth(date);

                return (
                  <div
                    key={dayIndex}
                    className={`border-r border-border last:border-r-0 p-1 cursor-pointer hover:bg-secondary/20 transition-colors ${
                      !inCurrentMonth ? 'bg-muted' : 'bg-card'
                    } ${isToday ? 'ring-2 ring-inset ring-primary' : ''}`}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className="flex flex-col h-full">
                      {/* Date number */}
                      <div className={`text-xs font-medium mb-0.5 ${
                        isToday
                          ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]'
                          : !inCurrentMonth
                          ? 'text-muted-foreground/50'
                          : 'text-foreground'
                      }`}>
                        {date.getDate()}
                      </div>

                      {/* Event indicators */}
                      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {dayEvents.length > 0 && (
                          <div className="space-y-0.5">
                            {dayEvents.map((event) => {
                              const eventEnd = new Date(event.end.dateTime);
                              const isPast = eventEnd < new Date();

                              return (
                                <EventCard
                                  key={event.id}
                                  event={event}
                                  mini
                                  isPast={isPast}
                                  onClick={() => onEventClick?.(event)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
