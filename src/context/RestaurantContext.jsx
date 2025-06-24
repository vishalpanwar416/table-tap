import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';

const RestaurantContext = createContext();

// Helper function to get URL parameters
const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    restaurantId: urlParams.get('restaurant'),
    tableNumber: urlParams.get('table')
  };
};

// Helper function to store in session (in-memory for this session)
const sessionStore = {
  data: {},
  set: (key, value) => {
    sessionStore.data[key] = value;
  },
  get: (key) => {
    return sessionStore.data[key];
  },
  clear: () => {
    sessionStore.data = {};
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
      // Store in session
      sessionStore.set('restaurantId', urlParams.restaurantId);
      sessionStore.set('tableNumber', urlParams.tableNumber);
      
      setRestaurantId(urlParams.restaurantId);
      setTableNumber(urlParams.tableNumber);
    } else {
      // Try to get from session storage
      const storedRestaurantId = sessionStore.get('restaurantId');
      const storedTableNumber = sessionStore.get('tableNumber');
      
      if (storedRestaurantId && storedTableNumber) {
        setRestaurantId(storedRestaurantId);
        setTableNumber(storedTableNumber);
      } else {
        // Fallback to default restaurant ID
        const defaultRestaurantId = '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa';
        setRestaurantId(defaultRestaurantId);
        sessionStore.set('restaurantId', defaultRestaurantId);
      }
    }
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching restaurant:', error);
          setError(error.message);
          return;
        }

        if (!data) {
          setError('Restaurant not found or inactive');
          return;
        }

        setRestaurant(data);
        
      } catch (err) {
        console.error('Unexpected error:', err);
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
        console.error('Error updating restaurant:', error);
        return false;
      }

      setRestaurant(data);
      return true;
      
    } catch (err) {
      console.error('Unexpected error updating restaurant:', err);
      return false;
    }
  };

  const refreshRestaurant = async () => {
    if (!restaurantId) return false;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (error) {
        setError(error.message);
        return false;
      }

      setRestaurant(data);
      setError(null);
      return true;
      
    } catch (err) {
      setError('Failed to refresh restaurant data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to manually set restaurant and table (useful for testing or admin)
  const setRestaurantAndTable = (newRestaurantId, newTableNumber) => {
    sessionStore.set('restaurantId', newRestaurantId);
    sessionStore.set('tableNumber', newTableNumber);
    setRestaurantId(newRestaurantId);
    setTableNumber(newTableNumber);
  };

  // Function to clear session data
  const clearSession = () => {
    sessionStore.clear();
    setRestaurantId(null);
    setTableNumber(null);
    setRestaurant(null);
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