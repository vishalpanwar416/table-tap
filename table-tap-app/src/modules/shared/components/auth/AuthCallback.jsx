import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/config/AuthContext';
import { supabase } from '../../../shared/supabase';
import { hasValidRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import { authService, syncProfile } from '../../api/authService';
import LoadingScreen from '../LoadingScreen';

/** Fallback path for timeout/error: stay on admin/restaurant root, not /home */
function getDefaultRedirectPath() {
  if (typeof window === 'undefined') return '/home';
  const h = (window.location.hostname || '').toLowerCase();
  const p = window.location.pathname || '';
  if (h.startsWith('admin.') || p.startsWith('/admin')) {
    return h.startsWith('admin.') ? '/' : '/admin';
  }
  if (h.startsWith('restaurant.') || h.startsWith('manager.') || p.startsWith('/restaurant') || p.startsWith('/owner')) {
    return (h.startsWith('restaurant.') || h.startsWith('owner.') || h.startsWith('manager.')) ? '/' : (p.startsWith('/owner') ? '/owner' : '/restaurant');
  }
  return '/home';
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('Initializing...');
  const [redirecting, setRedirecting] = useState(false);
  const checkStarted = React.useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (loading) return;

    if (!user) {
      const hash = window.location.hash;
      const hasToken = hash.includes('access_token') ||
        window.location.search.includes('code=');

      if (hasToken) {
        setStatus('Syncing session...');

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken && !checkStarted.current) {
          checkStarted.current = true;
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          }).catch(e => {
            console.warn('Manual session failed', e);
            checkStarted.current = false; // Allow retry if it failed
          });
        }

        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000);

        return () => clearTimeout(timer);
      }

      navigate('/login');
      return;
    }

    if (redirecting || checkStarted.current) return;

    const runFlow = async () => {
      checkStarted.current = true;
      setRedirecting(true);
      setStatus('Identifying your role...');

      const defaultPath = getDefaultRedirectPath();

      const timeout = setTimeout(() => {
        console.error('[AuthCallback] Redirection timeout');
        navigate(defaultPath, { replace: true });
      }, 10000);

      try {
        const profilePromise = authService.getProfile(user.id);
        const syncPromise = syncProfile(user).catch(e => console.warn('Sync failed:', e));

        const [profile] = await Promise.all([profilePromise, syncPromise]);

        const role = profile?.profile_role || profile?.role || 'customer';
        clearTimeout(timeout);

        // Check environment context
        const h = (typeof window !== 'undefined' && window.location.hostname || '').toLowerCase();
        const path = window.location.pathname;

        // Portal roles (any role that has dashboard access)
        const PORTAL_ROLES = ['owner', 'manager', 'captain', 'chef', 'staff', 'waiter', 'cashier'];

        // Determine context-specific root redirects
        const getPortalRedirect = (targetRole) => {
          if (targetRole === 'admin') return (h.startsWith('admin.') ? '/' : '/admin');
          if (targetRole === 'owner' && path.startsWith('/owner')) return '/owner';
          return (h.startsWith('restaurant.') || h.startsWith('manager.') || h.startsWith('owner.')) ? '/' : '/restaurant';
        };

        if (role === 'admin') {
          setStatus('Welcome back, Admin');
          navigate(getPortalRedirect('admin'), { replace: true });
        } else if (PORTAL_ROLES.includes(role)) {
          setStatus(`Welcome back, ${role.charAt(0).toUpperCase() + role.slice(1)}`);
          navigate(getPortalRedirect(role), { replace: true });
        } else {
          setStatus('Checking profile...');
          const isComplete = Boolean(profile?.mobile_number && profile?.date_of_birth);

          if (!isComplete) {
            navigate('/complete-profile', { replace: true });
          } else {
            setStatus('Finding your table...');
            navigate(hasValidRestaurantSelection() ? '/home' : '/restaurant-selection', { replace: true });
          }
        }
      } catch (error) {
        // Ignore AbortError and stop flow (likely component unmounted or navigated)
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          console.log('[AuthCallback] Fetch aborted');
          checkStarted.current = false;
          // Only retry if we haven't hit a reasonable limit to avoid loops
          if (retryCount < 3) {
            const retryTimer = setTimeout(() => {
              if (mounted) setRetryCount(c => c + 1);
            }, 1000);
            return () => clearTimeout(retryTimer);
          }
          return;
        }

        console.error('[AuthCallback] Login flow failed:', error);
        clearTimeout(timeout);
        // Fallback to default path instead of sticking on loading screen
        if (mounted) navigate(defaultPath, { replace: true });
      }
    };

    runFlow();

    return () => {
      mounted = false;
    };
  }, [user, loading, navigate, redirecting, retryCount]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <LoadingScreen message={status} />
      {/* Dev Diagnostics */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 text-[10px] text-gray-800 font-mono opacity-20">
          U: {user?.id?.slice(0, 8) || 'NONE'} | R: {retryCount} | Hash: {window.location.hash ? 'YES' : 'NO'}
        </div>
      )}
    </div>
  );
};

export default AuthCallback; 