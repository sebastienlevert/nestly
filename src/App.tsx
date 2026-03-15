import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CloudSyncProvider } from './contexts/CloudSyncContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { MealProvider } from './contexts/MealContext';
import { PhotoProvider } from './contexts/PhotoContext';
import { TaskProvider } from './contexts/TaskContext';
import { AdventureProvider } from './contexts/AdventureContext';
import { LoveBoardProvider } from './contexts/LoveBoardContext';
import { MemoryProvider } from './contexts/MemoryContext';
import { FunNightProvider } from './contexts/FunNightContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { CalendarPage } from './pages/CalendarPage';
import { PhotosPage } from './pages/PhotosPage';
import { MealsPage } from './pages/MealsPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdventuresPage } from './pages/AdventuresPage';
import { LoveBoardPage } from './pages/LoveBoardPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { FunNightPage } from './pages/FunNightPage';
import { useAutoReload } from './hooks/useAutoReload';

function App() {
  useAutoReload();

  // Debug: Log all navigation
  React.useEffect(() => {
    console.log('App: Current location:', window.location.href);
    console.log('App: Hash:', window.location.hash);
    console.log('App: Search:', window.location.search);
  }, []);

  return (
    <HashRouter>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <CloudSyncProvider>
            <CalendarProvider>
              <MealProvider>
                <PhotoProvider>
                  <TaskProvider>
                    <AdventureProvider>
                      <LoveBoardProvider>
                        <MemoryProvider>
                          <FunNightProvider>
                            <Routes>
                              <Route path="/" element={<MainLayout />}>
                                <Route index element={<Navigate to="/calendar" replace />} />
                                <Route path="calendar" element={<CalendarPage />} />
                                <Route path="tasks" element={<TasksPage />} />
                                <Route path="adventures" element={<AdventuresPage />} />
                                <Route path="memories" element={<MemoriesPage />} />
                                <Route path="love-board" element={<LoveBoardPage />} />
                                <Route path="fun-night" element={<FunNightPage />} />
                                <Route path="photos" element={<PhotosPage />} />
                                <Route path="meals" element={<MealsPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                              </Route>
                            </Routes>
                          </FunNightProvider>
                        </MemoryProvider>
                      </LoveBoardProvider>
                    </AdventureProvider>
                  </TaskProvider>
                </PhotoProvider>
              </MealProvider>
            </CalendarProvider>
            </CloudSyncProvider>
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
