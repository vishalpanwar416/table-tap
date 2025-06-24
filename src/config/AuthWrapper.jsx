// AuthWrapper.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { hasValidRestaurantSelection } from '../utils/restaurantCheck';

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
        // Check if user has restaurant selection, if not redirect to restaurant selection
        if (hasValidRestaurantSelection()) {
          navigate('/home');
        } else {
          navigate('/restaurant-selection');
        }
        return;
      }

      // Public-only route handling
      if (publicOnly) {
        if (user) {
          // Check if user has restaurant selection, if not redirect to restaurant selection
          if (hasValidRestaurantSelection()) {
            navigate('/home');
          } else {
            navigate('/restaurant-selection');
          }
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
            // After profile completion, check restaurant selection
            if (hasValidRestaurantSelection()) {
              navigate(location.state?.from || '/home');
            } else {
              navigate('/restaurant-selection');
            }
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