import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useRestaurant } from '../Pages/Restaurantselection/RestaurantContext';
import { processFoodItems, getFallbackImage } from '../utils/imageOptimization';

export const categories = [
  { name: 'Snacks', icon: 'Sandwich' },
  { name: 'Main Course', icon: 'UtensilsCrossed' },
  { name: 'Beverages', icon: 'CupSoda' },
  { name: 'Dessert', icon: 'IceCream' },
  { name: 'Offers', icon: 'Tag' },
];

/**
 * Fetches all food items for a restaurant with image fallback handling.
 */
export const fetchFoodItems = async (restaurantId) => {
  if (!restaurantId) return [];
  try {
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Process items to ensure they have valid images
    const processedItems = processFoodItems(data || []);
    return processedItems;
  } catch (error) {
    console.error('Exception while fetching all food items:', error);
    return [];
  }
};

/**
 * OPTIMIZED: Fetches only items tagged as 'bestseller' with image fallback handling.
 */
export const fetchBestSellerItems = async (restaurantId) => {
  if (!restaurantId) return [];
  try {
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .contains('tags', ['bestseller']);

    if (error) throw error;
    
    // Process items to ensure they have valid images
    const processedItems = processFoodItems(data || []);
    return processedItems;
  } catch (error) {
    console.error('Exception while fetching best seller items:', error);
    return [];
  }
};

/**
 * NEW & OPTIMIZED: Fetches only items tagged as 'recommended' with image fallback handling.
 */
export const fetchRecommendedItems = async (restaurantId) => {
  if (!restaurantId) return [];
  try {
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .contains('tags', ['recommended']);

    if (error) throw error;
    
    // Process items to ensure they have valid images
    const processedItems = processFoodItems(data || []);
    return processedItems;
  } catch (error) {
    console.error('Exception while fetching recommended items:', error);
    return [];
  }
};

// Function that automatically gets restaurant ID from context and fetches food items
// This is what you should use in your components
export const fetchFoodItemsWithContext = () => {
  const { restaurantId, loading: restaurantLoading } = useRestaurant();
  
  const fetchItems = async () => {
    console.log('fetchFoodItemsWithContext called with restaurantId:', restaurantId);
    
    if (!restaurantId || restaurantLoading) {
      console.warn('Restaurant ID not available or still loading');
      return [];
    }
    
    return await fetchFoodItems(restaurantId);
  };
  
  return { 
    fetchItems, 
    restaurantId, 
    isReady: !restaurantLoading && !!restaurantId 
  };
};

// Hook to fetch food items for current restaurant
export const useFoodItems = () => {
  const { restaurantId, loading: restaurantLoading } = useRestaurant();
  
  const getFoodItems = async () => {
    console.log('getFoodItems called with restaurantId:', restaurantId);
    
    if (!restaurantId) {
      console.warn('No restaurant ID available from context, restaurant loading:', restaurantLoading);
      return [];
    }
    
    return await fetchFoodItems(restaurantId);
  };
  
  return { getFoodItems, restaurantId, isRestaurantReady: !restaurantLoading && !!restaurantId };
};

// Alternative: Hook that returns food items directly with automatic fetching
export const useFoodItemsData = () => {
  const { restaurantId, loading: restaurantLoading } = useRestaurant();
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFoodItems = async () => {
    console.log('loadFoodItems called with restaurantId:', restaurantId);
    
    if (!restaurantId) {
      console.warn('No restaurant ID available from context, restaurant loading:', restaurantLoading);
      setFoodItems([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const items = await fetchFoodItems(restaurantId);
      setFoodItems(items);
    } catch (err) {
      console.error('Error loading food items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when restaurantId changes and is available
  useEffect(() => {
    if (restaurantId && !restaurantLoading) {
      loadFoodItems();
    }
  }, [restaurantId, restaurantLoading]);

  return { 
    foodItems, 
    loading: loading || restaurantLoading, 
    error, 
    refetch: loadFoodItems,
    restaurantId,
    isReady: !restaurantLoading && !!restaurantId
  };
};