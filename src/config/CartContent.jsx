import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '../Pages/Restaurantselection/RestaurantContext';

const CartContext = createContext();

export function CartProvider({ children, userId, userProfile }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { restaurantId } = useRestaurant(); // Get current restaurant ID

  // Auto-save to localStorage whenever cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      const cartData = {
        items: cartItems,
        timestamp: Date.now(),
        userId: userId,
        restaurantId: restaurantId // Include restaurant ID in cart data
      };
      try {
        localStorage.setItem(`cart_${userId || 'guest'}_${restaurantId}`, JSON.stringify(cartData));
        console.log("Cart auto-saved to localStorage");
      } catch (error) {
        console.warn("Failed to save cart to localStorage:", error);
      }
    }
  }, [cartItems, userId, restaurantId]);

  // Load cart from localStorage on mount, user change, or restaurant change
  useEffect(() => {
    const loadCartFromStorage = () => {
      if (!restaurantId) return;
      
      try {
        const savedCart = localStorage.getItem(`cart_${userId || 'guest'}_${restaurantId}`);
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          // Check if cart is not too old (e.g., 7 days)
          const isExpired = Date.now() - cartData.timestamp > 7 * 24 * 60 * 60 * 1000;
          
          if (!isExpired && cartData.items) {
            setCartItems(cartData.items);
            setLastSyncTime(cartData.timestamp);
            console.log("Cart loaded from localStorage for restaurant:", restaurantId);
          }
        } else {
          // Clear cart when switching to a new restaurant
          setCartItems([]);
          setLastSyncTime(null);
        }
      } catch (error) {
        console.warn("Failed to load cart from localStorage:", error);
        setCartItems([]);
      }
    };

    loadCartFromStorage();
  }, [userId, restaurantId]);

  // Sync with server (if you have an API endpoint)
  const syncWithServer = useCallback(async () => {
    if (!userId || !restaurantId) return;

    setIsLoading(true);
    try {
      // Example API calls - replace with your actual endpoints
      const response = await fetch(`/api/cart/${userId}?restaurantId=${restaurantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth headers here
        }
      });

      if (response.ok) {
        const serverCart = await response.json();
        if (serverCart.items && serverCart.timestamp > (lastSyncTime || 0)) {
          setCartItems(serverCart.items);
          setLastSyncTime(serverCart.timestamp);
          console.log("Cart synced from server for restaurant:", restaurantId);
        }
      }
    } catch (error) {
      console.warn("Failed to sync cart with server:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, restaurantId, lastSyncTime]);

  // Auto-sync on mount and periodically
  useEffect(() => {
    if (userId && restaurantId) {
      syncWithServer();
      
      // Set up periodic sync (every 5 minutes)
      const syncInterval = setInterval(syncWithServer, 5 * 60 * 1000);
      return () => clearInterval(syncInterval);
    }
  }, [userId, restaurantId, syncWithServer]);

  // Save to server whenever cart changes (debounced)
  useEffect(() => {
    if (!userId || !restaurantId || cartItems.length === 0) return;

    const saveToServer = async () => {
      try {
        await fetch(`/api/cart/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add your auth headers here
          },
          body: JSON.stringify({
            items: cartItems,
            timestamp: Date.now(),
            restaurantId: restaurantId
          })
        });
        console.log("Cart auto-saved to server for restaurant:", restaurantId);
      } catch (error) {
        console.warn("Failed to save cart to server:", error);
      }
    };

    // Debounce server saves
    const timeoutId = setTimeout(saveToServer, 1000);
    return () => clearTimeout(timeoutId);
  }, [cartItems, userId, restaurantId]);

  // Apply user profile preferences/discounts
  useEffect(() => {
    if (userProfile && cartItems.length > 0) {
      setCartItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          // Apply user-specific discounts or preferences
          userDiscount: userProfile.membershipDiscount || 0,
          // You can add more user-specific modifications here
        }))
      );
    }
  }, [userProfile]);

  // Debug: Log cart items state whenever it changes
  useEffect(() => {
    console.log("Cart state updated for restaurant:", restaurantId, cartItems);
  }, [cartItems, restaurantId]);

  // Calculate the actual price after discount (including user discounts)
  const calculateDiscountedPrice = (item) => {
    if (!item.discounttype || !item.discountvalue) {
      return item.price;
    }
    
    let finalPrice = item.price;
    
    if (item.discounttype === 'Percentage') {
      finalPrice = item.price * (1 - item.discountvalue/100);
    } else if (item.discounttype === 'Fixed') {
      finalPrice = Math.max(0, item.price - item.discountvalue);
    }

    // Apply user-specific discount if available
    if (item.userDiscount) {
      finalPrice = finalPrice * (1 - item.userDiscount/100);
    }
    
    return finalPrice;
  };

  const addToCart = (item) => {
    // Check if the item belongs to the current restaurant
    if (item.restaurant_id !== restaurantId) {
      console.error('Cannot add items from different restaurants to cart');
      return;
    }

    console.log("Adding to cart:", item);
    console.log("Item discount properties:", {
      discounttype: item.discounttype,
      discountvalue: item.discountvalue,
      price: item.price
    });

    setCartItems(prev => {
      const existingItem = prev.find(i => 
        i.id === item.id && 
        (item.category ? i.category === item.category : true)
      );
      
      if (existingItem) {
        console.log("Found existing item, updating quantity");
        return prev.map(i => 
          (i.id === item.id && 
           (item.category ? i.category === item.category : true)) 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      
      const effectivePrice = calculateDiscountedPrice(item);
      console.log(`Original price: ${item.price}, Effective price after discount: ${effectivePrice}`);
      
      const newItem = { 
        ...item, 
        effectivePrice: effectivePrice,
        quantity: 1,
        addedAt: Date.now(),
        userDiscount: userProfile?.membershipDiscount || 0
      };
      
      console.log("New item created:", newItem);
      return [...prev, newItem];
    });
  };

  const removeItem = (id, category) => {
    console.log(`Removing item: ${id}, category: ${category}`);
    setCartItems(prev => prev.filter(item => 
      !(item.id === id && (category ? item.category === category : true))
    ));
  };

  const updateQuantity = (id, category, quantity) => {
    console.log(`Updating quantity for item: ${id}, category: ${category}, new quantity: ${quantity}`);
    if (quantity < 1) return removeItem(id, category);
    
    setCartItems(prev =>
      prev.map(item => 
        (item.id === id && (category ? item.category === category : true)) 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    console.log("Clearing cart for restaurant:", restaurantId);
    setCartItems([]);
    // Also clear from localStorage
    try {
      localStorage.removeItem(`cart_${userId || 'guest'}_${restaurantId}`);
    } catch (error) {
      console.warn("Failed to clear cart from localStorage:", error);
    }
  };

  const mergeCarts = (guestCart, userCart) => {
    // Merge guest cart with user cart when user logs in
    // Only merge items from the same restaurant
    const mergedItems = [...userCart];
    
    guestCart.forEach(guestItem => {
      // Only merge items from the current restaurant
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

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.effectivePrice || calculateDiscountedPrice(item);
      return total + (price * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItem,
        updateQuantity,
        clearCart,
        calculateDiscountedPrice,
        syncWithServer,
        mergeCarts,
        getTotalItems,
        getTotalPrice,
        isLoading,
        lastSyncTime,
        restaurantId // Expose current restaurant ID
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