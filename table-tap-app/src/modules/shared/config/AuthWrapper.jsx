// AuthWrapper.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useAuth } from './AuthContext';
import { hasValidRestaurantSelection } from '../../shared/utils/restaurantCheck';

const AUTH_CHECK_TIMEOUT_MS = 10000;

/** True when on admin or restaurant subdomain (e.g. admin.table-tap.in). Pathname is "/" there, so we must use hostname. */
function isAdminOrRestaurantOrigin() {
  if (typeof window === 'undefined') return false;
  const h = (window.location.hostname || '').toLowerCase();
  return h.startsWith('admin.') || h.startsWith('restaurant.') || h.startsWith('manager.');
}

export default function AuthWrapper({ children, publicOnly = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const timeoutRef = useRef(null);

  const urlParams = new URLSearchParams(location.search);
  const urlRestaurant = urlParams.get('restaurant');
  const urlTable = urlParams.get('table');

  const navigateWithParams = (path) => {
    const params = urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
    navigate(`${path}${params}`);
  };

  useEffect(() => {
    let mounted = true;

    const stopChecking = () => {
      if (mounted) setChecking(false);
    };

    timeoutRef.current = setTimeout(() => {
      if (mounted && checking) {
        console.warn('[AuthWrapper] Auth check timeout');
        stopChecking();
      }
    }, AUTH_CHECK_TIMEOUT_MS);

    const checkAuthAndProfile = async () => {
      if (authLoading) return;

      const onAdminOrRestaurant = isAdminOrRestaurantOrigin();
      const pathIsAdminOrRestaurant = location.pathname.startsWith('/admin') || location.pathname.startsWith('/restaurant');

      // Admin/restaurant app: don't redirect to /home; don't run customer profile check
      if (onAdminOrRestaurant || pathIsAdminOrRestaurant) {
        stopChecking();
        return;
      }

      // Handle root route redirect (customer app only)
      if (location.pathname === '/' && user) {
        if (hasValidRestaurantSelection()) {
          navigateWithParams('/home');
        } else {
          navigateWithParams('/restaurant-selection');
        }
        return;
      }

      if (publicOnly) {
        if (user) {
          if (hasValidRestaurantSelection()) {
            navigateWithParams('/home');
          } else {
            navigateWithParams('/restaurant-selection');
          }
        }
        stopChecking();
        return;
      }

      if (!user) {
        const loginPath = onAdminOrRestaurant
          ? '/login'
          : pathIsAdminOrRestaurant
            ? (location.pathname.startsWith('/admin') ? '/admin/login' : '/restaurant/login')
            : '/login';
        navigateWithParams(loginPath);
        stopChecking();
        return;
      }

      // Profile completion check (customer app only)
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('mobile_number, date_of_birth')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          if (error.name === 'AbortError') return;
          console.error('[AuthWrapper] Profile check error:', error);
        } else if (!profile) {
          navigateWithParams('/complete-profile');
        } else {
          const needsCompletion = !profile?.mobile_number || !profile?.date_of_birth;
          if (needsCompletion && !location.pathname.startsWith('/complete-profile')) {
            navigateWithParams('/complete-profile');
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
      } finally {
        if (mounted) setChecking(false);
      }
    };

    checkAuthAndProfile();

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user?.id, authLoading, publicOnly, location.pathname, location.search]);

  if (checking || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-center p-8">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return children;
}