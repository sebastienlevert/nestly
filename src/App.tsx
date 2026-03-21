import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { MealProvider } from './contexts/MealContext';
import { PhotoProvider } from './contexts/PhotoContext';
import { TaskProvider } from './contexts/TaskContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { CalendarPage } from './pages/CalendarPage';
import { PhotosPage } from './pages/PhotosPage';
import { MealsPage } from './pages/MealsPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { MealPlannerPage } from './pages/MealPlannerPage';
import { DocsPage } from './pages/DocsPage';
import { LandingPage } from './pages/LandingPage';
import { useAutoReload } from './hooks/useAutoReload';
import { useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {!isAuthenticated && (
        <Route path="/" element={<LandingPage />} />
      )}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="photos" element={<PhotosPage />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="meal-planner" element={<MealPlannerPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  useAutoReload();

  return (
    <HashRouter>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <CalendarProvider>
              <MealProvider>
                <PhotoProvider>
                  <TaskProvider>
                    <AppRoutes />
                  </TaskProvider>
                </PhotoProvider>
              </MealProvider>
            </CalendarProvider>
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
