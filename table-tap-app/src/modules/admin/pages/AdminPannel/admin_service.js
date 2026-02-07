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
      format: 'webp'
    });

    // Generate unique filename
    const fileName = `restaurant_${restaurantId}_${Date.now()}.webp`;
    const filePath = `restaurants/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('food-images')
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      error: null
    };
  } catch (error) {
    return {
      url: null,
      path: null,
      error: error.message
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
      format: 'webp'
    });

    // Generate unique filename
    const fileName = `logo_${restaurantId}_${Date.now()}.webp`;
    const filePath = `logos/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('food-images')
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      error: null
    };
  } catch (error) {
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
    // Public URL format: .../storage/v1/object/public/food-images/restaurants/filename.webp
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `restaurants/${fileName}`;

    // Delete from storage
    const { error } = await supabaseClient.storage
      .from('food-images')
      .remove([filePath]);

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
 */
export const getAllRestaurants = async () => {
  try {

    // Step 1: Try a very simple query first
    const { data: simpleData, error: simpleError } = await supabase
      .from('restaurants')
      .select('id, name, is_active')
      .order('created_at', { ascending: false });


    if (simpleError) {
      if (simpleError.name === 'AbortError') return { data: [], error: null };
      throw simpleError;
    }

    if (!simpleData || simpleData.length === 0) {
      return { data: [], error: null };
    }


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


    if (error) {
      if (error.name === 'AbortError') return { data: simpleData, error: null };
      // If complex query fails, return simple data
      return { data: simpleData, error: null };
    }

    // Step 3: Transform the data
    const transformedData = data.map(restaurant => {

      const ownerStaff = restaurant.restaurant_staff?.find(
        staff => staff.staff_role === 'owner'
      ) || restaurant.restaurant_staff?.find(
        staff => staff.staff_role === 'manager'
      ); // Fallback to manager

      let manager = null; // Variable name kept as 'manager' to match UI prop expectation or I should rename it?
      // The frontend RestaurantCard uses `restaurant.manager`. I should keep the KEY `manager` but populate it with Owner info.

      if (ownerStaff) {
        if (ownerStaff.connected && ownerStaff.profiles) {
          manager = {
            name: ownerStaff.profiles.full_name,
            email: ownerStaff.profiles.email,
            id: ownerStaff.profiles.id,
            connected: true,
            role: ownerStaff.staff_role // Add role info
          };
        } else {
          manager = {
            name: ownerStaff.staff_name,
            email: ownerStaff.staff_email,
            phone: ownerStaff.staff_phone_number,
            connected: false,
            staff_id: ownerStaff.id,
            role: ownerStaff.staff_role
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
        ai_enabled: restaurant.ai_enabled,
        aggregators_enabled: restaurant.aggregators_enabled,
        swiggy_api_key: restaurant.swiggy_api_key,
        zomato_api_key: restaurant.zomato_api_key,
        billing_features_enabled: restaurant.billing_features_enabled,
        online_bill_enabled: restaurant.online_bill_enabled,
        auto_email_billing_enabled: restaurant.auto_email_billing_enabled,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at
      };

      return transformed;
    });


    // Step 4: Get staff counts (simplified)
    for (let restaurant of transformedData) {
      try {
        const { count } = await supabase
          .from('restaurant_staff')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id);
        restaurant.staff_count = count || 0;
      } catch (error) {
        restaurant.staff_count = 0;
      }
    }

    // Step 5: Get active subscriptions for all restaurants
    const restaurantIds = transformedData.map(r => r.id);
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('restaurant_id, plan_name, status, end_date, billing_cycle')
      .in('restaurant_id', restaurantIds)
      .in('status', ['active', 'grace_period']);

    // Map subscription data to restaurants
    if (subscriptions && subscriptions.length > 0) {
      const subscriptionMap = {};
      subscriptions.forEach(sub => {
        subscriptionMap[sub.restaurant_id] = {
          plan_name: sub.plan_name,
          status: sub.status,
          end_date: sub.end_date,
          billing_cycle: sub.billing_cycle
        };
      });

      transformedData.forEach(restaurant => {
        restaurant.subscription = subscriptionMap[restaurant.id] || null;
      });
    } else {
      transformedData.forEach(restaurant => {
        restaurant.subscription = null;
      });
    }

    return { data: transformedData, error: null };
  } catch (error) {
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
        // Aggregator Integration Keys
        swiggy_api_key: restaurantData.swiggy_api_key || null,
        zomato_api_key: restaurantData.zomato_api_key || null,
        aggregators_enabled: restaurantData.aggregators_enabled || false,
        online_bill_enabled: restaurantData.online_bill_enabled !== false,
        billing_features_enabled: restaurantData.billing_features_enabled !== false,
        auto_email_billing_enabled: restaurantData.auto_email_billing_enabled === true,
        is_active: true
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
          const { data: funcData, error: funcError } = await supabase.functions.invoke('create-user', {
            body: {
              email: restaurantData.owner_email,
              password: restaurantData.owner_password,
              email_confirm: true,
              user_metadata: {
                full_name: restaurantData.owner_name || 'Owner',
                profile_role: 'owner', // owner role
                phone_number: restaurantData.owner_phone
              }
            }
          });

          if (funcError) {
            console.error("Failed to create owner auth user:", funcError);
            // We continue to create the staff record even if Auth creation fails (placeholder)
          } else if (funcData?.user) {
            createdUserId = funcData.user.id;
            isConnected = true;
          }
        } catch (err) {
          console.error("Error invoking create-user:", err);
        }
      }

      // 2. Insert into restaurant_staff
      const { error: staffError } = await supabase
        .from('restaurant_staff')
        .insert({
          restaurant_id: restaurant.id,
          staff_role: 'owner',
          staff_name: restaurantData.owner_name || 'Owner',
          staff_email: restaurantData.owner_email,
          staff_phone_number: restaurantData.owner_phone,
          connected: isConnected,
          user_id: createdUserId
        });

      if (staffError) {
        // Fallback if 'owner' role is not in enum: try 'manager' but log it
        if (staffError.message?.includes('check constraint')) {
          console.warn("Owner role not supported in DB, falling back to manager");
          await supabase.from('restaurant_staff').insert({
            restaurant_id: restaurant.id,
            staff_role: 'manager',
            staff_name: (restaurantData.owner_name || 'Owner') + ' (Owner)',
            staff_email: restaurantData.owner_email,
            staff_phone_number: restaurantData.owner_phone,
            connected: isConnected,
            user_id: createdUserId
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
      description: `New restaurant ${restaurant.name} created.`
    });

    return { data: restaurant, error: null };
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
    const locationData = updateData.latitude && updateData.longitude
      ? `POINT(${updateData.longitude} ${updateData.latitude})`
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
        swiggy_api_key: updateData.swiggy_api_key || null,
        zomato_api_key: updateData.zomato_api_key || null,
        aggregators_enabled: updateData.aggregators_enabled || false,
        online_bill_enabled: updateData.online_bill_enabled !== false,
        billing_features_enabled: updateData.billing_features_enabled !== false,
        auto_email_billing_enabled: updateData.auto_email_billing_enabled === true,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId)
      .select()
      .maybeSingle();

    if (error) throw error;

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.RESTAURANT_UPDATED,
      activity_name: 'Restaurant Updated',
      restaurant_id: restaurantId,
      target_type: 'restaurant',
      target_id: restaurantId,
      target_name: updateData.name || 'Restaurant',
      description: `Restaurant ${updateData.name || ''} updated.`
    });

    return { data, error: null };
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
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);

    if (error) throw error;
    if (error) throw error;

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.RESTAURANT_DELETED,
      activity_name: 'Restaurant Deleted',
      restaurant_id: null,
      target_type: 'restaurant',
      target_id: restaurantId,
      target_name: 'Deleted Restaurant',
      description: `Restaurant ${restaurantId} deleted.`
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
export const getAllStaff = async () => {
  try {

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
      if (error.name === 'AbortError') return { data: [], error: null };
      throw error;
    }


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


    return { data: transformedData, error: null };
  } catch (error) {
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

    let createdUserId = null;
    let isConnected = false;

    // 1. If password provided, create Auth User
    if (staffData.password) {
      try {
        const { data: funcData, error: funcError } = await supabase.functions.invoke('create-user', {
          body: {
            email: staffData.email,
            password: staffData.password,
            email_confirm: true,
            user_metadata: {
              full_name: staffData.name,
              profile_role: staffData.role, // use selected role
              phone_number: staffData.phone_number
            }
          }
        });

        if (funcError) {
          console.error("Failed to create staff auth user:", funcError);
          if (funcError.message) {
            throw new Error("User creation failed: " + funcError.message);
          }
        } else if (funcData?.user) {
          createdUserId = funcData.user.id;
          isConnected = true;
        }
      } catch (err) {
        console.error("Error invoking create-user:", err);
        throw new Error("Failed to create user account: " + err.message);
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
        user_id: createdUserId
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
      description: `Staff member ${staffData.name} (${staffData.role}) added.`
    });

    return { data, error: null };
  } catch (error) {
    if (error.message?.includes('violates check constraint "restaurant_staff_staff_role_check"')) {
      return {
        data: null,
        error: `The database does not support the role '${staffData.role}' yet. Please run this SQL in your Supabase editor to fix it: \n\n ALTER TABLE restaurant_staff DROP CONSTRAINT IF EXISTS restaurant_staff_staff_role_check; \n ALTER TABLE restaurant_staff ADD CONSTRAINT restaurant_staff_staff_role_check CHECK (staff_role IN ('manager', 'captain', 'chef', 'waiter', 'cashier'));`
      };
    }
    return { data: null, error: error.message };
  }
};

/**
 * Update staff member
 */
export const updateStaff = async (id, updates) => {
  console.log('🔍 updateStaff called with:', { id, updates });

  try {
    // Map frontend fields to database fields (remove updated_at)
    const dbUpdates = {
      staff_role: updates.role,
      staff_name: updates.name,
      staff_email: updates.email,
      staff_phone_number: updates.phone_number,
      restaurant_id: updates.restaurant_id
      // Removed updated_at since it doesn't exist in the table
    };

    console.log('🔍 Mapped to database fields:', dbUpdates);

    const result = await supabase
      .from('restaurant_staff')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();

    console.log('🔍 Supabase response:', result);

    if (result.error) {
      console.error('❌ Supabase error:', result.error);
      throw new Error(result.error.message);
    }

    console.log('✅ Staff updated successfully in database');

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.STAFF_UPDATED,
      activity_name: 'Staff Updated',
      restaurant_id: updates.restaurant_id,
      target_type: 'staff',
      target_id: id,
      target_name: updates.name || 'Staff',
      description: `Staff member ${updates.name || id} ${updates.role ? `role changed to ${updates.role}` : 'details updated'}.`
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
    const { error } = await supabase
      .from('restaurant_staff')
      .delete()
      .eq('id', staffId);

    if (error) throw error;

    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.STAFF_DELETED,
      activity_name: 'Staff Deleted',
      restaurant_id: null, // We might not know the restaurant ID here unless passsed?
      target_type: 'staff',
      target_id: staffId,
      target_name: 'Deleted Staff',
      description: `Staff member ${staffId} deleted.`
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
        staff_phone_number: ownerData.owner_phone
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

// ========= SUBSCRIPTION MANAGEMENT =========

/**
 * Get subscription statistics using existing restaurants table
 */
export const getSubscriptionStats = async () => {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('is_active, ai_enabled');

    if (error) throw error;

    const totalSubscriptions = restaurants.length;
    const activeSubscriptions = restaurants.filter(r => r.is_active).length;
    const basicSubscriptions = restaurants.filter(r => r.is_active && !r.ai_enabled).length;
    const premiumSubscriptions = restaurants.filter(r => r.is_active && r.ai_enabled).length;

    // Calculate revenue based on plan prices
    const basicPrice = 1999;
    const premiumPrice = 2599;
    const totalRevenue = (basicSubscriptions * basicPrice) + (premiumSubscriptions * premiumPrice);

    return {
      data: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions: totalSubscriptions - activeSubscriptions,
        totalRevenue,
        basicSubscriptions,
        premiumSubscriptions,
        cancellationRate: totalSubscriptions > 0 ?
          ((totalSubscriptions - activeSubscriptions) / totalSubscriptions * 100).toFixed(2) : 0
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get upcoming renewals (active restaurants)
 */
export const getUpcomingRenewals = async (days = 30) => {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        is_active,
        ai_enabled,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const renewals = restaurants.map(restaurant => {
      const plan = restaurant.ai_enabled ?
        { id: 'premium', name: 'Premium Plan', price: 2599, ai_features_enabled: true } :
        { id: 'basic', name: 'Basic Plan', price: 1999, ai_features_enabled: false };

      return {
        id: restaurant.id,
        restaurant_id: restaurant.id,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          contact_email: restaurant.contact_email
        },
        plan: plan
      };
    });

    return { data: renewals, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update restaurant subscription (change plan)
 */
export const updateRestaurantSubscription = async (restaurantId, subscriptionData) => {
  try {
    const plan = subscriptionData.plan_id === 'premium' ?
      { ai_features_enabled: true } :
      { ai_features_enabled: false };

    const { data, error } = await supabase
      .from('restaurants')
      .update({
        ai_enabled: plan.ai_features_enabled,
        is_active: subscriptionData.status === 'active'
        // removed updated_at
      })
      .eq('id', restaurantId)
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        is_active,
        ai_enabled,
        created_at
      `) // removed updated_at
      .maybeSingle();

    if (error) throw error;

    const subscription = {
      id: data.id,
      restaurant_id: data.id,
      plan_id: data.ai_enabled ? 'premium' : 'basic',
      status: data.is_active ? 'active' : 'inactive',
      payment_status: 'paid',
      amount_paid: data.ai_enabled ? 2599 : 1999,
      start_date: data.created_at,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: subscriptionData.payment_method || 'manual',
      notes: subscriptionData.notes || '',
      restaurant: {
        id: data.id,
        name: data.name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone
      },
      plan: data.ai_enabled ?
        { id: 'premium', name: 'Premium Plan', price: 2599, ai_features_enabled: true } :
        { id: 'basic', name: 'Basic Plan', price: 1999, ai_features_enabled: false }
    };

    return { data: subscription, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Cancel restaurant subscription
 * NOTE: This does NOT deactivate the restaurant - it stays active but hidden from customers
 * Restaurant visibility in customer app is controlled by subscription status
 * When user re-subscribes, the restaurant automatically becomes visible again
 */
export const cancelRestaurantSubscription = async (restaurantId) => {
  try {
    // Get restaurant data without deactivating it
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        is_active,
        ai_enabled,
        created_at
      `)
      .eq('id', restaurantId)
      .maybeSingle();

    if (error) throw error;

    const plan = data.ai_enabled ?
      { id: 'premium', name: 'Premium Plan', price: 2599, ai_features_enabled: true } :
      { id: 'basic', name: 'Basic Plan', price: 1999, ai_features_enabled: false };

    const subscription = {
      id: data.id,
      restaurant_id: data.id,
      plan_id: plan.id,
      status: 'cancelled',
      payment_status: 'paid',
      amount_paid: plan.price,
      start_date: data.created_at,
      end_date: new Date().toISOString(),
      payment_method: 'manual',
      notes: 'Subscription cancelled - restaurant hidden from customers until renewed',
      restaurant: {
        id: data.id,
        name: data.name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone
      },
      plan: plan
    };

    return { data: subscription, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ========= LEAD INQUIRIES MANAGEMENT =========

/**
 * Get all inquiries from the landing page
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
    const { error } = await supabase
      .from('landing_inquiries')
      .delete()
      .eq('id', id);

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