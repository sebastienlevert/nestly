import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { MealProvider } from './contexts/MealContext';
import { PhotoProvider } from './contexts/PhotoContext';
import { TaskProvider } from './contexts/TaskContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MainLayout } from './components/layout/MainLayout';
import { CalendarPage } from './pages/CalendarPage';
import { PhotosPage } from './pages/PhotosPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { MealPlannerPage } from './pages/MealPlannerPage';
import { DocsPage } from './pages/DocsPage';
import { LandingPage } from './pages/LandingPage';
import { useAutoReload } from './hooks/useAutoReload';
import { useAuth } from './contexts/AuthContext';

function AuthGate() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Logged in at "/" → redirect to calendar
  return <Navigate to="/calendar" replace />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't decide routes until auth state is known
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AuthGate />} />
      {isAuthenticated ? (
        <Route element={<MainLayout />}>
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="photos" element={<PhotosPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="meals" element={<MealPlannerPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="docs/:sectionId" element={<DocsPage />} />
          <Route path="docs/:sectionId/:articleId" element={<DocsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
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
            <SettingsProvider>
              <CalendarProvider>
                <MealProvider>
                  <PhotoProvider>
                    <TaskProvider>
                      <AppRoutes />
                    </TaskProvider>
                  </PhotoProvider>
                </MealProvider>
              </CalendarProvider>
            </SettingsProvider>
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
