import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/admin-panel.css';

// Core providers that all apps need
import { AuthProvider } from './modules/shared/config/AuthContext';
import { NotificationProvider } from './modules/shared/context/NotificationContext';
import { OrderProvider } from './modules/shared/context/OrderContext';
import ErrorBoundary from './modules/shared/components/ErrorBoundary';
import InstallPrompt from './modules/shared/components/InstallPrompt';
import { register } from './modules/shared/utils/serviceWorkerRegistration';
import { getSubdomain, isDevelopment } from './modules/shared/utils/subdomainRouter';

// Lazy load app modules for better performance
const CustomerApp = lazy(() => import('./modules/customer/CustomerApp'));
const RestaurantApp = lazy(() => import('./modules/restaurant/RestaurantApp'));
const AdminApp = lazy(() => import('./modules/admin/AdminApp'));


import "@fontsource/league-spartan";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import EnvGuard from './modules/shared/config/EnvGuard';

// Register service worker
// register();

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen bg-black">
    <div className="text-center text-white">
      <div className="w-16 h-16 border-4 border-gray-700 border-t-[#2A9D8F] rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-400 font-spartan">Loading Table Tap...</p>
    </div>
  </div>
);

/**
 * Main App Component with Subdomain-based Routing
 * 
 * Routes:
 * - tabletap.com (or localhost/) → Landing Page
 * - app.tabletap.com (or localhost/app/*) → Customer App
 * - restaurant.tabletap.com (or localhost/restaurant/*) → Restaurant Dashboard
 * - admin.tabletap.com (or localhost/admin/*) → Admin Panel
 */
const App = () => {
  // Diagnostic: detect refresh loops
  React.useEffect(() => {
    const now = Date.now();
    const lastReload = parseInt(sessionStorage.getItem('last_reload') || '0');
    const reloadCount = parseInt(sessionStorage.getItem('reload_count') || '0');

    if (now - lastReload < 10000) {
      if (reloadCount > 5) {
        console.error('Refresh loop detected! Stopping Service Workers.');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
        }
        alert('Refresh loop detected. Attempting to fix...');
        sessionStorage.setItem('reload_count', '0');
      } else {
        sessionStorage.setItem('reload_count', (reloadCount + 1).toString());
      }
    } else {
      sessionStorage.setItem('reload_count', '1');
    }
    sessionStorage.setItem('last_reload', now.toString());

    // Break persistent service worker loops
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  // Detect current subdomain
  const subdomain = useMemo(() => getSubdomain(), []);
  const isDevMode = useMemo(() => isDevelopment(), []);

  // Render the appropriate app based on subdomain
  const renderApp = () => {
    // In development, we use path-based routing for convenience
    if (isDevMode) {
      return (
        <Routes>
          {/* Restaurant dashboard routes */}
          <Route path="/restaurant/*" element={
            <Suspense fallback={<LoadingSpinner />}>
              <RestaurantApp />
            </Suspense>
          } />

          {/* Admin panel routes */}
          <Route path="/admin/*" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminApp />
            </Suspense>
          } />

          {/* Customer app routes (Catch-all for development) */}
          <Route path="/*" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CustomerApp />
            </Suspense>
          } />
        </Routes>
      );
    }

    // Production: subdomain-based routing
    // Production: subdomain-based routing
    // Allow path-based overrides for hybrid routing (e.g. /admin on main domain)
    if (window.location.pathname.startsWith('/admin')) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <AdminApp />
        </Suspense>
      );
    }

    if (window.location.pathname.startsWith('/restaurant')) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <RestaurantApp />
        </Suspense>
      );
    }

    switch (subdomain) {
      case 'app':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <CustomerApp />
          </Suspense>
        );
      case 'restaurant':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <RestaurantApp />
          </Suspense>
        );
      case 'admin':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdminApp />
          </Suspense>
        );
      case 'landing':
      default:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <CustomerApp />
          </Suspense>
        );
    }
  };

  return (
    <EnvGuard>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <OrderProvider>
              <div className="min-h-screen bg-black font-spartan">
                {renderApp()}

                {/* Install Prompt - only show for customer app */}
                {(subdomain === 'app' || isDevMode) && <InstallPrompt />}

                {/* Vercel Analytics and Speed Insights */}
                <Analytics />
                <SpeedInsights />
              </div>
            </OrderProvider>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </EnvGuard>
  );
};

export default App;