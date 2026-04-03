import React, { useEffect } from 'react';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Layouts
import Navbar from './components/layout/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import AppDetailPage from './pages/AppDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/developer/DashboardPage';
import CreateAppPage from './pages/developer/CreateAppPage';
import AdminPage from './pages/admin/AdminPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user, loading } = useAuthStore();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing Page - standalone (no Navbar, no page-wrapper) */}
          <Route path="/" element={<LandingPage />} />

          {/* All other routes get the Navbar + page-wrapper */}
          <Route path="*" element={
            <>
              <Navbar />
              <div className="page-wrapper">
                <Routes>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/apps/:id" element={<AppDetailPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/profile" element={
                    <ProtectedRoute><ProfilePage /></ProtectedRoute>
                  } />
                  <Route path="/favorites" element={
                    <ProtectedRoute><FavoritesPage /></ProtectedRoute>
                  } />
                  <Route path="/developer" element={
                    <ProtectedRoute roles={['DEVELOPER', 'ADMIN']}><DashboardPage /></ProtectedRoute>
                  } />
                  <Route path="/developer/create" element={
                    <ProtectedRoute roles={['DEVELOPER', 'ADMIN']}><CreateAppPage /></ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute roles={['ADMIN']}><AdminPage /></ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
            </>
          } />
        </Routes>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fafafa',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '14px',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
