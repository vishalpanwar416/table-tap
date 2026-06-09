import { supabase } from '../../../shared/supabase';
import { logAdminActivity, ACTIVITY_TYPES } from '../../api/adminActivityLogService';
import { validateImageFile, optimizeImageForUpload } from '../../../shared/utils/imageOptimization';

// Use the regular supabase client since you have admin permissions via RLS
const supabaseClient = supabase;

// DRY: Define email regex once
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Test function removed for cleanup

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
      format: 'webp',
    });

    // Generate unique filename
    const fileName = `restaurant_${restaurantId}_${Date.now()}.webp`;
    const filePath = `restaurants/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('food-images')
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage.from('food-images').getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      error: null,
    };
  } catch (error) {
    return {
      url: null,
      path: null,
      error: error.message,
    };
  }
};

/**
 * Upload restaurant logo for admin panel
 */
export const uploadRestaurantLogo = async (file, restaurantId) => {
  try {
    // Validate the file first
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Optimize the image
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
      format: 'webp',
    });

    // Generate unique filename
    const fileName = `logo_${restaurantId}_${Date.now()}.webp`;
    const filePath = `logos/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('food-images')
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage.from('food-images').getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      error: null,
    };
  } catch (error) {
    return {
      url: null,
      path: null,
      error: error.message,
    };
  }
};

/**
 * Transform restaurant data for easier frontend usage
 * Handles PostGIS POINT format and owner mapping
 */
const transformRestaurantData = (restaurant) => {
  if (!restaurant) return null;

  // Extract latitude and longitude from PostGIS POINT format (WKT)
  let latitude = '';
  let longitude = '';

  if (restaurant.location) {
    if (typeof restaurant.location === 'string') {
      // Handle WKT: POINT(lng lat)
      const pointMatch = restaurant.location.match(/POINT\(([^)]+)\)/);
      if (pointMatch) {
        const coords = pointMatch[1].split(' ');
        longitude = coords[0];
        latitude = coords[1];
      } else if (/^[0-9a-fA-F]+$/.test(restaurant.location)) {
        // Likely WKB hex string - we can't easily parse this without a library
        // but we'll leave latitude/longitude alone if they already exist in the object
      }
    } else if (
      restaurant.location.type === 'Point' &&
      Array.isArray(restaurant.location.coordinates)
    ) {
      // Handle GeoJSON format
      longitude = restaurant.location.coordinates[0];
      latitude = restaurant.location.coordinates[1];
    }
  }

  // Map staff/owner info
  const ownerStaff =
    restaurant.restaurant_staff?.find((staff) => staff.staff_role === 'owner') ||
    restaurant.restaurant_staff?.find((staff) => staff.staff_role === 'manager');

  let manager = null;
  if (ownerStaff) {
    if (ownerStaff.connected && ownerStaff.profiles) {
      manager = {
        name: ownerStaff.profiles.full_name,
        email: ownerStaff.profiles.email,
        id: ownerStaff.profiles.id,
        connected: true,
        role: ownerStaff.staff_role,
      };
    } else {
      manager = {
        name: ownerStaff.staff_name,
        email: ownerStaff.staff_email,
        phone: ownerStaff.staff_phone_number,
        connected: false,
        staff_id: ownerStaff.id,
        role: ownerStaff.staff_role,
      };
    }
  }

  return {
    ...restaurant,
    latitude: latitude || restaurant.latitude || '',
    longitude: longitude || restaurant.longitude || '',
    manager: manager || restaurant.manager || null,
    staff_count: restaurant.staff_count || 0,
  };
};

/**
 * Delete restaurant photo from storage
 */
export const deleteRestaurantPhotoForAdmin = async (url) => {
  try {
    if (!url) return { success: true, error: null };

    // Extract file path from URL
    // Public URL format: .../storage/v1/object/public/food-images/restaurants/filename.webp
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `restaurants/${fileName}`;

    // Delete from storage
    const { error } = await supabaseClient.storage.from('food-images').remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========= RESTAURANT MANAGEMENT =========

/**
 * Get all restaurants (admin only)
 * Optimized for scalability using Database Views and Pagination
 */
export const getAllRestaurants = async (page = 1, pageSize = 50) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Try the optimised view first; fall back to direct table query if the
    // view doesn't exist or lacks grants in this Supabase environment.
    let data, error, count;

    ({ data, error, count } = await supabase
      .from('restaurant_admin_summary')
      .select('*', { count: 'estimated' })
      .order('created_at', { ascending: false })
      .range(from, to));

    if (error || !data || data.length === 0) {
      // Fallback: query restaurants table directly with staff join
      ({ data, error, count } = await supabase
        .from('restaurants')
        .select(
          `
          *,
          restaurant_staff (id, staff_role, connected, staff_name, staff_email,
            profiles (id, full_name, email, avatar_url))
        `,
          { count: 'estimated' },
        )
        .order('created_at', { ascending: false })
        .range(from, to));
    }

    if (error) {
      if (error.name === 'AbortError') return { data: [], total: 0, error: null };
      throw error;
    }

    const transformedData = (data || []).map((restaurant) => transformRestaurantData(restaurant));

    return {
      data: transformedData,
      total: count || transformedData.length,
      page,
      pageSize,
      error: null,
    };
  } catch (error) {
    console.error('[AdminService] getAllRestaurants failed:', error);
    return { data: [], total: 0, error: error.message };
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
      return 0;
    }
    return count || 0;
  } catch (error) {
    return 0;
  }
};

// Add validation function
const validateRestaurantData = (data) => {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('Restaurant name is required');
  }

  if (!data.owner_email || data.owner_email.trim() === '') {
    errors.push('Owner email is required');
  }

  if (data.owner_email && !emailRegex.test(data.owner_email)) {
    errors.push('Invalid owner email format');
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

  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.restaurant_id) {
    errors.push('Restaurant assignment is required');
  }

  if (!['owner', 'manager', 'captain', 'chef', 'waiter', 'cashier'].includes(data.role)) {
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
    const locationData =
      restaurantData.latitude && restaurantData.longitude
        ? `POINT(${restaurantData.longitude} ${restaurantData.latitude})`
        : null;

    // Prepare social media data
    const socialMediaData =
      restaurantData.social_media &&
      Object.keys(restaurantData.social_media).some(
        (key) => restaurantData.social_media[key].trim() !== '',
      )
        ? restaurantData.social_media
        : null;

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
        // Aggregator Integration Keys
        swiggy_api_key: restaurantData.swiggy_api_key || null,
        zomato_api_key: restaurantData.zomato_api_key || null,
        aggregators_enabled: restaurantData.aggregators_enabled || false,
        online_bill_enabled: restaurantData.online_bill_enabled !== false,
        billing_features_enabled: restaurantData.billing_features_enabled !== false,
        auto_email_billing_enabled: restaurantData.auto_email_billing_enabled === true,
        is_active: true,
      })
      .select()
      .maybeSingle();

    if (restaurantError) {
      throw restaurantError;
    }

    // Create owner staff record
    if (restaurantData.owner_email) {
      let createdUserId = null;
      let isConnected = false;

      // 1. If password is provided, create the Auth User using Edge Function
      if (restaurantData.owner_password) {
        try {
          const { data: funcData, error: funcError } = await supabase.functions.invoke(
            'create-user',
            {
              body: {
                email: restaurantData.owner_email,
                password: restaurantData.owner_password,
                email_confirm: true,
                user_metadata: {
                  full_name: restaurantData.owner_name || 'Owner',
                  profile_role: 'owner', // owner role
                  phone_number: restaurantData.owner_phone,
                },
              },
            },
          );

          if (funcError) {
            console.error('Failed to create owner auth user:', funcError);
            // We continue to create the staff record even if Auth creation fails (placeholder)
          } else if (funcData?.user) {
            createdUserId = funcData.user.id;
            isConnected = true;
          }
        } catch (err) {
          console.error('Error invoking create-user:', err);
        }
      }

      // 2. Insert into restaurant_staff
      const { error: staffError } = await supabase.from('restaurant_staff').insert({
        restaurant_id: restaurant.id,
        staff_role: 'owner',
        staff_name: restaurantData.owner_name || 'Owner',
        staff_email: restaurantData.owner_email,
        staff_phone_number: restaurantData.owner_phone,
        connected: isConnected,
        user_id: createdUserId,
      });

      if (staffError) {
        // Fallback if 'owner' role is not in enum: try 'manager' but log it
        if (staffError.message?.includes('check constraint')) {
          console.warn('Owner role not supported in DB, falling back to manager');
          await supabase.from('restaurant_staff').insert({
            restaurant_id: restaurant.id,
            staff_role: 'manager',
            staff_name: (restaurantData.owner_name || 'Owner') + ' (Owner)',
            staff_email: restaurantData.owner_email,
            staff_phone_number: restaurantData.owner_phone,
            connected: isConnected,
            user_id: createdUserId,
          });
        } else {
          throw staffError;
        }
      }
    }

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.RESTAURANT_CREATED,
      activity_name: 'Restaurant Created',
      restaurant_id: restaurant.id,
      target_type: 'restaurant',
      target_id: restaurant.id,
      target_name: restaurant.name,
      description: `New restaurant ${restaurant.name} created.`,
    });

    return { data: transformRestaurantData(restaurant), error: null };
  } catch (error) {
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
    return { success: false, error: error.message };
  }
};

/**
 * Toggle restaurant aggregator integration
 */
export const toggleRestaurantAggregators = async (restaurantId, newStatus) => {
  try {
    const { error } = await supabase
      .from('restaurants')
      .update({ aggregators_enabled: newStatus })
      .eq('id', restaurantId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
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

    // FIX: Correct longitude/latitude order
    const locationData =
      updateData.latitude !== null &&
      updateData.latitude !== undefined &&
      updateData.latitude !== '' &&
      updateData.longitude !== null &&
      updateData.longitude !== undefined &&
      updateData.longitude !== ''
        ? `POINT(${updateData.longitude} ${updateData.latitude})`
        : null;

    // Prepare social media data
    const socialMediaData =
      updateData.social_media &&
      Object.keys(updateData.social_media).some((key) => updateData.social_media[key].trim() !== '')
        ? updateData.social_media
        : null;

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
        swiggy_api_key: updateData.swiggy_api_key || null,
        zomato_api_key: updateData.zomato_api_key || null,
        aggregators_enabled: updateData.aggregators_enabled || false,
        online_bill_enabled: updateData.online_bill_enabled !== false,
        billing_features_enabled: updateData.billing_features_enabled !== false,
        auto_email_billing_enabled: updateData.auto_email_billing_enabled === true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', restaurantId)
      .select()
      .maybeSingle();

    if (error) throw error;

    // Transform returned data to ensure lat/lng are present
    const transformed = transformRestaurantData({
      ...data,
      // If DB returned blank/WKB, use our known good updateData as backup
      latitude: data.latitude || updateData.latitude,
      longitude: data.longitude || updateData.longitude,
    });

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.RESTAURANT_UPDATED,
      activity_name: 'Restaurant Updated',
      restaurant_id: restaurantId,
      target_type: 'restaurant',
      target_id: restaurantId,
      target_name: updateData.name || 'Restaurant',
      description: `Restaurant ${updateData.name || ''} updated.`,
    });

    return { data: transformed, error: null };
  } catch (error) {
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
      // LOG error for debugging
      console.error(staffError);
    }

    // Then delete the restaurant
    const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId);

    if (error) throw error;

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.RESTAURANT_DELETED,
      activity_name: 'Restaurant Deleted',
      restaurant_id: restaurantId,
      target_type: 'restaurant',
      target_id: restaurantId,
      target_name: 'Deleted Restaurant',
      description: `Restaurant ${restaurantId} deleted.`,
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========= STAFF MANAGEMENT =========

/**
 * Get all staff members
 */
/**
 * Get all staff members (admin only)
 * Optimized for scalability with Pagination
 */
export const getAllStaff = async (page = 1, pageSize = 50) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('restaurant_staff')
      .select(
        `
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
      `,
        { count: 'estimated' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      if (error.name === 'AbortError') return { data: [], total: 0, error: null };
      throw error;
    }

    // Transform data to match component structure
    const transformedData = (data || []).map((staff) => ({
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
      updated_at: staff.updated_at || null,
    }));

    return {
      data: transformedData,
      total: count || 0,
      page,
      pageSize,
      error: null,
    };
  } catch (error) {
    console.error('[AdminService] getAllStaff failed:', error);
    return { data: [], total: 0, error: error.message };
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

    let createdUserId = null;
    let isConnected = false;

    // 1. If password provided, create Auth User
    if (staffData.password) {
      try {
        const { data: funcData, error: funcError } = await supabase.functions.invoke(
          'create-user',
          {
            body: {
              email: staffData.email,
              password: staffData.password,
              email_confirm: true,
              user_metadata: {
                full_name: staffData.name,
                profile_role: staffData.role, // use selected role
                phone_number: staffData.phone_number,
              },
            },
          },
        );

        if (funcError) {
          console.error('Failed to create staff auth user:', funcError);
          if (funcError.message) {
            throw new Error('User creation failed: ' + funcError.message);
          }
        } else if (funcData?.user) {
          createdUserId = funcData.user.id;
          isConnected = true;
        }
      } catch (err) {
        console.error('Error invoking create-user:', err);
        throw new Error('Failed to create user account: ' + err.message);
      }
    }

    // 2. Insert into restaurant_staff
    const { data, error } = await supabase
      .from('restaurant_staff')
      .insert({
        restaurant_id: staffData.restaurant_id,
        staff_role: staffData.role,
        staff_name: staffData.name,
        staff_email: staffData.email,
        staff_phone_number: staffData.phone_number,
        connected: isConnected,
        user_id: createdUserId,
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.STAFF_CREATED,
      activity_name: 'Staff Created',
      restaurant_id: staffData.restaurant_id,
      target_type: 'staff',
      target_id: data?.id,
      target_name: staffData.name,
      description: `Staff member ${staffData.name} (${staffData.role}) added.`,
    });

    return { data, error: null };
  } catch (error) {
    if (error.message?.includes('violates check constraint "restaurant_staff_staff_role_check"')) {
      return {
        data: null,
        error: `The database does not support the role '${staffData.role}' yet. Please run this SQL in your Supabase editor to fix it: \n\n ALTER TABLE restaurant_staff DROP CONSTRAINT IF EXISTS restaurant_staff_staff_role_check; \n ALTER TABLE restaurant_staff ADD CONSTRAINT restaurant_staff_staff_role_check CHECK (staff_role IN ('manager', 'captain', 'chef', 'waiter', 'cashier'));`,
      };
    }
    return { data: null, error: error.message };
  }
};

/**
 * Update staff member
 */
export const updateStaff = async (id, updates) => {
  try {
    // Map frontend fields to database fields (remove updated_at)
    const dbUpdates = {
      staff_role: updates.role,
      staff_name: updates.name,
      staff_email: updates.email,
      staff_phone_number: updates.phone_number,
      restaurant_id: updates.restaurant_id,
      // Removed updated_at since it doesn't exist in the table
    };

    const result = await supabase
      .from('restaurant_staff')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (result.error) {
      console.error('❌ Supabase error:', result.error);
      throw new Error(result.error.message);
    }

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.STAFF_UPDATED,
      activity_name: 'Staff Updated',
      restaurant_id: updates.restaurant_id,
      target_type: 'staff',
      target_id: id,
      target_name: updates.name || 'Staff',
      description: `Staff member ${updates.name || id} ${updates.role ? `role changed to ${updates.role}` : 'details updated'}.`,
    });

    return result;
  } catch (error) {
    console.error('❌ Error in updateStaff:', error);
    throw error;
  }
};

/**
 * Delete staff member
 */
export const deleteStaff = async (staffId) => {
  try {
    // Look up the staff's restaurant before deleting so the activity log is
    // scoped correctly (restaurant-scoped log filtering drops null entries).
    const { data: staffRow } = await supabase
      .from('restaurant_staff')
      .select('restaurant_id')
      .eq('id', staffId)
      .maybeSingle();

    const { error } = await supabase.from('restaurant_staff').delete().eq('id', staffId);

    if (error) throw error;

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.STAFF_DELETED,
      activity_name: 'Staff Deleted',
      restaurant_id: staffRow?.restaurant_id ?? null,
      target_type: 'staff',
      target_id: staffId,
      target_name: 'Deleted Staff',
      description: `Staff member ${staffId} deleted.`,
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========= RESTAURANT MANAGER FUNCTIONS =========

/**
 * Get owners for a specific restaurant
 */
export const getRestaurantOwners = async (restaurantId) => {
  try {
    // Try picking 'owner' role first
    let { data, error } = await supabase
      .from('restaurant_staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('staff_role', 'owner');

    // If no owners found or error, maybe they are stored as managers?
    // But for now strict check or fallback?
    // Let's return what we found.
    if (!data || data.length === 0) {
      // Fallback: Check for managers if no owners found (migration support)
      const { data: managers } = await supabase
        .from('restaurant_staff')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('staff_role', 'manager');
      if (managers && managers.length > 0) return { data: managers, error: null };
    }

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

/**
 * Update owner details
 */
export const updateOwnerDetails = async (ownerId, ownerData) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_staff')
      .update({
        staff_name: ownerData.owner_name,
        staff_email: ownerData.owner_email,
        staff_phone_number: ownerData.owner_phone,
      })
      .eq('id', ownerId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ========= LEAD INQUIRIES MANAGEMENT =========

/**
 * Get lead inquiries with pagination
 */
export const getPaginatedInquiries = async (page = 1, pageSize = 20, status = 'all') => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('landing_inquiries').select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, totalCount: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching paginated inquiries:', error);
    return { data: [], totalCount: 0, error: error.message };
  }
};

/**
 * Get all inquiries from the landing page.
 * @deprecated Use getPaginatedInquiries instead.
 */
export const getAllInquiries = async () => {
  try {
    const { data, error } = await supabase
      .from('landing_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

/**
 * Update inquiry status
 */
export const updateInquiryStatus = async (id, status) => {
  try {
    const { data, error } = await supabase
      .from('landing_inquiries')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Delete an inquiry
 */
export const deleteInquiry = async (id) => {
  try {
    const { error } = await supabase.from('landing_inquiries').delete().eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========= SYSTEM SETTINGS =========

/**
 * Get a system setting by key
 */
export const getSystemSetting = async (key) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return data.value;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
};

/**
 * Get an email template by key
 */
export const getEmailTemplate = async (key) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('subject, html')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching email template ${key}:`, error);
    return null;
  }
};
/**
 * Get restaurant registrations with pagination
 */
export const getPaginatedRegistrations = async (page = 1, pageSize = 20, status = 'all') => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('restaurant_registrations').select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data || [], totalCount: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching paginated registrations:', error);
    return { data: [], totalCount: 0, error: error.message };
  }
};
