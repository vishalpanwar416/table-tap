import { supabase } from '../../shared/supabase';
import { cacheManager } from '../../shared/utils/cacheManager';

// Enhanced food service with caching, error handling, and performance optimizations
class EnhancedFoodService {
  constructor() {
    this.cache = cacheManager;
    this.requestQueue = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // Generic request method with retry logic
  async makeRequest(requestFn, cacheKey = null, ttl = 5 * 60 * 1000) {
    // Check cache first
    if (cacheKey) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    // Create new request promise
    const requestPromise = this.executeWithRetry(requestFn);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful result
      if (cacheKey && result) {
        this.cache.set(cacheKey, result, ttl);
      }
      
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  // Retry logic with exponential backoff
  async executeWithRetry(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.retryAttempts) {
        throw error;
      }

      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.executeWithRetry(requestFn, attempt + 1);
    }
  }

  // Enhanced best seller items fetch
  async fetchBestSellerItems(restaurantId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'popularity',
      sortOrder = 'desc',
      includeInactive = false
    } = options;

    const cacheKey = `bestsellers_${restaurantId}_${limit}_${offset}_${sortBy}_${sortOrder}`;

    return this.makeRequest(async () => {
      let query = supabase
        .from('fooditems')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .contains('tags', ['bestseller']);

      // Apply filters
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price':
          query = query.order('price', { ascending: sortOrder === 'asc' });
          break;
        case 'name':
          query = query.order('name', { ascending: sortOrder === 'asc' });
          break;
        case 'rating':
          query = query.order('rating', { ascending: sortOrder === 'asc' });
          break;
        case 'popularity':
        default:
          query = query.order('popularity_score', { ascending: sortOrder === 'asc' });
          break;
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch best seller items: ${error.message}`);
      }

      // Enhance data with computed fields
      const enhancedData = data.map(item => ({
        ...item,
        finalPrice: this.calculateFinalPrice(item),
        discountPercentage: this.calculateDiscountPercentage(item),
        isDiscounted: this.hasDiscount(item)
      }));

      return {
        items: enhancedData,
        total: count,
        hasMore: enhancedData.length === limit,
        offset,
        limit
      };
    }, cacheKey, 10 * 60 * 1000); // 10 minutes cache
  }

  // Enhanced recommended items fetch
  async fetchRecommendedItems(restaurantId, options = {}) {
    const {
      limit = 10,
      userId = null,
      includePersonalized = true
    } = options;

    const cacheKey = `recommendations_${restaurantId}_${limit}_${userId || 'anonymous'}`;

    return this.makeRequest(async () => {
      let query = supabase
        .from('fooditems')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .contains('tags', ['recommended']);

      // Add personalized recommendations if user is logged in
      if (userId && includePersonalized) {
        // This would integrate with a recommendation system
        // For now, we'll just get recommended items
        query = query.order('rating', { ascending: false });
      } else {
        query = query.order('popularity_score', { ascending: false });
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch recommended items: ${error.message}`);
      }

      return data.map(item => ({
        ...item,
        finalPrice: this.calculateFinalPrice(item),
        discountPercentage: this.calculateDiscountPercentage(item),
        isDiscounted: this.hasDiscount(item)
      }));
    }, cacheKey, 15 * 60 * 1000); // 15 minutes cache
  }

  // Enhanced all food items fetch with pagination
  async fetchAllFoodItems(restaurantId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      category = null,
      searchQuery = null,
      sortBy = 'name',
      sortOrder = 'asc',
      includeInactive = false
    } = options;

    const cacheKey = `allfood_${restaurantId}_${limit}_${offset}_${category}_${searchQuery}_${sortBy}_${sortOrder}`;

    return this.makeRequest(async () => {
      let query = supabase
        .from('fooditems')
        .select('*')
        .eq('restaurant_id', restaurantId);

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch food items: ${error.message}`);
      }

      return {
        items: data.map(item => ({
          ...item,
          finalPrice: this.calculateFinalPrice(item),
          discountPercentage: this.calculateDiscountPercentage(item),
          isDiscounted: this.hasDiscount(item)
        })),
        total: count,
        hasMore: data.length === limit,
        offset,
        limit
      };
    }, cacheKey, 5 * 60 * 1000); // 5 minutes cache
  }

  // Utility methods
  calculateFinalPrice(item) {
    if (!this.hasDiscount(item)) {
      return Number(item.price);
    }

    const originalPrice = Number(item.price);
    if (item.discounttype === 'Percentage') {
      return originalPrice - (originalPrice * (item.discountvalue / 100));
    } else {
      return Math.max(0, originalPrice - item.discountvalue);
    }
  }

  calculateDiscountPercentage(item) {
    if (!this.hasDiscount(item)) {
      return 0;
    }

    const originalPrice = Number(item.price);
    const finalPrice = this.calculateFinalPrice(item);
    return ((originalPrice - finalPrice) / originalPrice) * 100;
  }

  hasDiscount(item) {
    return item.discounttype && item.discountvalue && item.discountvalue > 0;
  }

  // Clear cache for specific restaurant
  clearRestaurantCache(restaurantId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`_${restaurantId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size(),
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const enhancedFoodService = new EnhancedFoodService();

// Hook for using enhanced food service
export const useEnhancedFoodService = () => {
  return enhancedFoodService;
}; 