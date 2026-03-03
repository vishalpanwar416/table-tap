import React, { useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../../shared/config/AuthContext';
import { useRestaurant } from './RestaurantContext';
import { needsRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import LoadingScreen from '../../../shared/components/LoadingScreen';

const SKIP_PATHS = new Set([
  '/restaurant-selection',
  '/',
  '/skip1',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/complete-profile',
]);

const RestaurantSelectionWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { restaurantId, loading: restaurantLoading, error, clearSession } = useRestaurant();

  // Get URL parameters
  const urlParams = new URLSearchParams(location.search);
  const urlRestaurant = urlParams.get('restaurant');
  const urlTable = urlParams.get('table');

  // Redirect to restaurant selection if needed (only when both loadings are done)
  useEffect(() => {
    if (authLoading || restaurantLoading) return;
    if (SKIP_PATHS.has(location.pathname)) return;

    if (user && needsRestaurantSelection()) {
      const params = urlRestaurant && urlTable
        ? `?restaurant=${urlRestaurant}&table=${urlTable}`
        : '';
      navigate(`/restaurant-selection${params}`);
    }
  }, [user, authLoading, restaurantLoading, location.pathname, navigate, urlRestaurant, urlTable]);

  // Handle auth errors — redirect to login
  useEffect(() => {
    if (error === 'AUTH_ERROR') {
      clearSession();
      const returnUrl = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  }, [error, navigate, clearSession, location.pathname, location.search]);

  // Show spinner only while auth OR restaurant data is loading
  if (authLoading || restaurantLoading) {
    return <LoadingScreen message="Verifying session..." variant="page" />;
  }

  // If no restaurant is selected → redirect to selection page
  if (!restaurantId && location.pathname !== '/restaurant-selection') {
    return <Navigate to="/restaurant-selection" replace />;
  }

  // Non-auth errors
  if (error && error !== 'AUTH_ERROR') {
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
              onClick={() => { clearSession(); navigate('/restaurant-selection'); }}
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