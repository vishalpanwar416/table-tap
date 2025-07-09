import { supabase } from '../../supabase';

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
        tables
      `)
      .eq('is_active', true)
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
        location
      `)
      .eq('is_active', true)
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
        location
      `)
      .eq('is_active', true)
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
 * Get restaurants near a specific location
 */
export const getRestaurantsNearLocation = async (latitude, longitude, radiusKm = 50) => {
  try {
    
    // Note: This is a simplified approach. For production, you might want to use
    // PostGIS functions for more accurate distance calculations
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
        location
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw error;
    }

    // Filter restaurants by distance (client-side filtering)
    // In a production environment, you'd want to do this server-side with PostGIS
    const restaurantsWithDistance = data
      .map(restaurant => {
        let distance = null;
        
        if (restaurant.location) {
          try {
            const match = restaurant.location.match(/POINT\(([^)]+)\)/);
            if (match) {
              const [lng, lat] = match[1].split(' ');
              distance = calculateDistance(
                latitude, 
                longitude, 
                parseFloat(lat), 
                parseFloat(lng)
              );
            }
          } catch (error) {
          }
        }
        
        return {
          ...restaurant,
          distance
        };
      })
      .filter(restaurant => restaurant.distance === null || restaurant.distance <= radiusKm)
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

    return restaurantsWithDistance;
  } catch (error) {
    throw error;
  }
};

/**
 * Get closest restaurants within a radius (in meters) from a point
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} radiusMeters
 * @returns {Promise<Array>} List of restaurants with distance (meters)
 */
export const getClosestRestaurants = async (latitude, longitude, radiusMeters = 5000) => {
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
        distance:ST_Distance(location, ST_MakePoint(${longitude}, ${latitude})::geography)
      `)
      .eq('is_active', true)
      .filter('location', 'is not', null)
      .lte('distance', radiusMeters)
      .order('distance', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};
