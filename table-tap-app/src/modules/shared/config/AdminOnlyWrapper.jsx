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
  const navigate = useNavigate();
  const location = useLocation();
  const checkInProgressRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }
      
      // If no user, AuthWrapper will handle redirect to login
      if (!user?.id) {
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

      try {
        // First check user_metadata for role (faster, doesn't need DB query)
        const metadataRole = user.user_metadata?.profile_role;
        if (metadataRole === 'admin') {
          if (mounted) {
            setIsAdmin(true);
            setCheckingRole(false);
            setShouldRedirect(false);
          }
          return;
        }

        // Fallback: check profiles table with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const queryPromise = supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', user.id)
          .single();

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (!mounted) return;

        if (error) {
          console.error('Admin role check error:', error);
          // On error, don't immediately redirect - could be network issue
          // Check if we should retry or show error
          setIsAdmin(false);
          setShouldRedirect(true);
          setCheckingRole(false);
          return;
        }

        const isAdminRole = data?.profile_role === 'admin';
        setIsAdmin(isAdminRole);
        setShouldRedirect(!isAdminRole);
        setCheckingRole(false);
      } catch (err) {
        console.error('Admin check failed:', err);
        if (mounted) {
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
  }, [authLoading, user?.id, user?.user_metadata?.profile_role]);

  // Handle redirect in useEffect (not during render)
  useEffect(() => {
    if (!checkingRole && shouldRedirect && !isAdmin) {
      navigate('/home', { replace: true, state: { from: location.pathname } });
    }
  }, [checkingRole, shouldRedirect, isAdmin, navigate, location.pathname]);

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
          </div>
        </div>
      </AuthWrapper>
    );
  }

  return <AuthWrapper>{children}</AuthWrapper>;
}

