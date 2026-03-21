import React from 'react';
import { LayoutList, CalendarDays, ChevronDown, Check } from 'lucide-react';
import type { CalendarView } from '../../types/calendar.types';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ViewSwitcherProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const views: { value: CalendarView; labelKey: 'agenda' | 'month'; Icon: typeof LayoutList }[] = [
  { value: 'agenda', labelKey: 'agenda', Icon: LayoutList },
  { value: 'month', labelKey: 'month', Icon: CalendarDays },
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const { t } = useLocale();
  const current = views.find(v => v.value === currentView) || views[0];
  const CurrentIcon = current.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 lg:w-auto lg:px-3 lg:gap-2">
          <CurrentIcon size={18} />
          <span className="hidden lg:inline text-sm font-medium">{t.views[current.labelKey]}</span>
          <ChevronDown size={14} className="hidden lg:inline text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {views.map(({ value, labelKey, Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onViewChange(value)}
            className="flex items-center justify-between cursor-pointer py-2.5"
          >
            <span className="flex items-center gap-2">
              <Icon size={16} />
              {t.views[labelKey]}
            </span>
            {currentView === value && <Check size={14} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
