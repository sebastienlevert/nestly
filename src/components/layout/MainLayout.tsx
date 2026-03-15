import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { useWakeLock } from '../../hooks/useWakeLock';

export const MainLayout: React.FC = () => {
  useWakeLock();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Mobile header with hamburger — hidden on lg+ */}
      <MobileHeader onMenuToggle={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: desktop = always visible, mobile = slide-out drawer */}
        <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
