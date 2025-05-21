import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Debug: Log cart items state whenever it changes
  useEffect(() => {
    console.log("Cart state updated:", cartItems);
  }, [cartItems]);

  // Calculate the actual price after discount
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
    
    return finalPrice;
  };

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
      
      // Calculate the actual price after discount
      const effectivePrice = calculateDiscountedPrice(item);
      console.log(`Original price: ${item.price}, Effective price after discount: ${effectivePrice}`);
      
      // Preserve all item properties and add the effective price
      console.log("Creating new cart item");
      const newItem = { 
        ...item, 
        effectivePrice: effectivePrice,  // Store the calculated price
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
        clearCart,
        calculateDiscountedPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}