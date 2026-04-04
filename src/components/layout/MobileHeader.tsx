import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Loader2, Check, WifiOff } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCalendar } from '../../contexts/CalendarContext';
import { useTask } from '../../contexts/TaskContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useProfilePhotos } from '../../hooks/useProfilePhotos';
import { useHeaderControlsSlot } from '../../contexts/HeaderControlsContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { UserAvatar } from '../common/UserAvatar';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

const routeTitles: Record<string, string> = {
  '/calendar': 'calendar',
  '/tasks': 'todos',
  '/meals': 'mealPlanner',
  '/games': 'games',
  '/weather': 'weather',
  '/home': 'home',
  '/photos': 'photos',
  '/docs': 'docs',
  '/settings': 'settings',
};

/** Displays current time in 24 h format, updates every minute. Desktop only. */
const DesktopClock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    // Align the first tick to the start of the next minute
    const ms = (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, ms);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <span className="hidden lg:flex absolute inset-x-0 items-center justify-center text-3xl font-semibold text-muted-foreground tabular-nums tracking-wide select-none pointer-events-none">
      {time}
    </span>
  );
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle }) => {
  const { t } = useLocale();
  const { accounts, isAuthenticated } = useAuth();
  const { isSyncing: calSyncing, isLoading: calLoading, lastSyncTime: calLastSync } = useCalendar();
  const { isSyncing: taskSyncing, isLoading: taskLoading, lastSyncTime: taskLastSync } = useTask();
  const { isSyncing: settingsSyncing } = useSettings();
  const photos = useProfilePhotos();
  const location = useLocation();
  const headerControls = useHeaderControlsSlot();
  const isOnline = useOnlineStatus();

  const anySyncing = calSyncing || calLoading || taskSyncing || taskLoading || settingsSyncing;
  const anySynced = !!(calLastSync || taskLastSync);

  const currentKey = routeTitles[location.pathname]
    || (location.pathname.startsWith('/docs') ? 'docs' : 'calendar');
  const pageTitle = t.nav[currentKey as keyof typeof t.nav] || t.header.title;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="relative flex items-center h-14 lg:h-[72px] px-2 lg:px-3 gap-2 lg:gap-3">
        {/* Left: hamburger + logo + title */}
        <div className="flex items-center min-w-0 shrink-0 h-full">
          {/* Hamburger — opens drawer on all sizes */}
          <button
            onClick={onMenuToggle}
            className="w-11 h-11 lg:w-14 lg:h-14 flex items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors touch-target ml-1 lg:ml-0"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {/* Mobile: page title */}
          <span className="lg:hidden text-sm font-medium text-foreground truncate cursor-pointer" onClick={onMenuToggle}>{pageTitle}</span>

          {/* Desktop: page title */}
          <span className="hidden lg:block text-lg text-muted-foreground truncate cursor-pointer" onClick={onMenuToggle}>{pageTitle}</span>
        </div>

        {/* Center: clock (desktop only, absolutely centered) */}
        <DesktopClock />

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
              {!isOnline ? (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-yellow-500 flex items-center justify-center" title="Offline">
                  <WifiOff size={8} className="text-white" strokeWidth={3} />
                </div>
              ) : anySyncing ? (
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
