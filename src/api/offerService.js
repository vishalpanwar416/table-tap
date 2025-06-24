import { supabase } from '../supabase';

// Create a new offer
export const createOffer = async (offerData) => {
  try {
    console.log('Creating offer with data:', offerData);
    
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
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
      console.warn('No restaurant_id provided for offer creation');
    }
    
    console.log('Formatted data for insertion:', formattedData);
    
    const { data, error } = await supabase
      .from('fooditems')
      .insert([formattedData])
      .select();
    
    if (error) {
      console.error('Create offer error details:', error);
      throw error;
    }
    
    console.log('Offer created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

// Get all offers for a specific restaurant
export const getRestaurantOffers = async (restaurantId) => {
  try {
    console.log('Fetching offers for restaurant:', restaurantId);
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get restaurant offers error:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} offers for restaurant`);
    return data || [];
  } catch (error) {
    console.error('Error fetching restaurant offers:', error);
    throw error;
  }
};

// Get all offers (keep existing function for backward compatibility)
export const getAllOffers = async (restaurantId = null) => {
  try {
    console.log('Fetching all offers');
    
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
      console.error('Get all offers error:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} offers`);
    return data || [];
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
};

// Update offer
export const updateOffer = async (id, offerData) => {
  try {
    console.log(`Updating offer with id: ${id}`, offerData);
    
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
      console.error('Update offer error:', error);
      throw error;
    }
    
    console.log('Offer updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
};

// Delete offer
export const deleteOffer = async (id) => {
  try {
    console.log(`Deleting offer with id: ${id}`);
    
    // First get the item to check if there's an image to delete
    const { data: itemData, error: getError } = await supabase
      .from('fooditems')
      .select('image')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('Error getting offer before delete:', getError);
    }
    
    const { error } = await supabase
      .from('fooditems')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete offer error:', error);
      throw error;
    }
    
    console.log('Offer deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting offer:', error);
    throw error;
  }
};

// Set/unset individual offer carousel status
export const setCarouselOffer = async (offerId, isCarousel) => {
  try {
    console.log(`Setting offer ${offerId} carousel status to: ${isCarousel}`);
    
    const { data, error } = await supabase
      .from('fooditems')
      .update({ is_carousel: isCarousel })
      .eq('id', offerId)
      .select();
    
    if (error) {
      console.error('Error updating carousel status:', error);
      throw error;
    }
    
    console.log('Carousel status updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating carousel status:', error);
    throw error;
  }
};

// Update featured carousel offers (alternative method if needed)
export const setMultipleCarouselOffers = async (offerIds, restaurantId = null) => {
  try {
    console.log('Updating carousel offers with IDs:', offerIds);
    
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
      console.error('Error resetting featured offers:', resetError);
      throw resetError;
    }
    
    // Then set the new featured offers
    if (offerIds && offerIds.length > 0) {
      const { error: updateError } = await supabase
        .from('fooditems')
        .update({ is_carousel: true })
        .in('id', offerIds);
      
      if (updateError) {
        console.error('Error updating featured offers:', updateError);
        throw updateError;
      }
    }
    
    console.log('Carousel offers updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating carousel offers:', error);
    throw error;
  }
};

// Get all featured carousel offers for a specific restaurant
export const getRestaurantCarouselOffers = async (restaurantId) => {
  try {
    console.log('Fetching carousel offers for restaurant:', restaurantId);
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId)
      .eq('is_carousel', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get restaurant carousel offers error:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} carousel offers for restaurant`);
    return data || [];
  } catch (error) {
    console.error('Error fetching restaurant carousel offers:', error);
    throw error;
  }
};

// Get all featured carousel offers (keep existing function for backward compatibility)
export const getCarouselOffers = async (restaurantId = null) => {
  try {
    console.log('Fetching carousel offers');
    
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
      console.error('Get carousel offers error:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} carousel offers`);
    return data || [];
  } catch (error) {
    console.error('Error fetching carousel offers:', error);
    throw error;
  }
};

// Get offers by category for a specific restaurant
export const getRestaurantOffersByCategory = async (restaurantId, category) => {
  try {
    console.log(`Fetching ${category} offers for restaurant:`, restaurantId);
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId)
      .eq('subcategory', category) // Assuming you have a subcategory field
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get restaurant offers by category error:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} ${category} offers for restaurant`);
    return data || [];
  } catch (error) {
    console.error('Error fetching restaurant offers by category:', error);
    throw error;
  }
};

// Search offers for a specific restaurant
export const searchRestaurantOffers = async (restaurantId, searchTerm) => {
  try {
    console.log(`Searching offers for restaurant: ${restaurantId}, term: ${searchTerm}`);
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Search restaurant offers error:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} offers matching search term`);
    return data || [];
  } catch (error) {
    console.error('Error searching restaurant offers:', error);
    throw error;
  }
};

// Get offer statistics for a specific restaurant
export const getRestaurantOfferStats = async (restaurantId) => {
  try {
    console.log('Fetching offer statistics for restaurant:', restaurantId);
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('price, discounted_price, is_carousel')
      .eq('category', 'Offers')
      .eq('restaurant_id', restaurantId);
    
    if (error) {
      console.error('Get restaurant offer stats error:', error);
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
    
    console.log('Offer statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error fetching restaurant offer stats:', error);
    throw error;
  }
};

export const createCompositeOfferImage = async (images) => {
  return images[0];
};