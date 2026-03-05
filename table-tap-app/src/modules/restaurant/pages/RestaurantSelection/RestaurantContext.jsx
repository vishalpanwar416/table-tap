import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../../../shared/supabase';
import { useAuth } from '../../../shared/config/AuthContext';

const RestaurantContext = createContext();

// Helper function to get URL parameters
const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    restaurantId: urlParams.get('restaurant'),
    tableNumber: urlParams.get('table')
  };
};

// Helper function to store in localStorage
const localStorageStore = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
    }
  },
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
    }
  },
  clear: () => {
    try {
      localStorage.removeItem('restaurantId');
      localStorage.removeItem('tableNumber');
    } catch (error) {
    }
  }
};

export const RestaurantProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Check URL parameters first
    const urlParams = getUrlParams();

    // Check if we have URL parameters
    if (urlParams.restaurantId && urlParams.tableNumber) {
      // Store in localStorage
      localStorageStore.set('restaurantId', urlParams.restaurantId);
      localStorageStore.set('tableNumber', urlParams.tableNumber);

      setRestaurantId(urlParams.restaurantId);
      setTableNumber(urlParams.tableNumber);
    } else {
      // Try to get from localStorage
      const storedRestaurantId = localStorageStore.get('restaurantId');
      const storedTableNumber = localStorageStore.get('tableNumber');

      if (storedRestaurantId && storedTableNumber) {
        setRestaurantId(storedRestaurantId);
        setTableNumber(storedTableNumber);
      } else {
        // No stored restaurant, don't set any default
        setLoading(false);
        return;
      }
    }
  }, []);

  useEffect(() => {
    // Still waiting for auth to resolve — don't touch loading, just wait.
    // The initial loading=true state is correct during this time.
    if (authLoading) return;

    // Auth done, but no restaurant ID found — nothing to fetch
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        setError(null);

        // First fetch the restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .eq('is_active', true)
          .single();

        if (abortController.signal.aborted) return;

        if (restaurantError) {
          if (restaurantError.code === 'PGRST301' ||
            restaurantError.message?.includes('JWT') ||
            restaurantError.message?.includes('expired') ||
            restaurantError.message?.includes('Invalid Refresh Token') ||
            restaurantError.message?.includes('Refresh Token Not Found') ||
            restaurantError.status === 401) {
            setError('AUTH_ERROR');
            return;
          }
          setError(restaurantError.message);
          return;
        }

        if (!restaurantData) {
          setError('Restaurant not found or inactive');
          return;
        }

        // Check if restaurant has an active subscription (includes 7-day grace window after expiry)
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('id, status, end_date')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (abortController.signal.aborted) return;

        if (subscriptionError) {
          if (subscriptionError.code === 'PGRST301' ||
            subscriptionError.message?.includes('JWT') ||
            subscriptionError.message?.includes('expired') ||
            subscriptionError.message?.includes('Invalid Refresh Token') ||
            subscriptionError.message?.includes('Refresh Token Not Found') ||
            subscriptionError.status === 401) {
            setError('AUTH_ERROR');
            return;
          }
        }

        // Determine if restaurant is accessible:
        // - active / grace_period: always accessible
        // - expired: allow 7-day grace window after end_date before blocking
        // - cancelled / no subscription: block immediately
        const isAccessible = (() => {
          if (!subscription) return false;
          if (subscription.status === 'active' || subscription.status === 'grace_period') return true;
          if (subscription.status === 'expired' && subscription.end_date) {
            const daysSinceExpiry = Math.ceil(
              (new Date() - new Date(subscription.end_date)) / (1000 * 60 * 60 * 24)
            );
            return daysSinceExpiry <= 7; // Allow 7-day grace window
          }
          return false;
        })();

        if (!isAccessible) {
          setError('This restaurant is currently unavailable. Please try again later.');
          return;
        }

        setRestaurant({
          ...restaurantData,
          subscription_status: subscription.status,
          subscription_end_date: subscription.end_date
        });

      } catch (err) {
        // AbortError is expected on unmount / re-render — suppress it silently
        if (abortController.signal.aborted || err?.name === 'AbortError') return;

        if (err?.code === 'PGRST301' ||
          err?.message?.includes('JWT') ||
          err?.message?.includes('Invalid Refresh Token') ||
          err?.message?.includes('Refresh Token Not Found') ||
          err?.status === 401) {
          setError('AUTH_ERROR');
        } else {
          setError(err?.message || 'Failed to load restaurant data');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    // Hard safety timeout — if fetch takes > 8s, unblock the UI
    const safetyTimer = setTimeout(() => setLoading(false), 8000);

    fetchRestaurant().finally(() => clearTimeout(safetyTimer));

    return () => abortController.abort();
  }, [restaurantId, authLoading]);

  const updateRestaurant = async (updates) => {
    if (!restaurantId) return false;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) {
        return false;
      }

      setRestaurant(data);
      return true;

    } catch (err) {
      return false;
    }
  };

  const refreshRestaurant = async () => {
    if (!restaurantId) return false;

    try {
      setLoading(true);

      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (restaurantError) {
        // Check if it's an authentication error
        if (restaurantError.code === 'PGRST301' ||
          restaurantError.message?.includes('JWT') ||
          restaurantError.message?.includes('expired') ||
          restaurantError.message?.includes('Invalid Refresh Token') ||
          restaurantError.message?.includes('Refresh Token Not Found') ||
          restaurantError.status === 401) {
          setError('AUTH_ERROR');
        } else {
          setError(restaurantError.message);
        }
        return false;
      }

      // Check subscription status — use same grace window logic as fetchRestaurant
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('id, status, end_date')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        if (subscriptionError.code === 'PGRST301' ||
          subscriptionError.message?.includes('JWT') ||
          subscriptionError.message?.includes('Invalid Refresh Token') ||
          subscriptionError.message?.includes('Refresh Token Not Found') ||
          subscriptionError.status === 401) {
          setError('AUTH_ERROR');
          return false;
        }
      }

      // Apply same grace window: allow expired restaurants up to 7 days past end_date
      const isAccessible = (() => {
        if (!subscription) return false;
        if (subscription.status === 'active' || subscription.status === 'grace_period') return true;
        if (subscription.status === 'expired' && subscription.end_date) {
          const daysSinceExpiry = Math.ceil(
            (new Date() - new Date(subscription.end_date)) / (1000 * 60 * 60 * 24)
          );
          return daysSinceExpiry <= 7;
        }
        return false;
      })();

      if (!isAccessible) {
        setError('This restaurant is currently unavailable. Please try again later.');
        return false;
      }

      setRestaurant({
        ...restaurantData,
        subscription_status: subscription.status,
        subscription_end_date: subscription.end_date
      });
      setError(null);
      return true;

    } catch (err) {
      if (err?.name === 'AbortError') return false;
      if (err?.code === 'PGRST301' ||
        err?.message?.includes('JWT') ||
        err?.message?.includes('Invalid Refresh Token') ||
        err?.message?.includes('Refresh Token Not Found') ||
        err?.status === 401) {
        setError('AUTH_ERROR');
      } else {
        setError('Failed to refresh restaurant data');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to manually set restaurant and table
  const setRestaurantAndTable = (newRestaurantId, newTableNumber) => {

    // Clear old restaurant data
    setRestaurant(null);
    setError(null);

    // Update localStorage
    localStorageStore.set('restaurantId', newRestaurantId);
    localStorageStore.set('tableNumber', newTableNumber);

    // Update state
    setRestaurantId(newRestaurantId);
    setTableNumber(newTableNumber);

    // Clear any cached food data for the old restaurant
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('fooddata_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
    }
  };

  // Function to clear session data
  const clearSession = () => {
    localStorageStore.clear();
    setRestaurantId(null);
    setTableNumber(null);
    setRestaurant(null);
    setError(null);
  };

  const value = {
    restaurant,
    restaurantId,
    tableNumber,
    updateRestaurant,
    refreshRestaurant,
    setRestaurantAndTable,
    clearSession,
    loading,
    error
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};