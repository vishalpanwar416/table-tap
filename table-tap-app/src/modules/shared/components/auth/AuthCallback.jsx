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
  if (h.startsWith('admin.')) return '/';
  if (h.startsWith('restaurant.') || h.startsWith('manager.')) return '/';
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
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          }).catch(e => console.warn('Manual session failed', e));
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

        const role = profile?.profile_role || 'customer';
        clearTimeout(timeout);

        if (role === 'admin') {
          setStatus('Welcome back, Admin');
          const h = (typeof window !== 'undefined' && window.location.hostname || '').toLowerCase();
          navigate(h.startsWith('admin.') ? '/' : '/admin', { replace: true });
        } else if (role === 'manager' || role === 'captain') {
          setStatus('Welcome back, Manager');
          const h = (typeof window !== 'undefined' && window.location.hostname || '').toLowerCase();
          navigate(h.startsWith('restaurant.') || h.startsWith('manager.') ? '/' : '/restaurant', { replace: true });
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
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          checkStarted.current = false;
          setRedirecting(false);
          setTimeout(() => setRetryCount(c => c + 1), 500);
          return;
        }

        console.error('[AuthCallback] Login flow failed:', error);
        clearTimeout(timeout);
        navigate(defaultPath, { replace: true });
      }
    };

    runFlow();
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