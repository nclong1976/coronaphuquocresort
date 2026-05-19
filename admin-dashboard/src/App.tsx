import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { FinancialPage } from './pages/FinancialPage';
import { GamesPage } from './pages/GamesPage';
import { DepositsPage } from './pages/DepositsPage';
import { WithdrawalsPage } from './pages/WithdrawalsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SupportChatPage } from './pages/SupportChatPage';
import { SystemPage } from './pages/SystemPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5000, retry: 1 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="financial" element={<FinancialPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="deposits" element={<DepositsPage />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="support" element={<SupportChatPage />} />
            <Route path="system" element={<SystemPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
