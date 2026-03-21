import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, UtensilsCrossed, Settings, BookOpen, X } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  labelKey: string;
  section: 'top' | 'bottom';
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const { t } = useLocale();
  const { accounts, isAuthenticated } = useAuth();
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
      icon: <Calendar size={26} />,
      labelKey: 'calendar',
      section: 'top',
    },
    {
      to: '/tasks',
      icon: <CheckSquare size={26} />,
      labelKey: 'todos',
      section: 'top',
    },
    {
      to: '/meal-planner',
      icon: <UtensilsCrossed size={26} />,
      labelKey: 'mealPlanner',
      section: 'top',
    },
    {
      to: '/docs',
      icon: <BookOpen size={26} />,
      labelKey: 'docs',
      section: 'bottom',
    },
    {
      to: '/settings',
      icon: <Settings size={26} />,
      labelKey: 'settings',
      section: 'bottom',
    },
  ];

  const topItems = navItems.filter(item => item.section === 'top');
  const bottomItems = navItems.filter(item => item.section === 'bottom');

  const navLinkClass = (isActive: boolean, isMobile: boolean) =>
    `flex items-center rounded-xl transition-all duration-200 touch-target ${
      isMobile
        ? `justify-start gap-4 w-full px-4 h-14 ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`
        : `justify-center flex-col w-18 h-18 ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`
    }`;

  const renderNavItems = (items: NavItem[], isMobile: boolean) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => navLinkClass(isActive, isMobile)}
      >
        {item.icon}
        <span className={isMobile ? 'text-sm font-medium' : 'text-xs mt-1 font-medium leading-tight'}>
          {t.nav[item.labelKey as keyof typeof t.nav]}
        </span>
      </NavLink>
    ));

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-22 bg-card border-r border-border flex-col items-center py-6 shrink-0">
        {/* User avatars at top */}
        {isAuthenticated && accounts.length > 0 && (
          <div className="flex flex-col items-center gap-2 mb-4 pb-4 border-b border-border w-full px-2">
            {accounts.map((account) => (
              <div
                key={account.homeAccountId}
                className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm"
                title={account.name || account.username}
              >
                {getInitials(account.name || account.username)}
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-4">
          {renderNavItems(topItems, false)}
        </div>
        <div className="flex-1" />
        <div className="flex flex-col gap-4">
          {renderNavItems(bottomItems, false)}
        </div>
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-out drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
              N
            </div>
            <span className="font-display font-semibold text-foreground">{t.header.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && accounts.length > 0 && (
              <div className="flex items-center gap-1">
                {accounts.map((account) => (
                  <div
                    key={account.homeAccountId}
                    className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs"
                    title={account.name || account.username}
                  >
                    {getInitials(account.name || account.username)}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors touch-target"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-auto px-3 py-4 flex flex-col">
          <div className="flex flex-col gap-1">
            {renderNavItems(topItems, true)}
          </div>
          <div className="flex-1" />
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex flex-col gap-1">
              {renderNavItems(bottomItems, true)}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};
