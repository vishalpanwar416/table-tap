import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useAuth } from './AuthContext';
import { useBasePathNavigate } from './BasePathContext';
import AuthWrapper from './AuthWrapper';

const LOADING_TIMEOUT_MS = 8000;

/**
 * AdminOnlyWrapper
 * - Ensures user is authenticated + profile is complete (via AuthWrapper)
 * - Then enforces profiles.profile_role === 'admin'
 */
export default function AdminOnlyWrapper({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useBasePathNavigate();
  const location = useLocation();
  const checkInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const finishChecking = (admin, redirect) => {
      if (!mounted) return;
      setCheckingRole(false);
      setIsAdmin(admin);
      setShouldRedirect(redirect);
      checkInProgressRef.current = false;
    };

    const checkRole = async () => {
      if (authLoading) return;

      if (!user?.id) {
        finishChecking(false, true);
        return;
      }

      // Only trust app_metadata for a fast-path: it is server-controlled and
      // cannot be set by the client. user_metadata is client-writable
      // (supabase.auth.updateUser({ data })), so it must NOT grant access —
      // doing so allowed privilege escalation. The profiles table below is the
      // authoritative source of truth.
      const metadataRole = user.app_metadata?.profile_role || user.app_metadata?.role;

      if (metadataRole && metadataRole.toLowerCase() === 'admin') {
        finishChecking(true, false);
        return;
      }

      if (checkInProgressRef.current) return;
      checkInProgressRef.current = true;

      timeoutId = setTimeout(() => {
        if (!mounted) return;
        console.warn('[AdminOnlyWrapper] Role check timeout');
        finishChecking(false, true);
      }, LOADING_TIMEOUT_MS);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          if (error.name === 'AbortError') return;
          console.error('[AdminCheck] Error:', error);
          setDebugInfo({ error: error.message });
          finishChecking(false, true);
        } else {
          const isAdminRole = data?.profile_role === 'admin';
          setDebugInfo({ profileRole: data?.profile_role, isAdmin: isAdminRole });
          finishChecking(isAdminRole, !isAdminRole);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[AdminCheck] Exception:', err);
        if (mounted) setDebugInfo({ exception: err.message });
        finishChecking(false, true);
      } finally {
        if (mounted) clearTimeout(timeoutId);
        // We don't reset checkInProgressRef here because we want to block until unmount/remount
        // actually we should reset it if we want to allow re-checks?
        // But the robust fix is in cleanup.
      }
    };

    checkRole();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      checkInProgressRef.current = false;
    };
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!checkingRole && !authLoading && shouldRedirect && !isAdmin && mountedRef.current) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [checkingRole, authLoading, shouldRedirect, isAdmin, navigate, location.pathname]);

  // Show loading while checking
  if (checkingRole) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking admin permissions...</p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  // Show loading while redirecting (prevent flash of content)
  if (shouldRedirect && !isAdmin) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8">
            <p className="text-gray-600">Redirecting...</p>
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <p className="text-xs text-red-500 mt-2">Debug: {JSON.stringify(debugInfo)}</p>
            )}
          </div>
        </div>
      </AuthWrapper>
    );
  }

  return <AuthWrapper>{children}</AuthWrapper>;
}
