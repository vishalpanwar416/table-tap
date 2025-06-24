import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';
import { getStoredRestaurantSelection, storeRestaurantSelection, clearRestaurantSelection } from '../utils/restaurantCheck';

const RestaurantContext = createContext();

// Helper function to get URL parameters
const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    restaurantId: urlParams.get('restaurant'),
    tableNumber: urlParams.get('table')
  };
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
      // Store in localStorage for persistence
      storeRestaurantSelection(urlParams.restaurantId, urlParams.tableNumber);
      
      setRestaurantId(urlParams.restaurantId);
      setTableNumber(urlParams.tableNumber);
    } else {
      // Try to get from stored selection
      const storedSelection = getStoredRestaurantSelection();
      
      if (storedSelection) {
        setRestaurantId(storedSelection.restaurantId);
        setTableNumber(storedSelection.tableNumber);
      } else {
        // No stored restaurant, will need selection
        setRestaurantId(null);
        setTableNumber(null);
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

  // Function to manually set restaurant and table
  const setRestaurantAndTable = (newRestaurantId, newTableNumber) => {
    storeRestaurantSelection(newRestaurantId, newTableNumber);
    setRestaurantId(newRestaurantId);
    setTableNumber(newTableNumber);
  };

  // Function to clear session data
  const clearSession = () => {
    clearRestaurantSelection();
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