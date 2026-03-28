import React from 'react';
import { Clock, MapPin, Users, Repeat } from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar.types';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import { dateHelpers } from '../../utils/dateHelpers';
import { StorageService } from '../../services/storage.service';

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  /** Ultra-compact single-line pill for month view */
  mini?: boolean;
  onClick?: () => void;
  isPast?: boolean;
}

function getMealEmoji(event: CalendarEvent): string | null {
  const start = new Date(event.start.dateTime);
  const hour = start.getHours();
  const time = hour + start.getMinutes() / 60;

  if (time >= 6 && time < 10) return '🥐';
  if (time >= 11 && time < 13.5) return '🥗';
  if (time >= 17 && time < 21) return '🍽️';
  return null;
}

export const EventCard: React.FC<EventCardProps> = ({ event, compact = false, mini = false, onClick, isPast = false }) => {
  const { calendars } = useCalendar();
  const { t } = useLocale();

  const calendar = calendars.find(cal => cal.id === event.calendarId);
  const eventColor = calendar?.color || '#0ea5e9';
  const calendarEmoji = calendar?.emoji;

  const mealCalendarId = StorageService.getSettings().mealCalendarId;
  const isMeal = mealCalendarId && event.calendarId === mealCalendarId;
  const mealEmoji = isMeal ? getMealEmoji(event) : null;
  const displayEmoji = isMeal ? (mealEmoji || calendarEmoji) : calendarEmoji;

  const startTime = dateHelpers.formatTime(event.start.dateTime);
  const endTime = dateHelpers.formatTime(event.end.dateTime);

  if (mini) {
    return (
      <div
        className={`rounded px-1.5 py-0.5 text-xs cursor-pointer truncate transition-opacity hover:opacity-80 ${isPast ? 'opacity-50 bg-muted' : ''}`}
        style={{
          backgroundColor: isPast ? undefined : `${eventColor}40`,
          color: isPast ? undefined : eventColor,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {displayEmoji && <span className="mr-0.5">{displayEmoji}</span>}
        <span className="font-medium">{event.subject}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`rounded-lg p-4 text-base cursor-pointer transition-opacity hover:opacity-80 relative ${isPast ? 'opacity-50 bg-muted' : ''}`}
        style={{
          backgroundColor: isPast ? undefined : `${eventColor}40`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <div className={`font-semibold line-clamp-2 ${isPast ? 'text-muted-foreground' : ''}`} style={isPast ? {} : { color: eventColor }}>
          {displayEmoji && <span className="mr-1">{displayEmoji}</span>}{event.subject}
        </div>
        {!event.isAllDay && !isMeal && (
          <div className={`text-sm mt-0.5 ${isPast ? 'text-muted-foreground/70' : 'opacity-70'}`} style={isPast ? {} : { color: eventColor }}>
            {startTime} – {endTime}
          </div>
        )}
        {event.recurrence && (
          <Repeat size={14} className="absolute bottom-2 right-2 opacity-70" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg p-4 text-base font-medium cursor-pointer transition-opacity hover:opacity-80 relative ${isPast ? 'opacity-60 bg-muted' : ''}`}
      style={{
        backgroundColor: isPast ? undefined : `${eventColor}35`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold text-base ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
          {displayEmoji && <span className="mr-1">{displayEmoji}</span>}{event.subject}
        </h3>
        {calendar && (
          <span
            className="text-sm px-3 py-1 rounded flex-shrink-0"
            style={{
              backgroundColor: isPast ? 'hsl(var(--muted))' : eventColor,
              color: 'white',
            }}
          >
            {calendar.name}
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        {!event.isAllDay && !isMeal && (
          <div className="flex items-center gap-2">
            <Clock size={18} />
            <span>
              {startTime} - {endTime}
            </span>
          </div>
        )}

        {event.isAllDay && (
          <div className="flex items-center gap-2">
            <Clock size={18} />
            <span>{t.calendar.allDay}</span>
          </div>
        )}

        {event.location && event.location.displayName && (
          <div className="flex items-center gap-2">
            <MapPin size={18} />
            <span className="truncate">{event.location.displayName}</span>
          </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center gap-2">
            <Users size={18} />
            <span>{event.attendees.length} {t.calendar.attendees}</span>
          </div>
        )}
      </div>

      {event.bodyPreview && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.bodyPreview}</p>
      )}

      {event.recurrence && (
        <Repeat size={16} className="absolute bottom-3 right-3 opacity-70" />
      )}
    </div>
  );
};
