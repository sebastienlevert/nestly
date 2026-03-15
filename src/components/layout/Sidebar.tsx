import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, Settings, Map as MapIcon, Heart, Camera, Dice5, Image as ImageIcon, UtensilsCrossed, X } from 'lucide-react';
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
      to: '/adventures',
      icon: <MapIcon size={26} />,
      labelKey: 'adventures',
      section: 'top',
    },
    {
      to: '/memories',
      icon: <Camera size={26} />,
      labelKey: 'memories',
      section: 'top',
    },
    {
      to: '/love-board',
      icon: <Heart size={26} />,
      labelKey: 'loveBoard',
      section: 'top',
    },
    {
      to: '/fun-night',
      icon: <Dice5 size={26} />,
      labelKey: 'funNight',
      section: 'top',
    },
    {
      to: '/photos',
      icon: <ImageIcon size={26} />,
      labelKey: 'photos',
      section: 'bottom',
    },
    {
      to: '/meals',
      icon: <UtensilsCrossed size={26} />,
      labelKey: 'meals',
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

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-22 bg-card border-r border-border flex-col items-center py-6 shrink-0">
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
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">{t.header.title}</span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors touch-target"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {renderNavItems(topItems, true)}
          </div>
          <div className="border-t border-border my-4" />
          <div className="flex flex-col gap-1">
            {renderNavItems(bottomItems, true)}
          </div>
        </nav>
      </aside>
    </>
  );
};
