import React from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeItem, calculateDiscountedPrice } = useCart();

  const calculatePriceDetails = () => {
    let originalTotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    
    cartItems.forEach(item => {
      // Calculate original price total
      const originalItemTotal = item.price * item.quantity;
      originalTotal += originalItemTotal;
      
      // Calculate discount amount
      const effectivePrice = item.effectivePrice !== undefined ? 
        item.effectivePrice : 
        calculateDiscountedPrice(item);
      
      const itemDiscount = (item.price - effectivePrice) * item.quantity;
      discountAmount += itemDiscount;
      
      // Calculate subtotal after discount for tax calculation
      const itemSubtotal = effectivePrice * item.quantity;
      
      // Check if the item is water (exempt from GST)
      const isWater = item.name && 
        (item.name.toLowerCase().includes('water') || 
         item.category?.toLowerCase() === 'water');
         
      if (!isWater) {
        taxableAmount += itemSubtotal;
      }
    });
    
    // Calculate taxes (split into CGST and SGST equally, each at 2.5%)
    const cgst = taxableAmount * 0.025; // 2.5% CGST
    const sgst = taxableAmount * 0.025; // 2.5% SGST
    
    // Subtotal is original total minus discount
    const subtotalAfterDiscount = originalTotal - discountAmount;
    
    // Final total is subtotal plus taxes
    const finalTotal = subtotalAfterDiscount + cgst + sgst;
    
    return {
      originalTotal,
      discountAmount,
      subtotalAfterDiscount,
      cgst,
      sgst,
      finalTotal
    };
  };

  const { 
    originalTotal, 
    discountAmount, 
    subtotalAfterDiscount, 
    cgst, 
    sgst, 
    finalTotal 
  } = calculatePriceDetails();
  
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

              {/* Cart items list */}
              <div className="flex-1 overflow-y-auto px-6">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center mt-8">
                    <p className="text-gray-400 text-center mb-4">Your cart is empty</p>
                    <button
                      onClick={onClose}
                      className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center text-3xl shadow-lg hover:bg-gray-200 transition"
                      aria-label="Close Cart"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  cartItems.map((item, index) => {
                    // Check if the item is water
                    const isWater = item.name && 
                      (item.name.toLowerCase().includes('water') || 
                       item.category?.toLowerCase() === 'water');
                    
                    // Calculate discounted price
                    const hasDiscount = item.discounttype && item.discountvalue;
                    const originalPrice = Number(item.price).toFixed(2);
                    
                    // Use effectivePrice if it exists, otherwise calculate it
                    const discountedPrice = item.effectivePrice !== undefined ? 
                      Number(item.effectivePrice).toFixed(2) : 
                      Number(calculateDiscountedPrice(item)).toFixed(2);
                    
                    return (
                      <div key={`${item.id}-${item.category}`}>
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
                            
                            {/* Price display with discounts if available */}
                            {hasDiscount ? (
                              <div>
                                <p className="text-gray-400 text-sm line-through">₹{originalPrice}</p>
                                <p className="text-white font-medium">₹{discountedPrice}</p>
                                {item.discounttype === 'Percentage' && (
                                  <span className="text-green-400 text-sm">{item.discountvalue}% off</span>
                                )}
                                {item.discounttype === 'Fixed' && (
                                  <span className="text-green-400 text-sm">₹{item.discountvalue} off</span>
                                )}
                              </div>
                            ) : (
                              <p className="text-white font-medium">₹{originalPrice}</p>
                            )}
                            
                            {isWater && (
                              <p className="text-green-400 text-sm">GST exempt</p>
                            )}
                          </div>
                          
                          {/* Date and time (using placeholders) */}
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

              {/* Pricing information with detailed breakdown */}
              {cartItems.length > 0 && (
                <div className="px-6 pb-20">
                  <div className="flex justify-between mb-4">
                    <span className="text-white text-lg">Original Total</span>
                    <span className="text-white text-lg font-medium">₹{originalTotal.toFixed(2)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between mb-4">
                      <span className="text-green-400 text-lg">Discount</span>
                      <span className="text-green-400 text-lg font-medium">- ₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between mb-4">
                    <span className="text-white text-lg">Subtotal</span>
                    <span className="text-white text-lg font-medium">₹{subtotalAfterDiscount.toFixed(2)}</span>
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
                    <span className="text-white text-xl font-medium">₹{finalTotal.toFixed(2)}</span>
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