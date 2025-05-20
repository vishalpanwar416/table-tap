import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Use the centralized auth context

  // Load cart items when user changes
  useEffect(() => {
    if (user) {
      loadUserCart(user.id);
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [user]);

  // Load user cart items from profiles table
  const loadUserCart = async (userId) => {
    try {
      setLoading(true);
      
      // Get cart items from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('cart_items')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user cart:', error);
        setCartItems([]);
        return;
      }

      // Convert cart items from JSONB to our cart format
      if (profile?.cart_items && profile.cart_items.length > 0) {
        const formattedItems = await Promise.all(
          profile.cart_items.map(async (cartItem) => {
            // Get the food item details
            const { data: foodItem, error: foodError } = await supabase
              .from('fooditems')
              .select('*')
              .eq('id', cartItem.id)
              .single();

            if (foodError || !foodItem) {
              console.error('Error fetching food item:', foodError);
              return null;
            }

            return {
              ...foodItem,
              quantity: cartItem.quantity,
              addedAt: cartItem.addedAt
            };
          })
        );

        // Filter out any null items
        setCartItems(formattedItems.filter(item => item !== null));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading user cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Update cart in profiles table
  const updateCartInDB = async (newCartItems) => {
    if (!user) return;

    try {
      // Convert cart items to JSONB format
      const cartForDB = newCartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        addedAt: item.addedAt || new Date().toISOString()
      }));

      const { error } = await supabase
        .from('profiles')
        .update({ cart_items: cartForDB })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const addToCart = async (item) => {
    if (!user) {
      console.error('User must be logged in to add items to cart');
      return;
    }

    const newCartItems = [...cartItems];
    const sanitizedPrice = typeof item.price === 'string' 
      ? parseFloat(item.price.replace(/[^0-9.]/g, '')) 
      : item.price;

    const numericPriceItem = {
      ...item,
      price: sanitizedPrice
    };
    
    const existingIndex = newCartItems.findIndex(i => 
      i.id === numericPriceItem.id && 
      i.category === numericPriceItem.category
    );
    
    if (existingIndex > -1) {
      newCartItems[existingIndex].quantity += 1;
    } else {
      newCartItems.push({ 
        ...numericPriceItem, 
        quantity: 1, 
        addedAt: new Date().toISOString() 
      });
    }

    setCartItems(newCartItems);
    await updateCartInDB(newCartItems);
  };

  const removeItem = async (id, category) => {
    if (!user) return;

    const newCartItems = cartItems.filter(item => 
      !(item.id === id && item.category === category)
    );
    
    setCartItems(newCartItems);
    await updateCartInDB(newCartItems);
  };
  
  const updateQuantity = async (id, category, newQuantity) => {
    if (!user) return;

    let newCartItems;
    if (newQuantity <= 0) {
      newCartItems = cartItems.filter(item => 
        !(item.id === id && item.category === category)
      );
    } else {
      newCartItems = cartItems.map(item => {
        if (item.id === id && item.category === category) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    }

    setCartItems(newCartItems);
    await updateCartInDB(newCartItems);
  };

  const clearCart = async () => {
    if (!user) return;

    setCartItems([]);
    await updateCartInDB([]);
  };
  
  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      loading,
      user
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};