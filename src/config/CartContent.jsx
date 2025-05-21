import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Debug: Log cart items state whenever it changes
  useEffect(() => {
    console.log("Cart state updated:", cartItems);
  }, [cartItems]);

  const addToCart = (item) => {
    // Debug: Log the item being added to cart
    console.log("Adding to cart:", item);
    console.log("Item discount properties:", {
      discounttype: item.discounttype,
      discountvalue: item.discountvalue,
      price: item.price
    });

    setCartItems(prev => {
      // Look for an existing item with same id and category
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
      
      // Preserve all item properties exactly as they are
      console.log("Creating new cart item");
      const newItem = { 
        ...item, 
        quantity: 1
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
    console.log("Clearing cart");
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItem,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}