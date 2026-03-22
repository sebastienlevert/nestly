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
  '/home': 'home',
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
      <div className="flex items-center h-14 lg:h-[72px] px-2 lg:px-0 gap-2 lg:gap-3">
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
            className="hidden lg:flex w-14 h-14 items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>

          {/* Mobile: page title */}
          <span className="lg:hidden text-sm font-medium text-foreground truncate">{pageTitle}</span>

          {/* Desktop: logo + title */}
          <div className="hidden lg:flex items-center min-w-0 h-full">
            <div className={`flex items-center gap-3 overflow-hidden transition-all duration-200 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <NestlyLogo size={40} className="rounded-lg shrink-0" />
              <span className="font-display font-bold text-foreground text-xl whitespace-nowrap">Nestly</span>
            </div>
            <span className={`text-lg text-muted-foreground truncate transition-all duration-200 ${sidebarCollapsed ? 'ml-0' : 'ml-3'}`}>{pageTitle}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: module controls + user avatars */}
        <div className="flex items-center gap-3 shrink-0 pr-2 lg:pr-5">
          {headerControls}

          {isAuthenticated && accounts.length > 0 && (
            <div className="relative flex items-center gap-2 ml-1">
              {accounts.map((account) => (
                <UserAvatar
                  key={account.homeAccountId}
                  name={account.name || account.username}
                  photoUrl={photos[account.homeAccountId]}
                  size="md"
                />
              ))}
              {/* Sync badge */}
              {anySyncing ? (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-card flex items-center justify-center">
                  <Loader2 size={9} className="text-primary animate-spin" />
                </div>
              ) : anySynced ? (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={8} className="text-white" strokeWidth={3} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
