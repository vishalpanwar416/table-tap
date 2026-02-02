import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../../../shared/supabase';

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
    if (!restaurantId) {
      setLoading(false);
      return;
    }

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

        if (restaurantError) {
          setError(restaurantError.message);
          return;
        }

        if (!restaurantData) {
          setError('Restaurant not found or inactive');
          return;
        }

        // Check if restaurant has an active subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id, status, end_date')
          .eq('restaurant_id', restaurantId)
          .in('status', ['active', 'grace_period'])
          .maybeSingle();

        // If no active subscription, show error to customer
        if (!subscription) {
          setError('This restaurant is currently unavailable. Please try again later.');
          return;
        }

        // Add subscription info to restaurant data
        setRestaurant({
          ...restaurantData,
          subscription_status: subscription.status,
          subscription_end_date: subscription.end_date
        });

      } catch (err) {
        setError('Failed to load restaurant data');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

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
        setError(restaurantError.message);
        return false;
      }

      // Check subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, status, end_date')
        .eq('restaurant_id', restaurantId)
        .in('status', ['active', 'grace_period'])
        .maybeSingle();

      if (!subscription) {
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
      setError('Failed to refresh restaurant data');
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