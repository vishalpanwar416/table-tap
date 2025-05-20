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

// Get all offers
export const getAllOffers = async () => {
  try {
    console.log('Fetching all offers');
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .order('created_at', { ascending: false });
    
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
export const setMultipleCarouselOffers = async (offerIds) => {
  try {
    console.log('Updating carousel offers with IDs:', offerIds);
    
    // First, reset all featured offers
    const { error: resetError } = await supabase
      .from('fooditems')
      .update({ is_carousel: false })
      .eq('category', 'Offers');
    
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

// Get all featured carousel offers
export const getCarouselOffers = async () => {
  try {
    console.log('Fetching carousel offers');
    
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('category', 'Offers')
      .eq('is_carousel', true)
      .order('created_at', { ascending: false });
    
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

export const createCompositeOfferImage = async (images) => {
  return images[0];
};