import React, { Suspense, lazy, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminOnlyWrapper from '../shared/config/AdminOnlyWrapper';
import { AdminRestaurantProvider } from '../shared/context/AdminRestaurantContext';
import { ManagerNotificationProvider } from '../shared/context/ManagerNotificationContext';
import { BasePathProvider, useBasePath } from '../shared/config/BasePathContext';
import { isDevelopment } from '../shared/utils/subdomainRouter';

// Use unified loading component
import LoadingScreen from '../shared/components/LoadingScreen';
import NotFoundPage from '../shared/components/NotFoundPage';

// Lazy load admin pages
const AdminPanel = lazy(() => import('./pages/AdminPannel/AdminPannel.jsx'));
const LoginPage = lazy(() => import('./pages/AdminPannel/components/AdminLoginPage.jsx'));
const SignupPage = lazy(() => import('../shared/components/auth/SignupPage'));
const ForgotPassword = lazy(() => import('../shared/components/auth/ForgotPassward'));
const ResetPassword = lazy(() => import('../shared/components/auth/ResetPassword'));
const AuthCallback = lazy(() => import('../shared/components/auth/AuthCallback'));
const LoadingSpinner = () => <LoadingScreen message="Loading Admin Panel..." />;

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth-callback'];

const AdminFallbackRedirect = () => {
  const location = useLocation();
  const basePath = useBasePath();
  let pathname = (location.pathname || '/').replace(/\/$/, '') || '/';
  if (isDevelopment() && pathname.startsWith('/admin')) {
    pathname = pathname.slice('/admin'.length) || '/';
  }
  const isAuthPath = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isAuthPath) {
    if (pathname === '/login' || pathname.startsWith('/login')) return <LoginPage />;
    if (pathname === '/signup' || pathname.startsWith('/signup')) return <SignupPage />;
    if (pathname === '/forgot-password' || pathname.startsWith('/forgot-password'))
      return <ForgotPassword />;
    if (pathname === '/reset-password' || pathname.startsWith('/reset-password'))
      return <ResetPassword />;
    if (pathname === '/auth-callback' || pathname.startsWith('/auth-callback'))
      return <AuthCallback />;
    return <Navigate to={basePath || pathname} replace />;
  }
  return <NotFoundPage />;
};

/**
 * Admin App Module
 * - Production (admin.table-tap.in): pathname is /, /login, /panel, etc.
 * - Development (localhost/admin/*): pathname is /admin, /admin/login — use path prefix so we don't override location.
 */
const AdminAppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route
          index
          element={
            <AdminOnlyWrapper>
              <AdminPanel />
            </AdminOnlyWrapper>
          }
        />
        <Route path="login/*" element={<LoginPage />} />
        <Route path="signup/*" element={<SignupPage />} />
        <Route path="forgot-password/*" element={<ForgotPassword />} />
        <Route path="reset-password/*" element={<ResetPassword />} />
        <Route path="auth-callback/*" element={<AuthCallback />} />
        <Route
          path="panel"
          element={
            <AdminOnlyWrapper>
              <AdminPanel />
            </AdminOnlyWrapper>
          }
        />
        <Route path="*" element={<AdminFallbackRedirect />} />
      </Routes>
    </Suspense>
  );
};

const AdminApp = () => {
  return (
    <BasePathProvider basePathSegment="/admin">
      <AdminRestaurantProvider>
        <ManagerNotificationProvider>
          <AdminAppRoutes />
        </ManagerNotificationProvider>
      </AdminRestaurantProvider>
    </BasePathProvider>
  );
};

export default AdminApp;
