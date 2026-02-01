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
  const [roleError, setRoleError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;
      
      // If no user, AuthWrapper will handle redirect to login
      if (!user?.id) {
        if (mounted) {
          setCheckingRole(false);
          setIsAdmin(false);
        }
        return;
      }

      // Prevent duplicate checks
      if (hasCheckedRef.current) return;
      hasCheckedRef.current = true;

      try {
        // First check user_metadata for role (faster, doesn't need DB query)
        const metadataRole = user.user_metadata?.profile_role;
        if (metadataRole === 'admin') {
          if (mounted) {
            setIsAdmin(true);
            setCheckingRole(false);
          }
          return;
        }

        // Fallback: check profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        if (error) {
          console.error('Admin role check error:', error);
          setRoleError(error.message);
          setIsAdmin(false);
          setCheckingRole(false);
          return;
        }

        const isAdminRole = data?.profile_role === 'admin';
        setIsAdmin(isAdminRole);
        setCheckingRole(false);
      } catch (err) {
        console.error('Admin check failed:', err);
        if (mounted) {
          setRoleError(err.message);
          setIsAdmin(false);
          setCheckingRole(false);
        }
      }
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id, user?.user_metadata?.profile_role]);

  // Reset check flag when user changes
  useEffect(() => {
    hasCheckedRef.current = false;
  }, [user?.id]);

  // AuthWrapper handles redirect to /login / complete-profile etc.
  // After that, we enforce admin-only.
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

  if (!isAdmin) {
    // Show error message briefly before redirect if there was an error
    if (roleError) {
      console.error('Admin access denied due to error:', roleError);
    }
    
    // Redirect non-admins out of admin area.
    // Use replace to avoid back-button returning here.
    return (
      <AuthWrapper>
        {(() => {
          navigate('/home', { replace: true, state: { from: location.pathname } });
          return null;
        })()}
      </AuthWrapper>
    );
  }

  return <AuthWrapper>{children}</AuthWrapper>;
}

