import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchFoodItems, fetchBestSellerItems, fetchRecommendedItems } from '../api/foodData';

const FoodDataContext = createContext();

export const FoodDataProvider = ({ children }) => {
  const [bestSellerItems, setBestSellerItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [allFoodItems, setAllFoodItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRestaurantId, setCurrentRestaurantId] = useState(null);
  const abortControllerRef = useRef(null);
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Load data from sessionStorage cache
  const loadFromCache = useCallback((restaurantId) => {
    try {
      const cacheKey = `fooddata_${restaurantId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setBestSellerItems(data.bestSellers || []);
          setRecommendedItems(data.recommended || []);
          setAllFoodItems(data.allItems || []);
          setCurrentRestaurantId(restaurantId);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }
    return false;
  }, []);

  // Save data to sessionStorage cache
  const saveToCache = useCallback((restaurantId, data) => {
    try {
      const cacheKey = `fooddata_${restaurantId}`;
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }, []);

  // Load food data for a restaurant - only when we don't have data
  const loadFoodData = useCallback(async (restaurantId, forceRefresh = false) => {
    if (!restaurantId) return;

    // If we already have data for this restaurant and not forcing refresh, do nothing
    if (!forceRefresh && currentRestaurantId === restaurantId && bestSellerItems.length > 0) {
      console.log('Data already available for restaurant:', restaurantId);
      return;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current && !forceRefresh) {
      console.log('Already loading data, skipping...');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Try cache first (unless force refresh)
      if (!forceRefresh && loadFromCache(restaurantId)) {
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      console.log('Loading food data for restaurant:', restaurantId);

      // Critical data first - parallel loading with timeout
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 10000); // 10s timeout

      const [bestSellers, recommended] = await Promise.all([
        fetchBestSellerItems(restaurantId).catch(err => {
          if (err.name === 'AbortError') return [];
          console.warn('Failed to load best sellers:', err);
          return [];
        }),
        fetchRecommendedItems(restaurantId).catch(err => {
          if (err.name === 'AbortError') return [];
          console.warn('Failed to load recommendations:', err);
          return [];
        })
      ]);

      clearTimeout(timeoutId);

      // Check if component is still mounted
      if (abortControllerRef.current?.signal.aborted) return;

      setBestSellerItems(bestSellers);
      setRecommendedItems(recommended);
      setCurrentRestaurantId(restaurantId);
      setLoading(false);
      loadingRef.current = false;

      // Background loading for full menu with caching
      fetchFoodItems(restaurantId)
        .then(allItems => {
          if (abortControllerRef.current?.signal.aborted) return;
          setAllFoodItems(allItems);
          
          // Save to cache
          saveToCache(restaurantId, {
            bestSellers,
            recommended,
            allItems
          });
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          console.warn('Failed to load all food items:', err);
          if (!abortControllerRef.current?.signal.aborted) {
            setAllFoodItems([]);
          }
        });

    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Critical data loading failed:', error);
      if (!abortControllerRef.current?.signal.aborted) {
        setError(error);
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, [currentRestaurantId, bestSellerItems.length, loadFromCache, saveToCache]);

  // Initialize data when restaurant context changes
  const initializeData = useCallback((restaurantId) => {
    if (!restaurantId || initializedRef.current) return;
    
    // Try to load from cache first
    if (loadFromCache(restaurantId)) {
      initializedRef.current = true;
      return;
    }
    
    // If no cache, load from API
    loadFoodData(restaurantId);
    initializedRef.current = true;
  }, [loadFromCache, loadFoodData]);

  // Retry function
  const retryLoadData = useCallback(() => {
    if (currentRestaurantId) {
      loadFoodData(currentRestaurantId, true);
    }
  }, [currentRestaurantId, loadFoodData]);

  // Clear cache for a specific restaurant
  const clearCache = useCallback((restaurantId) => {
    try {
      const cacheKey = `fooddata_${restaurantId}`;
      sessionStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, []);

  // Clear all cache
  const clearAllCache = useCallback(() => {
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
      console.warn('Failed to clear all cache:', error);
    }
  }, []);

  return (
    <FoodDataContext.Provider value={{
      bestSellerItems,
      recommendedItems,
      allFoodItems,
      loading,
      error,
      currentRestaurantId,
      loadFoodData,
      retryLoadData,
      clearCache,
      clearAllCache,
      initializeData
    }}>
      {children}
    </FoodDataContext.Provider>
  );
};

export const useFoodData = () => {
  const context = useContext(FoodDataContext);
  if (!context) {
    throw new Error('useFoodData must be used within a FoodDataProvider');
  }
  return context;
}; 