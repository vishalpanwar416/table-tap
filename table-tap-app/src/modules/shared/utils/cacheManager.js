import { useCallback } from 'react';

// Cache management utilities
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Maximum number of cached items
  }

  set(key, value, ttl = 5 * 60 * 1000) {
    // Default 5 minutes
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();

// React hook for caching
export const useCache = () => {
  const setCache = useCallback((key, value, ttl) => {
    cacheManager.set(key, value, ttl);
  }, []);

  const getCache = useCallback((key) => {
    return cacheManager.get(key);
  }, []);

  const clearCache = useCallback(() => {
    cacheManager.clear();
  }, []);

  return { setCache, getCache, clearCache };
};
