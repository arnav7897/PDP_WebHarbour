import React, { useEffect } from 'react';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Stores
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// UI
import { AuthCheckLoader, PageTransition, WHSplash } from './components/ui/Loader';
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
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user, loading } = useAuthStore();
  if (loading) return <AuthCheckLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function MainLayout() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/home" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/marketplace" element={<PageTransition><MarketplacePage /></PageTransition>} />
            <Route path="/apps/:id" element={<PageTransition><AppDetailPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
            <Route path="/profile" element={
              <ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute><PageTransition><FavoritesPage /></PageTransition></ProtectedRoute>
            } />
            <Route path="/developer" element={
              <ProtectedRoute roles={['DEVELOPER', 'ADMIN']}><PageTransition><DashboardPage /></PageTransition></ProtectedRoute>
            } />
            <Route path="/developer/create" element={
              <ProtectedRoute roles={['DEVELOPER', 'ADMIN']}><PageTransition><CreateAppPage /></PageTransition></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['ADMIN']}><PageTransition><AdminPage /></PageTransition></ProtectedRoute>
            } />
            <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  );
}

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const loading = useAuthStore((s) => s.loading);
  const initializeTheme = useThemeStore((s) => s.init);

  // One-time initializations
  useEffect(() => {
    initializeTheme();
    initializeAuth();
  }, [initializeTheme, initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <WHSplash visible={loading} />
      {!loading && (
        <BrowserRouter>
          <Routes>
            {/* Landing Page (no navbar, dark context always) */}
            <Route path="/" element={<LandingPage />} />
            {/* Everything else gets Navbar and Theme transitions block */}
            <Route path="/*" element={<MainLayout />} />
          </Routes>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontSize: '14px',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
              error: { iconTheme: { primary: 'var(--danger)', secondary: 'white' } },
            }}
          />
        </BrowserRouter>
      )}
    </QueryClientProvider>
  );
}
