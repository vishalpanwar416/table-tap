import { supabase } from '../supabase';

// Create a new offer
export const createOffer = async (offerData) => {
  try {
    
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    // Ensure data is properly formatted
    const formattedData = {
      ...offerData,
      price: parseFloat(offerData.price),
      discounted_price: parseFloat(offerData.discounted_price),
      user_id: userData.user?.id || null,
      category: 'Offers', // Force category to be 'Offers'
    };
    
    // If restaurant_id is provided in offerData, use it
    // Otherwise, try to get it from the current user's context
    if (!formattedData.restaurant_id) {
    }
    
    
    const { data, error } = await supabase
      .from('fooditems')
      .insert([formattedData])
      .select();
    
    if (error) {
      throw error;
    }
    
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

// Update offer
export const updateOffer = async (id, offerData) => {
  try {
    
    // Ensure data is properly formatted
    const formattedData = {
      ...offerData,
      price: parseFloat(offerData.price),
      discounted_price: parseFloat(offerData.discounted_price),
      category: 'Offers', // Ensure category remains 'Offers'
    };
    
    const { data, error } = await supabase
      .from('fooditems')
      .update(formattedData)
      .eq('id', id)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete offer
export const deleteOffer = async (id) => {
  try {
    
    // First get the item to check if there's an image to delete
    const { data: itemData, error: getError } = await supabase
      .from('fooditems')
      .select('image')
      .eq('id', id)
      .single();
    
    if (getError) {
    }
    
    const { error } = await supabase
      .from('fooditems')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Set/unset individual offer carousel status
export const setCarouselOffer = async (offerId, isCarousel) => {
  try {
    
    const { data, error } = await supabase
      .from('fooditems')
      .update({ is_carousel: isCarousel })
      .eq('id', offerId)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Update featured carousel offers (alternative method if needed)
export const setMultipleCarouselOffers = async (offerIds, restaurantId = null) => {
  try {
    
    // First, reset all featured offers for the restaurant
    let resetQuery = supabase
      .from('fooditems')
      .update({ is_carousel: false })
      .eq('category', 'Offers');
    
    // Filter by restaurant if provided
    if (restaurantId) {
      resetQuery = resetQuery.eq('restaurant_id', restaurantId);
    }
    
    const { error: resetError } = await resetQuery;
    
    if (resetError) {
      throw resetError;
    }
    
    // Then set the new featured offers
    if (offerIds && offerIds.length > 0) {
      const { error: updateError } = await supabase
        .from('fooditems')
        .update({ is_carousel: true })
        .in('id', offerIds);
      
      if (updateError) {
        throw updateError;
      }
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Get all featured carousel offers for a specific restaurant
export const getRestaurantCarouselOffers = async (restaurantId) => {
  try {
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId)
      .eq('is_carousel', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get all featured carousel offers (keep existing function for backward compatibility)
export const getCarouselOffers = async (restaurantId = null) => {
  try {
    
    let query = supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('is_carousel', true);
    
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

// Get offers by category for a specific restaurant
export const getRestaurantOffersByCategory = async (restaurantId, category) => {
  try {
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId)
      .eq('subcategory', category) // Assuming you have a subcategory field
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    throw error;
  }
};

// Search offers for a specific restaurant
export const searchRestaurantOffers = async (restaurantId, searchTerm) => {
  try {
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get offer statistics for a specific restaurant
export const getRestaurantOfferStats = async (restaurantId) => {
  try {
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('price, discounted_price, is_carousel')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId);
    
    if (error) {
      throw error;
    }
    
    const stats = {
      totalOffers: data.length,
      carouselOffers: data.filter(offer => offer.is_carousel).length,
      totalSavings: data.reduce((sum, offer) => {
        return sum + (parseFloat(offer.price) - parseFloat(offer.discounted_price));
      }, 0),
      averageDiscount: data.length > 0 ? 
        data.reduce((sum, offer) => {
          const discount = ((parseFloat(offer.price) - parseFloat(offer.discounted_price)) / parseFloat(offer.price)) * 100;
          return sum + discount;
        }, 0) / data.length : 0
    };
    
    return stats;
  } catch (error) {
    throw error;
  }
};

export const createCompositeOfferImage = async (images) => {
  return images[0];
};