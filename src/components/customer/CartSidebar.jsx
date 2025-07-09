import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeItem, calculateEffectivePrice } = useCart();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Swipe detection
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50; // Minimum swipe distance
    const swipeDistance = touchEndX.current - touchStartX.current;
    
    // If swiped right (positive distance) and distance is significant
    if (swipeDistance > swipeThreshold) {
      onClose();
    }
  }, [onClose]);

  // Add keyboard support for escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Memoize price calculations to prevent unnecessary recalculations
  const priceDetails = useMemo(() => {
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
        calculateEffectivePrice(item);
      
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
  }, [cartItems, calculateEffectivePrice]);

  const { 
    originalTotal, 
    discountAmount, 
    subtotalAfterDiscount, 
    cgst, 
    sgst, 
    finalTotal 
  } = priceDetails;
  
  // Memoize event handlers
  const handleCheckout = useCallback(() => {
    onClose();
    navigate('/order-confirmation');
  }, [onClose, navigate]);

  const handleQuantityUpdate = useCallback((itemId, category, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId, category);
    } else {
      updateQuantity(itemId, category, newQuantity);
    }
  }, [removeItem, updateQuantity]);

  const slideVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { 
      x: '100%', 
      opacity: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 40,
        duration: 0.4
      } 
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.3,
        ease: 'easeOut'
      } 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            ref={sidebarRef}
            key="cart-content"
            className="fixed top-0 right-0 h-full w-full md:w-8/12 lg:w-7/10 z-50 overflow-hidden rounded-tl-[80px] rounded-bl-[80px]"
            style={{ maxWidth: '70%' }}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Enhanced glassy background with multiple layers */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
            
            {/* Glass effect layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent"></div>
            
            {/* Additional glass highlights */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            {/* Border glow effect */}
            <div className="absolute inset-0 rounded-tl-[80px] rounded-bl-[80px] border border-white/20 shadow-2xl"></div>
            
            {/* Inner glass border */}
            <div className="absolute inset-1 rounded-tl-[75px] rounded-bl-[75px] border border-white/10"></div>
            
            {/* Main content */}
            <div className="relative h-full flex flex-col">
              {/* Header with enhanced glass effect */}
              <div className="flex justify-center items-center pt-8 pb-4">
                <div className="bg-white/30 backdrop-blur-md rounded-full p-3 mr-3 border border-white/30 shadow-xl">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Cart</h2>
              </div>

              <div className="border-t border-white/30 w-full my-4"></div>

              {/* Cart items count */}
              <div className="px-6 mb-4">
                <h3 className="text-white text-sm drop-shadow-sm whitespace-nowrap text-center">
                  You have {cartItems.length} items in the cart
                </h3>
              </div>

              {/* Cart items list */}
              <div className="flex-1 overflow-y-auto px-6">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center mt-8">
                    <p className="text-white/70 text-center mb-4 drop-shadow-sm">Your cart is empty</p>
                    <button
                      onClick={onClose}
                      className="bg-white/30 backdrop-blur-md text-white rounded-full w-12 h-12 flex items-center justify-center text-3xl shadow-xl hover:bg-white/40 transition-all border border-white/30"
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
                      Number(calculateEffectivePrice(item)).toFixed(2);
                    
                    return (
                      <div key={`${item.id}-${item.category}`}>
                        <div className="flex items-start mb-4 p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all shadow-lg">
                          {/* Item image with glass effect */}
                          <div className="w-24 h-24 overflow-hidden rounded-lg mr-4 border border-white/30 shadow-xl">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          
                          {/* Item details */}
                          <div className="flex-1">
                            <h3 className="text-white font-medium text-lg drop-shadow-sm">{item.name}</h3>
                            
                            {/* Price display with discounts if available */}
                            {hasDiscount ? (
                              <div>
                                <p className="text-white/60 text-sm line-through drop-shadow-sm">₹{originalPrice}</p>
                                <p className="text-white font-medium drop-shadow-sm">₹{discountedPrice}</p>
                                {item.discounttype === 'Percentage' && (
                                  <span className="text-green-300 text-sm drop-shadow-sm">{item.discountvalue}% off</span>
                                )}
                                {item.discounttype === 'Fixed' && (
                                  <span className="text-green-300 text-sm drop-shadow-sm">₹{item.discountvalue} off</span>
                                )}
                              </div>
                            ) : (
                              <p className="text-white font-medium drop-shadow-sm">₹{originalPrice}</p>
                            )}
                            
                            {isWater && (
                              <p className="text-green-300 text-sm drop-shadow-sm">GST exempt</p>
                            )}
                          </div>
                          
                          {/* Quantity controls with enhanced glass effect */}
                          <div className="text-right">
                            <div className="flex items-center justify-end mt-2">
                              <button 
                                onClick={() => handleQuantityUpdate(item.id, item.category, item.quantity - 1)}
                                className="bg-white/30 backdrop-blur-md border border-white/40 rounded-full w-6 h-6 flex items-center justify-center hover:bg-white/40 transition-all shadow-lg"
                                aria-label={`Decrease ${item.name} quantity`}
                              >
                                <Minus className="h-3 w-3 text-white" />
                              </button>
                              <span className="mx-2 text-white font-medium drop-shadow-sm">{item.quantity}</span>
                              <button 
                                onClick={() => handleQuantityUpdate(item.id, item.category, item.quantity + 1)}
                                className="bg-white/30 backdrop-blur-md border border-white/40 rounded-full w-6 h-6 flex items-center justify-center hover:bg-white/40 transition-all shadow-lg"
                                aria-label={`Increase ${item.name} quantity`}
                              >
                                <Plus className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Divider with glass effect */}
                        <div className="border-t border-white/30 w-full my-4"></div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pricing information with enhanced glass effect */}
              {cartItems.length > 0 && (
                <div className="px-6 pb-4">
                  {/* Enhanced glassy pricing display */}
                  <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-lg p-4 mb-3 shadow-2xl">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Original</span>
                        <span className="text-white">₹{originalTotal.toFixed(2)}</span>
                      </div>
                      
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-green-300">Discount</span>
                          <span className="text-green-300">- ₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Subtotal</span>
                        <span className="text-white">₹{subtotalAfterDiscount.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-white/50">
                        <span>CGST + SGST (5%)</span>
                        <span>₹{(cgst + sgst).toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t border-white/30 my-1"></div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-white font-bold">₹{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Checkout button with enhanced glass effect */}
                  <div className="w-full flex justify-center">
                    <button 
                      className="bg-gray-600 text-white font-medium py-3 px-12 rounded-full text-lg hover:bg-gray-700 transition-all shadow-xl hover:shadow-2xl"
                      onClick={handleCheckout}
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            key="cart-overlay"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
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