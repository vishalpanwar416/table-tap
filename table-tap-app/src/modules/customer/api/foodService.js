import { supabase } from '../../shared/supabase';
import { optimizeImageForUpload, validateImageFile } from '../../shared/utils/imageOptimization';
import { logActivity } from '../../shared/api/activityLogService';

export const uploadFoodImage = async (file) => {
  try {
    // Validate the file first
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Optimize the image before upload
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: 'webp',
      maxFileSize: 500 * 1024 // 500KB
    });

    const fileExt = 'webp'; // Always use webp for optimized images
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;


    // Use the standard supabase client for storage operations
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('food-images')
      .upload(filePath, optimizedFile, {
        contentType: 'image/webp',
        cacheControl: '3600'
      });

    if (uploadError) {
      throw uploadError;
    }


    // Get the public URL for the uploaded file
    const { data } = supabase
      .storage
      .from('food-images')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) throw new Error('Failed to get public URL for uploaded image');
    return data.publicUrl;
  } catch (error) {
    throw error;
  }
};

// Delete image from storage
export const deleteFoodImage = async (url) => {
  try {
    if (!url) return;

    // Extract the file name from the URL
    const fileName = url.split('/').pop();


    // Use the standard supabase client for storage operations
    const { error } = await supabase
      .storage
      .from('food-images')
      .remove([fileName]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Create a new food item
export const createFoodItem = async (foodData) => {
  try {

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    // Ensure data is properly formatted
    const formattedData = {
      ...foodData,
      price: parseFloat(foodData.price), // Ensure price is a number
      user_id: userData.user?.id || null
    };

    // If restaurant_id is provided in foodData, use it
    // Otherwise, try to get it from the current user's context
    if (!formattedData.restaurant_id) {
      // You might want to get this from context or pass it as a parameter
    }


    const { data, error } = await supabase
      .from('fooditems')
      .insert([formattedData])
      .select(); // Add select to return the created item

    if (error) {
      throw error;
    }

    const createdItem = data[0];
    // Log activity
    if (createdItem) {
      // Fetch profile for better name/role info
      const { data: profile } = await supabase.from('profiles').select('full_name, profile_role').eq('id', userData.user?.id).single();

      await logActivity({
        restaurant_id: createdItem.restaurant_id,
        user_id: userData.user?.id,
        user_name: profile?.full_name || 'Staff',
        user_role: profile?.profile_role || 'staff',
        action_type: 'menu',
        action_name: 'item_added',
        target_id: createdItem.id,
        target_name: createdItem.name,
        details: { category: createdItem.category, price: createdItem.price },
        description: `New menu item added: ${createdItem.name}`
      });
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Get all food items for a specific restaurant
export const getRestaurantFoodItems = async (restaurantId) => {
  try {

    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get all food items (keep existing function for backward compatibility)
export const getAllFoodItems = async (restaurantId = null) => {
  try {

    let query = supabase
      .from('fooditems')
      .select('*');

    // Filter by restaurant if provided
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get food items by category for a specific restaurant
export const getRestaurantFoodItemsByCategory = async (restaurantId, category) => {
  try {

    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

// Update food item
export const updateFoodItem = async (id, foodData) => {
  try {

    // Ensure data is properly formatted
    const formattedData = {
      ...foodData,
      price: parseFloat(foodData.price) // Ensure price is a number
    };

    const { data, error } = await supabase
      .from('fooditems')
      .update(formattedData)
      .eq('id', id)
      .select(); // Add select to return the updated item

    if (error) {
      throw error;
    }

    const updatedItem = data[0];
    if (updatedItem) {
      // Get current user and profile for logging
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('full_name, profile_role').eq('id', user?.id).single();

      await logActivity({
        restaurant_id: updatedItem.restaurant_id,
        user_id: user?.id,
        user_name: profile?.full_name || 'Staff',
        user_role: profile?.profile_role || 'staff',
        action_type: 'menu',
        action_name: 'item_updated',
        target_id: updatedItem.id,
        target_name: updatedItem.name,
        details: { category: updatedItem.category, price: updatedItem.price },
        description: `Menu item updated: ${updatedItem.name}`
      });
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Delete food item
export const deleteFoodItem = async (id) => {
  try {

    // First get the item to check if there's an image to delete
    const { data: itemData, error: getError } = await supabase
      .from('fooditems')
      .select('image')
      .eq('id', id)
      .single();

    if (getError) {
    } else if (itemData?.image) {
      // Try to delete the associated image
      try {
        await deleteFoodImage(itemData.image);
      } catch (imgError) {
        // Continue with deletion even if image deletion fails
      }
    }

    // Get current user and item details for logging
    const { data: { user } } = await supabase.auth.getUser();
    const { data: itemToDelete } = await supabase.from('fooditems').select('name, restaurant_id').eq('id', id).single();

    const { error } = await supabase
      .from('fooditems')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (itemToDelete) {
      const { data: profile } = await supabase.from('profiles').select('full_name, profile_role').eq('id', user?.id).single();

      await logActivity({
        restaurant_id: itemToDelete.restaurant_id,
        user_id: user?.id,
        user_name: profile?.full_name || 'Staff',
        user_role: profile?.profile_role || 'staff',
        action_type: 'menu',
        action_name: 'item_deleted',
        target_id: id,
        target_name: itemToDelete.name,
        description: `Menu item deleted: ${itemToDelete.name}`
      });
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Check if the current user is a manager
export const checkIsManager = async () => {
  try {

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return false;
    }

    if (!userData.user) {
      return false;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('profile_role')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      return false;
    }

    return data?.profile_role === 'manager' || false;
  } catch (error) {
    return false;
  }
};

// Add these functions to foodService.js

// Offer Management Functions
export const createOffer = async (offerData) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .insert([offerData])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Get all offers for a specific restaurant
export const getRestaurantOffers = async (restaurantId) => {
  try {

    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get all offers (keep existing function for backward compatibility)
export const getAllOffers = async (restaurantId = null) => {
  try {

    let query = supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers');

    // Filter by restaurant if provided
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

export const updateOffer = async (id, offerData) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .update(offerData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteOffer = async (id) => {
  try {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
};

export const setCarouselOffer = async (id, isCarousel) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .update({ is_carousel: isCarousel })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Add this function for updating order status
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const toggleFoodItemActive = async (id, isActive) => {
  try {
    const { data, error } = await supabase
      .from('fooditems')
      .update({ is_active: isActive })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};