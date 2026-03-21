import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { useWakeLock } from '../../hooks/useWakeLock';
import { HeaderControlsProvider } from '../../contexts/HeaderControlsContext';

export const MainLayout: React.FC = () => {
  useWakeLock();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <HeaderControlsProvider>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <MobileHeader onMenuToggle={toggleSidebar} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />

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
