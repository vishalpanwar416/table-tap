import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/config/AuthContext';
import { hasValidRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import { authService } from '../../api/authService';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !redirecting && user) {
      setRedirecting(true);
      
      const checkProfileAndRedirect = async () => {
        try {
          // First check if profile is complete
          const isProfileComplete = await authService.isProfileComplete(user.id);
          
          if (!isProfileComplete) {
            // Profile is not complete, redirect to complete profile
            navigate('/complete-profile');
            return;
          }
          
          // Profile is complete, check restaurant selection
          if (hasValidRestaurantSelection()) {
            navigate('/home');
          } else {
            navigate('/restaurant-selection');
          }
        } catch (error) {
          // If there's an error checking profile, assume it needs completion
          navigate('/complete-profile');
        }
      };
      
      checkProfileAndRedirect();
    } else if (!loading && !user) {
      // No user, redirect to login
      navigate('/login');
    }
  }, [user, loading, navigate, redirecting]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 