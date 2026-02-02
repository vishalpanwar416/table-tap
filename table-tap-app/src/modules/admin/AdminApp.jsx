import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthWrapper from '../shared/config/AuthWrapper';
import AdminOnlyWrapper from '../shared/config/AdminOnlyWrapper';
import { AdminRestaurantProvider } from '../shared/context/AdminRestaurantContext';
import { ManagerNotificationProvider } from '../shared/context/ManagerNotificationContext';
import { BasePathProvider, useEffectiveLocation } from '../shared/config/BasePathContext';
import { isDevelopment } from '../shared/utils/subdomainRouter';

// Lazy load admin pages
const AdminPanel = lazy(() => import('./pages/AdminPannel/AdminPannel'));
const LoginPage = lazy(() => import('../shared/components/auth/LoginPage'));
const SignupPage = lazy(() => import('../shared/components/auth/SignupPage'));
const ForgotPassword = lazy(() => import('../shared/components/auth/ForgotPassward'));
const ResetPassword = lazy(() => import('../shared/components/auth/ResetPassword'));
const AuthCallback = lazy(() => import('../shared/components/auth/AuthCallback'));

const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-[#2A9D8F] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading Admin Panel...</p>
        </div>
    </div>
);

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth-callback'];

const AdminFallbackRedirect = () => {
    const location = useLocation();
    let pathname = (location.pathname || '/').replace(/\/$/, '') || '/';
    if (isDevelopment() && pathname.startsWith('/admin')) {
        pathname = pathname.slice('/admin'.length) || '/';
    }
    const isAuthPath = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (isAuthPath) {
        if (pathname === '/login' || pathname.startsWith('/login')) return <LoginPage />;
        if (pathname === '/signup' || pathname.startsWith('/signup')) return <SignupPage />;
        if (pathname === '/forgot-password' || pathname.startsWith('/forgot-password')) return <ForgotPassword />;
        if (pathname === '/reset-password' || pathname.startsWith('/reset-password')) return <ResetPassword />;
        if (pathname === '/auth-callback' || pathname.startsWith('/auth-callback')) return <AuthCallback />;
        return <Navigate to={pathname} replace />;
    }
    return <Navigate to="/" replace />;
};

/**
 * Admin App Module
 * - Production (admin.table-tap.in): pathname is /, /login, /panel, etc.
 * - Development (localhost/admin/*): pathname is /admin/login — we pass effectiveLocation so Routes see /login.
 */
const AdminAppRoutes = () => {
    const effectiveLocation = useEffectiveLocation('/admin');
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes location={effectiveLocation}>
                <Route index element={
                    <AdminOnlyWrapper>
                        <AdminPanel />
                    </AdminOnlyWrapper>
                } />
                <Route path="/login/*" element={<LoginPage />} />
                <Route path="/signup/*" element={<SignupPage />} />
                <Route path="/forgot-password/*" element={<ForgotPassword />} />
                <Route path="/reset-password/*" element={<ResetPassword />} />
                <Route path="/auth-callback/*" element={<AuthCallback />} />
                <Route path="/panel" element={
                    <AdminOnlyWrapper>
                        <AdminPanel />
                    </AdminOnlyWrapper>
                } />
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
