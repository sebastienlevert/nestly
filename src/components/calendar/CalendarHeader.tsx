import React, { useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import { StorageService } from '../../services/storage.service';
import { ViewSwitcher } from './ViewSwitcher';
import type { CalendarView } from '../../types/calendar.types';
import { dateHelpers } from '../../utils/dateHelpers';
import { Button } from '@/components/ui/button';

interface CalendarHeaderProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  monthYearDisplay: string;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentView,
  onViewChange,
  currentDate,
  onDateChange,
  monthYearDisplay
}) => {
  const { accounts } = useAuth();
  const { isSyncing, isLoading, lastSyncTime } = useCalendar();
  const { t } = useLocale();
  const [calendarName, setCalendarName] = useState('');
  const [showSyncTooltip, setShowSyncTooltip] = useState<string | null>(null);

  useEffect(() => {
    // Load calendar name from settings
    const loadCalendarName = () => {
      const settings = StorageService.getSettings();
      setCalendarName(settings.calendarName || t.calendar.title);
    };

    loadCalendarName();

    // Listen for settings updates and locale changes
    window.addEventListener('settings-updated', loadCalendarName);
    window.addEventListener('locale-changed', loadCalendarName);
    return () => {
      window.removeEventListener('settings-updated', loadCalendarName);
      window.removeEventListener('locale-changed', loadCalendarName);
    };
  }, [t]);

  // Function to get initials from email
  const getInitials = (email: string): string => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const handlePrevious = () => {
    if (currentView === 'day') {
      onDateChange(dateHelpers.previousDay(currentDate));
    } else if (currentView === 'agenda' || currentView === 'week') {
      onDateChange(dateHelpers.previousWeek(currentDate));
    } else if (currentView === 'month') {
      onDateChange(dateHelpers.previousMonth(currentDate));
    }
  };

  const handleNext = () => {
    if (currentView === 'day') {
      onDateChange(dateHelpers.nextDay(currentDate));
    } else if (currentView === 'agenda' || currentView === 'week') {
      onDateChange(dateHelpers.nextWeek(currentDate));
    } else if (currentView === 'month') {
      onDateChange(dateHelpers.nextMonth(currentDate));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="bg-card border-b border-border">
      {/* Single Row: All Header Components */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3">
        {/* Calendar Name */}
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{calendarName}</h1>

        {/* Navigation Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11" onClick={handlePrevious} aria-label="Previous">
            <ChevronLeft size={22} />
          </Button>
          <Button variant="secondary" className="h-10 px-3 sm:h-11 sm:px-5 text-sm sm:text-base" onClick={handleToday}>
            {t.actions.today}
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11" onClick={handleNext} aria-label="Next">
            <ChevronRight size={22} />
          </Button>
        </div>

        {/* Month/Year Display */}
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          {monthYearDisplay}
        </h2>

        {/* Spacer to push right items to the end */}
        <div className="flex-1 min-w-0" />

        {/* View Switcher */}
        <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />

        {/* Account List */}
        <div className="flex items-center gap-3">
          {accounts.map((account) => {
            const initials = getInitials(account.username);
            const isSynced = !isSyncing && lastSyncTime;
            const showingTooltip = showSyncTooltip === account.homeAccountId;

            return (
              <div key={account.homeAccountId} className="relative">
                {/* Circle with initials */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSyncTooltip(showingTooltip ? null : account.homeAccountId)}
                  className="w-11 h-11 rounded-full bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-sm"
                >
                  {initials}
                </Button>

                {/* Sync spinner while syncing */}
                {(isSyncing || isLoading) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-card rounded-full flex items-center justify-center border-2 border-card pointer-events-none">
                    <Loader2 size={12} className="text-primary animate-spin" />
                  </div>
                )}

                {/* Green checkmark if synced */}
                {!isSyncing && !isLoading && isSynced && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-card pointer-events-none">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Tooltip */}
                {showingTooltip && lastSyncTime && (
                  <div className="absolute top-full mt-2 right-0 bg-popover border border-border text-popover-foreground text-sm px-4 py-3 rounded-lg shadow-lg whitespace-nowrap z-50">
                    <div className="font-medium mb-1">{account.username}</div>
                    <div className="text-muted-foreground">
                      Last sync: {new Date(lastSyncTime).toLocaleString()}
                    </div>
                    {/* Arrow */}
                    <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
