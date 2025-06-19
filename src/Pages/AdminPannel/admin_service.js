import { supabase } from '../../supabase';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for admin operations
// This client bypasses RLS policies and should be used for all admin tasks.
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
    const { data, error } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurants')
      .select(`
        *,
        restaurant_staff (
          staff_role,
          staff_name,
          staff_email,
          staff_phone_number,
          connected,
          user_id,
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
      const managerStaff = restaurant.restaurant_staff?.find(
        staff => staff.staff_role === 'manager'
      );
      
      let manager = null;
      if (managerStaff) {
        if (managerStaff.connected && managerStaff.profiles) {
          manager = {
            name: managerStaff.profiles.full_name,
            email: managerStaff.profiles.email,
            id: managerStaff.profiles.id,
            connected: true
          };
        } else {
          manager = {
            name: managerStaff.staff_name,
            email: managerStaff.staff_email,
            phone: managerStaff.staff_phone_number,
            connected: false,
            staff_id: managerStaff.id
          };
        }
      }

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
        social_media: restaurant.social_media,
        manager: manager,
        staff_count: 0, 
        created_at: restaurant.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      };
    });

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
    const { count, error } = await supabaseAdmin // USE ADMIN CLIENT
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
    const restaurantInsertData = {
      name: restaurantData.name,
      address: restaurantData.address,
      contact_phone: restaurantData.contact_phone,
      contact_email: restaurantData.contact_email,
      cuisine_type: restaurantData.cuisine_type,
      description: restaurantData.description,
      opening_hours: restaurantData.opening_hours,
      social_media: restaurantData.social_media,
      is_active: true
    };

    if (restaurantData.latitude && restaurantData.longitude) {
      restaurantInsertData.location = `POINT(${restaurantData.longitude} ${restaurantData.latitude})`;
    }

    const { data: restaurantData_result, error: restaurantError } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurants')
      .insert(restaurantInsertData)
      .select()
      .single();

    if (restaurantError) throw restaurantError;

    const { error: staffError } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurant_staff')
      .insert({
        restaurant_id: restaurantData_result.id,
        staff_name: restaurantData.manager_name,
        staff_email: restaurantData.manager_email,
        staff_phone_number: restaurantData.manager_phone || null,
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
    const { error } = await supabaseAdmin // USE ADMIN CLIENT
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
    if (updateData.latitude && updateData.longitude) {
      updateData.location = `POINT(${updateData.longitude} ${updateData.latitude})`;
      delete updateData.latitude;
      delete updateData.longitude;
    }

    const { data, error } = await supabaseAdmin // USE ADMIN CLIENT
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
 * Delete restaurant and all associated staff safely.
 */
export const deleteRestaurant = async (restaurantId) => {
  try {
    const { data: staff, error: staffError } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurant_staff')
      .select('id')
      .eq('restaurant_id', restaurantId);

    if (staffError) {
      console.error('Error fetching staff for deletion:', staffError);
      throw staffError;
    }

    for (const staffMember of staff) {
      const { error: deleteStaffError } = await deleteStaff(staffMember.id);
      if (deleteStaffError) {
        throw new Error(`Failed to delete staff member ${staffMember.id}. Halting restaurant deletion.`);
      }
    }

    const { error: deleteRestaurantError } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);

    if (deleteRestaurantError) throw deleteRestaurantError;

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
    const { data, error } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurant_staff')
      .select(`
        id,
        staff_role,
        staff_name,
        staff_email,
        staff_phone_number,
        connected,
        user_id,
        profiles (
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

    const transformedData = data.map(staff => {
      const name = staff.connected && staff.profiles ? staff.profiles.full_name : staff.staff_name;
      const email = staff.connected && staff.profiles ? staff.profiles.email : staff.staff_email;
      
      return {
        id: staff.id,
        name: name,
        email: email,
        phone_number: staff.staff_phone_number,
        role: staff.staff_role,
        restaurant_id: staff.restaurants.id,
        restaurant_name: staff.restaurants.name,
        status: staff.connected ? 'connected' : 'standalone',
        user_id: staff.user_id,
        connected: staff.connected
      };
    });

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching staff:', error);
    return { data: [], error: error.message };
  }
};


/**
 * Create a new staff member, trusting DB triggers for linking.
 */
export const createStaff = async (staffData) => {
  try {
    const { data: staff, error: staffError } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurant_staff')
      .insert({
        restaurant_id: staffData.restaurant_id,
        staff_name: staffData.name,
        staff_email: staffData.email,
        staff_phone_number: staffData.phone_number,
        staff_role: staffData.role
      })
      .select()
      .single();

    if (staffError) throw staffError;

    return { data: staff, error: null };
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
    const allowedUpdates = {
      staff_name: updates.name,
      staff_email: updates.email,
      staff_phone_number: updates.phone_number,
      staff_role: updates.role
    };

    const { data, error } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurant_staff')
      .update(allowedUpdates)
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
 * Delete a staff member with a safety check.
 */
export const deleteStaff = async (staffId) => {
  try {
    const { data: staffToDelete, error: fetchError } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurant_staff')
      .select('id, user_id, connected')
      .eq('id', staffId)
      .single();

    if (fetchError) throw fetchError;

    if (staffToDelete.connected && staffToDelete.user_id) {
      const { data: otherAssignments, error: checkError } = await supabaseAdmin // USE ADMIN CLIENT
        .from('restaurant_staff')
        .select('id')
        .eq('user_id', staffToDelete.user_id)
        .neq('id', staffId);

      if (checkError) throw checkError;

      if (otherAssignments.length === 0) {
        console.log(`User ${staffToDelete.user_id} has no other assignments. Deleting profile and auth user.`);
        await supabaseAdmin.auth.admin.deleteUser(staffToDelete.user_id); // USE ADMIN CLIENT
      } else {
        console.log(`User ${staffToDelete.user_id} has other assignments. Only removing this one staff role.`);
      }
    }

    const { error: deleteError } = await supabaseAdmin // USE ADMIN CLIENT
      .from('restaurant_staff')
      .delete()
      .eq('id', staffId);

    if (deleteError) throw deleteError;

    return { error: null };
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return { error: error.message };
  }
};
