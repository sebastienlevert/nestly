import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfilePhotos } from '../../hooks/useProfilePhotos';
import { UserAvatar } from '../common/UserAvatar';
import { NestlyLogo } from '../common/NestlyLogo';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

const routeTitles: Record<string, string> = {
  '/calendar': 'calendar',
  '/tasks': 'todos',
  '/meals': 'mealPlanner',
  '/photos': 'photos',
  '/docs': 'docs',
  '/settings': 'settings',
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle }) => {
  const { t } = useLocale();
  const { accounts, isAuthenticated } = useAuth();
  const photos = useProfilePhotos();
  const location = useLocation();

  const currentKey = routeTitles[location.pathname] || 'calendar';
  const pageTitle = t.nav[currentKey as keyof typeof t.nav] || t.header.title;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center min-w-0">
          {/* Hamburger: mobile only */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors touch-target -ml-1"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-2.5 ml-3 lg:ml-0 min-w-0">
            <NestlyLogo size={32} className="rounded-lg shrink-0" />
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="font-display font-bold text-foreground text-base">Nestly</span>
              <span className="text-sm text-muted-foreground truncate">{pageTitle}</span>
            </div>
          </div>
        </div>

        {isAuthenticated && accounts.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {accounts.map((account) => (
              <UserAvatar
                key={account.homeAccountId}
                name={account.name || account.username}
                photoUrl={photos[account.homeAccountId]}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
