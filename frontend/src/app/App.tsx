import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { MainLayout } from '../layouts/MainLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { SessionsPage } from '../features/sessions/SessionsPage';
import { AttendancePage } from '../features/attendance/AttendancePage';
import { PlayersPage } from '../features/players/PlayersPage';
import { PaymentsPage } from '../features/payments/PaymentsPage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { CourtAssignmentsPage } from '../features/court-assignments/CourtAssignmentsPage';
import { VenuesPage } from '../features/venues/VenuesPage';
import { CourtsPage } from '../features/courts/CourtsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="court-assignments" element={<CourtAssignmentsPage />} />
              <Route path="players" element={<PlayersPage />} />
              <Route path="venues" element={<VenuesPage />} />
              <Route path="courts" element={<CourtsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
