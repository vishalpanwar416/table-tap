import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ShoppingCart, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../shared/config/CartContent';
import { useNavigate } from 'react-router-dom';

const FloatingCartButton = ({ 
  toggleCart, 
  isCartOpen = false, 
  isSidebarOpen = false, 
  isNotificationOpen = false 
}) => {
  const { cartItems, calculateEffectivePrice } = useCart();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const [prevQuantity, setPrevQuantity] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const expandedPanelRef = useRef(null);
  
  // Calculate the detailed price breakdown
  const calculatePriceDetails = useCallback(() => {
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
  
  // Memoize calculations to prevent unnecessary recalculations
  const { totalQuantity, totalPrice, recentItems, priceDetails } = useMemo(() => {
    // Calculate the total quantity of items
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const priceDetails = calculatePriceDetails();
    
    // Get most recent items (limited to 2)
    const recentItems = [...cartItems]
      .sort((a, b) => {
        if (!a.addedAt || !b.addedAt) return 0;
        return new Date(b.addedAt) - new Date(a.addedAt);
      })
      .slice(0, 2);
      
    return { 
      totalQuantity, 
      totalPrice: priceDetails.finalTotal, 
      recentItems,
      priceDetails
    };
  }, [cartItems, calculatePriceDetails]);
  
  // Add event listener to close expanded panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isExpanded && 
        expandedPanelRef.current && 
        !expandedPanelRef.current.contains(event.target)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Add scroll lock when expanded panel is open
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    };
  }, [isExpanded]);
  
  // Check if new items were added to show animation
  useEffect(() => {
    // Skip animation on initial load when items already exist
    if (initialLoad) {
      setPrevQuantity(totalQuantity);
      setInitialLoad(false);
      return;
    }

    // Only show animation if quantity increases (something added)
    if (totalQuantity > prevQuantity) {
      setShowAddedAnimation(true);
      const timer = setTimeout(() => {
        setShowAddedAnimation(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    setPrevQuantity(totalQuantity);
  }, [totalQuantity, prevQuantity, initialLoad]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleCheckoutClick = useCallback(() => {
    if (isExpanded) {
      // If expanded panel is open, close it instead of opening cart
      setIsExpanded(false);
    } else {
      // If not expanded, open the cart sidebar
      toggleCart();
    }
  }, [toggleCart, isExpanded]);

  const handleExpandClick = useCallback((e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  const handleViewCartClick = useCallback((e) => {
    e.stopPropagation();
    toggleCart();
  }, [toggleCart]);

  const handleDirectCheckout = useCallback((e) => {
    e.stopPropagation();
    navigate('/order-confirmation');
  }, [navigate]);

  // Check if any sidebar is open
  const isAnySidebarOpen = isCartOpen || isSidebarOpen || isNotificationOpen;
  
  // Only continue rendering if there are items in the cart AND no sidebars are open
  if (cartItems.length === 0 || isAnySidebarOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-8 left-0 right-0 mx-auto z-40 flex flex-col items-center"
        style={{ maxWidth: "100%", width: "100%" }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          scale: showAddedAnimation ? [1, 1.05, 1] : 1,
          transition: { 
            type: 'spring', 
            stiffness: 500,
            damping: 20,
            scale: { duration: 0.3 }
          }
        }}
        exit={{ y: 100, opacity: 0, transition: { duration: 0.2 } }}
      >
        {/* Background overlay when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              style={{ touchAction: 'none' }}
            />
          )}
        </AnimatePresence>

        {/* Expanded panel showing recent items and price breakdown */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              ref={expandedPanelRef}
              className="bg-white rounded-2xl shadow-xl mb-3 p-4 z-50 relative"
              style={{ 
                width: "85%", 
                maxWidth: "350px",
                overflow: "hidden"
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: "auto", 
                opacity: 1,
                transition: {
                  duration: 0.2,
                  delayChildren: 0.05,
                  staggerChildren: 0.05
                }
              }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-black">Recent Items</h3>
                <span className="text-gray-500 text-sm">{totalQuantity} items</span>
              </div>
              
              {recentItems.map((item) => (
                <motion.div 
                  key={`${item.id}-${item.category}`}
                  className="flex items-center py-2 border-b border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden mr-3">
                    <img 
                      src={item.image || '/placeholder-image.jpg'} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-black">{item.name}</h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">Qty: {item.quantity}</span>
                      <span className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Price breakdown section */}
              <div className="mt-4 border-t border-gray-100 pt-3">
                <h3 className="font-bold text-black mb-2">Price Details</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Total</span>
                    <span className="font-medium">₹{priceDetails.originalTotal.toFixed(2)}</span>
                  </div>
                  
                  {priceDetails.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Discount</span>
                      <span className="text-green-600 font-medium">- ₹{priceDetails.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (5%)</span>
                    <span className="font-medium">₹{(priceDetails.cgst + priceDetails.sgst).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="font-bold text-black">Total</span>
                    <span className="font-bold text-black">₹{priceDetails.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <motion.button
                  className="flex items-center justify-center px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-black"
                  onClick={handleViewCartClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Cart
                </motion.button>
                
                <motion.button
                  className="flex items-center justify-center px-4 py-2 bg-black rounded-full text-sm font-medium text-white"
                  onClick={handleDirectCheckout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Checkout <ArrowRight className="ml-1 w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main cart button */}
        <motion.button
          onClick={handleCheckoutClick}
          className="flex items-center justify-between bg-black text-white px-6 py-4 rounded-full shadow-lg relative overflow-hidden z-50"
          style={{ 
            minWidth: '260px', 
            maxWidth: '85%',
            backgroundImage: 'linear-gradient(135deg, #000000, #1a1a1a)',
          }}
          whileHover={{ 
            scale: 1.03,
            boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
            transition: {
              type: "spring",
              stiffness: 500,
              damping: 8
            }
          }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Pulse animation for new items */}
          {showAddedAnimation && (
            <motion.div 
              className="absolute inset-0 bg-gray-500 rounded-full"
              animate={{ 
                opacity: [0, 0.2, 0],
                scale: [1, 1.5, 1.8]
              }}
              transition={{ duration: 0.8 }}
            />
          )}
          
          <div className="flex items-center">
            <div className="relative mr-3">
              <motion.div 
                className="bg-white rounded-full p-2"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-black" />
                ) : (
                  <ShoppingCart className="h-5 w-5 text-black" />
                )}
              </motion.div>
              <motion.span 
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                animate={showAddedAnimation ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {totalQuantity}
              </motion.span>
            </div>
            <span className="font-medium text-sm md:text-base">{totalQuantity} item{totalQuantity !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="ml-4 font-bold text-base md:text-lg flex items-center">
            ₹{totalPrice.toFixed(2)}
            <motion.button
              className="ml-2 bg-white bg-opacity-20 rounded-full p-1"
              onClick={handleExpandClick}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronUp 
                className="h-4 w-4 text-white" 
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </motion.button>
          </div>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(FloatingCartButton);