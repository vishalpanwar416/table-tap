import { useEffect, useState } from 'react';
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      if (authLoading) return;
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        if (error) {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(data?.profile_role === 'admin');
      } finally {
        if (mounted) setCheckingRole(false);
      }
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id]);

  // AuthWrapper handles redirect to /login / complete-profile etc.
  // After that, we enforce admin-only.
  if (checkingRole) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking permissions...</p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  if (!isAdmin) {
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

