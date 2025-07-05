import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../config/AuthContext';
import { useRestaurant } from './RestaurantContext';
import { needsRestaurantSelection, hasValidRestaurantSelection } from '../../utils/restaurantCheck';
import RestaurantSelectionPage from './RestaurantSelectionPage';

const RestaurantSelectionWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { restaurantId, loading, error } = useRestaurant();
  const [checking, setChecking] = useState(true);

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
      if (user && !authLoading && !loading) {
        if (needsRestaurantSelection()) {
          navigateWithParams('/restaurant-selection');
          return;
        }
      }

      setChecking(false);
    };

    // Wait for auth and restaurant loading to complete
    if (!authLoading && !loading) {
      checkRestaurantSelection();
    }
  }, [user, authLoading, loading, location.pathname, navigate, urlRestaurant, urlTable]);

  if (checking || authLoading || loading) {
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

  // If no restaurant is selected, show restaurant selection page
  if (!restaurantId) {
    return <RestaurantSelectionPage />;
  }

  // If there's an error, show error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md shadow-lg">
          <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
          <h3 className="text-red-600 text-xl font-semibold mb-2 text-center">Error Loading Restaurant</h3>
          <p className="text-red-500 text-center mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RestaurantSelectionWrapper; 