import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { addMonths, subMonths } from 'date-fns';
import { dateHelpers } from '../../utils/dateHelpers';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

interface DatePickerFieldProps {
  /** Value as YYYY-MM-DD string */
  value: string;
  /** Called with YYYY-MM-DD string */
  onChange: (value: string) => void;
  /** Optional time as HH:MM string */
  time?: string;
  /** Called with HH:MM string when time changes */
  onTimeChange?: (value: string) => void;
  placeholder?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  time,
  onTimeChange,
  placeholder = 'Select date',
}) => {
  const { locale, t } = useLocale();
  const showTime = time !== undefined && onTimeChange !== undefined;
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [viewMonth, setViewMonth] = useState(selected || new Date());
  const [open, setOpen] = useState(false);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const [hour, minute] = (time || '00:00').split(':').map(Number);

  // Scroll to selected hour/minute when popover opens
  useEffect(() => {
    if (open && showTime) {
      setTimeout(() => {
        const hEl = hourRef.current?.querySelector('[data-selected="true"]');
        if (hEl) hEl.scrollIntoView({ block: 'center' });
        const mEl = minuteRef.current?.querySelector('[data-selected="true"]');
        if (mEl) mEl.scrollIntoView({ block: 'center' });
      }, 50);
    }
  }, [open, showTime]);

  const weeks = dateHelpers.getMonthCalendarGrid(viewMonth);
  const viewMonthNum = viewMonth.getMonth();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthLabel = capitalize(dateHelpers.formatDate(viewMonth, 'MMMM yyyy', locale));

  const weekDayHeaders = dateHelpers.getWeekDays(new Date()).map(d =>
    dateHelpers.formatDate(d, 'EEEEE', locale)
  );

  const formatDateStr = (day: Date) => {
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDayClick = (day: Date) => {
    onChange(formatDateStr(day));
    if (!showTime) setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setViewMonth(today);
    onChange(formatDateStr(today));
    if (!showTime) setOpen(false);
  };

  const handleHourClick = (h: number) => {
    onTimeChange?.(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  const handleMinuteClick = (m: number) => {
    onTimeChange?.(`${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setViewMonth(selected || new Date());
    setOpen(isOpen);
  };

  const triggerLabel = selected
    ? capitalize(dateHelpers.formatDate(selected, 'PPP', locale)) +
      (showTime ? ` — ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : '')
    : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-start gap-2 h-14 lg:h-16 text-lg lg:text-xl px-4 lg:px-5 font-normal ${!selected ? 'text-muted-foreground' : ''}`}
        >
          {showTime ? <Clock size={20} className="shrink-0" /> : <Calendar size={20} className="shrink-0" />}
          <span className="truncate">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0" sideOffset={8}>
        <div className="flex">
          {/* Calendar side */}
          <div className="p-3">
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
                    const isSelected = selected ? dateHelpers.isSameDay(day, selected) : false;
                    const isToday = dateHelpers.isToday(day);
                    const isOutside = day.getMonth() !== viewMonthNum;

                    return (
                      <button
                        type="button"
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
              <Button type="button" variant="ghost" className="w-full h-8 text-sm" onClick={handleToday}>
                {t.actions.today}
              </Button>
            </div>
          </div>

          {/* Time picker side */}
          {showTime && (
            <div className="border-l border-border flex">
              {/* Hours */}
              <div ref={hourRef} className="h-[300px] overflow-y-auto py-1 px-1 scrollbar-thin">
                {HOURS.map(h => (
                  <button
                    type="button"
                    key={h}
                    data-selected={h === hour}
                    onClick={() => handleHourClick(h)}
                    className={`w-10 h-9 flex items-center justify-center rounded-md text-sm transition-colors ${
                      h === hour
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>
              {/* Minutes */}
              <div ref={minuteRef} className="h-[300px] overflow-y-auto py-1 px-1 border-l border-border scrollbar-thin">
                {MINUTES.map(m => (
                  <button
                    type="button"
                    key={m}
                    data-selected={m === minute}
                    onClick={() => handleMinuteClick(m)}
                    className={`w-10 h-9 flex items-center justify-center rounded-md text-sm transition-colors ${
                      m === minute
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
