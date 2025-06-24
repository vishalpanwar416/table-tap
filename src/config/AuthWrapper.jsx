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

  // Get URL parameters
  const urlParams = new URLSearchParams(location.search);
  const urlRestaurant = urlParams.get('restaurant');
  const urlTable = urlParams.get('table');

  // Helper function to preserve parameters in navigation
  const navigateWithParams = (path) => {
    const params = urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
    navigate(`${path}${params}`);
  };

  useEffect(() => {
    let mounted = true;

    const checkAuthAndProfile = async () => {
      if (authLoading) return;

      if (!mounted) return;

      // Handle home route redirect
      if (location.pathname === '/' && user) {
        // Check if user has restaurant selection, if not redirect to restaurant selection
        if (hasValidRestaurantSelection()) {
          navigateWithParams('/home');
        } else {
          navigateWithParams('/restaurant-selection');
        }
        return;
      }

      // Public-only route handling
      if (publicOnly) {
        if (user) {
          // Check if user has restaurant selection, if not redirect to restaurant selection
          if (hasValidRestaurantSelection()) {
            navigateWithParams('/home');
          } else {
            navigateWithParams('/restaurant-selection');
          }
        }
        setChecking(false);
        return;
      }

      // Protected route handling
      if (!user) {
        navigateWithParams('/login');
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
            navigateWithParams('/complete-profile');
          }
        } else {
          const needsCompletion = !profile?.mobile_number || !profile?.date_of_birth;

          if (needsCompletion && !location.pathname.startsWith('/complete-profile')) {
            navigateWithParams('/complete-profile');
          } else if (!needsCompletion && location.pathname === '/complete-profile') {
            // After profile completion, check restaurant selection
            if (hasValidRestaurantSelection()) {
              navigateWithParams(location.state?.from || '/home');
            } else {
              navigateWithParams('/restaurant-selection');
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
  }, [navigate, location, publicOnly, user, authLoading, urlRestaurant, urlTable]);

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