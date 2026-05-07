import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';
import './styles/admin-panel.css';

// Core providers that all apps need
import { AuthProvider } from './modules/shared/config/AuthContext';
import { NotificationProvider } from './modules/shared/context/NotificationContext';
import ErrorBoundary from './modules/shared/components/ErrorBoundary';
import InstallPrompt from './modules/shared/components/InstallPrompt';
import { register } from './modules/shared/utils/serviceWorkerRegistration';
import { getSubdomain, isDevelopment } from './modules/shared/utils/subdomainRouter';
import { syncPendingActions } from './modules/restaurant/api/admin/orderService';

// Eagerly load CustomerApp for immediate Splash Screen (no initial loading spinner)
import CustomerApp from './modules/customer/CustomerApp';

import '@fontsource/league-spartan';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import EnvGuard from './modules/shared/config/EnvGuard';

// Loading spinner component
import LoadingScreen from './modules/shared/components/LoadingScreen';

// Lazy load other app modules for better performance
const RestaurantApp = lazy(() => import('./modules/restaurant/RestaurantApp'));
const AdminApp = lazy(() => import('./modules/admin/AdminApp'));
const OwnerApp = lazy(() => import('./modules/owner/OwnerApp'));
const AuthCallback = lazy(() => import('./modules/shared/components/auth/AuthCallback'));

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
  const location = useLocation();
  // Diagnostic: detect refresh loops
  React.useEffect(() => {
    const now = Date.now();
    const lastReload = parseInt(sessionStorage.getItem('last_reload') || '0');
    const reloadCount = parseInt(sessionStorage.getItem('reload_count') || '0');

    if (now - lastReload < 10000) {
      if (reloadCount > 5) {
        console.error('Refresh loop detected! Stopping Service Workers.');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker
            .getRegistrations()
            .then((regs) => regs.forEach((r) => r.unregister()));
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

    // Offline sync listener
    const handleOnline = async () => {
      console.log('App is online, syncing pending actions...');
      try {
        await syncPendingActions();
        toast.success('Back online! Synced offline changes.');
      } catch (error) {
        console.error('Sync failed:', error);
        toast.error('Failed to sync offline changes.');
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Detect current subdomain
  const subdomain = useMemo(() => getSubdomain(), []);
  const isDevMode = useMemo(() => isDevelopment(), []);

  // Render the appropriate app based on subdomain
  const renderApp = () => {
    const pathname = location.pathname;
    console.log('[App] Routing decision:', { isDevMode, subdomain, pathname });

    // In development, we use path-based routing for convenience
    if (isDevMode) {
      console.log('[App] Using dev mode routing (React Router)');
      return (
        <Routes>
          {/* Top-level callback to prevent unmounting during auth logic */}
          <Route
            path="/auth-callback"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
                <AuthCallback />
              </Suspense>
            }
          />

          {/* Restaurant dashboard routes */}
          <Route
            path="/restaurant/*"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
                <RestaurantApp />
              </Suspense>
            }
          />

          {/* Admin panel routes */}
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
                <AdminApp />
              </Suspense>
            }
          />

          {/* Owner panel routes */}
          <Route
            path="/owner/*"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
                <OwnerApp />
              </Suspense>
            }
          />

          {/* Customer app routes (Catch-all for development) */}
          <Route path="/*" element={<CustomerApp />} />
        </Routes>
      );
    }

    // Production: subdomain-based routing
    // Auth callback: handle /auth-callback and legacy /restaurant/auth-callback, /admin/auth-callback
    // so OAuth redirects complete and tokens are not lost (e.g. on restaurant.table-tap.in)
    const isAuthCallback =
      pathname === '/auth-callback' ||
      pathname === '/restaurant/auth-callback' ||
      pathname === '/admin/auth-callback';
    if (isAuthCallback) {
      return (
        <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
          <AuthCallback />
        </Suspense>
      );
    }

    if (pathname.startsWith('/admin')) {
      console.log('[App] Loading AdminApp for /admin path');
      return (
        <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
          <AdminApp />
        </Suspense>
      );
    }

    // Explicitly handle restaurant-selection via CustomerApp BEFORE checking /restaurant prefix
    if (pathname.startsWith('/restaurant-selection')) {
      return <CustomerApp />;
    }

    if (pathname.startsWith('/restaurant')) {
      console.log('[App] Loading RestaurantApp for /restaurant path');
      return (
        <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
          <RestaurantApp />
        </Suspense>
      );
    }

    console.log('[App] Loading app based on subdomain:', subdomain);
    switch (subdomain) {
      case 'app':
        return <CustomerApp />;
      case 'restaurant':
        return (
          <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
            <RestaurantApp />
          </Suspense>
        );
      case 'owner':
        return (
          <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
            <OwnerApp />
          </Suspense>
        );
      case 'admin':
        return (
          <Suspense fallback={<LoadingScreen message="Loading Table Tap..." />}>
            <AdminApp />
          </Suspense>
        );
      case 'landing':
      default:
        return <CustomerApp />;
    }
  };

  return (
    <EnvGuard>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-black font-spartan">
              {renderApp()}

              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#111827', // text-gray-900
                    border: '1px solid #E5E7EB', // border-gray-200 default
                    padding: '12px 16px', // p-3 equivalent
                    borderRadius: '12px', // rounded-lg +
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)', // Exact shadow from location toast
                    fontSize: '14px',
                    fontWeight: '600', // font-semibold
                    maxWidth: '90vw', // Mobile responsive width
                    width: 'fit-content',
                  },
                  success: {
                    iconTheme: {
                      primary: '#22c55e', // Green-500
                      secondary: '#fff',
                    },
                    style: {
                      border: '1px solid #BBF7D0', // border-green-200
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444', // Red-500
                      secondary: '#fff',
                    },
                    style: {
                      border: '1px solid #FECACA', // border-red-200
                    },
                  },
                  loading: {
                    iconTheme: {
                      primary: '#F97316', // Orange-500 (Brand color)
                      secondary: '#fff',
                    },
                    style: {
                      border: '1px solid #FED7AA', // border-orange-200 warning/loading type
                    },
                  },
                }}
                containerStyle={{
                  top: 20, // Standard spacing
                  left: 20,
                  right: 20,
                }}
              />

              {/* Install Prompt - only show for customer app */}
              {(subdomain === 'app' || isDevMode) && <InstallPrompt />}

              {/* Vercel Analytics and Speed Insights */}
              <Analytics />
              <SpeedInsights />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </EnvGuard>
  );
};

export default App;
