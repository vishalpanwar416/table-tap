import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../config/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { needsRestaurantSelection, hasValidRestaurantSelection } from '../utils/restaurantCheck';

const RestaurantSelectionWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRestaurantSelection = () => {
      // Don't redirect if we're already on the restaurant selection page
      if (location.pathname === '/restaurant-selection') {
        setChecking(false);
        return;
      }

      // Don't redirect if we're on auth pages
      const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/complete-profile'];
      if (authPages.includes(location.pathname)) {
        setChecking(false);
        return;
      }

      // Don't redirect if we're on the opening page
      if (location.pathname === '/') {
        setChecking(false);
        return;
      }

      // Don't redirect if we're on the onboarding page
      if (location.pathname === '/skip1') {
        setChecking(false);
        return;
      }

      // If user is authenticated and needs restaurant selection, redirect
      if (user && !authLoading && !restaurantLoading) {
        if (needsRestaurantSelection()) {
          navigate('/restaurant-selection');
          return;
        }
      }

      setChecking(false);
    };

    // Wait for auth and restaurant loading to complete
    if (!authLoading && !restaurantLoading) {
      checkRestaurantSelection();
    }
  }, [user, authLoading, restaurantLoading, location.pathname, navigate]);

  if (checking || authLoading || restaurantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-opacity-20"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-orange-500 absolute top-0 left-0"></div>
          </div>
          <p className="text-white mt-4 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default RestaurantSelectionWrapper; 