import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, UtensilsCrossed, Settings, BookOpen, X, CloudSun } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  labelKey: string;
  section: 'top' | 'bottom';
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose, collapsed = false }) => {
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
      icon: <Calendar size={20} />,
      labelKey: 'calendar',
      section: 'top',
    },
    {
      to: '/tasks',
      icon: <CheckSquare size={20} />,
      labelKey: 'todos',
      section: 'top',
    },
    {
      to: '/meals',
      icon: <UtensilsCrossed size={20} />,
      labelKey: 'mealPlanner',
      section: 'top',
    },
    {
      to: '/weather',
      icon: <CloudSun size={20} />,
      labelKey: 'weather',
      section: 'top',
    },
    {
      to: '/docs',
      icon: <BookOpen size={20} />,
      labelKey: 'docs',
      section: 'bottom',
    },
    {
      to: '/settings',
      icon: <Settings size={20} />,
      labelKey: 'settings',
      section: 'bottom',
    },
  ];

  const topItems = navItems.filter(item => item.section === 'top');
  const bottomItems = navItems.filter(item => item.section === 'bottom');

  // Desktop nav link styles — icons stay in fixed position, label appears on expand
  const desktopNavClass = (isActive: boolean) =>
    `flex items-center rounded-xl transition-all duration-200 h-10 overflow-hidden whitespace-nowrap ${
      isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
    }`;

  // Mobile nav link styles
  const mobileNavClass = (isActive: boolean) =>
    `flex items-center rounded-xl transition-all duration-200 touch-target justify-start gap-4 w-full px-4 h-14 ${
      isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
    }`;

  const renderDesktopItems = (items: NavItem[]) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        title={collapsed ? t.nav[item.labelKey as keyof typeof t.nav] : undefined}
        className={({ isActive }) => desktopNavClass(isActive)}
      >
        {/* Fixed-width icon column — matches collapsed sidebar width so icon never moves */}
        <span className="w-14 shrink-0 flex items-center justify-center">{item.icon}</span>
        <span className={`text-sm font-medium truncate transition-opacity duration-200 pr-3 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
          {t.nav[item.labelKey as keyof typeof t.nav]}
        </span>
      </NavLink>
    ));

  const renderMobileItems = (items: NavItem[]) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => mobileNavClass(isActive)}
      >
        {item.icon}
        <span className="text-sm font-medium">
          {t.nav[item.labelKey as keyof typeof t.nav]}
        </span>
      </NavLink>
    ));


  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside
        className={`hidden lg:flex flex-col bg-card border-r border-border shrink-0 overflow-hidden transition-all duration-200 ${
          collapsed ? 'w-14' : 'w-48'
        } py-3`}
      >
        <nav className="flex flex-col flex-1">
          <div className="flex flex-col gap-1">
            {renderDesktopItems(topItems)}
          </div>
          <div className="flex-1" />
          <div className="flex flex-col gap-1">
            {renderDesktopItems(bottomItems)}
          </div>
        </nav>
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
            {renderMobileItems(topItems)}
          </div>
          <div className="flex-1" />
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex flex-col gap-1">
              {renderMobileItems(bottomItems)}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};
