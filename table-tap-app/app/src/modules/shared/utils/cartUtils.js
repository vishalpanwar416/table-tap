import { supabase } from '../../shared/supabase';

// Cart item validation
export const validateCartItem = (item) => {
  const required = ['id', 'name', 'price', 'restaurant_id'];
  const missing = required.filter(field => !item[field]);
  
  if (missing.length > 0) {
    throw new Error(`Invalid cart item: missing ${missing.join(', ')}`);
  }
  
  if (typeof item.price !== 'number' || item.price < 0) {
    throw new Error('Invalid price');
  }
  
  if (typeof item.quantity !== 'number' || item.quantity < 1) {
    throw new Error('Invalid quantity');
  }
  
  return true;
};

// Calculate effective price with all discounts
export const calculateEffectivePrice = (item, userDiscount = 0) => {
  if (!item) return 0;
  
  let price = item.price || 0;
  
  // Apply item discounts
  if (item.discounttype && item.discountvalue) {
    if (item.discounttype === 'Percentage') {
      price = price * (1 - item.discountvalue / 100);
    } else if (item.discounttype === 'Fixed') {
      price = Math.max(0, price - item.discountvalue);
    }
  }
  
  // Apply user discounts
  if (userDiscount > 0) {
    price = price * (1 - userDiscount / 100);
  }
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
};

// Clean up stale cart items
export const cleanupStaleCartItems = async (cartItems, restaurantId) => {
  if (!cartItems.length) return cartItems;
  
  try {
    const itemIds = cartItems.map(item => item.id);
    
    // Check which items still exist and are active
    const { data: validItems, error } = await supabase
      .from('fooditems')
      .select('id, name, price, image, category, discounttype, discountvalue, is_active')
      .in('id', itemIds)
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true);
    
    if (error) {
      return cartItems; // Return original if check fails
    }
    
    const validIds = new Set(validItems.map(item => item.id));
    const cleanedItems = cartItems.filter(item => validIds.has(item.id));
    
    if (cleanedItems.length !== cartItems.length) {
    }
    
    return cleanedItems;
  } catch (error) {
    return cartItems;
  }
};

// Merge guest cart with user cart
export const mergeCarts = (guestCart, userCart, restaurantId) => {
  const mergedItems = [...userCart];
  
  guestCart.forEach(guestItem => {
    if (guestItem.restaurant_id === restaurantId) {
      const existingItem = mergedItems.find(item => 
        item.id === guestItem.id && 
        (guestItem.category ? item.category === guestItem.category : true)
      );
      
      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        mergedItems.push(guestItem);
      }
    }
  });
  
  return mergedItems;
};

// Calculate cart totals
export const calculateCartTotals = (cartItems, userDiscount = 0) => {
  const totals = {
    itemCount: 0,
    subtotal: 0,
    totalDiscount: 0,
    total: 0,
    itemBreakdown: []
  };
  
  cartItems.forEach(item => {
    const originalPrice = item.price * item.quantity;
    const effectivePrice = calculateEffectivePrice(item, userDiscount);
    const finalPrice = effectivePrice * item.quantity;
    const itemDiscount = originalPrice - finalPrice;
    
    totals.itemCount += item.quantity;
    totals.subtotal += originalPrice;
    totals.totalDiscount += itemDiscount;
    totals.total += finalPrice;
    
    totals.itemBreakdown.push({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      originalPrice,
      finalPrice,
      discount: itemDiscount
    });
  });
  
  // Round all monetary values
  totals.subtotal = Math.round(totals.subtotal * 100) / 100;
  totals.totalDiscount = Math.round(totals.totalDiscount * 100) / 100;
  totals.total = Math.round(totals.total * 100) / 100;
  
  return totals;
};

// Format price for display
export const formatPrice = (price, currency = '₹') => {
  if (typeof price !== 'number') return `${currency}0`;
  return `${currency}${price.toFixed(2)}`;
};

// Generate cart summary for notifications
export const generateCartSummary = (cartItems, maxItems = 3) => {
  if (!cartItems.length) return 'Cart is empty';
  
  const itemNames = cartItems.slice(0, maxItems).map(item => item.name);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (cartItems.length <= maxItems) {
    return `${totalItems} item${totalItems > 1 ? 's' : ''}: ${itemNames.join(', ')}`;
  }
  
  const remaining = cartItems.length - maxItems;
  return `${totalItems} item${totalItems > 1 ? 's' : ''}: ${itemNames.join(', ')} and ${remaining} more`;
};

// Validate cart data structure
export const validateCartData = (cartData) => {
  if (!cartData || typeof cartData !== 'object') {
    throw new Error('Invalid cart data: must be an object');
  }
  
  if (!Array.isArray(cartData.items)) {
    throw new Error('Invalid cart data: items must be an array');
  }
  
  if (typeof cartData.timestamp !== 'number') {
    throw new Error('Invalid cart data: timestamp must be a number');
  }
  
  if (cartData.timestamp > Date.now()) {
    throw new Error('Invalid cart data: timestamp cannot be in the future');
  }
  
  // Check if cart is expired (7 days)
  const isExpired = Date.now() - cartData.timestamp > 7 * 24 * 60 * 60 * 1000;
  if (isExpired) {
    throw new Error('Cart data is expired');
  }
  
  return true;
};

// Compress cart data for storage
export const compressCartData = (cartItems) => {
  return cartItems.map(item => ({
    id: item.id,
    q: item.quantity, // quantity
    p: item.price, // price
    n: item.name, // name
    c: item.category, // category
    r: item.restaurant_id, // restaurant_id
    dt: item.discounttype, // discounttype
    dv: item.discountvalue, // discountvalue
    ep: item.effectivePrice, // effectivePrice
    a: item.addedAt // addedAt
  }));
};

// Decompress cart data from storage
export const decompressCartData = (compressedItems) => {
  return compressedItems.map(item => ({
    id: item.id,
    quantity: item.q,
    price: item.p,
    name: item.n,
    category: item.c,
    restaurant_id: item.r,
    discounttype: item.dt,
    discountvalue: item.dv,
    effectivePrice: item.ep,
    addedAt: item.a
  }));
};

// Check if cart has items from different restaurants
export const hasMixedRestaurants = (cartItems) => {
  if (cartItems.length <= 1) return false;
  
  const restaurantIds = new Set(cartItems.map(item => item.restaurant_id));
  return restaurantIds.size > 1;
};

// Get unique restaurants in cart
export const getCartRestaurants = (cartItems) => {
  const restaurants = new Map();
  
  cartItems.forEach(item => {
    if (!restaurants.has(item.restaurant_id)) {
      restaurants.set(item.restaurant_id, {
        id: item.restaurant_id,
        name: item.restaurant_name || 'Unknown Restaurant',
        itemCount: 0,
        totalPrice: 0
      });
    }
    
    const restaurant = restaurants.get(item.restaurant_id);
    restaurant.itemCount += item.quantity;
    restaurant.totalPrice += (item.effectivePrice || item.price) * item.quantity;
  });
  
  return Array.from(restaurants.values());
};

// Export cart data for backup/transfer
export const exportCartData = (cartItems, metadata = {}) => {
  return {
    version: '1.0',
    timestamp: Date.now(),
    itemCount: cartItems.length,
    totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    restaurants: getCartRestaurants(cartItems),
    items: cartItems,
    metadata
  };
};

// Import cart data with validation
export const importCartData = (exportedData) => {
  if (!exportedData || typeof exportedData !== 'object') {
    throw new Error('Invalid export data');
  }
  
  if (!Array.isArray(exportedData.items)) {
    throw new Error('Invalid export data: items must be an array');
  }
  
  // Validate each item
  const validItems = [];
  for (const item of exportedData.items) {
    try {
      validateCartItem(item);
      validItems.push(item);
    } catch (error) {
    }
  }
  
  return validItems;
}; 