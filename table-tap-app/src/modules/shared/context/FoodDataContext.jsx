import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchFoodItems,
  BESTSELLER_TAGS,
  RECOMMENDED_TAGS,
  hasTag,
} from '../../customer/api/foodData';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';

const FoodDataContext = createContext();

// Cache configuration
const CACHE_VERSION = 'v3'; // bump when menu schema/categories change
const getMemoryCacheKey = (restId) => `${CACHE_VERSION}_${restId}`;
const getStorageCacheKey = (restId) => `fooddata_${CACHE_VERSION}_${restId}`;
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
  const lastLoadedRestaurantRef = useRef(null); // tracks last initiated load (sync, avoids loop)

  // Per-restaurant cache in memory (survives re-renders, faster than storage)
  const memoryCache = useRef(new Map());

  const { restaurantId } = useRestaurant();

  // Get cache key for a restaurant
  // Load data from localStorage (persistent) + memory cache (fast)
  const loadFromCache = useCallback((restaurantId) => {
    try {
      // Check memory cache first (fastest)
      const memoryKey = getMemoryCacheKey(restaurantId);
      if (memoryCache.current.has(memoryKey)) {
        const cached = memoryCache.current.get(memoryKey);
        const age = Date.now() - cached.timestamp;

        if (age < CACHE_DURATION) {
          return { data: cached.data, isStale: age > STALE_DURATION };
        }
      }

      // Fallback to localStorage (persistent across sessions)
      const cacheKey = getStorageCacheKey(restaurantId);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        if (age < CACHE_DURATION) {
          // Also store in memory cache for faster access
          memoryCache.current.set(memoryKey, { data, timestamp });
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
      memoryCache.current.set(getMemoryCacheKey(restaurantId), cacheData);

      // Save to localStorage
      const cacheKey = getStorageCacheKey(restaurantId);
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
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt - 1)));
        return fetchWithRetry(fetchFn, attempt + 1);
      }
      throw error;
    }
  }, []);

  // Clear all data (does NOT reset currentRestaurantId to avoid re-triggering the load effect)
  const clearData = useCallback(() => {
    setBestSellerItems([]);
    setRecommendedItems([]);
    setAllFoodItems([]);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort('restaurant-change');
    }
    requestInProgressRef.current = false;
  }, []);

  // Main data loading function with stale-while-revalidate
  const loadFoodData = useCallback(
    async (restaurantId, forceRefresh = false) => {
      if (!restaurantId) return;

      // Prevent duplicate requests
      if (requestInProgressRef.current && !forceRefresh) return;

      // Check cache first
      const cached = loadFromCache(restaurantId);

      if (cached && !forceRefresh) {
        applyCachedData(cached.data);
        setCurrentRestaurantId(restaurantId);

        if (!cached.isStale) {
          setLoading(false);
          return;
        }
        // Data is stale - refresh in background
        setIsRefreshing(true);
      } else if (!cached) {
        setLoading(true);
      }

      // Hard safety: if fetch never resolves, unblock UI after 12s
      const safetyTimer = setTimeout(() => {
        setLoading(false);
        setIsRefreshing(false);
        requestInProgressRef.current = false;
      }, 12000);

      try {
        requestInProgressRef.current = true;
        setError(null);

        // Cancel any previous in-flight request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort('new-request');
        }
        abortControllerRef.current = new AbortController();

        // Single fetch — filter in memory (zero extra network cost)
        const allItems = await fetchWithRetry(() => fetchFoodItems(restaurantId));

        // Check if this restaurant is still relevant
        if (abortControllerRef.current?.signal.aborted) return;

        const bestSellers = allItems.filter((item) => hasTag(item, BESTSELLER_TAGS));
        const recommended = allItems.filter((item) => hasTag(item, RECOMMENDED_TAGS));

        setBestSellerItems(bestSellers);
        setRecommendedItems(recommended);
        setAllFoodItems(allItems);
        setCurrentRestaurantId(restaurantId);
        lastFetchTimeRef.current = Date.now();

        saveToCache(restaurantId, { bestSellers, recommended, allItems });
      } catch (err) {
        if (err.name === 'AbortError' || err.message?.toLowerCase().includes('aborted')) return;
        setError(err);
      } finally {
        clearTimeout(safetyTimer);
        setLoading(false);
        setIsRefreshing(false);
        requestInProgressRef.current = false;
      }
    },
    [loadFromCache, applyCachedData, fetchWithRetry, saveToCache],
  );

  // Watch for restaurant changes
  // Uses a ref (lastLoadedRestaurantRef) as the deduplication key instead of
  // currentRestaurantId state, so that clearing data can't re-trigger this effect.
  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    // Already initiated a load for this restaurant — skip
    if (lastLoadedRestaurantRef.current === restaurantId) return;

    // Mark as initiated SYNCHRONOUSLY before any async work
    lastLoadedRestaurantRef.current = restaurantId;

    // Try cache first for instant render
    const cached = loadFromCache(restaurantId);
    if (cached) {
      applyCachedData(cached.data);
      setCurrentRestaurantId(restaurantId);
      setLoading(false);

      if (cached.isStale) {
        loadFoodData(restaurantId, true);
      }
    } else {
      // Clear visual data from previous restaurant (not the ID ref)
      setBestSellerItems([]);
      setRecommendedItems([]);
      setAllFoodItems([]);
      setError(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('restaurant-change');
      }
      requestInProgressRef.current = false;
      loadFoodData(restaurantId);
    }
  }, [restaurantId, loadFromCache, applyCachedData, loadFoodData]);

  // Retry function for error recovery
  const retryLoadData = useCallback(() => {
    if (currentRestaurantId) {
      loadFoodData(currentRestaurantId, true);
    }
  }, [currentRestaurantId, loadFoodData]);

  // Clear cache for a specific restaurant
  const clearCache = useCallback((restaurantId) => {
    try {
      memoryCache.current.delete(getMemoryCacheKey(restaurantId));
      localStorage.removeItem(getStorageCacheKey(restaurantId));
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
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache clear all error:', error);
    }
  }, []);

  // Prefetch data for a restaurant (called when hovering over restaurant card)
  const prefetchRestaurantData = useCallback(
    async (restId) => {
      if (!restId || loadFromCache(restId)) return;

      try {
        const allItems = await fetchFoodItems(restId);
        const bestSellers = allItems.filter((item) => hasTag(item, BESTSELLER_TAGS));
        const recommended = allItems.filter((item) => hasTag(item, RECOMMENDED_TAGS));
        saveToCache(restId, { bestSellers, recommended, allItems });
      } catch {
        // Silent fail for prefetch
      }
    },
    [loadFromCache, saveToCache],
  );

  return (
    <FoodDataContext.Provider
      value={{
        bestSellerItems,
        recommendedItems,
        allFoodItems,
        loading,
        isRefreshing,
        error,
        currentRestaurantId,
        loadFoodData,
        retryLoadData,
        clearCache,
        clearAllCache,
        prefetchRestaurantData,
        clearData,
      }}
    >
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
