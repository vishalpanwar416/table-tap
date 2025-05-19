import React, { useState, useEffect } from 'react';
import { ShoppingCart, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';

const FloatingCartButton = ({ toggleCart }) => {
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const [prevQuantity, setPrevQuantity] = useState(0);
  
  // Calculate the total price
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      let price = item.price;
      
      if (item.discountType === 'percentage') {
        price = item.price * (1 - item.discountValue/100);
      } else if (item.discountType === 'fixed') {
        price = item.price - item.discountValue;
      }
      
      return total + (price * item.quantity);
    }, 0);
  };

  // Calculate the total quantity of items
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = calculateTotal();
  
  // Check if new items were added to show animation
  useEffect(() => {
    if (totalQuantity > prevQuantity) {
      setShowAddedAnimation(true);
      const timer = setTimeout(() => {
        setShowAddedAnimation(false);
      }, 800); // Reduced from 1500ms to 800ms
      return () => clearTimeout(timer);
    }
    setPrevQuantity(totalQuantity);
  }, [totalQuantity, prevQuantity]);

  // Handle the checkout click
  const handleCheckoutClick = () => {
    toggleCart();
  };

  // Handle expand click
  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handle view cart click
  const handleViewCartClick = (e) => {
    e.stopPropagation();
    toggleCart();
  };

  // Handle checkout click
  const handleDirectCheckout = (e) => {
    e.stopPropagation();
    navigate('/checkout');
  };

  // Button animations
  const buttonVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 500, // Increased from 300
        damping: 20 // Reduced from 25
      }
    },
    exit: { 
      y: 100, 
      opacity: 0, 
      transition: { 
        duration: 0.2 // Reduced from 0.3
      } 
    },
    hover: {
      scale: 1.03,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
      transition: {
        type: "spring",
        stiffness: 500, // Increased from 400
        damping: 8 // Reduced from 10
      }
    },
    tap: {
      scale: 0.97
    },
    added: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.3 // Reduced from 0.5
      }
    }
  };

  const expandedVariants = {
    collapsed: { 
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.2 // Reduced from 0.3
      }
    },
    expanded: { 
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.2, // Reduced from 0.3
        delayChildren: 0.05, // Reduced from 0.1
        staggerChildren: 0.05 // Reduced from 0.1
      }
    }
  };

  const itemVariants = {
    collapsed: { opacity: 0, y: 10 },
    expanded: { opacity: 1, y: 0 }
  };

  // Only show the button if there are items in the cart
  if (cartItems.length === 0) {
    return null;
  }

  // Get most recent items (limited to 2)
  const recentItems = [...cartItems]
    .sort((a, b) => {
      if (!a.addedAt || !b.addedAt) return 0;
      return new Date(b.addedAt) - new Date(a.addedAt);
    })
    .slice(0, 2);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-8 left-0 right-0 mx-auto z-40 flex flex-col items-center"
        style={{ maxWidth: "100%", width: "100%" }}
        variants={buttonVariants}
        initial="hidden"
        animate={showAddedAnimation ? "added" : "visible"}
        exit="exit"
      >
        {/* Expanded panel showing recent items */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="bg-white rounded-2xl shadow-xl mb-3 p-4"
              style={{ 
                width: "85%", 
                maxWidth: "350px",
                overflow: "hidden"
              }}
              variants={expandedVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-black">Recent Items</h3>
                <span className="text-gray-500 text-sm">{totalQuantity} items</span>
              </div>
              
              {recentItems.map((item) => (
                <motion.div 
                  key={`${item.id}-${item.category}`}
                  className="flex items-center py-2 border-b border-gray-100"
                  variants={itemVariants}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden mr-3">
                    <img 
                      src={item.image || '/placeholder-image.jpg'} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
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
          className="flex items-center justify-between bg-black text-white px-6 py-4 rounded-full shadow-lg relative overflow-hidden"
          style={{ 
            minWidth: '260px', 
            maxWidth: '85%',
            backgroundImage: 'linear-gradient(135deg, #000000, #1a1a1a)',
          }}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {/* Pulse animation for new items */}
          {showAddedAnimation && (
            <motion.div 
              className="absolute inset-0 bg-green-500 rounded-full"
              animate={{ 
                opacity: [0, 0.2, 0],
                scale: [1, 1.5, 1.8]
              }}
              transition={{ duration: 0, repeat: 0 }} // Reduced from 1.5
            />
          )}
          
          <div className="flex items-center">
            <div className="relative mr-3">
              <motion.div 
                className="bg-white rounded-full p-2"
                animate={isExpanded ? { rotate: 180 } : { rotate: 0 }}
                transition={{ duration: 0.2 }} // Added faster transition
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-black" />
                ) : (
                  <ShoppingCart className="h-5 w-5 text-black" />
                )}
              </motion.div>
              <motion.span 
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                initial={{ scale: 1 }}
                animate={showAddedAnimation ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }} // Reduced from 0.5
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

export default FloatingCartButton;