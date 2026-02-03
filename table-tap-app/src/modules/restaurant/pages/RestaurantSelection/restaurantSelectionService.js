import { supabase } from '../../../shared/supabase';

/**
 * Get all active restaurants
 */
export const getActiveRestaurants = async () => {
  try {

    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        address,
        contact_phone,
        opening_hours,
        logo_url,
        restaurant_photo_url,
        is_active,
        cuisine_type,
        location,
        tables,
        subscriptions!inner(status)
      `)
      .eq('is_active', true)
      .in('subscriptions.status', ['active', 'grace_period'])
      .order('name');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get restaurant by ID
 */
export const getRestaurantById = async (restaurantId) => {
  try {

    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        address,
        contact_phone,
        opening_hours,
        logo_url,
        is_active,
        cuisine_type,
        location,
        tables
      `)
      .eq('id', restaurantId)
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get restaurant tables
 */
export const getRestaurantTables = async (restaurantId) => {
  try {

    const { data, error } = await supabase
      .from('restaurants')
      .select('tables')
      .eq('id', restaurantId)
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }

    // Parse tables JSON if it exists
    let tables = [];
    if (data?.tables) {
      try {
        tables = typeof data.tables === 'string' ? JSON.parse(data.tables) : data.tables;
      } catch (parseError) {
        tables = [];
      }
    }

    return tables;
  } catch (error) {
    throw error;
  }
};

/**
 * Update restaurant tables
 */
export const updateRestaurantTables = async (restaurantId, tables) => {
  try {

    const { data, error } = await supabase
      .from('restaurants')
      .update({
        tables: JSON.stringify(tables),
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Search restaurants by name or cuisine type
 */
export const searchRestaurants = async (searchTerm) => {
  try {

    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        address,
        contact_phone,
        opening_hours,
        logo_url,
        is_active,
        cuisine_type,
        location,
        subscriptions!inner(status)
      `)
      .eq('is_active', true)
      .in('subscriptions.status', ['active', 'grace_period'])
      .or(`name.ilike.%${searchTerm}%,cuisine_type.ilike.%${searchTerm}%`)
      .order('name');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get restaurants by cuisine type
 */
export const getRestaurantsByCuisine = async (cuisineType) => {
  try {

    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        address,
        contact_phone,
        opening_hours,
        logo_url,
        is_active,
        cuisine_type,
        location,
        subscriptions!inner(status)
      `)
      .eq('is_active', true)
      .in('subscriptions.status', ['active', 'grace_period'])
      .eq('cuisine_type', cuisineType)
      .order('name');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get restaurant statistics
 */
export const getRestaurantStats = async (restaurantId) => {
  try {

    // Get restaurant data
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (restaurantError) {
      throw restaurantError;
    }

    // Get order count for this restaurant
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    if (orderError) {
      // Don't throw error for order count, just log it
    }

    // Get food items count for this restaurant
    const { count: foodItemCount, error: foodError } = await supabase
      .from('fooditems')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    if (foodError) {
      // Don't throw error for food count, just log it
    }

    const stats = {
      restaurant,
      orderCount: orderCount || 0,
      foodItemCount: foodItemCount || 0,
      isActive: restaurant?.is_active || false
    };

    return stats;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parse PostGIS POINT string to coordinates
 * Example: "POINT(77.5946 12.9716)" -> { lat: 12.9716, lng: 77.5946 }
 */
function parsePostGISPoint(pointString) {
  if (!pointString) return null;
  const match = pointString.match(/POINT\(([^)]+)\)/);
  if (!match) return null;
  const [lng, lat] = match[1].split(' ').map(Number);
  return { lat, lng };
}

/**
 * Check if PostGIS is available and properly configured
 */
async function checkPostGISAvailability() {
  try {
    const { data, error } = await supabase.rpc('check_postgis_available');
    if (error) {
      console.warn('PostGIS check failed:', error);
      return false;
    }
    return data === true;
  } catch (err) {
    console.warn('PostGIS not available, falling back to JavaScript calculation');
    return false;
  }
}

/**
 * Get closest restaurants using PostGIS (preferred method)
 */
async function getClosestRestaurantsPostGIS(latitude, longitude, radiusMeters = 5000) {
  try {
    const { data, error } = await supabase.rpc('get_restaurants_within_radius', {
      user_lat: latitude,
      user_lng: longitude,
      radius_meters: radiusMeters
    });
    if (error) {
      console.error('PostGIS query failed:', error);
      throw error;
    }

    // Filter by active subscription
    if (data && data.length > 0) {
      const activeIds = await fetchActiveRestaurantIds(data.map(r => r.id));
      return data.filter(r => activeIds.includes(r.id));
    }

    return data || [];
  } catch (err) {
    console.error('PostGIS method failed:', err);
    throw err;
  }
}

/**
 * Get closest restaurants using JavaScript calculation (fallback method)
 */
async function getClosestRestaurantsJavaScript(latitude, longitude, radiusMeters = 5000) {
  try {
    // Fetch all active restaurants
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*, subscriptions!inner(status)')
      .eq('is_active', true)
      .in('subscriptions.status', ['active', 'grace_period']);
    if (error) {
      console.error('Failed to fetch restaurants:', error);
      throw error;
    }
    if (!restaurants || restaurants.length === 0) {
      return [];
    }
    // Calculate distances and filter by radius
    const restaurantsWithDistance = restaurants
      .map(restaurant => {
        const location = parsePostGISPoint(restaurant.location);
        if (!location) return null;
        const distance = calculateDistance(
          latitude,
          longitude,
          location.lat,
          location.lng
        );
        return {
          ...restaurant,
          distance,
          latitude: location.lat,
          longitude: location.lng
        };
      })
      .filter(restaurant => restaurant && restaurant.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
    return restaurantsWithDistance;
  } catch (err) {
    console.error('JavaScript fallback method failed:', err);
    throw err;
  }
}

/**
 * Main function to get closest restaurants
 * Automatically chooses between PostGIS and JavaScript methods
 */
export async function getClosestRestaurants(latitude, longitude, radiusMeters = 5000) {
  // Validate inputs
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude. Must be between -90 and 90');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude. Must be between -180 and 180');
  }
  try {
    // First, try PostGIS method
    const isPostGISAvailable = await checkPostGISAvailability();
    if (isPostGISAvailable) {
      console.log('Using PostGIS for restaurant search');
      return await getClosestRestaurantsPostGIS(latitude, longitude, radiusMeters);
    } else {
      console.log('Using JavaScript fallback for restaurant search');
      return await getClosestRestaurantsJavaScript(latitude, longitude, radiusMeters);
    }
  } catch (err) {
    console.error('Primary method failed, trying fallback');
    try {
      return await getClosestRestaurantsJavaScript(latitude, longitude, radiusMeters);
    } catch (fallbackErr) {
      console.error('Both methods failed:', fallbackErr);
      throw new Error('Unable to fetch restaurants. Please try again later.');
    }
  }
}

/**
 * Get all restaurants (no location filtering)
 */
export async function getAllRestaurants() {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, subscriptions!inner(status)')
      .eq('is_active', true)
      .in('subscriptions.status', ['active', 'grace_period'])
      .order('name');
    if (error) {
      console.error('Failed to fetch all restaurants:', error);
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('Failed to get all restaurants:', err);
    throw err;
  }
}

/**
 * Utility function to format distance for display
 */
export function formatDistance(distanceMeters) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  } else {
    return `${(distanceMeters / 1000).toFixed(1)}km`;
  }
}

/**
 * Helper to fetch IDs of restaurants with active subscriptions
 */
async function fetchActiveRestaurantIds(restaurantIds) {
  if (!restaurantIds || restaurantIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('restaurant_id')
      .in('restaurant_id', restaurantIds)
      .in('status', ['active', 'grace_period']);

    if (error) throw error;

    // Return unique IDs
    return [...new Set(data.map(item => item.restaurant_id))];
  } catch (err) {
    console.error('Error fetching active subscriptions:', err);
    return [];
  }
}
