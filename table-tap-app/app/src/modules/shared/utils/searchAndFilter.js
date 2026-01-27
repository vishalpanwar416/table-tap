// Search and filter utilities for BestSeller items
export const searchAndFilterItems = (items, searchTerm, sortBy, filters = {}) => {
  let filteredItems = [...items];

  // Search filtering
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Additional filters
  if (filters.category && filters.category !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === filters.category);
  }

  if (filters.priceRange) {
    filteredItems = filteredItems.filter(item => {
      const price = item.discounttype && item.discountvalue 
        ? (item.discounttype === 'Percentage' 
          ? item.price - (item.price * (item.discountvalue / 100))
          : Math.max(0, item.price - item.discountvalue))
        : item.price;
      
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });
  }

  if (filters.rating) {
    filteredItems = filteredItems.filter(item => (item.rating || 0) >= filters.rating);
  }

  if (filters.discountOnly) {
    filteredItems = filteredItems.filter(item => item.discounttype && item.discountvalue);
  }

  // Sorting
  switch (sortBy) {
    case 'price-low':
      filteredItems.sort((a, b) => {
        const priceA = a.discounttype && a.discountvalue 
          ? (a.discounttype === 'Percentage' 
            ? a.price - (a.price * (a.discountvalue / 100))
            : Math.max(0, a.price - a.discountvalue))
          : a.price;
        const priceB = b.discounttype && b.discountvalue 
          ? (b.discounttype === 'Percentage' 
            ? b.price - (b.price * (b.discountvalue / 100))
            : Math.max(0, b.price - b.discountvalue))
          : b.price;
        return priceA - priceB;
      });
      break;
      
    case 'price-high':
      filteredItems.sort((a, b) => {
        const priceA = a.discounttype && a.discountvalue 
          ? (a.discounttype === 'Percentage' 
            ? a.price - (a.price * (a.discountvalue / 100))
            : Math.max(0, a.price - a.discountvalue))
          : a.price;
        const priceB = b.discounttype && b.discountvalue 
          ? (b.discounttype === 'Percentage' 
            ? b.price - (b.price * (b.discountvalue / 100))
            : Math.max(0, b.price - b.discountvalue))
          : b.price;
        return priceB - priceA;
      });
      break;
      
    case 'name':
      filteredItems.sort((a, b) => a.name.localeCompare(b.name));
      break;
      
    case 'rating':
      filteredItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
      
    case 'discount':
      filteredItems.sort((a, b) => {
        const discountA = a.discountvalue || 0;
        const discountB = b.discountvalue || 0;
        return discountB - discountA;
      });
      break;
      
    case 'popularity':
    default:
      // Keep original order (assumed to be by popularity)
      break;
  }

  return filteredItems;
};

// Get unique categories from items
export const getUniqueCategories = (items) => {
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  return categories.sort();
};

// Get price range from items
export const getPriceRange = (items) => {
  if (items.length === 0) return { min: 0, max: 0 };
  
  const prices = items.map(item => {
    if (item.discounttype && item.discountvalue) {
      return item.discounttype === 'Percentage' 
        ? item.price - (item.price * (item.discountvalue / 100))
        : Math.max(0, item.price - item.discountvalue);
    }
    return item.price;
  });
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
};

// Get rating statistics
export const getRatingStats = (items) => {
  const ratedItems = items.filter(item => item.rating);
  if (ratedItems.length === 0) return { average: 0, count: 0 };
  
  const totalRating = ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0);
  return {
    average: totalRating / ratedItems.length,
    count: ratedItems.length
  };
}; 