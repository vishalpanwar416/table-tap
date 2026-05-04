import { getFallbackImage } from './imageOptimization';

// Utility to clean up problematic image URLs
export const cleanImageUrl = (url) => {
  if (!url) return null;

  // Remove any via.placeholder.com URLs
  if (url.includes('via.placeholder.com')) {
    return null;
  }

  // Remove any blob URLs that might be stale
  if (url.startsWith('blob:')) {
    return null;
  }

  // Remove any localhost blob URLs
  if (url.includes('localhost') && url.startsWith('blob:')) {
    return null;
  }

  return url;
};

// Clean up food items data
export const cleanFoodItemsData = (items) => {
  return items.map((item) => ({
    ...item,
    image: cleanImageUrl(item.image) || getFallbackImage(item.category, item.name),
  }));
};

// Clean up offers data
export const cleanOffersData = (offers) => {
  return offers.map((offer) => ({
    ...offer,
    image: cleanImageUrl(offer.image) || getFallbackImage('Offers', offer.name),
  }));
};
