import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useAuth } from './AuthContext';
import AuthWrapper from './AuthWrapper';

/**
 * AdminOnlyWrapper
 * - Ensures user is authenticated + profile is complete (via AuthWrapper)
 * - Then enforces profiles.profile_role === 'admin'
 */
export default function AdminOnlyWrapper({ children }) {
  // Log immediately when component renders
  console.log('[AdminOnlyWrapper] Component rendering...');

  const { user, loading: authLoading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const checkInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  console.log('[AdminOnlyWrapper] State:', { authLoading, userId: user?.id, checkingRole, isAdmin });

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      if (authLoading) return;

      if (!user?.id) {
        if (mounted) {
          setCheckingRole(false);
          setIsAdmin(false);
          setShouldRedirect(true);
        }
        return;
      }

      // Check if we already have the info in metadata to avoid unnecessary DB call
      const metadataRole = user.user_metadata?.profile_role || user.app_metadata?.profile_role;
      if (metadataRole === 'admin') {
        if (mounted) {
          setIsAdmin(true);
          setCheckingRole(false);
          setShouldRedirect(false);
        }
        return;
      }

      if (checkInProgressRef.current) return;
      checkInProgressRef.current = true;

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
          setIsAdmin(false);
          setShouldRedirect(true);
        } else {
          const isAdminRole = data?.profile_role === 'admin';
          setDebugInfo({ profileRole: data?.profile_role, isAdmin: isAdminRole });
          setIsAdmin(isAdminRole);
          setShouldRedirect(!isAdminRole);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[AdminCheck] Exception:', err);
        if (mounted) {
          setDebugInfo({ exception: err.message });
          setIsAdmin(false);
          setShouldRedirect(true);
        }
      } finally {
        if (mounted) {
          setCheckingRole(false);
          checkInProgressRef.current = false;
        }
      }
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id]);

  useEffect(() => {
    // Only redirect if NOT loading and we are sure they are NOT an admin
    if (!checkingRole && !authLoading && shouldRedirect && !isAdmin && mountedRef.current) {
      console.log('[AdminCheck] Redirecting to /login');
      // Redirect to login with preserving the current location so we can redirect back after login
      navigate('/login', {
        replace: true,
        state: { from: location.pathname }
      });
    }
  }, [checkingRole, authLoading, shouldRedirect, isAdmin, navigate]);

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

