import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import type { CalendarView } from '../../types/calendar.types';
import { dateHelpers } from '../../utils/dateHelpers';
import { Button } from '@/components/ui/button';

interface CalendarHeaderProps {
  currentView: CalendarView;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  monthYearDisplay: string;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentView,
  currentDate,
  onDateChange,
  monthYearDisplay
}) => {
  const { t } = useLocale();

  const handlePrevious= () => {
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
      </div>
    </div>
  );
};
