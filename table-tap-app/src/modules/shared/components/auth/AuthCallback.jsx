import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/config/AuthContext';
import { hasValidRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import { authService, syncProfile } from '../../api/authService';
import LoadingScreen from '../LoadingScreen';
import {
  isAdminHost,
  isCustomerAppOrigin,
  isRestaurantPortalHost,
} from '../../utils/subdomainRouter';

const RESTAURANT_ROLES = ['owner', 'manager', 'captain', 'chef', 'staff', 'waiter', 'cashier'];

function getDefaultRedirectPath() {
  if (typeof window === 'undefined') return '/home';
  const p = window.location.pathname || '';
  if (isAdminHost() || p.startsWith('/admin')) {
    return isAdminHost() ? '/' : '/admin';
  }
  if (isRestaurantPortalHost() || p.startsWith('/restaurant') || p.startsWith('/owner')) {
    return isRestaurantPortalHost() ? '/' : p.startsWith('/owner') ? '/owner' : '/restaurant';
  }
  return '/home';
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('Syncing session...');
  const redirectingRef = useRef(false);

  // Safety net — if nothing resolves in 15 s, go to login
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      console.warn('[AuthCallback] 15 s safety timeout — redirecting to /login');
      navigate('/login', { replace: true });
    }, 15000);
    return () => clearTimeout(safetyTimer);
  }, []); // run once on mount

  // When AuthContext has a user (set by detectSessionInUrl → onAuthStateChange),
  // determine role and redirect to the correct area of the app.
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (redirectingRef.current) return;

    redirectingRef.current = true;
    setStatus('Identifying your role...');

    const run = async () => {
      const defaultPath = getDefaultRedirectPath();
      const fallbackTimer = setTimeout(() => navigate(defaultPath, { replace: true }), 10000);

      try {
        const [profile] = await Promise.all([
          authService.getProfile(user.id),
          syncProfile(user).catch((e) => console.warn('[AuthCallback] Sync non-critical:', e)),
        ]);

        clearTimeout(fallbackTimer);

        const role = profile?.profile_role || profile?.role || 'customer';

        if (isCustomerAppOrigin()) {
          setStatus('Finding your table...');
          const isComplete = Boolean(profile?.mobile_number && profile?.date_of_birth);
          navigate(
            isComplete
              ? hasValidRestaurantSelection()
                ? '/home'
                : '/restaurant-selection'
              : '/complete-profile',
            { replace: true },
          );
        } else if (isAdminHost()) {
          if (role === 'admin') navigate('/', { replace: true });
          else throw new Error('Admin-only portal');
        } else {
          if (RESTAURANT_ROLES.includes(role)) navigate('/', { replace: true });
          else throw new Error('Customers cannot access this portal');
        }
      } catch (err) {
        console.error('[AuthCallback] Redirect failed:', err);
        clearTimeout(fallbackTimer);
        navigate(getDefaultRedirectPath(), { replace: true });
      }
    };

    run();
  }, [user, loading, navigate]);

  // If loading finished and there's no user AND no token in the URL → go to login
  useEffect(() => {
    if (loading) return;
    if (user) return;

    const hasCode = !!new URLSearchParams(window.location.search).get('code');
    const hasHashToken = window.location.hash.includes('access_token');

    if (!hasCode && !hasHashToken) {
      console.warn('[AuthCallback] No user, no token — redirecting to /login');
      navigate('/login', { replace: true });
    }
    // If there IS a token, wait for detectSessionInUrl + onAuthStateChange to set the user.
    // The 15 s safety timer above is the last-resort fallback.
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <LoadingScreen message={status} />
    </div>
  );
};

export default AuthCallback;
