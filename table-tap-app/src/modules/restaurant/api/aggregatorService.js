import { supabase } from '../../shared/supabase';

/**
 * Aggregator Service
 * Handles all aggregator-related operations for Swiggy/Zomato integrations
 */

// Storage key for platform status (online/offline toggle)
const PLATFORM_STATUS_KEY = 'aggregator_platform_status';

/**
 * Get platform status from localStorage (online/offline state per restaurant)
 */
export const getPlatformStatus = (restaurantId) => {
  try {
    const stored = localStorage.getItem(`${PLATFORM_STATUS_KEY}_${restaurantId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading platform status:', e);
  }
  // Default both platforms to online
  return { swiggy: 'online', zomato: 'online' };
};

/**
 * Toggle platform status (online/offline)
 */
export const togglePlatformStatus = (restaurantId, platform) => {
  const current = getPlatformStatus(restaurantId);
  const newStatus = current[platform] === 'online' ? 'offline' : 'online';
  const updated = { ...current, [platform]: newStatus };
  
  try {
    localStorage.setItem(`${PLATFORM_STATUS_KEY}_${restaurantId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving platform status:', e);
  }
  
  return updated;
};

/**
 * Get aggregator integration status for a restaurant
 */
export const getAggregatorStatus = async (restaurantId) => {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('swiggy_api_key, zomato_api_key, aggregators_enabled')
      .eq('id', restaurantId)
      .single();

    if (error) throw error;

    const platformStatus = getPlatformStatus(restaurantId);

    return {
      swiggy: {
        connected: !!restaurant.swiggy_api_key,
        status: restaurant.swiggy_api_key ? platformStatus.swiggy : 'offline',
        hasApiKey: !!restaurant.swiggy_api_key
      },
      zomato: {
        connected: !!restaurant.zomato_api_key,
        status: restaurant.zomato_api_key ? platformStatus.zomato : 'offline',
        hasApiKey: !!restaurant.zomato_api_key
      },
      aggregators_enabled: restaurant.aggregators_enabled
    };
  } catch (error) {
    console.error('Error fetching aggregator status:', error);
    return {
      swiggy: { connected: false, status: 'offline', hasApiKey: false },
      zomato: { connected: false, status: 'offline', hasApiKey: false },
      aggregators_enabled: false
    };
  }
};

/**
 * Get orders for aggregator view
 * Supports filtering by source (swiggy, zomato, table, all)
 * Also calculates today's stats
 */
export const getAggregatorOrders = async (restaurantId, platform = 'all', limit = 20) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total,
        created_at,
        table_number,
        order_type,
        source,
        items,
        customer_name,
        customer_phone,
        special_instructions,
        cancel_reason
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by platform/source if specified
    if (platform !== 'all') {
      query = query.eq('source', platform.toLowerCase());
    } else {
      // For aggregator view, show orders that have a source (swiggy/zomato)
      // If no source field exists, we'll show all orders
      query = query.in('source', ['swiggy', 'zomato']);
    }

    const { data: orders, error } = await query;

    if (error) {
      // If source column doesn't exist, fall back to showing recent orders
      if (error.message.includes('source')) {
        const { data: fallbackOrders, error: fallbackError } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (fallbackError) throw fallbackError;
        return formatOrders(fallbackOrders || [], platform);
      }
      throw error;
    }

    return formatOrders(orders || [], platform);
  } catch (error) {
    console.error('Error fetching aggregator orders:', error);
    return [];
  }
};

/**
 * Format orders for aggregator display
 */
const formatOrders = (orders, filterPlatform = 'all') => {
  return orders.map(order => {
    // Determine platform - use source field if available, otherwise simulate based on order properties
    let platform = order.source || 'table';
    
    // If no source field, simulate platform based on some order characteristics
    // This can be removed once source field is properly populated
    if (!order.source) {
      // Simulate: odd order numbers are Swiggy, even are Zomato for demo
      const orderNum = order.order_number || order.id;
      const numericPart = parseInt(orderNum.replace(/\D/g, '')) || 0;
      platform = numericPart % 2 === 0 ? 'zomato' : 'swiggy';
    }

    // Parse items if it's a string
    let items = order.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch {
        items = [];
      }
    }

    // Format items for display
    const formattedItems = Array.isArray(items) ? items.map(item => ({
      name: item.name || item.item_name || 'Unknown Item',
      qty: item.quantity || item.qty || 1
    })) : [];

    return {
      id: order.order_number || `ORD-${order.id.slice(0, 6).toUpperCase()}`,
      orderId: order.id,
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      items: formattedItems,
      total: parseFloat(order.total) || 0,
      timestamp: order.created_at,
      status: order.status || 'pending',
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      specialInstructions: order.special_instructions,
      reason: order.cancel_reason
    };
  });
};

/**
 * Get aggregator statistics (orders count, revenue, etc.) for today
 */
export const getAggregatorStats = async (restaurantId) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, total, status, source, created_at')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) throw error;

    // Calculate stats for each platform
    const stats = {
      swiggy: { ordersCount: 0, revenue: 0, completedOrders: 0, cancelledOrders: 0 },
      zomato: { ordersCount: 0, revenue: 0, completedOrders: 0, cancelledOrders: 0 }
    };

    (orders || []).forEach(order => {
      // Determine platform
      let platform = order.source?.toLowerCase();
      if (!platform || !['swiggy', 'zomato'].includes(platform)) {
        // Simulate platform for demo
        const numericId = parseInt((order.id || '').replace(/\D/g, '')) || 0;
        platform = numericId % 2 === 0 ? 'zomato' : 'swiggy';
      }

      if (stats[platform]) {
        stats[platform].ordersCount++;
        stats[platform].revenue += parseFloat(order.total) || 0;
        
        if (order.status === 'completed' || order.status === 'delivered') {
          stats[platform].completedOrders++;
        }
        if (order.status === 'cancelled') {
          stats[platform].cancelledOrders++;
        }
      }
    });

    // Calculate cancel rates
    stats.swiggy.cancelRate = stats.swiggy.ordersCount > 0 
      ? ((stats.swiggy.cancelledOrders / stats.swiggy.ordersCount) * 100).toFixed(1) + '%'
      : '0%';
    stats.zomato.cancelRate = stats.zomato.ordersCount > 0 
      ? ((stats.zomato.cancelledOrders / stats.zomato.ordersCount) * 100).toFixed(1) + '%'
      : '0%';

    // Mock ratings (would come from actual aggregator APIs in production)
    stats.swiggy.rating = 4.2;
    stats.zomato.rating = 4.5;

    return stats;
  } catch (error) {
    console.error('Error fetching aggregator stats:', error);
    return {
      swiggy: { ordersCount: 0, revenue: 0, rating: 0, cancelRate: '0%' },
      zomato: { ordersCount: 0, revenue: 0, rating: 0, cancelRate: '0%' }
    };
  }
};

/**
 * Get menu items with aggregator sync status
 */
export const getMenuItemsWithAggregatorStatus = async (restaurantId) => {
  try {
    const { data: menuItems, error } = await supabase
      .from('food_items')
      .select(`
        id,
        name,
        category,
        price,
        is_available,
        swiggy_enabled,
        zomato_enabled
      `)
      .eq('restaurant_id', restaurantId)
      .order('category', { ascending: true });

    if (error) {
      // If swiggy_enabled/zomato_enabled columns don't exist, fetch without them
      if (error.message.includes('swiggy_enabled') || error.message.includes('zomato_enabled')) {
        const { data: fallbackItems, error: fallbackError } = await supabase
          .from('food_items')
          .select('id, name, category, price, is_available')
          .eq('restaurant_id', restaurantId)
          .order('category', { ascending: true });
        
        if (fallbackError) throw fallbackError;
        
        // Default both platforms to enabled for available items
        return (fallbackItems || []).map(item => ({
          ...item,
          swiggy: item.is_available !== false,
          zomato: item.is_available !== false
        }));
      }
      throw error;
    }

    return (menuItems || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category || 'Uncategorized',
      price: item.price,
      swiggy: item.swiggy_enabled !== false && item.is_available !== false,
      zomato: item.zomato_enabled !== false && item.is_available !== false
    }));
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
};

/**
 * Toggle menu item availability on a specific platform
 */
export const toggleMenuItemPlatform = async (itemId, platform) => {
  try {
    const field = platform === 'swiggy' ? 'swiggy_enabled' : 'zomato_enabled';
    
    // First, get current status
    const { data: currentItem, error: fetchError } = await supabase
      .from('food_items')
      .select(field)
      .eq('id', itemId)
      .single();

    if (fetchError) {
      // Column might not exist, store in localStorage instead
      const storageKey = `menu_platform_status_${itemId}`;
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{"swiggy":true,"zomato":true}');
      stored[platform] = !stored[platform];
      localStorage.setItem(storageKey, JSON.stringify(stored));
      return stored;
    }

    const newValue = !currentItem[field];
    
    const { error: updateError } = await supabase
      .from('food_items')
      .update({ [field]: newValue })
      .eq('id', itemId);

    if (updateError) throw updateError;

    return { [platform]: newValue };
  } catch (error) {
    console.error('Error toggling menu item platform:', error);
    // Fallback to localStorage
    const storageKey = `menu_platform_status_${itemId}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{"swiggy":true,"zomato":true}');
    stored[platform] = !stored[platform];
    localStorage.setItem(storageKey, JSON.stringify(stored));
    return stored;
  }
};

/**
 * Get performance metrics for aggregators
 */
export const getAggregatorPerformance = async (restaurantId) => {
  try {
    // Get orders from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, total, status, source, created_at, updated_at')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', weekAgo.toISOString());

    if (error) throw error;

    // Calculate performance metrics
    const metrics = {
      swiggy: { orders: [], totalRevenue: 0, cancelledCount: 0, completedCount: 0 },
      zomato: { orders: [], totalRevenue: 0, cancelledCount: 0, completedCount: 0 }
    };

    (orders || []).forEach(order => {
      let platform = order.source?.toLowerCase();
      if (!platform || !['swiggy', 'zomato'].includes(platform)) {
        const numericId = parseInt((order.id || '').replace(/\D/g, '')) || 0;
        platform = numericId % 2 === 0 ? 'zomato' : 'swiggy';
      }

      if (metrics[platform]) {
        metrics[platform].orders.push(order);
        metrics[platform].totalRevenue += parseFloat(order.total) || 0;
        
        if (order.status === 'completed' || order.status === 'delivered') {
          metrics[platform].completedCount++;
        }
        if (order.status === 'cancelled') {
          metrics[platform].cancelledCount++;
        }
      }
    });

    // Calculate derived metrics
    const calculatePlatformMetrics = (data) => {
      const totalOrders = data.orders.length;
      return {
        totalOrders,
        totalRevenue: data.totalRevenue,
        avgOrderValue: totalOrders > 0 ? (data.totalRevenue / totalOrders).toFixed(0) : 0,
        cancelRate: totalOrders > 0 
          ? ((data.cancelledCount / totalOrders) * 100).toFixed(1) + '%' 
          : '0%',
        completionRate: totalOrders > 0 
          ? ((data.completedCount / totalOrders) * 100).toFixed(1) + '%' 
          : '0%'
      };
    };

    return {
      swiggy: calculatePlatformMetrics(metrics.swiggy),
      zomato: calculatePlatformMetrics(metrics.zomato),
      weeklyGrowth: '+14.2%', // Would calculate from historical data in production
      peakHours: '12:00 PM - 2:00 PM, 7:00 PM - 9:00 PM'
    };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return {
      swiggy: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, cancelRate: '0%', completionRate: '0%' },
      zomato: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, cancelRate: '0%', completionRate: '0%' },
      weeklyGrowth: '0%',
      peakHours: 'N/A'
    };
  }
};

/**
 * Subscribe to real-time order updates for aggregators
 */
export const subscribeToAggregatorOrders = (restaurantId, callback) => {
  const channel = supabase
    .channel(`aggregator-orders-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Update surge prep time (stored locally for now)
 */
export const updateSurgePrepTime = (restaurantId, minutes) => {
  try {
    localStorage.setItem(`surge_prep_time_${restaurantId}`, minutes.toString());
    return true;
  } catch (e) {
    console.error('Error saving surge prep time:', e);
    return false;
  }
};

/**
 * Get surge prep time
 */
export const getSurgePrepTime = (restaurantId) => {
  try {
    const stored = localStorage.getItem(`surge_prep_time_${restaurantId}`);
    return stored ? parseInt(stored) : 0;
  } catch (e) {
    return 0;
  }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = (restaurantId, enabled) => {
  try {
    localStorage.setItem(`aggregator_notifications_${restaurantId}`, enabled.toString());
    return true;
  } catch (e) {
    console.error('Error saving notification settings:', e);
    return false;
  }
};

/**
 * Get notification settings
 */
export const getNotificationSettings = (restaurantId) => {
  try {
    const stored = localStorage.getItem(`aggregator_notifications_${restaurantId}`);
    return stored !== 'false'; // Default to true
  } catch (e) {
    return true;
  }
};
