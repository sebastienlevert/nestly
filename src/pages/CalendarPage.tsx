import React, { useState, useCallback } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useHeaderControls } from '../contexts/HeaderControlsContext';
import { LoginButton } from '../components/auth/LoginButton';
import { AgendaView } from '../components/calendar/AgendaView';
import { MonthView } from '../components/calendar/MonthView';
import { CreateEventModal } from '../components/calendar/CreateEventModal';
import { EventDetailsModal } from '../components/calendar/EventDetailsModal';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { ViewSwitcher } from '../components/calendar/ViewSwitcher';
import { dateHelpers } from '../utils/dateHelpers';
import { useDateTick } from '../hooks/useDateTick';
import type { CalendarView, CalendarEvent } from '../types/calendar.types';

export const CalendarPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLocale();
  const [currentView, setCurrentView] = useState<CalendarView>('agenda');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Auto-advance to the current day/week when midnight crosses
  useDateTick(useCallback(() => setCurrentDate(new Date()), []));

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createEventDate, setCreateEventDate] = useState<Date>();
  const [createEventHour, setCreateEventHour] = useState<number>(9);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Inject view switcher into global header
  useHeaderControls(
    <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
  );

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <CalendarIcon size={64} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t.auth.welcome}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t.auth.signInMessage}
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  const handleCreateEvent = (date: Date, hour: number) => {
    setCreateEventDate(date);
    setCreateEventHour(hour);
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Calculate month/year display based on current view and date
  const getMonthYearDisplay = (): string => {
    if (currentView === 'agenda') {
      const weekStart = dateHelpers.getWeekStart(currentDate);
      const weekEnd = dateHelpers.getWeekEnd(currentDate);

      const firstMonth = weekStart.getMonth();
      const firstYear = weekStart.getFullYear();
      const lastMonth = weekEnd.getMonth();
      const lastYear = weekEnd.getFullYear();

      if (firstMonth === lastMonth && firstYear === lastYear) {
        return capitalize(dateHelpers.formatDate(weekStart, 'MMMM yyyy', locale));
      }

      if (firstYear === lastYear) {
        return `${capitalize(dateHelpers.formatDate(weekStart, 'MMMM', locale))} / ${capitalize(dateHelpers.formatDate(weekEnd, 'MMMM yyyy', locale))}`;
      }

      return `${capitalize(dateHelpers.formatDate(weekStart, 'MMMM yyyy', locale))} / ${capitalize(dateHelpers.formatDate(weekEnd, 'MMMM yyyy', locale))}`;
    } else if (currentView === 'month') {
      return capitalize(dateHelpers.formatDate(currentDate, 'MMMM yyyy', locale));
    }
    return '';
  };

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        currentView={currentView}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        monthYearDisplay={getMonthYearDisplay()}
      />

      <div className="flex-1 overflow-hidden relative">
        {currentView === 'agenda' && (
          <AgendaView
            currentDate={currentDate}
            onCreateEvent={handleCreateEvent}
            onDateChange={setCurrentDate}
            onEventClick={handleEventClick}
          />
        )}
        {currentView === 'month' && (
          <MonthView
            currentDate={currentDate}
            onDateClick={(date) => {
              setCreateEventDate(date);
              setCreateEventHour(9);
              setIsCreateModalOpen(true);
            }}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialDate={createEventDate}
        initialHour={createEventHour}
      />

      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};
