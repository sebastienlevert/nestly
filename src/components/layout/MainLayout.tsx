import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { useWakeLock } from '../../hooks/useWakeLock';
import { HeaderControlsProvider } from '../../contexts/HeaderControlsContext';

const SIDEBAR_COLLAPSED_KEY = 'nestly:sidebar-collapsed';

export const MainLayout: React.FC = () => {
  useWakeLock();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'; }
    catch { return false; }
  });

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <HeaderControlsProvider>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <MobileHeader onMenuToggle={toggleSidebar} onSidebarCollapse={toggleCollapse} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            mobileOpen={sidebarOpen}
            onClose={closeSidebar}
            collapsed={sidebarCollapsed}
          />

          <main className="flex-1 overflow-auto">
            <div className="max-w-full h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </HeaderControlsProvider>
  );
};
