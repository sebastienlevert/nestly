import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, UtensilsCrossed, Settings, BookOpen, X, CloudSun, Home, Dices } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { NestlyLogo } from '../common/NestlyLogo';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  labelKey: string;
  group: 'planning' | 'familyTime' | 'bottom';
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const { t } = useLocale();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (mobileOpen && onClose) {
      onClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const navItems: NavItem[] = [
    {
      to: '/calendar',
      icon: <Calendar size={30} />,
      labelKey: 'calendar',
      group: 'planning',
    },
    {
      to: '/tasks',
      icon: <CheckSquare size={30} />,
      labelKey: 'todos',
      group: 'planning',
    },
    {
      to: '/meals',
      icon: <UtensilsCrossed size={30} />,
      labelKey: 'mealPlanner',
      group: 'planning',
    },
    {
      to: '/games',
      icon: <Dices size={30} />,
      labelKey: 'games',
      group: 'familyTime',
    },
    {
      to: '/weather',
      icon: <CloudSun size={30} />,
      labelKey: 'weather',
      group: 'familyTime',
    },
    {
      to: '/docs',
      icon: <BookOpen size={30} />,
      labelKey: 'docs',
      group: 'bottom',
    },
    {
      to: '/home',
      icon: <Home size={30} />,
      labelKey: 'home',
      group: 'bottom',
    },
    {
      to: '/settings',
      icon: <Settings size={30} />,
      labelKey: 'settings',
      group: 'bottom',
    },
  ];

  const planningItems = navItems.filter(item => item.group === 'planning');
  const familyTimeItems = navItems.filter(item => item.group === 'familyTime');
  const bottomItems = navItems.filter(item => item.group === 'bottom');

  // Nav link styles
  const navClass = (isActive: boolean) =>
    `flex items-center rounded-xl transition-all duration-200 touch-target justify-start gap-4 w-full px-4 h-14 ${
      isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
    }`;

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => navClass(isActive)}
      >
        {item.icon}
        <span className="text-sm font-medium">
          {t.nav[item.labelKey as keyof typeof t.nav]}
        </span>
      </NavLink>
    ));


  return (
    <>
      {/* Drawer overlay — all screen sizes */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out drawer — all screen sizes */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <NestlyLogo size={36} className="rounded-lg shrink-0" />
            <span className="font-display font-semibold text-foreground">{t.header.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors touch-target"
              aria-label="Close menu"
            >
              <X size={30} />
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-auto px-3 py-4 flex flex-col">
          {/* Planning group */}
          <div className="flex flex-col gap-1">
            <span className="px-4 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {t.nav.groupPlanning}
            </span>
            {renderItems(planningItems)}
          </div>

          {/* Family Time group */}
          <div className="flex flex-col gap-1 mt-4">
            <span className="px-4 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {t.nav.groupFamilyTime}
            </span>
            {renderItems(familyTimeItems)}
          </div>

          <div className="flex-1" />
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex flex-col gap-1">
              {renderItems(bottomItems)}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};
