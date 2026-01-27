import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';
import { secureStorage, sanitizeInput } from '../utils/security';

const CartContext = createContext();

// Validate simplified cart item
const validateCartItem = (item) => {
  const required = ['food_item_id', 'restaurant_id', 'quantity'];
  const missing = required.filter(field => !item[field]);

  if (missing.length > 0) {
    throw new Error(`Invalid cart item: missing ${missing.join(', ')}`);
  }

  if (typeof item.quantity !== 'number' || item.quantity < 1) {
    throw new Error('Invalid quantity');
  }

  return true;
};

// Clean up stale cart items (items that no longer exist or are inactive)
const cleanupStaleCartItems = async (cartItems, restaurantId) => {
  if (!cartItems.length) return cartItems;

  try {
    // Extract food item IDs from cart items (handle both old and new formats)
    const itemIds = cartItems.map(item => item.food_item_id || item.id);

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
    const cleanedItems = cartItems.filter(item => {
      const itemId = item.food_item_id || item.id;
      return validIds.has(itemId);
    });

    if (cleanedItems.length !== cartItems.length) {
    }

    return cleanedItems;
  } catch (error) {
    return cartItems;
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { restaurantId } = useRestaurant();

  // Refs for debouncing and cleanup
  const saveTimeoutRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const isInitializedRef = useRef(false);
  const prevRestaurantIdRef = useRef();

  // Generate cart key for localStorage
  const getCartKey = useCallback(() => {
    return `cart_${user?.id || 'guest'}_${restaurantId}`;
  }, [user?.id, restaurantId]);

  // Calculate effective price with discounts
  const calculateEffectivePrice = useCallback((item) => {
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
    if (item.userDiscount) {
      price = price * (1 - item.userDiscount / 100);
    }

    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }, []);

  // Add this new function to enrich cart items with food data - MOVED INSIDE COMPONENT
  const enrichCartItemsWithFoodData = useCallback(async (minimalCartItems) => {
    if (!minimalCartItems.length || !restaurantId) {
      return minimalCartItems;
    }

    try {
      // Extract food item IDs from cart items
      const foodItemIds = minimalCartItems.map(item => item.food_item_id || item.id);

      // Fetch food item details from fooditems table
      const { data: foodItems, error: foodError } = await supabase
        .from('fooditems')
        .select('*')
        .in('id', foodItemIds)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (foodError) {
        console.error('Failed to fetch food items for cart enrichment:', foodError);
        return minimalCartItems; // Return original if fetch fails
      }

      // Create a map of food items by ID
      const foodItemsMap = new Map(foodItems.map(item => [item.id, item]));

      // Merge cart items with food item details
      const enrichedCartItems = minimalCartItems
        .map(cartItem => {
          const foodItem = foodItemsMap.get(cartItem.food_item_id || cartItem.id);
          if (!foodItem) {
            return null; // Remove items that no longer exist
          }

          return {
            ...foodItem,
            quantity: cartItem.quantity,
            addedAt: cartItem.addedAt,
            effectivePrice: calculateEffectivePrice(foodItem)
          };
        })
        .filter(Boolean); // Remove null items

      return enrichedCartItems;
    } catch (error) {
      console.error('Error enriching cart items:', error);
      return minimalCartItems; // Return original if enrichment fails
    }
  }, [restaurantId, calculateEffectivePrice]);

  // Simplified cart item structure - only store essential data
  const createCartItem = useCallback((item) => {
    return {
      food_item_id: item.id,
      restaurant_id: item.restaurant_id,
      quantity: 1,
      addedAt: Date.now()
    };
  }, []);

  // Load cart from localStorage with validation
  const loadCartFromStorage = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const cartKey = getCartKey();
      const savedCart = secureStorage.getItem(cartKey);

      if (!savedCart) {
        setCartItems([]);
        setLastSyncTime(null);
        return;
      }

      const cartData = savedCart;

      // Validate cart data structure
      if (!cartData.items || !Array.isArray(cartData.items)) {
        throw new Error('Invalid cart data structure');
      }

      // Check if cart is expired (7 days)
      const isExpired = Date.now() - cartData.timestamp > 7 * 24 * 60 * 60 * 1000;

      if (isExpired) {
        secureStorage.removeItem(cartKey);
        setCartItems([]);
        setLastSyncTime(null);
        return;
      }

      // Handle both old and new cart item formats
      const validItems = [];
      for (const item of cartData.items) {
        try {
          // Check if it's the old format (has 'id') or new format (has 'food_item_id')
          if (item.food_item_id) {
            // New format - validate as minimal cart item
            validateCartItem(item);
            validItems.push(item);
          } else if (item.id) {
            // Old format - convert to new format
            const convertedItem = {
              food_item_id: item.id,
              restaurant_id: item.restaurant_id,
              quantity: item.quantity || 1,
              addedAt: item.addedAt || Date.now()
            };
            validateCartItem(convertedItem);
            validItems.push(convertedItem);
          } else {
            // Skip invalid items
          }
        } catch (validationError) {
          // Skip invalid items
        }
      }

      // Clean up stale items if user is logged in
      let finalItems = validItems;
      if (user) {
        finalItems = await cleanupStaleCartItems(validItems, restaurantId);
      }

      // Enrich cart items with food data
      const enrichedItems = await enrichCartItemsWithFoodData(finalItems);

      setCartItems(enrichedItems);
      setLastSyncTime(cartData.timestamp);
      setError(null);

    } catch (error) {
      setError('Failed to load cart');
      setCartItems([]);
      setLastSyncTime(null);

      // Clear corrupted data
      try {
        secureStorage.removeItem(getCartKey());
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, [restaurantId, user, getCartKey, enrichCartItemsWithFoodData]);

  // Save cart to localStorage with error handling
  const saveCartToStorage = useCallback((items) => {
    if (!restaurantId) return;

    try {
      const cartData = {
        items,
        timestamp: Date.now(),
        userId: user?.id,
        restaurantId
      };

      secureStorage.setItem(getCartKey(), cartData);
      setError(null);
    } catch (error) {
      setError('Failed to save cart');

      // Handle storage quota exceeded
      if (error.name === 'QuotaExceededError') {
        // Try to clear old carts and retry
        try {
          const keys = Object.keys(localStorage);
          const oldCartKeys = keys.filter(key => key.startsWith('cart_') && key !== getCartKey());
          oldCartKeys.forEach(key => secureStorage.removeItem(key));
          secureStorage.setItem(getCartKey(), cartData);
          setError(null);
        } catch (retryError) {
        }
      }
    }
  }, [restaurantId, user?.id, getCartKey]);

  // Save cart to server with minimal data
  const saveCartToServer = useCallback(async (items) => {
    if (!user?.id || !restaurantId) return;

    try {
      // Convert enriched cart items back to minimal format
      const minimalCartItems = items.map(item => ({
        food_item_id: item.id,
        restaurant_id: item.restaurant_id,
        quantity: item.quantity,
        addedAt: item.addedAt
      }));

      // First, get current cart items from profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('cart_items')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Get existing cart items (default to empty array if null)
      const existingCartItems = profile?.cart_items || [];

      // Remove items for current restaurant and add new items
      const updatedCartItems = [
        ...existingCartItems.filter(item => item.restaurant_id !== restaurantId),
        ...minimalCartItems
      ];

      // Update the profile with new cart items
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cart_items: updatedCartItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setLastSyncTime(Date.now());
      setError(null);
    } catch (error) {
      setError('Failed to sync cart');
    }
  }, [user?.id, restaurantId]);

  // Load cart from server with food item details
  const loadCartFromServer = useCallback(async () => {
    if (!user?.id || !restaurantId) return;

    setIsLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('cart_items')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (profile && profile.cart_items && Array.isArray(profile.cart_items)) {
        // Find cart items for current restaurant
        const restaurantCartItems = profile.cart_items.filter(item =>
          item.restaurant_id === restaurantId
        );

        if (restaurantCartItems.length === 0) {
          setCartItems([]);
          setLastSyncTime(Date.now());
          setError(null);
          return;
        }

        // Get food item IDs
        const foodItemIds = restaurantCartItems.map(item => item.food_item_id);

        // Fetch food item details from fooditems table
        const { data: foodItems, error: foodError } = await supabase
          .from('fooditems')
          .select('*')
          .in('id', foodItemIds)
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true);

        if (foodError) {
          throw foodError;
        }

        // Create a map of food items by ID
        const foodItemsMap = new Map(foodItems.map(item => [item.id, item]));

        // Merge cart items with food item details
        const enrichedCartItems = restaurantCartItems
          .map(cartItem => {
            const foodItem = foodItemsMap.get(cartItem.food_item_id);
            if (!foodItem) {
              return null;
            }

            return {
              ...foodItem,
              quantity: cartItem.quantity,
              addedAt: cartItem.addedAt,
              effectivePrice: calculateEffectivePrice(foodItem)
            };
          })
          .filter(Boolean); // Remove null items

        setCartItems(enrichedCartItems);
        setLastSyncTime(Date.now());
        setError(null);

        // Update localStorage with enriched data
        saveCartToStorage(enrichedCartItems);

      } else {
        setCartItems([]);
        setLastSyncTime(Date.now());
        setError(null);
      }
    } catch (error) {
      setError('Failed to sync cart');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, restaurantId, saveCartToStorage, calculateEffectivePrice]);

  // Debounced save to server
  const debouncedSaveToServer = useCallback((items) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCartToServer(items);
    }, 2000); // 2 second debounce
  }, [saveCartToServer]);

  // Clear entire cart - DEFINE THIS BEFORE THE useEffect THAT USES IT
  const clearCart = useCallback(() => {
    setCartItems([]);
    setLastSyncTime(null);
    setError(null);

    // Clear from localStorage
    try {
      localStorage.removeItem(getCartKey());
    } catch (error) {
    }

    // Clear from server
    if (user) {
      saveCartToServer([]);
    }
  }, [user, getCartKey, saveCartToServer]);

  // Add item to cart with minimal data
  const addToCart = useCallback((item) => {
    if (!restaurantId) {
      setError('No restaurant selected');
      return;
    }

    if (item.restaurant_id !== restaurantId) {
      setError('Cannot add items from different restaurants');
      return;
    }

    try {
      // Create enriched item for local state
      const enrichedItem = {
        ...item,
        quantity: 1,
        addedAt: Date.now(),
        effectivePrice: calculateEffectivePrice(item)
      };

      setCartItems(prev => {
        const existingItem = prev.find(i =>
          i.id === item.id &&
          (item.category ? i.category === item.category : true)
        );

        if (existingItem) {
          return prev.map(i =>
            (i.id === item.id &&
              (item.category ? i.category === item.category : true))
              ? {
                ...i,
                quantity: i.quantity + 1,
                effectivePrice: calculateEffectivePrice(i)
              }
              : i
          );
        }

        return [...prev, enrichedItem];
      });

      setError(null);
    } catch (validationError) {
      setError('Invalid item data');
    }
  }, [restaurantId, calculateEffectivePrice]);

  // Remove item from cart
  const removeItem = useCallback((id, category) => {
    setCartItems(prev => {
      const filtered = prev.filter(item =>
        !(item.id === id && (category ? item.category === category : true))
      );

      // Recalculate effective prices for remaining items
      return filtered.map(item => ({
        ...item,
        effectivePrice: calculateEffectivePrice(item)
      }));
    });
    setError(null);
  }, [calculateEffectivePrice]);

  // Update item quantity
  const updateQuantity = useCallback((id, category, quantity) => {
    if (quantity < 1) {
      removeItem(id, category);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        (item.id === id && (category ? item.category === category : true))
          ? {
            ...item,
            quantity,
            effectivePrice: calculateEffectivePrice(item) // Recalculate effective price
          }
          : item
      )
    );
    setError(null);
  }, [removeItem, calculateEffectivePrice]);

  // Merge guest cart with user cart
  const mergeCarts = useCallback((guestCart, userCart) => {
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
  }, [restaurantId]);

  // Calculate totals
  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  }, [cartItems]);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = item.effectivePrice || calculateEffectivePrice(item);
      return total + (price * (item.quantity || 0));
    }, 0);
  }, [cartItems, calculateEffectivePrice]);

  // Manual sync function
  const syncWithServer = useCallback(async () => {
    if (user) {
      await loadCartFromServer();
    }
  }, [user, loadCartFromServer]);

  // Initialize cart on mount and restaurant/user changes
  useEffect(() => {
    if (!isInitializedRef.current && restaurantId) {
      isInitializedRef.current = true;
      loadCartFromStorage();

      // Load from server if user is logged in
      if (user) {
        loadCartFromServer();
      }
    }
  }, [restaurantId, user, loadCartFromStorage, loadCartFromServer]);

  // Auto-save to localStorage and server when cart changes
  useEffect(() => {
    if (!isInitializedRef.current) return;

    saveCartToStorage(cartItems);

    if (user) {
      debouncedSaveToServer(cartItems);
    }
  }, [cartItems, user, saveCartToStorage, debouncedSaveToServer]);

  // Set up periodic server sync for logged-in users
  useEffect(() => {
    if (user && restaurantId) {
      syncIntervalRef.current = setInterval(() => {
        loadCartFromServer();
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [user, restaurantId, loadCartFromServer]);

  // Clear cart when restaurant changes (but not on initial mount)
  useEffect(() => {
    if (prevRestaurantIdRef.current && prevRestaurantIdRef.current !== restaurantId) {
      clearCart();
    }
    prevRestaurantIdRef.current = restaurantId;
  }, [restaurantId, clearCart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItem,
        updateQuantity,
        clearCart,
        calculateEffectivePrice,
        syncWithServer,
        mergeCarts,
        getTotalItems,
        getTotalPrice,
        isLoading,
        lastSyncTime,
        error,
        restaurantId
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}