import React, { useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

// ─── Error config by error type ───────────────────────────────────────────────

const getErrorConfig = (error) => {
  if (!error) return null;

  if (error.includes('not found') || error.includes('scan the QR')) {
    return {
      emoji: '📷',
      title: 'QR Code Not Recognised',
      description: 'This QR code doesn\'t match any active restaurant. Please scan the correct QR code at your table.',
      primaryLabel: 'Scan Again',
      primaryAction: 'scan',
      showBack: false,
    };
  }

  if (error.includes('unavailable') || error.includes('subscription')) {
    return {
      emoji: '🔒',
      title: 'Restaurant Unavailable',
      description: 'This restaurant is temporarily unavailable. Please ask staff for assistance.',
      primaryLabel: 'Try Again',
      primaryAction: 'retry',
      showBack: true,
    };
  }

  if (error.includes('internet') || error.includes('network') || error.includes('fetch')) {
    return {
      emoji: '📶',
      title: 'No Internet Connection',
      description: 'Please check your Wi-Fi or mobile data and try again.',
      primaryLabel: 'Retry',
      primaryAction: 'retry',
      showBack: false,
    };
  }

  if (error.includes('timed out') || error.includes('timeout')) {
    return {
      emoji: '⏱️',
      title: 'Taking Too Long',
      description: 'The server is taking longer than usual. Please try again.',
      primaryLabel: 'Try Again',
      primaryAction: 'retry',
      showBack: false,
    };
  }

  // Generic fallback
  return {
    emoji: '⚠️',
    title: 'Something Went Wrong',
    description: 'We couldn\'t load the restaurant. Please try again or ask staff for help.',
    primaryLabel: 'Try Again',
    primaryAction: 'retry',
    showBack: true,
  };
};

// ─── Error Screen ─────────────────────────────────────────────────────────────

const RestaurantErrorScreen = ({ error, onRetry, onBack }) => {
  const config = getErrorConfig(error);
  if (!config) return null;

  const handlePrimary = () => {
    if (config.primaryAction === 'scan') {
      onBack();
    } else {
      onRetry();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Top safe area spacer */}
      <div className="flex-1" />

      <motion.div
        className="flex flex-col items-center px-6 pb-12"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
      >
        {/* Icon blob */}
        <motion.div
          className="w-28 h-28 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 shadow-lg"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
        >
          <span className="text-5xl" role="img" aria-label="error">{config.emoji}</span>
        </motion.div>

        {/* Text */}
        <motion.h1
          className="text-white text-2xl font-bold text-center mb-3 font-spartan"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          {config.title}
        </motion.h1>

        <motion.p
          className="text-gray-400 text-base text-center leading-relaxed mb-10 max-w-xs"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          {config.description}
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="w-full max-w-xs flex flex-col gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={handlePrimary}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-base rounded-2xl transition-colors shadow-lg shadow-orange-500/25"
            whileTap={{ scale: 0.97 }}
          >
            {config.primaryLabel}
          </motion.button>

          {config.showBack && (
            <motion.button
              onClick={onBack}
              className="w-full py-4 bg-white/8 hover:bg-white/12 active:bg-white/16 text-gray-300 font-medium text-base rounded-2xl border border-white/10 transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              Back to Restaurant Selection
            </motion.button>
          )}
        </motion.div>

        {/* Help hint */}
        <motion.p
          className="text-gray-600 text-xs text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Still having trouble? Ask a staff member for help.
        </motion.p>
      </motion.div>

      {/* Bottom safe area spacer */}
      <div className="flex-1" />

      {/* Bottom home indicator space */}
      <div className="h-8" />
    </div>
  );
};

// ─── Wrapper ──────────────────────────────────────────────────────────────────

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
      <RestaurantErrorScreen
        error={error}
        onRetry={refreshRestaurant}
        onBack={() => { clearSession(); navigate('/restaurant-selection'); }}
      />
    );
  }

  return children;
};

export default RestaurantSelectionWrapper;
