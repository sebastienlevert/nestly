import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Loader2, Check } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCalendar } from '../../contexts/CalendarContext';
import { useTask } from '../../contexts/TaskContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useProfilePhotos } from '../../hooks/useProfilePhotos';
import { useHeaderControlsSlot } from '../../contexts/HeaderControlsContext';
import { UserAvatar } from '../common/UserAvatar';
import { NestlyLogo } from '../common/NestlyLogo';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  onSidebarCollapse?: () => void;
  sidebarCollapsed?: boolean;
}

const routeTitles: Record<string, string> = {
  '/calendar': 'calendar',
  '/tasks': 'todos',
  '/meals': 'mealPlanner',
  '/weather': 'weather',
  '/photos': 'photos',
  '/docs': 'docs',
  '/settings': 'settings',
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle, onSidebarCollapse, sidebarCollapsed }) => {
  const { t } = useLocale();
  const { accounts, isAuthenticated } = useAuth();
  const { isSyncing: calSyncing, isLoading: calLoading, lastSyncTime: calLastSync } = useCalendar();
  const { isSyncing: taskSyncing, isLoading: taskLoading, lastSyncTime: taskLastSync } = useTask();
  const { isSyncing: settingsSyncing } = useSettings();
  const photos = useProfilePhotos();
  const location = useLocation();
  const headerControls = useHeaderControlsSlot();

  const anySyncing = calSyncing || calLoading || taskSyncing || taskLoading || settingsSyncing;
  const anySynced = !!(calLastSync || taskLastSync);

  const currentKey = routeTitles[location.pathname]
    || (location.pathname.startsWith('/docs') ? 'docs' : 'calendar');
  const pageTitle = t.nav[currentKey as keyof typeof t.nav] || t.header.title;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="flex items-center h-14 px-2 lg:px-0 gap-2">
        {/* Left: hamburger + logo + title */}
        <div className="flex items-center min-w-0 shrink-0 h-full">
          {/* Mobile: open drawer */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors touch-target ml-1"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          {/* Desktop: toggle sidebar collapse — matches sidebar w-14 so icon aligns with nav icons */}
          <button
            onClick={onSidebarCollapse}
            className="hidden lg:flex w-14 h-10 items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:flex items-center gap-2.5 lg:ml-0 min-w-0 h-full">
            {!sidebarCollapsed && (
              <>
                <NestlyLogo size={32} className="rounded-lg shrink-0" />
                <span className="font-display font-bold text-foreground text-base">Nestly</span>
              </>
            )}
            <span className="text-sm text-muted-foreground truncate">{pageTitle}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: module controls + user avatars */}
        <div className="flex items-center gap-2 shrink-0 pr-2 lg:pr-4">
          {headerControls}

          {isAuthenticated && accounts.length > 0 && (
            <div className="relative flex items-center gap-1.5 ml-1">
              {accounts.map((account) => (
                <UserAvatar
                  key={account.homeAccountId}
                  name={account.name || account.username}
                  photoUrl={photos[account.homeAccountId]}
                  size="sm"
                />
              ))}
              {/* Sync badge */}
              {anySyncing ? (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-card flex items-center justify-center">
                  <Loader2 size={8} className="text-primary animate-spin" />
                </div>
              ) : anySynced ? (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={7} className="text-white" strokeWidth={3} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
