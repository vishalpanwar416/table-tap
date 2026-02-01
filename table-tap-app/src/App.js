import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import LoadingScreen from './modules/shared/components/LoadingScreen';
const LoadingSpinner = () => <LoadingScreen message="Loading Table Tap..." />;

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
    const pathname = window.location.pathname;
    console.log('[App] Routing decision:', { isDevMode, subdomain, pathname });
    
    // In development, we use path-based routing for convenience
    if (isDevMode) {
      console.log('[App] Using dev mode routing (React Router)');
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
    // Allow path-based overrides for hybrid routing (e.g. /admin on main domain)
    if (pathname.startsWith('/admin')) {
      console.log('[App] Loading AdminApp for /admin path');
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <AdminApp />
        </Suspense>
      );
    }

    if (pathname.startsWith('/restaurant')) {
      console.log('[App] Loading RestaurantApp for /restaurant path');
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <RestaurantApp />
        </Suspense>
      );
    }

    console.log('[App] Loading app based on subdomain:', subdomain);
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

                <Toaster
                  position="top-center"
                  toastOptions={{
                    style: {
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(12px)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '50px',
                      padding: '10px 20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      fontSize: '14px',
                      fontWeight: '500',
                      letterSpacing: '0.02em',
                      maxWidth: '350px',
                    },
                    success: {
                      iconTheme: {
                        primary: '#4ADE80', // Green accent
                        secondary: '#fff',
                      },
                      style: {
                        border: '1px solid rgba(74, 222, 128, 0.3)', // Subtle green border
                      }
                    },
                    error: {
                      iconTheme: {
                        primary: '#EF4444', // Red accent
                        secondary: '#fff',
                      },
                      style: {
                        border: '1px solid rgba(239, 68, 68, 0.3)', // Subtle red border
                      }
                    },
                  }}
                  containerStyle={{
                    top: 20,
                  }}
                />

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