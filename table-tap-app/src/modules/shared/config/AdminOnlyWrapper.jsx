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
  const { user, loading: authLoading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const checkInProgressRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('[AdminCheck] Auth still loading...');
        return;
      }
      
      // If no user, AuthWrapper will handle redirect to login
      if (!user?.id) {
        console.log('[AdminCheck] No user found');
        if (mounted) {
          setCheckingRole(false);
          setIsAdmin(false);
          setShouldRedirect(true);
        }
        return;
      }

      // Prevent duplicate concurrent checks
      if (checkInProgressRef.current) return;
      checkInProgressRef.current = true;

      console.log('[AdminCheck] Checking role for user:', user.id);
      console.log('[AdminCheck] user_metadata:', user.user_metadata);
      console.log('[AdminCheck] app_metadata:', user.app_metadata);

      try {
        // Check multiple sources for admin role
        const metadataRole = user.user_metadata?.profile_role;
        const appMetadataRole = user.app_metadata?.profile_role;
        
        console.log('[AdminCheck] metadataRole:', metadataRole);
        console.log('[AdminCheck] appMetadataRole:', appMetadataRole);

        // Check user_metadata first
        if (metadataRole === 'admin') {
          console.log('[AdminCheck] Admin found in user_metadata');
          if (mounted) {
            setIsAdmin(true);
            setCheckingRole(false);
            setShouldRedirect(false);
          }
          return;
        }

        // Check app_metadata (set by Supabase admin)
        if (appMetadataRole === 'admin') {
          console.log('[AdminCheck] Admin found in app_metadata');
          if (mounted) {
            setIsAdmin(true);
            setCheckingRole(false);
            setShouldRedirect(false);
          }
          return;
        }

        // Fallback: check profiles table
        console.log('[AdminCheck] Checking profiles table...');
        
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', user.id)
          .single();

        console.log('[AdminCheck] Profile query result:', { data, error });

        if (!mounted) return;

        if (error) {
          console.error('[AdminCheck] Profile query error:', error);
          setDebugInfo({ error: error.message, code: error.code });
          setIsAdmin(false);
          setShouldRedirect(true);
          setCheckingRole(false);
          return;
        }

        const profileRole = data?.profile_role;
        console.log('[AdminCheck] Profile role from DB:', profileRole);
        
        const isAdminRole = profileRole === 'admin';
        setDebugInfo({ profileRole, isAdmin: isAdminRole });
        setIsAdmin(isAdminRole);
        setShouldRedirect(!isAdminRole);
        setCheckingRole(false);
      } catch (err) {
        console.error('[AdminCheck] Exception:', err);
        if (mounted) {
          setDebugInfo({ exception: err.message });
          setIsAdmin(false);
          setShouldRedirect(true);
          setCheckingRole(false);
        }
      } finally {
        checkInProgressRef.current = false;
      }
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id, user?.user_metadata?.profile_role, user?.app_metadata?.profile_role]);

  // Handle redirect in useEffect (not during render)
  useEffect(() => {
    if (!checkingRole && shouldRedirect && !isAdmin) {
      console.log('[AdminCheck] Redirecting to /home. Debug info:', debugInfo);
      navigate('/home', { replace: true, state: { from: location.pathname } });
    }
  }, [checkingRole, shouldRedirect, isAdmin, navigate, location.pathname, debugInfo]);

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

