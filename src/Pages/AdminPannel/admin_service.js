import { supabase } from '../../supabase';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for admin operations
const supabaseAdmin = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
    )
  : supabase; // Fallback to regular client if service role key is not available

// ========= RESTAURANT MANAGEMENT =========

/**
 * Get all restaurants (admin only)
 */
export const getAllRestaurants = async () => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        restaurant_staff (
          staff_role,
          profiles (
            id,
            full_name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getAllRestaurants query:', error);
      throw error;
    }

    // Transform data to match your component structure
    const transformedData = data.map(restaurant => {
      // Find the manager from the nested restaurant_staff array
      const managerStaff = restaurant.restaurant_staff?.find(
        staff => staff.staff_role === 'manager'
      );
      
      const manager = managerStaff ? managerStaff.profiles : null;

      return {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        contact_phone: restaurant.contact_phone,
        contact_email: restaurant.contact_email,
        cuisine_type: restaurant.cuisine_type,
        is_active: restaurant.is_active,
        logo_url: restaurant.logo_url,
        description: restaurant.description,
        opening_hours: restaurant.opening_hours,
        location: restaurant.location,
        manager: manager ? {
          name: manager.full_name,
          email: manager.email,
          id: manager.id
        } : null,
        staff_count: 0, // Will be populated by getRestaurantStaffCount
        created_at: restaurant.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      };
    });

    // Get staff count for each restaurant
    for (let restaurant of transformedData) {
      const staffCount = await getRestaurantStaffCount(restaurant.id);
      restaurant.staff_count = staffCount;
    }

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get staff count for a restaurant
 */
export const getRestaurantStaffCount = async (restaurantId) => {
  try {
    const { count, error } = await supabase
      .from('restaurant_staff')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting staff count:', error);
    return 0;
  }
};

/**
 * Create a new restaurant with manager
 */
export const createRestaurant = async (restaurantData) => {
  try {
    // Start a transaction-like operation
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: restaurantData.manager_email,
      password: restaurantData.manager_password,
      email_confirm: true
    });

    if (userError) throw userError;

    // Create profile for the manager
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: restaurantData.manager_name,
        email: restaurantData.manager_email,
        profile_role: 'staff'
      });

    if (profileError) throw profileError;

    // Create the restaurant
    const restaurantInsertData = {
      name: restaurantData.name,
      address: restaurantData.address,
      contact_phone: restaurantData.contact_phone,
      contact_email: restaurantData.contact_email,
      cuisine_type: restaurantData.cuisine_type,
      description: restaurantData.description,
      opening_hours: restaurantData.opening_hours,
      is_active: true
    };

    // Add location if provided
    if (restaurantData.latitude && restaurantData.longitude) {
      restaurantInsertData.location = `POINT(${restaurantData.longitude} ${restaurantData.latitude})`;
    }

    const { data: restaurantData_result, error: restaurantError } = await supabase
      .from('restaurants')
      .insert(restaurantInsertData)
      .select()
      .single();

    if (restaurantError) throw restaurantError;

    // Link manager to restaurant
    const { error: staffError } = await supabase
      .from('restaurant_staff')
      .insert({
        restaurant_id: restaurantData_result.id,
        user_id: userData.user.id,
        staff_role: 'manager'
      });

    if (staffError) throw staffError;

    return { data: restaurantData_result, error: null };
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Update restaurant status (active/inactive)
 */
export const toggleRestaurantStatus = async (restaurantId, newStatus) => {
  try {
    const { error } = await supabase
      .from('restaurants')
      .update({ is_active: newStatus })
      .eq('id', restaurantId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error toggling restaurant status:', error);
    return { error: error.message };
  }
};

/**
 * Update restaurant details
 */
export const updateRestaurant = async (restaurantId, updateData) => {
  try {
    // Prepare location if coordinates are provided
    if (updateData.latitude && updateData.longitude) {
      updateData.location = `POINT(${updateData.longitude} ${updateData.latitude})`;
      delete updateData.latitude;
      delete updateData.longitude;
    }

    const { data, error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Delete restaurant (also removes all related data due to CASCADE)
 */
export const deleteRestaurant = async (restaurantId) => {
  try {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return { error: error.message };
  }
};

// ========= STAFF MANAGEMENT =========

/**
 * Get all staff members across all restaurants
 */
export const getAllStaff = async () => {
  try {
    const { data, error } = await supabase
      .from('restaurant_staff')
      .select(`
        id,
        staff_role,
        profiles!inner(
          id,
          full_name,
          email
        ),
        restaurants!inner(
          id,
          name
        )
      `);

    if (error) throw error;

    // Transform data to match your component structure
    const transformedData = data.map(staff => ({
      id: staff.id,
      name: staff.profiles.full_name,
      email: staff.profiles.email,
      role: staff.staff_role,
      restaurant_id: staff.restaurants.id,
      restaurant_name: staff.restaurants.name,
      status: 'active', // Default status since we don't have is_active in profiles
      user_id: staff.profiles.id
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching staff:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get staff for a specific restaurant
 */
export const getRestaurantStaff = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_staff')
      .select(`
        id,
        staff_role,
        profiles!inner(
          id,
          full_name,
          email,
          is_active
        )
      `)
      .eq('restaurant_id', restaurantId);

    if (error) throw error;

    const transformedData = data.map(staff => ({
      id: staff.id,
      name: staff.profiles.full_name,
      email: staff.profiles.email,
      role: staff.staff_role,
      status: staff.profiles.is_active ? 'active' : 'inactive',
      user_id: staff.profiles.id
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching restaurant staff:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Create a new staff member
 */
export const createStaff = async (staffData) => {
  try {
    // First check if the email already exists in profiles
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, email, profile_role')
      .eq('email', staffData.email)
      .single();

    let userId;

    if (existingProfile) {
      // User exists in profiles, use their existing profile
      userId = existingProfile.id;
      
      // Check if user is already staff at this restaurant
      const { data: existingStaff, error: staffCheckError } = await supabase
        .from('restaurant_staff')
        .select('id')
        .eq('restaurant_id', staffData.restaurant_id)
        .eq('user_id', userId)
        .single();

      if (existingStaff) {
        throw new Error('This user is already a staff member at this restaurant.');
      }

      // Update their role to staff if they're not already staff
      if (existingProfile.profile_role !== 'staff') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ profile_role: 'staff' })
          .eq('id', userId);

        if (updateError) throw updateError;
      }
    } else {
      // Try to sign in first to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: staffData.email,
        password: staffData.password
      });

      if (signInError) {
        // If sign in fails, try to create new user
        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: staffData.email,
          password: staffData.password,
          options: {
            data: {
              full_name: staffData.name,
              profile_role: 'staff'
            }
          }
        });

        if (userError) throw userError;
        userId = userData.user.id;
      } else {
        // User exists in auth, use their ID
        userId = signInData.user.id;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: staffData.name,
          email: staffData.email,
          profile_role: 'staff'
        });

      if (profileError) {
        throw profileError;
      }
    }

    // Link staff to restaurant using admin client to bypass RLS
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('restaurant_staff')
      .insert({
        restaurant_id: staffData.restaurant_id,
        user_id: userId,
        staff_role: staffData.role
      })
      .select()
      .single();

    if (staffError) throw staffError;

    return { 
      data: {
        ...staff,
        message: existingProfile ? 'Existing user added as staff member' : 'New staff member created successfully'
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error creating staff member:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to create staff member'
    };
  }
};

/**
 * Update staff member details
 */
export const updateStaff = async (staffId, updates) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_staff')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating staff member:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Delete a staff member
 */
export const deleteStaff = async (staffId) => {
  try {
    // First get the user_id
    const { data: staff, error: fetchError } = await supabase
      .from('restaurant_staff')
      .select('user_id')
      .eq('id', staffId)
      .single();

    if (fetchError) throw fetchError;

    // Delete the staff record
    const { error: deleteError } = await supabase
      .from('restaurant_staff')
      .delete()
      .eq('id', staffId);

    if (deleteError) throw deleteError;

    // Delete the user's profile and auth account
    if (staff.user_id) {
      await supabase.auth.admin.deleteUser(staff.user_id);
      await supabase
        .from('profiles')
        .delete()
        .eq('id', staff.user_id);
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return { error: error.message };
  }
};

/**
 * Toggle staff member status
 */
export const toggleStaffStatus = async (staffId) => {
  try {
    // Get current status
    const { data: staffData, error: fetchError } = await supabase
      .from('restaurant_staff')
      .select(`
        profiles!inner(
          id,
          is_active
        )
      `)
      .eq('id', staffId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle status
    const newStatus = !staffData.profiles.is_active;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('id', staffData.profiles.id);

    if (updateError) throw updateError;

    return { data: { is_active: newStatus }, error: null };
  } catch (error) {
    console.error('Error toggling staff status:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Remove staff member from restaurant
 */
export const removeStaffMember = async (staffId) => {
  try {
    const { error } = await supabase
      .from('restaurant_staff')
      .delete()
      .eq('id', staffId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error removing staff member:', error);
    return { error: error.message };
  }
};

// ========= UTILITY FUNCTIONS =========

/**
 * Search restaurants by name or cuisine
 */
export const searchRestaurants = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,cuisine_type.ilike.%${searchTerm}%`);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching restaurants:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get restaurant analytics/stats
 */
export const getRestaurantStats = async (restaurantId = null) => {
  try {
    let query = supabase
      .from('restaurants')
      .select('id, name, is_active');

    if (restaurantId) {
      query = query.eq('id', restaurantId);
    }

    const { data: restaurants, error: restaurantError } = await query;
    if (restaurantError) throw restaurantError;

    const stats = {
      total_restaurants: restaurants.length,
      active_restaurants: restaurants.filter(r => r.is_active).length,
      inactive_restaurants: restaurants.filter(r => !r.is_active).length,
      total_staff: 0,
      total_orders: 0,
      total_revenue: 0
    };

    // Get total staff count
    const { count: staffCount, error: staffError } = await supabase
      .from('restaurant_staff')
      .select('*', { count: 'exact', head: true });

    if (!staffError) stats.total_staff = staffCount || 0;

    // Get total orders (you'll need to implement this based on your orders table structure)
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (!ordersError) stats.total_orders = ordersCount || 0;

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting restaurant stats:', error);
    return { data: null, error: error.message };
  }
};