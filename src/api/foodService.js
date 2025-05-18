import { supabase } from '../supabase';


export const uploadFoodImage = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('Starting image upload:', filePath);

    
    
    // Use the standard supabase client for storage operations
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('food-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);

    // Get the public URL for the uploaded file
    const { data } = supabase
      .storage
      .from('food-images')
      .getPublicUrl(filePath);
    
    console.log('Image public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from storage
export const deleteFoodImage = async (url) => {
  try {
    if (!url) return;
    
    // Extract the file name from the URL
    const fileName = url.split('/').pop();
    
    console.log('Deleting image:', fileName);
    
    // Use the standard supabase client for storage operations
    const { error } = await supabase
      .storage
      .from('food-images')
      .remove([fileName]);
    
    if (error) {
      console.error('Delete image error:', error);
      throw error;
    }
    
    console.log('Image deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Create a new food item
export const createFoodItem = async (foodData) => {
  try {
    console.log('Creating food item with data:', foodData);
    
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw userError;
    }
    
    // Ensure data is properly formatted
    const formattedData = {
      ...foodData,
      price: parseFloat(foodData.price), // Ensure price is a number
      user_id: userData.user?.id || null
    };
    
    console.log('Formatted data for insertion:', formattedData);
    
    const { data, error } = await supabase
      .from('fooditems')
      .insert([formattedData])
      .select(); // Add select to return the created item
    
    if (error) {
      console.error('Create food item error details:', error);
      throw error;
    }
    
    console.log('Food item created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating food item:', error);
    throw error;
  }
};

// Get all food items
export const getAllFoodItems = async () => {
  try {
    console.log('Fetching all food items');
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get all food items error:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} food items`);
    return data || [];
  } catch (error) {
    console.error('Error fetching food items:', error);
    throw error;
  }
};

// Update food item
export const updateFoodItem = async (id, foodData) => {
  try {
    console.log(`Updating food item with id: ${id}`, foodData);
    
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
      console.error('Update food item error:', error);
      throw error;
    }
    
    console.log('Food item updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating food item:', error);
    throw error;
  }
};

// Delete food item
export const deleteFoodItem = async (id) => {
  try {
    console.log(`Deleting food item with id: ${id}`);
    
    // First get the item to check if there's an image to delete
    const { data: itemData, error: getError } = await supabase
      .from('fooditems')
      .select('image')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('Error getting item before delete:', getError);
    } else if (itemData?.image) {
      // Try to delete the associated image
      try {
        await deleteFoodImage(itemData.image);
      } catch (imgError) {
        console.error('Error deleting associated image:', imgError);
        // Continue with deletion even if image deletion fails
      }
    }
    
    const { error } = await supabase
      .from('fooditems')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete food item error:', error);
      throw error;
    }
    
    console.log('Food item deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting food item:', error);
    throw error;
  }
};

// Check if the current user is an admin
export const checkIsAdmin = async () => {
  try {
    console.log('Checking if user is admin');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user for admin check:', userError);
      return false;
    }
    
    if (!user) {
      console.log('No user logged in');
      return false;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    console.log('Admin check result:', data?.is_admin || false);
    return data?.is_admin || false;
  } catch (error) {
    console.error('Error in admin check process:', error);
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
    console.error('Error creating offer:', error);
    throw error;
  }
};

export const getAllOffers = async () => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching offers:', error);
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
    console.error('Error updating offer:', error);
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
    console.error('Error deleting offer:', error);
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
    console.error('Error updating carousel status:', error);
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
    console.error('Error updating order status:', error);
    throw error;
  }
};