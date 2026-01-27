import { supabase } from '../../shared/supabase';

// ========= RESTAURANT MANAGEMENT =========

/**
 * Get all restaurants with their managers
 */
export const getRestaurants = async () => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        manager:profiles!restaurants_manager_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Add a new restaurant with manager
 */
export const addRestaurant = async (restaurantData) => {
  try {
    // First check if the email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', restaurantData.manager_email)
      .single();

    if (existingUser) {
      throw new Error('Manager email already registered. Please use a different email.');
    }

    // Create manager user account
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: restaurantData.manager_email,
      password: restaurantData.manager_password,
      options: {
        data: {
          full_name: restaurantData.manager_name,
          profile_role: 'manager'
        }
      }
    });

    if (userError) throw userError;

    // Create manager profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: restaurantData.manager_name,
        email: restaurantData.manager_email,
        profile_role: 'manager'
      });

    if (profileError) {
      // If profile creation fails, delete the auth user
      await supabase.auth.admin.deleteUser(userData.user.id);
      throw profileError;
    }

    // Create the restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: restaurantData.name,
        address: restaurantData.address,
        contact_phone: restaurantData.contact_phone,
        contact_email: restaurantData.contact_email,
        cuisine_type: restaurantData.cuisine_type,
        description: restaurantData.description,
        opening_hours: restaurantData.opening_hours,
        location: restaurantData.location,
        logo_url: restaurantData.logo_url,
        razorpay_key_id: restaurantData.razorpay_key_id,
        currency: restaurantData.currency,
        google_maps_link: restaurantData.google_maps_link,
        gst_number: restaurantData.gst_number,
        fssai_license: restaurantData.fssai_license,
        social_media: restaurantData.social_media,
        manager_id: userData.user.id
      })
      .select()
      .single();

    if (restaurantError) throw restaurantError;

    return { data: restaurant, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update restaurant details
 */
export const updateRestaurant = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Delete a restaurant
 */
export const deleteRestaurant = async (id) => {
  try {
    // First get the manager_id
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('manager_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete the restaurant
    const { error: deleteError } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Delete the manager's profile and auth account
    if (restaurant.manager_id) {
      await supabase.auth.admin.deleteUser(restaurant.manager_id);
      await supabase
        .from('profiles')
        .delete()
        .eq('id', restaurant.manager_id);
    }

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ========= STAFF MANAGEMENT =========

/**
 * Get all staff members
 */
export const getStaff = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        profile_role,
        is_active,
        restaurant:restaurants!restaurants_manager_id_fkey(
          id,
          name
        )
      `)
      .in('profile_role', ['manager', 'staff'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match component structure
    const transformedData = data.map(staff => ({
      id: staff.id,
      name: staff.full_name,
      email: staff.email,
      role: staff.profile_role,
      restaurant_id: staff.restaurant?.id,
      restaurant_name: staff.restaurant?.name,
      status: staff.is_active ? 'active' : 'inactive'
    }));

    return transformedData;
  } catch (error) {
    throw error;
  }
};

/**
 * Add a new staff member
 */
export const addStaff = async (staffData) => {
  try {
    // Create user account
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: staffData.email,
      password: staffData.password,
      options: {
        data: {
          full_name: staffData.name,
          profile_role: staffData.role
        }
      }
    });

    if (userError) throw userError;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: staffData.name,
        email: staffData.email,
        profile_role: staffData.role
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userData.user.id);
      throw profileError;
    }

    return { data: userData.user, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update staff member details
 */
export const updateStaff = async (id, updates) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Delete a staff member
 */
export const deleteStaff = async (id) => {
  try {
    // Delete the user's auth account
    await supabase.auth.admin.deleteUser(id);

    // Delete the profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}; 