import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../config/AuthContext';
import { hasValidRestaurantSelection } from '../../utils/restaurantCheck';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !redirecting) {
      setRedirecting(true);
      
      if (user) {
        // User is authenticated, check restaurant selection
        if (hasValidRestaurantSelection()) {
          navigate('/home');
        } else {
          navigate('/restaurant-selection');
        }
      } else {
        // No user, redirect to login
        navigate('/login');
      }
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