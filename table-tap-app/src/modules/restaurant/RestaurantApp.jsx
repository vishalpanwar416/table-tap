import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthWrapper from '../shared/config/AuthWrapper';
import RestaurantDashboardWrapper from '../shared/config/RestaurantDashboardWrapper';
import { AdminRestaurantProvider } from '../shared/context/AdminRestaurantContext';
import { ManagerNotificationProvider } from '../shared/context/ManagerNotificationContext';

// Lazy load restaurant pages
const AdminDashboard = lazy(() => import('./pages/RestaurantManagement/adminDashboard'));
const LoginPage = lazy(() => import('../shared/components/auth/LoginPage'));
const SignupPage = lazy(() => import('../shared/components/auth/SignupPage'));
const ForgotPassword = lazy(() => import('../shared/components/auth/ForgotPassward'));
const ResetPassword = lazy(() => import('../shared/components/auth/ResetPassword'));
const AuthCallback = lazy(() => import('../shared/components/auth/AuthCallback'));

// Loading component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-[#2A9D8F] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading Restaurant Dashboard...</p>
        </div>
    </div>
);

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
                        <Route path="/login" element={<LoginPage />} />
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
