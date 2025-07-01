import { supabase } from '../../supabase';

/**
 * Get all active restaurants
 */
export const getActiveRestaurants = async () => {
  try {
    console.log('Fetching active restaurants...');
    
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
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} active restaurants`);
    return data || [];
  } catch (error) {
    console.error('Error in getActiveRestaurants:', error);
    throw error;
  }
};

/**
 * Get restaurant by ID
 */
export const getRestaurantById = async (restaurantId) => {
  try {
    console.log('Fetching restaurant by ID:', restaurantId);
    
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
      console.error('Error fetching restaurant by ID:', error);
      throw error;
    }

    console.log('Retrieved restaurant:', data?.name);
    return data;
  } catch (error) {
    console.error('Error in getRestaurantById:', error);
    throw error;
  }
};

/**
 * Get restaurant tables
 */
export const getRestaurantTables = async (restaurantId) => {
  try {
    console.log('Fetching tables for restaurant:', restaurantId);
    
    const { data, error } = await supabase
      .from('restaurants')
      .select('tables')
      .eq('id', restaurantId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching restaurant tables:', error);
      throw error;
    }

    // Parse tables JSON if it exists
    let tables = [];
    if (data?.tables) {
      try {
        tables = typeof data.tables === 'string' ? JSON.parse(data.tables) : data.tables;
      } catch (parseError) {
        console.error('Error parsing tables JSON:', parseError);
        tables = [];
      }
    }

    console.log(`Retrieved ${tables.length} tables for restaurant`);
    return tables;
  } catch (error) {
    console.error('Error in getRestaurantTables:', error);
    throw error;
  }
};

/**
 * Update restaurant tables
 */
export const updateRestaurantTables = async (restaurantId, tables) => {
  try {
    console.log('Updating tables for restaurant:', restaurantId);
    
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
      console.error('Error updating restaurant tables:', error);
      throw error;
    }

    console.log('Successfully updated restaurant tables');
    return data;
  } catch (error) {
    console.error('Error in updateRestaurantTables:', error);
    throw error;
  }
};

/**
 * Search restaurants by name or cuisine type
 */
export const searchRestaurants = async (searchTerm) => {
  try {
    console.log('Searching restaurants with term:', searchTerm);
    
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
      console.error('Error searching restaurants:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} restaurants matching search term`);
    return data || [];
  } catch (error) {
    console.error('Error in searchRestaurants:', error);
    throw error;
  }
};

/**
 * Get restaurants by cuisine type
 */
export const getRestaurantsByCuisine = async (cuisineType) => {
  try {
    console.log('Fetching restaurants by cuisine type:', cuisineType);
    
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
      console.error('Error fetching restaurants by cuisine:', error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} ${cuisineType} restaurants`);
    return data || [];
  } catch (error) {
    console.error('Error in getRestaurantsByCuisine:', error);
    throw error;
  }
};

/**
 * Get restaurant statistics
 */
export const getRestaurantStats = async (restaurantId) => {
  try {
    console.log('Fetching restaurant statistics:', restaurantId);
    
    // Get restaurant data
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (restaurantError) {
      console.error('Error fetching restaurant data:', restaurantError);
      throw restaurantError;
    }

    // Get order count for this restaurant
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    if (orderError) {
      console.error('Error fetching order count:', orderError);
      // Don't throw error for order count, just log it
    }

    // Get food items count for this restaurant
    const { count: foodItemCount, error: foodError } = await supabase
      .from('fooditems')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    if (foodError) {
      console.error('Error fetching food item count:', foodError);
      // Don't throw error for food count, just log it
    }

    const stats = {
      restaurant,
      orderCount: orderCount || 0,
      foodItemCount: foodItemCount || 0,
      isActive: restaurant?.is_active || false
    };

    console.log('Retrieved restaurant statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error in getRestaurantStats:', error);
    throw error;
  }
};

/**
 * Get restaurants near a specific location
 */
export const getRestaurantsNearLocation = async (latitude, longitude, radiusKm = 50) => {
  try {
    console.log('Fetching restaurants near location:', { latitude, longitude, radiusKm });
    
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
      console.error('Error fetching restaurants near location:', error);
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
            console.error('Error calculating distance for restaurant:', restaurant.id, error);
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

    console.log(`Found ${restaurantsWithDistance.length} restaurants within ${radiusKm}km`);
    return restaurantsWithDistance;
  } catch (error) {
    console.error('Error in getRestaurantsNearLocation:', error);
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
