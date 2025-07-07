import { supabase } from '../../supabase';
import { validateImageFile, optimizeImageForUpload } from '../../utils/imageOptimization';

// Use the regular supabase client since you have admin permissions via RLS
const supabaseClient = supabase;

// Debug function to check client configuration
const debugClientConfig = () => {
  console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
  console.log('Using anon key with admin permissions');
};

// Test function to check database connection
export const testDatabaseConnection = async () => {
  try {
    console.log('=== TESTING DATABASE CONNECTION ===');
    
    // Test 1: Simple count query
    const { count, error: countError } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true });
    
    console.log('Count query result:', { count, error: countError });
    
    // Test 2: Simple select query
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, created_at')
      .limit(5);
    
    console.log('Simple select result:', { data, error });
    
    // Test 3: Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    return { success: true, count, data, user };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// ========= RESTAURANT PHOTO UPLOAD FUNCTIONS =========

/**
 * Upload restaurant photo for admin panel
 */
export const uploadRestaurantPhotoForAdmin = async (file, restaurantId) => {
  try {
    // Validate the file first
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Optimize the image
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: 'webp'
    });

    // Generate unique filename
    const fileExt = optimizedFile.name.split('.').pop();
    const fileName = `restaurant_${restaurantId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('avatars')
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      error: null
    };
  } catch (error) {
    console.error('Error uploading restaurant photo:', error);
    return {
      url: null,
      path: null,
      error: error.message
    };
  }
};

/**
 * Delete restaurant photo from storage
 */
export const deleteRestaurantPhotoForAdmin = async (url) => {
  try {
    if (!url) return { success: true, error: null };

    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `avatars/${fileName}`;

    // Delete from storage
    const { error } = await supabaseClient.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting restaurant photo:', error);
    return { success: false, error: error.message };
  }
};

// ========= RESTAURANT MANAGEMENT =========

/**
 * Get all restaurants (admin only)
 */
export const getAllRestaurants = async () => {
  try {
    console.log('=== GETTING ALL RESTAURANTS ===');
    
    // Step 1: Try a very simple query first
    const { data: simpleData, error: simpleError } = await supabase
      .from('restaurants')
      .select('id, name, is_active')
      .order('created_at', { ascending: false });

    console.log('Simple query result:', { simpleData, simpleError });

    if (simpleError) {
      console.error('Simple query failed:', simpleError);
      throw simpleError;
    }

    if (!simpleData || simpleData.length === 0) {
      console.log('No restaurants found in simple query');
      return { data: [], error: null };
    }

    console.log(`Found ${simpleData.length} restaurants in simple query`);

    // Step 2: If simple query works, try the complex query
    const { data, error } = await supabase
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

    console.log('Complex query result:', { data, error });

    if (error) {
      console.error('Complex query failed:', error);
      // If complex query fails, return simple data
      return { data: simpleData, error: null };
    }

    // Step 3: Transform the data
    const transformedData = data.map(restaurant => {
      console.log('Processing restaurant:', restaurant);
      
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

      // Extract latitude and longitude from PostGIS POINT format
      let latitude = '';
      let longitude = '';
      if (restaurant.location) {
        const pointMatch = restaurant.location.match(/POINT\(([^)]+)\)/);
        if (pointMatch) {
          const coords = pointMatch[1].split(' ');
          longitude = coords[0];
          latitude = coords[1];
        }
      }

      const transformed = {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        contact_phone: restaurant.contact_phone,
        contact_email: restaurant.contact_email,
        cuisine_type: restaurant.cuisine_type,
        is_active: restaurant.is_active,
        logo_url: restaurant.logo_url,
        restaurant_photo_url: restaurant.restaurant_photo_url,
        description: restaurant.description,
        opening_hours: restaurant.opening_hours,
        location: restaurant.location,
        latitude: latitude,
        longitude: longitude,
        social_media: restaurant.social_media,
        google_maps_link: restaurant.google_maps_link,
        razorpay_key_id: restaurant.razorpay_key_id,
        gst_number: restaurant.gst_number,
        fssai_license: restaurant.fssai_license,
        manager: manager,
        staff_count: 0,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at,
        ai_enabled: restaurant.ai_enabled
      };

      console.log('Transformed restaurant:', transformed);
      return transformed;
    });

    console.log('Final transformed data:', transformedData);

    // Step 4: Get staff counts (simplified)
    for (let restaurant of transformedData) {
      try {
        const { count } = await supabase
          .from('restaurant_staff')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id);
        restaurant.staff_count = count || 0;
      } catch (error) {
        console.error(`Error getting staff count for restaurant ${restaurant.id}:`, error);
        restaurant.staff_count = 0;
      }
    }

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error in getAllRestaurants:', error);
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

    if (error) {
      console.error(`Error getting staff count for restaurant ${restaurantId}:`, error);
      return 0;
    }
    return count || 0;
  } catch (error) {
    console.error('Error getting staff count:', error);
    return 0;
  }
};

// Add validation function
const validateRestaurantData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Restaurant name is required');
  }
  
  if (!data.manager_email || data.manager_email.trim() === '') {
    errors.push('Manager email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.manager_email && !emailRegex.test(data.manager_email)) {
    errors.push('Invalid manager email format');
  }
  
  if (data.contact_email && !emailRegex.test(data.contact_email)) {
    errors.push('Invalid contact email format');
  }
  
  if (data.latitude && data.longitude) {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Invalid latitude value');
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Invalid longitude value');
    }
  }
  
  return errors;
};

const validateStaffData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Staff name is required');
  }
  
  if (!data.email || data.email.trim() === '') {
    errors.push('Staff email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.restaurant_id) {
    errors.push('Restaurant assignment is required');
  }
  
  if (!['captain', 'manager'].includes(data.role)) {
    errors.push('Invalid role selected');
  }
  
  return errors;
};

/**
 * Create a new restaurant
 */
export const createRestaurant = async (restaurantData) => {
  try {
    // Validate data
    const validationErrors = validateRestaurantData(restaurantData);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    // Prepare location data
    const locationData = restaurantData.latitude && restaurantData.longitude 
      ? `POINT(${restaurantData.longitude} ${restaurantData.latitude})`
      : null;

    // Prepare social media data
    const socialMediaData = restaurantData.social_media && 
      Object.keys(restaurantData.social_media).some(key => 
        restaurantData.social_media[key].trim() !== ''
      ) ? restaurantData.social_media : null;

    // Create restaurant
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
        location: locationData,
        logo_url: restaurantData.logo_url,
        restaurant_photo_url: restaurantData.restaurant_photo_url,
        google_maps_link: restaurantData.google_maps_link,
        razorpay_key_id: restaurantData.razorpay_key_id,
        gst_number: restaurantData.gst_number,
        fssai_license: restaurantData.fssai_license,
        social_media: socialMediaData,
        is_active: true
      })
      .select()
      .single();

    if (restaurantError) {
      throw restaurantError;
    }

    // Create manager staff record
    if (restaurantData.manager_email) {
      const { error: staffError } = await supabase
      .from('restaurant_staff')
      .insert({
          restaurant_id: restaurant.id,
          staff_role: 'manager',
          staff_name: restaurantData.manager_name || 'Manager',
          staff_email: restaurantData.manager_email,
          staff_phone_number: restaurantData.manager_phone,
          connected: false
        });

      if (staffError) {
        console.error('Error creating manager staff record:', staffError);
      }
    }

    return { data: restaurant, error: null };
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Toggle restaurant active status
 */
export const toggleRestaurantStatus = async (restaurantId, newStatus) => {
  try {
    const { error } = await supabase
      .from('restaurants')
      .update({ is_active: newStatus })
      .eq('id', restaurantId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error toggling restaurant status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update restaurant
 */
export const updateRestaurant = async (restaurantId, updateData) => {
  try {
    // Validate data
    const validationErrors = validateRestaurantData(updateData);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    // Prepare location data
    const locationData = updateData.latitude && updateData.longitude 
      ? `POINT(${updateData.longitude} ${updateData.longitude})`
      : null;

    // Prepare social media data
    const socialMediaData = updateData.social_media && 
      Object.keys(updateData.social_media).some(key => 
        updateData.social_media[key].trim() !== ''
      ) ? updateData.social_media : null;

    // Update restaurant
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        name: updateData.name,
        address: updateData.address,
        contact_phone: updateData.contact_phone,
        contact_email: updateData.contact_email,
        cuisine_type: updateData.cuisine_type,
        description: updateData.description,
        opening_hours: updateData.opening_hours,
        location: locationData,
        logo_url: updateData.logo_url,
        restaurant_photo_url: updateData.restaurant_photo_url,
        google_maps_link: updateData.google_maps_link,
        razorpay_key_id: updateData.razorpay_key_id,
        gst_number: updateData.gst_number,
        fssai_license: updateData.fssai_license,
        social_media: socialMediaData,
        updated_at: new Date().toISOString()
      })
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
 * Delete restaurant
 */
export const deleteRestaurant = async (restaurantId) => {
  try {
    // First, delete all staff associated with this restaurant
    const { error: staffError } = await supabase
      .from('restaurant_staff')
      .delete()
      .eq('restaurant_id', restaurantId);

    if (staffError) {
      console.error('Error deleting restaurant staff:', staffError);
    }

    // Then delete the restaurant
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return { success: false, error: error.message };
  }
};

// ========= STAFF MANAGEMENT =========

/**
 * Get all staff members
 */
export const getAllStaff = async () => {
  try {
    console.log('Fetching staff...');
    
    const { data, error } = await supabase
      .from('restaurant_staff')
      .select(`
        *,
        restaurants (
          id,
          name,
          is_active
        ),
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `);

    if (error) {
      console.error('Error in getAllStaff query:', error);
      throw error;
    }

    console.log('Raw staff data:', data);

    // Transform data to match component structure
    const transformedData = data.map(staff => ({
        id: staff.id,
      name: staff.connected && staff.profiles ? staff.profiles.full_name : staff.staff_name,
      email: staff.connected && staff.profiles ? staff.profiles.email : staff.staff_email,
        phone_number: staff.staff_phone_number,
        role: staff.staff_role,
      restaurant_id: staff.restaurant_id,
      restaurant_name: staff.restaurants?.name || 'Unknown Restaurant',
      connected: staff.connected,
        user_id: staff.user_id,
      avatar_url: staff.profiles?.avatar_url,
      created_at: staff.created_at || null,
      updated_at: staff.updated_at || null
    }));

    console.log('Transformed staff data:', transformedData);

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching staff:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Create new staff member
 */
export const createStaff = async (staffData) => {
  try {
    // Validate data
    const validationErrors = validateStaffData(staffData);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    const { data, error } = await supabase
      .from('restaurant_staff')
      .insert({
        restaurant_id: staffData.restaurant_id,
        staff_role: staffData.role,
        staff_name: staffData.name,
        staff_email: staffData.email,
        staff_phone_number: staffData.phone_number,
        connected: false
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating staff:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Update staff member
 */
export const updateStaff = async (staffId, updates) => {
  try {
    // Validate data
    const validationErrors = validateStaffData(updates);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    const { data, error } = await supabase
      .from('restaurant_staff')
      .update({
        staff_role: updates.role,
      staff_name: updates.name,
      staff_email: updates.email,
      staff_phone_number: updates.phone_number,
        restaurant_id: updates.restaurant_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating staff:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Delete staff member
 */
export const deleteStaff = async (staffId) => {
  try {
    const { error } = await supabase
      .from('restaurant_staff')
      .delete()
      .eq('id', staffId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting staff:', error);
    return { success: false, error: error.message };
  }
};

const handleToggleRestaurantAI = async (id) => {
  try {
    const restaurant = restaurants.find(r => r.id === id);
    const newAIStatus = !restaurant.ai_enabled;

    const { error } = await supabase
      .from('restaurants')
      .update({ ai_enabled: newAIStatus })
      .eq('id', id);

    if (error) {
      handleError('Failed to update AI status: ' + error.message);
      return;
    }

    // Update local state
    setRestaurants(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, ai_enabled: newAIStatus }
          : r
      )
    );
    // If you have a selectedRestaurant state, update it too:
    if (selectedRestaurant?.id === id) {
      setSelectedRestaurant(prev => ({ ...prev, ai_enabled: newAIStatus }));
    }

    handleSuccess(`AI analytics ${newAIStatus ? 'enabled' : 'disabled'} successfully`);
  } catch (err) {
    handleError('Failed to toggle AI status: ' + err.message);
  }
};
