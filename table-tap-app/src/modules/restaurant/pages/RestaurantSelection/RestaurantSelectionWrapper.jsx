import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../../shared/config/AuthContext';
import { useRestaurant } from './RestaurantContext';
import { needsRestaurantSelection, hasValidRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import RestaurantSelectionPage from './RestaurantSelectionPage';
import LoadingScreen from '../../../shared/components/LoadingScreen';

const RestaurantSelectionWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { restaurantId, loading, error, clearSession } = useRestaurant();
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
    return <LoadingScreen message="Verifying session..." variant="page" />;
  }

  // If no restaurant is selected, redirect to selection page
  if (!restaurantId && !checking) {
    if (location.pathname !== '/restaurant-selection') {
      return <Navigate to="/restaurant-selection" replace />;
    }
    // If we are somehow on /restaurant-selection (even if wrapped), allow it to render
    // note: typically /restaurant-selection should NOT be wrapped by this component
  }

  // If there's an authentication error, redirect to login
  useEffect(() => {
    if (error === 'AUTH_ERROR') {
      // Clear session and redirect to login
      clearSession();
      const returnUrl = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  }, [error, navigate, clearSession, location.pathname, location.search]);

  // If there's an error (and it's not an auth error), show error state
  if (error && error !== 'AUTH_ERROR') {
    const handleBackToSelection = () => {
      clearSession();
      navigate('/restaurant-selection');
    };

    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md shadow-lg">
          <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
          <h3 className="text-red-600 text-xl font-semibold mb-2 text-center">Error Loading Restaurant</h3>
          <p className="text-red-500 text-center mb-4">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToSelection}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Restaurant Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RestaurantSelectionWrapper; 