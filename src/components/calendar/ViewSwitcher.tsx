import React from 'react';
import { List, CalendarDays } from 'lucide-react';
import type { CalendarView } from '../../types/calendar.types';
import { Button } from '@/components/ui/button';

interface ViewSwitcherProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const views: { value: CalendarView; Icon: typeof List }[] = [
  { value: 'agenda', Icon: List },
  { value: 'month', Icon: CalendarDays },
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center gap-1">
      {views.map(({ value, Icon }) => (
        <Button
          key={value}
          variant={currentView === value ? 'default' : 'ghost'}
          size="icon"
          className="h-9 w-9"
          onClick={() => onViewChange(value)}
          aria-label={value}
        >
          <Icon size={18} />
        </Button>
      ))}
    </div>
  );
};
