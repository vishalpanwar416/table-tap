import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchBestSellerItems } from '../../customer/api/foodData';

// Custom hook for BestSeller data with enhanced caching and performance
export const useBestSellerData = (restaurantId) => {
  const [bestSellerItems, setBestSellerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Memoized cache key
  const cacheKey = useMemo(() => `bestsellers_${restaurantId}`, [restaurantId]);

  // Load data from cache
  const loadFromCache = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setBestSellerItems(data);
          setLastFetch(timestamp);
          return true;
        }
      }
    } catch (error) {
    }
    return false;
  }, [cacheKey]);

  // Save data to cache
  const saveToCache = useCallback((data) => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
    }
  }, [cacheKey]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!restaurantId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchBestSellerItems(restaurantId);

      setBestSellerItems(data);
      setLastFetch(Date.now());
      saveToCache(data);
    } catch (error) {
      setError(error.message || 'Failed to load best sellers');

      // Try to load from cache as fallback
      if (!loadFromCache()) {
        setBestSellerItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId, saveToCache, loadFromCache]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (error) {
    }
  }, [cacheKey]);

  // Auto-fetch when restaurantId changes
  useEffect(() => {
    if (!restaurantId) return;

    // Try cache first
    if (!loadFromCache()) {
      fetchData();
    } else {
      setLoading(false);
      // Refresh in background if cache is old
      if (Date.now() - lastFetch > CACHE_DURATION) {
        fetchData();
      }
    }
  }, [restaurantId, loadFromCache, fetchData, lastFetch]);

  // Memoized computed values
  const stats = useMemo(() => {
    const totalItems = bestSellerItems.length;
    const totalPrice = bestSellerItems.reduce((sum, item) => sum + item.price, 0);
    const avgPrice = totalItems > 0 ? totalPrice / totalItems : 0;
    const discountedItems = bestSellerItems.filter(item => item.discounttype && item.discountvalue).length;

    return {
      totalItems,
      totalPrice,
      avgPrice,
      discountedItems,
      discountPercentage: totalItems > 0 ? (discountedItems / totalItems) * 100 : 0
    };
  }, [bestSellerItems]);

  return {
    bestSellerItems,
    loading,
    error,
    refresh,
    clearCache,
    stats,
    lastFetch,
    isStale: Date.now() - lastFetch > CACHE_DURATION
  };
}; 