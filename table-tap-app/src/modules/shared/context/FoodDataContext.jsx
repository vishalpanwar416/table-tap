import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchFoodItems, fetchBestSellerItems, fetchRecommendedItems } from '../../customer/api/foodData';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';

const FoodDataContext = createContext();

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const STALE_DURATION = 2 * 60 * 1000; // 2 minutes - show stale data while refreshing
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const FoodDataProvider = ({ children }) => {
  const [bestSellerItems, setBestSellerItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [allFoodItems, setAllFoodItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Background refresh indicator
  const [error, setError] = useState(null);
  const [currentRestaurantId, setCurrentRestaurantId] = useState(null);

  // Refs for request management
  const abortControllerRef = useRef(null);
  const requestInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(null);

  // Per-restaurant cache in memory (survives re-renders, faster than storage)
  const memoryCache = useRef(new Map());

  const { restaurantId } = useRestaurant();

  // Get cache key for a restaurant
  const getCacheKey = (restId) => `fooddata_v2_${restId}`;

  // Load data from localStorage (persistent) + memory cache (fast)
  const loadFromCache = useCallback((restaurantId) => {
    try {
      // Check memory cache first (fastest)
      if (memoryCache.current.has(restaurantId)) {
        const cached = memoryCache.current.get(restaurantId);
        const age = Date.now() - cached.timestamp;

        if (age < CACHE_DURATION) {
          return { data: cached.data, isStale: age > STALE_DURATION };
        }
      }

      // Fallback to localStorage (persistent across sessions)
      const cacheKey = getCacheKey(restaurantId);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        if (age < CACHE_DURATION) {
          // Also store in memory cache for faster access
          memoryCache.current.set(restaurantId, { data, timestamp });
          return { data, isStale: age > STALE_DURATION };
        } else {
          // Cache expired, remove it
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }, []);

  // Save data to both memory and localStorage
  const saveToCache = useCallback((restaurantId, data) => {
    try {
      const cacheData = { data, timestamp: Date.now() };

      // Save to memory cache
      memoryCache.current.set(restaurantId, cacheData);

      // Save to localStorage
      const cacheKey = getCacheKey(restaurantId);
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }, []);

  // Apply cached data to state
  const applyCachedData = useCallback((data) => {
    setBestSellerItems(data.bestSellers || []);
    setRecommendedItems(data.recommended || []);
    setAllFoodItems(data.allItems || []);
  }, []);

  // Fetch with retry logic
  const fetchWithRetry = useCallback(async (fetchFn, attempt = 1) => {
    try {
      return await fetchFn();
    } catch (error) {
      if (error.name === 'AbortError') throw error;

      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt - 1))
        );
        return fetchWithRetry(fetchFn, attempt + 1);
      }
      throw error;
    }
  }, []);

  // Clear all data
  const clearData = useCallback(() => {
    setBestSellerItems([]);
    setRecommendedItems([]);
    setAllFoodItems([]);
    setCurrentRestaurantId(null);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    requestInProgressRef.current = false;
  }, []);

  // Main data loading function with stale-while-revalidate
  const loadFoodData = useCallback(async (restaurantId, forceRefresh = false) => {
    if (!restaurantId) return;

    // Prevent duplicate requests
    if (requestInProgressRef.current && !forceRefresh) {
      return;
    }

    // Check cache first
    const cached = loadFromCache(restaurantId);

    if (cached && !forceRefresh) {
      // Apply cached data immediately
      applyCachedData(cached.data);
      setCurrentRestaurantId(restaurantId);

      // If data is fresh, we're done
      if (!cached.isStale) {
        setLoading(false);
        return;
      }

      // Data is stale - refresh in background (don't show loading spinner)
      setIsRefreshing(true);
    } else if (!cached) {
      // No cache - show loading spinner
      setLoading(true);
    }

    try {
      requestInProgressRef.current = true;
      setError(null);

      // Cancel previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Parallel fetch of critical data with retry
      const [bestSellers, recommended] = await Promise.all([
        fetchWithRetry(() => fetchBestSellerItems(restaurantId)),
        fetchWithRetry(() => fetchRecommendedItems(restaurantId))
      ]);

      // Check if still relevant (restaurant might have changed)
      if (abortControllerRef.current?.signal.aborted) return;

      // Update state with fresh data
      setBestSellerItems(bestSellers);
      setRecommendedItems(recommended);
      setCurrentRestaurantId(restaurantId);
      lastFetchTimeRef.current = Date.now();

      // Background fetch of all items (non-blocking)
      fetchWithRetry(() => fetchFoodItems(restaurantId))
        .then(allItems => {
          if (abortControllerRef.current?.signal.aborted) return;

          setAllFoodItems(allItems);

          // Save complete data to cache
          saveToCache(restaurantId, {
            bestSellers,
            recommended,
            allItems
          });
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('Background fetch failed:', err);
          }
        });

      // Save partial data to cache immediately
      saveToCache(restaurantId, {
        bestSellers,
        recommended,
        allItems: cached?.data?.allItems || []
      });

    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('Food data fetch error:', error);
      setError(error);

      // If we have cached data, keep showing it
      if (!cached) {
        setError(error);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      requestInProgressRef.current = false;
    }
  }, [loadFromCache, applyCachedData, fetchWithRetry, saveToCache]);

  // Watch for restaurant changes
  useEffect(() => {
    if (restaurantId && restaurantId !== currentRestaurantId) {
      // Try to load from cache first for instant render
      const cached = loadFromCache(restaurantId);
      if (cached) {
        applyCachedData(cached.data);
        setCurrentRestaurantId(restaurantId);

        // If stale, refresh in background
        if (cached.isStale) {
          loadFoodData(restaurantId, true);
        }
      } else {
        // No cache, clear and load fresh
        clearData();
        loadFoodData(restaurantId);
      }
    }
  }, [restaurantId, currentRestaurantId, loadFromCache, applyCachedData, clearData, loadFoodData]);

  // Retry function for error recovery
  const retryLoadData = useCallback(() => {
    if (currentRestaurantId) {
      loadFoodData(currentRestaurantId, true);
    }
  }, [currentRestaurantId, loadFoodData]);

  // Clear cache for a specific restaurant
  const clearCache = useCallback((restaurantId) => {
    try {
      memoryCache.current.delete(restaurantId);
      localStorage.removeItem(getCacheKey(restaurantId));
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }, []);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    try {
      memoryCache.current.clear();

      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('fooddata_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache clear all error:', error);
    }
  }, []);

  // Prefetch data for a restaurant (called when hovering over restaurant)
  const prefetchRestaurantData = useCallback(async (restaurantId) => {
    if (!restaurantId || loadFromCache(restaurantId)) return;

    try {
      const [bestSellers, recommended] = await Promise.all([
        fetchBestSellerItems(restaurantId),
        fetchRecommendedItems(restaurantId)
      ]);

      saveToCache(restaurantId, { bestSellers, recommended, allItems: [] });
    } catch (error) {
      // Silent fail for prefetch
    }
  }, [loadFromCache, saveToCache]);

  return (
    <FoodDataContext.Provider value={{
      bestSellerItems,
      recommendedItems,
      allFoodItems,
      loading,
      isRefreshing, // New: indicates background refresh
      error,
      currentRestaurantId,
      loadFoodData,
      retryLoadData,
      clearCache,
      clearAllCache,
      prefetchRestaurantData, // New: prefetch for better UX
      clearData
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