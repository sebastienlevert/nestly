import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { addMonths, subMonths } from 'date-fns';
import { dateHelpers } from '../../utils/dateHelpers';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ currentDate, onDateChange }) => {
  const { locale, t } = useLocale();
  const [viewMonth, setViewMonth] = useState(currentDate);
  const [open, setOpen] = useState(false);

  // Keep viewMonth in sync when currentDate changes (e.g. midnight rollover) and popover is closed
  useEffect(() => {
    if (!open) setViewMonth(currentDate);
  }, [currentDate, open]);

  const weeks = dateHelpers.getMonthCalendarGrid(viewMonth);
  const viewMonthNum = viewMonth.getMonth();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthLabel = capitalize(dateHelpers.formatDate(viewMonth, 'MMMM yyyy', locale));

  // Day-of-week headers (Mon–Sun)
  const weekDayHeaders = dateHelpers.getWeekDays(new Date()).map(d =>
    dateHelpers.formatDate(d, 'EEEEE', locale)
  );

  const handleDayClick = (day: Date) => {
    onDateChange(day);
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setViewMonth(today);
    onDateChange(today);
    setOpen(false);
  };

  // Sync viewMonth when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setViewMonth(currentDate);
    setOpen(isOpen);
  };

  // Trigger label: abbreviated month + day
  const triggerLabel = capitalize(dateHelpers.formatDate(currentDate, 'MMM d', locale));

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 lg:h-11 px-2.5 lg:px-4 gap-1.5 lg:gap-2 text-sm lg:text-base font-medium">
          <Calendar size={16} className="lg:hidden" />
          <Calendar size={20} className="hidden lg:block" />
          <span>{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3" sideOffset={8}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMonth(m => subMonths(m, 1))}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMonth(m => addMonths(m, 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekDayHeaders.map((name, i) => (
            <div key={i} className="w-9 h-7 flex items-center justify-center text-[11px] font-medium text-muted-foreground uppercase">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => {
                const isSelected = dateHelpers.isSameDay(day, currentDate);
                const isToday = dateHelpers.isToday(day);
                const isOutside = day.getMonth() !== viewMonthNum;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : isToday
                          ? 'bg-primary/15 text-primary font-semibold'
                          : isOutside
                            ? 'text-muted-foreground/40'
                            : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Today button */}
        <div className="mt-2 pt-2 border-t border-border">
          <Button variant="ghost" className="w-full h-8 text-sm" onClick={handleToday}>
            {t.actions.today}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
