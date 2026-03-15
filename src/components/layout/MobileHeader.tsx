import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Calendar } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

const routeTitles: Record<string, string> = {
  '/calendar': 'calendar',
  '/tasks': 'todos',
  '/adventures': 'adventures',
  '/memories': 'memories',
  '/love-board': 'loveBoard',
  '/fun-night': 'funNight',
  '/photos': 'photos',
  '/meals': 'meals',
  '/settings': 'settings',
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle }) => {
  const { t } = useLocale();
  const location = useLocation();

  const currentKey = routeTitles[location.pathname] || 'calendar';
  const pageTitle = t.nav[currentKey as keyof typeof t.nav] || t.header.title;

  return (
    <header className="lg:hidden bg-card border-b border-border sticky top-0 z-30">
      <div className="flex items-center h-14 px-4">
        <button
          onClick={onMenuToggle}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors touch-target -ml-1"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2.5 ml-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calendar size={18} className="text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-foreground text-base truncate">
            {pageTitle}
          </span>
        </div>
      </div>
    </header>
  );
};
