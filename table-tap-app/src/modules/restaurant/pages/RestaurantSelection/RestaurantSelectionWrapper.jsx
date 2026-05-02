import React, { useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../../shared/config/AuthContext';
import { useRestaurant } from './RestaurantContext';
import { needsRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import LoadingScreen from '../../../shared/components/LoadingScreen';

// Lazy-loaded so framer-motion stays out of the main bundle
const RestaurantErrorScreen = lazy(() => import('./RestaurantErrorScreen'));

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
  const { restaurantId, loading: restaurantLoading, error, clearSession, refreshRestaurant } = useRestaurant();

  const urlParams = new URLSearchParams(location.search);
  const urlRestaurant = urlParams.get('restaurant');
  const urlTable = urlParams.get('table');

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

  useEffect(() => {
    if (error === 'AUTH_ERROR') {
      clearSession();
      const returnUrl = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  }, [error, navigate, clearSession, location.pathname, location.search]);

  if (authLoading || restaurantLoading) {
    return <LoadingScreen message="Verifying session..." variant="page" />;
  }

  if (!restaurantId && location.pathname !== '/restaurant-selection') {
    return <Navigate to="/restaurant-selection" replace />;
  }

  if (error && error !== 'AUTH_ERROR') {
    return (
      <Suspense fallback={<LoadingScreen variant="page" />}>
        <RestaurantErrorScreen
          error={error}
          onRetry={refreshRestaurant}
          onBack={() => { clearSession(); navigate('/restaurant-selection'); }}
        />
      </Suspense>
    );
  }

  return children;
};

export default RestaurantSelectionWrapper;
