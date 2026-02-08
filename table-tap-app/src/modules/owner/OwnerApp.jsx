import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminRestaurantProvider } from '../shared/context/AdminRestaurantContext';
import { BasePathProvider } from '../shared/config/BasePathContext';
import { ManagerNotificationProvider } from '../shared/context/ManagerNotificationContext';
import LoadingScreen from '../shared/components/LoadingScreen';

import OwnerOnlyWrapper from '../shared/config/OwnerOnlyWrapper';

// Lazy load
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));

const LoadingSpinner = () => <LoadingScreen message="Loading Owner Dashboard..." />;

const OwnerApp = () => {
    return (
        <BasePathProvider basePathSegment="/owner">
            <AdminRestaurantProvider>
                <ManagerNotificationProvider>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route path="/" element={
                                <OwnerOnlyWrapper>
                                    <OwnerDashboard />
                                </OwnerOnlyWrapper>
                            } />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </ManagerNotificationProvider>
            </AdminRestaurantProvider>
        </BasePathProvider>
    );
};

export default OwnerApp;
