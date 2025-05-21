// CartSidebar.jsx - Debugging Version
import React, { useEffect } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeItem } = useCart();
  
  // Debug: Log cart items to see their actual structure
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log("Cart Items with discount info:", cartItems);
    }
  }, [cartItems]);

  // Calculate discounted price for an item - handling ALL possible property name variations
  const calculateDiscountedPrice = (item) => {
    let price = parseFloat(item.price);
    
    // Debug: Log the item and its discount properties
    console.log("Item being calculated:", item);
    console.log("Discount properties:", {
      discounttype: item.discounttype,
      discountvalue: item.discountvalue,
      discountType: item.discountType,
      discountValue: item.discountValue,
      type: item.type,
      value: item.value
    });
  
    // Try all possible property name combinations
    if (item.discounttype === 'Percentage' || item.discountType === 'percentage' || item.discountType === 'Percentage') {
      const value = item.discountvalue || item.discountValue || 0;
      price = price * (1 - value / 100);
    } else if (item.discounttype === 'Fixed' || item.discountType === 'fixed' || item.discountType === 'Fixed') {
      const value = item.discountvalue || item.discountValue || 0;
      price = price - value;
    }
    
    return price;
  };

  const calculateSubtotalAndTaxes = () => {
    let subtotal = 0;
    let taxableAmount = 0;
    
    cartItems.forEach(item => {
      const price = calculateDiscountedPrice(item);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      
      // Check if the item is water (exempt from GST)
      const isWater = item.name && 
        (item.name.toLowerCase().includes('water') || 
         item.category?.toLowerCase() === 'water');
         
      if (!isWater) {
        taxableAmount += itemTotal;
      }
    });
    
    // Calculate taxes (split into CGST and SGST equally, each at 2.5%)
    const cgst = taxableAmount * 0.025; // 2.5% CGST
    const sgst = taxableAmount * 0.025; // 2.5% SGST
    
    return {
      subtotal,
      cgst,
      sgst,
      total: subtotal + cgst + sgst
    };
  };

  const { subtotal, cgst, sgst, total } = calculateSubtotalAndTaxes();
  const navigate = useNavigate();
  
  const slideVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // Function to check if item has any discount
  const hasAnyDiscount = (item) => {
    return (item.discounttype && item.discountvalue) || 
           (item.discountType && item.discountValue);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-content"
            className="fixed top-0 right-0 h-full w-full md:w-8/12 lg:w-7/10 bg-black z-50 overflow-hidden rounded-tl-[80px] rounded-bl-[80px]"
            style={{ maxWidth: '70%' }}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="h-full flex flex-col">
              {/* Header with cart icon and title */}
              <div className="flex justify-center items-center pt-8 pb-4">
                <div className="bg-white rounded-full p-3 mr-3">
                  <ShoppingCart className="h-6 w-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white">Cart</h2>
              </div>

              <div className="border-t border-gray-700 w-full my-4"></div>

              {/* Cart items count */}
              <div className="px-6 mb-4">
                <h3 className="text-white text-xl">
                  You have {cartItems.length} items in the cart
                </h3>
              </div>

              {/* Debug info */}
              <div className="px-6 mb-4 text-white text-xs">
                <div className="bg-gray-800 p-2 rounded">
                  <p>Debug mode: Checking discount properties...</p>
                </div>
              </div>

              {/* Cart items list */}
              <div className="flex-1 overflow-y-auto px-6">
                {cartItems.length === 0 ? (
                  <p className="text-gray-400 text-center mt-8">Your cart is empty</p>
                ) : (
                  cartItems.map((item, index) => {
                    // Check if the item is water
                    const isWater = item.name && 
                      (item.name.toLowerCase().includes('water') || 
                       item.category?.toLowerCase() === 'water');
                    
                    // Calculate discounted price - using the comprehensive function
                    const itemHasDiscount = hasAnyDiscount(item);
                    const originalPrice = parseFloat(item.price).toFixed(2);
                    const discountedPrice = itemHasDiscount ? 
                      parseFloat(calculateDiscountedPrice(item)).toFixed(2) : originalPrice;
                    
                    // Debug info
                    console.log(`Item ${index + 1}: ${item.name}`);
                    console.log(`- Original price: ${originalPrice}`);
                    console.log(`- Discounted price: ${discountedPrice}`);
                    console.log(`- Has discount: ${itemHasDiscount}`);
                    
                    return (
                      <div key={`${item.id}-${item.category}-${index}`}>
                        <div className="flex items-start mb-4">
                          {/* Item image */}
                          <div className="w-24 h-24 overflow-hidden rounded-lg mr-4">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          
                          {/* Item details */}
                          <div className="flex-1">
                            <h3 className="text-white font-medium text-lg">{item.name}</h3>
                            
                            {/* Debug info */}
                            <div className="text-xs text-gray-400 mb-1">
                              {itemHasDiscount ? 
                                `Using discount: ${item.discounttype || item.discountType} ${item.discountvalue || item.discountValue}` : 
                                'No discount found'}
                            </div>
                            
                            {/* Price display with discounts if available */}
                            {itemHasDiscount ? (
                              <div>
                                <p className="text-gray-400 text-sm line-through">₹{originalPrice}</p>
                                <p className="text-white font-medium">₹{discountedPrice}</p>
                                
                                {/* Show discount details */}
                                {(item.discounttype === 'Percentage' || item.discountType === 'percentage' || item.discountType === 'Percentage') && (
                                  <span className="text-green-400 text-sm">
                                    {item.discountvalue || item.discountValue}% off
                                  </span>
                                )}
                                
                                {(item.discounttype === 'Fixed' || item.discountType === 'fixed' || item.discountType === 'Fixed') && (
                                  <span className="text-green-400 text-sm">
                                    ₹{item.discountvalue || item.discountValue} off
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-white font-medium">₹{originalPrice}</p>
                            )}
                            
                            {isWater && (
                              <p className="text-green-400 text-sm">GST exempt</p>
                            )}
                          </div>
                          
                          {/* Date and time */}
                          <div className="text-right">
                            <p className="text-white">{new Date().toLocaleDateString()}</p>
                            <p>" "</p>
                            
                            {/* Quantity controls */}
                            <div className="flex items-center justify-end mt-2">
                              <button 
                                onClick={() => {
                                  if (item.quantity === 1) {
                                    removeItem(item.id, item.category);
                                  } else {
                                    updateQuantity(item.id, item.category, item.quantity - 1);
                                  }
                                }}
                                className="bg-black border border-white rounded-full w-6 h-6 flex items-center justify-center"
                              >
                                <Minus className="h-3 w-3 text-white" />
                              </button>
                              <span className="mx-2 text-white">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.category, item.quantity + 1)}
                                className="bg-black border border-white rounded-full w-6 h-6 flex items-center justify-center"
                              >
                                <Plus className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Divider between items */}
                        <div className="border-t border-gray-700 w-full my-4"></div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pricing information with Indian tax standards */}
              {cartItems.length > 0 && (
                <div className="px-6 pb-20">
                  <div className="flex justify-between mb-4">
                    <span className="text-white text-lg">Subtotal</span>
                    <span className="text-white text-lg font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between mb-2">
                    <span className="text-white text-lg">CGST (2.5%)</span>
                    <span className="text-white text-lg font-medium">₹{cgst.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between mb-4">
                    <span className="text-white text-lg">SGST (2.5%)</span>
                    <span className="text-white text-lg font-medium">₹{sgst.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-gray-600 my-4"></div>
                  
                  <div className="flex justify-between mb-8">
                    <span className="text-white text-xl font-medium">Total</span>
                    <span className="text-white text-xl font-medium">₹{total.toFixed(2)}</span>
                  </div>
                  
                  {/* Checkout button */}
                  <div className="w-full flex justify-center">
                    <button className="bg-gray-300 text-black font-medium py-3 px-12 rounded-full text-lg hover:bg-gray-400 transition-colors"
                      onClick={() => {navigate('/order-confirmation')}}>
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            key="cart-overlay"
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;