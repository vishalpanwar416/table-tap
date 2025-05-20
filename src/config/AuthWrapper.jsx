// AuthWrapper.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

export default function AuthWrapper({ children, publicOnly = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let mounted = true;

    const checkAuthAndProfile = async () => {
      if (authLoading) return;

      if (!mounted) return;

      // Handle home route redirect
      if (location.pathname === '/' && user) {
        navigate('/home');
        return;
      }

      // Public-only route handling
      if (publicOnly) {
        if (user) {
          navigate('/home');
        }
        setChecking(false);
        return;
      }

      // Protected route handling
      if (!user) {
        navigate('/login', { state: { from: location.pathname } });
        setChecking(false);
        return;
      }

      // Profile completion check
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('mobile_number, date_of_birth')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        if (error) {
          console.error("Profile check error:", error);
          if (error.code === 'PGRST116') {
            // Profile doesn't exist, redirect to complete profile
            navigate('/complete-profile', { state: { from: location.pathname } });
          }
        } else {
          const needsCompletion = !profile?.mobile_number || !profile?.date_of_birth;

          if (needsCompletion && !location.pathname.startsWith('/complete-profile')) {
            navigate('/complete-profile', { state: { from: location.pathname } });
          } else if (!needsCompletion && location.pathname === '/complete-profile') {
            navigate(location.state?.from || '/home');
          }
        }
      } catch (error) {
        console.error("Unexpected error in profile check:", error);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkAuthAndProfile();

    return () => {
      mounted = false;
    };
  }, [navigate, location, publicOnly, user, authLoading]);

  if (checking || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return children;
}