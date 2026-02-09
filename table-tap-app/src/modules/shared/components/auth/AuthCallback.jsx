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
        // Double check user if coming from useAuth, or fetch if we just set session
        let currentUser = user;
        if (!currentUser) {
          const { data: { user: freshlyFetchedUser } } = await supabase.auth.getUser();
          currentUser = freshlyFetchedUser;
        }

        if (!currentUser) {
          throw new Error('No user found after session sync');
        }

        const profilePromise = authService.getProfile(currentUser.id);
        const syncPromise = syncProfile(currentUser).catch(e => console.warn('Sync failed:', e));

        const [profile] = await Promise.all([profilePromise, syncPromise]);

        const role = profile?.profile_role || profile?.role || 'customer';
        clearTimeout(timeout);

        // Check environment context
        const h = (typeof window !== 'undefined' && window.location.hostname || '').toLowerCase();
        const isCustomerOrigin = !h.startsWith('admin.') && !h.startsWith('restaurant.') && !h.startsWith('manager.') && !h.startsWith('owner.');

        // Portal roles
        const RESTAURANT_ROLES = ['owner', 'manager', 'captain', 'chef', 'staff', 'waiter', 'cashier'];

        if (isCustomerOrigin) {
          // Customer App: Allow everyone, treat as customer
          setStatus('Finding your table...');
          const isComplete = Boolean(profile?.mobile_number && profile?.date_of_birth);
          if (!isComplete) {
            navigate('/complete-profile', { replace: true });
          } else {
            navigate(hasValidRestaurantSelection() ? '/home' : '/restaurant-selection', { replace: true });
          }
        } else if (h.startsWith('admin.')) {
          // Admin Portal: Strict Admin Only
          if (role === 'admin') {
            setStatus('Welcome back, Admin');
            navigate('/', { replace: true }); // Admin dashboard root
          } else {
            setStatus('Access Denied');
            throw new Error('Only administrators can access this portal.');
          }
        } else {
          // Restaurant/Partner Portal
          if (RESTAURANT_ROLES.includes(role)) {
            setStatus('Welcome back');
            navigate('/', { replace: true }); // Restaurant dashboard root
          } else if (role === 'admin') {
            // Admins can probably access restaurant portal too, or maybe not. User said "do not allow anyone else to log in using admin page".
            // Detailed request: "do not allower customer to login using restauarnt or admin login page". 
            // Assuming Admin is powerful enough, but safe to redirect to admin portal if they are admin? 
            // Or just let them in if the system allows. 
            // Current logic: Admin on Restaurant Portal -> Redirect to Admin Dashboard?
            // Or just Allow? Let's assume Admin is NOT a restaurant user for now unless they have that role. 
            // But wait, key requirement: "do not allow customer to login using restauarnt".
            // So if role == 'customer', DENY.

            // If Admin tries to login to Restaurant Portal, let's Redirect to Admin Portal if possible, or Deny. 
            // Let's Deny for strictness as requested "do not allow anyone else".
            // Actually, usually admins can impersonate. But let's stick to strict role check.
            setStatus('Access Denied');
            throw new Error('Access reserved for restaurant partners.');
          } else {
            setStatus('Access Denied');
            throw new Error('Customers cannot access the partner portal.');
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