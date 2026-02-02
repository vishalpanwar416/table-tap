import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthWrapper from '../shared/config/AuthWrapper';
import RestaurantDashboardWrapper from '../shared/config/RestaurantDashboardWrapper';
import { AdminRestaurantProvider } from '../shared/context/AdminRestaurantContext';
import { ManagerNotificationProvider } from '../shared/context/ManagerNotificationContext';

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

/**
 * Restaurant App Module
 * Handles all restaurant manager-facing routes and functionality
 */
const RestaurantApp = () => {
    return (
        <AdminRestaurantProvider>
            <ManagerNotificationProvider>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        {/* Auth Routes */}
                        <Route path="/login" element={<RestaurantLoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/auth-callback" element={<AuthCallback />} />

                        {/* Protected Restaurant Dashboard */}
                        <Route path="/" element={
                            <RestaurantDashboardWrapper>
                                <AdminDashboard />
                            </RestaurantDashboardWrapper>
                        } />
                        <Route path="/dashboard" element={
                            <RestaurantDashboardWrapper>
                                <AdminDashboard />
                            </RestaurantDashboardWrapper>
                        } />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </ManagerNotificationProvider>
        </AdminRestaurantProvider>
    );
};

export default RestaurantApp;
