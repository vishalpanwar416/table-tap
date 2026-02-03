import React, { Suspense, lazy, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import RestaurantDashboardWrapper from '../shared/config/RestaurantDashboardWrapper';
import { AdminRestaurantProvider } from '../shared/context/AdminRestaurantContext';
import { ManagerNotificationProvider } from '../shared/context/ManagerNotificationContext';
import { BasePathProvider, useBasePath } from '../shared/config/BasePathContext';
import { isDevelopment } from '../shared/utils/subdomainRouter';

// Lazy load restaurant pages
const AdminDashboard = lazy(() => import('./pages/RestaurantManagement/adminDashboard'));
const RestaurantLoginPage = lazy(() => import('./components/auth/RestaurantLoginPage'));
const SignupPage = lazy(() => import('../shared/components/auth/SignupPage'));
const ForgotPassword = lazy(() => import('../shared/components/auth/ForgotPassward'));
const ResetPassword = lazy(() => import('../shared/components/auth/ResetPassword'));
const AuthCallback = lazy(() => import('../shared/components/auth/AuthCallback'));

// Use unified loading component
import LoadingScreen from '../shared/components/LoadingScreen';
const LoadingSpinner = () => <LoadingScreen message="Loading Restaurant Dashboard..." />;

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth-callback'];

const RestaurantFallbackRedirect = () => {
    const location = useLocation();
    let pathname = (location.pathname || '/').replace(/\/$/, '') || '/';
    if (isDevelopment() && pathname.startsWith('/restaurant')) {
        pathname = pathname.slice('/restaurant'.length) || '/';
    }
    const isAuthPath = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (isAuthPath) {
        if (pathname === '/login' || pathname.startsWith('/login')) return <RestaurantLoginPage />;
        if (pathname === '/signup' || pathname.startsWith('/signup')) return <SignupPage />;
        if (pathname === '/forgot-password' || pathname.startsWith('/forgot-password')) return <ForgotPassword />;
        if (pathname === '/reset-password' || pathname.startsWith('/reset-password')) return <ResetPassword />;
        if (pathname === '/auth-callback' || pathname.startsWith('/auth-callback')) return <AuthCallback />;
        return <Navigate to={pathname} replace />;
    }
    return <Navigate to="/" replace />;
};

/**
 * Restaurant App Module
 * - Production (restaurant.table-tap.in): pathname is /, /login, /dashboard, etc.
 * - Development (localhost/restaurant/*): pathname is /restaurant, /restaurant/login — use path prefix so we don't override location.
 */
const RestaurantAppRoutes = () => {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route index element={
                    <RestaurantDashboardWrapper>
                        <AdminDashboard />
                    </RestaurantDashboardWrapper>
                } />
                <Route path="login/*" element={<RestaurantLoginPage />} />
                <Route path="signup/*" element={<SignupPage />} />
                <Route path="forgot-password/*" element={<ForgotPassword />} />
                <Route path="reset-password/*" element={<ResetPassword />} />
                <Route path="auth-callback/*" element={<AuthCallback />} />
                <Route path="dashboard" element={
                    <RestaurantDashboardWrapper>
                        <AdminDashboard />
                    </RestaurantDashboardWrapper>
                } />
                <Route path="*" element={<RestaurantFallbackRedirect />} />
            </Routes>
        </Suspense>
    );
};

const RestaurantApp = () => {
    return (
        <BasePathProvider basePathSegment="/restaurant">
            <AdminRestaurantProvider>
                <ManagerNotificationProvider>
                    <RestaurantAppRoutes />
                </ManagerNotificationProvider>
            </AdminRestaurantProvider>
        </BasePathProvider>
    );
};

export default RestaurantApp;
