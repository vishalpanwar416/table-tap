import React, { useEffect, useRef } from 'react';
import { X, Heart, ShoppingBag, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../config/CartContent';
import { useLikes } from '../../config/LikesContent';
import PriceDisplay from './PriceDisplay';
import { useMotionValue, useTransform } from 'framer-motion';

const OrderCard = ({ isOpen, onClose, item }) => {
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { toggleLike, likedItems } = useLikes();

  const isLiked = item ? likedItems.some(likedItem => likedItem.id === item.id) : false;
  const cartItem = item ? cartItems.find(i => i.id === item.id) : null;
  const quantity = cartItem?.quantity || 0;

  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 300], [0.5, 0]); // Fade out as you drag down

  // Lock scrolling when the order card is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleAddToCart = () => {
    if (item) {
      addToCart(item);
    }
  };

  const handleDecrementQuantity = () => {
    if (!item) return;
    
    if (quantity === 1) {
      removeItem(item.id, item.category);
    } else {
      updateQuantity(item.id, item.category, quantity - 1);
    }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          
          {/* Order Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'tween', 
              duration: 0.3, 
              ease: [0.25, 0.46, 0.45, 0.94] // Custom cubic-bezier for smooth animation
            }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-xl overflow-hidden max-h-[85vh] max-w-[450px] md:max-w-4xl mx-auto"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.3}
            style={{ y }}
            onDragEnd={(event, info) => {
              if (info.point.y > 150 || info.velocity.y > 800) { // More dynamic threshold
                onClose();
              }
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md z-10"
            >
              <X className="h-6 w-6 text-gray-800" />
            </button>
            
            {/* Image and like button */}
            <div className="relative w-full h-56 md:h-72">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <button
                className="absolute top-4 left-4 bg-white bg-opacity-70 rounded-full p-1.5 shadow-md hover:bg-opacity-100 transition-colors"
                onClick={() => toggleLike(item)}
              >
                <Heart
                  className={`h-6 w-6 ${
                    isLiked ? "text-red-500 fill-red-500" : "text-gray-500"
                  }`}
                />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 pb-24 overflow-y-auto " style={{ maxHeight: 'calc(85vh - 224px)' }}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                <PriceDisplay item={item} className="text-xl font-bold text-black" />
              </div>
              <p className="text-gray-600 mb-6">{item.description || "No description available."}</p>
              
              {/* Order Details Section */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Details</h3>
                
                {/* Price removed from here since it's now shown next to the name */}
                
                {item.preparationTime && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Preparation Time</span>
                    <span className="text-gray-900">{item.preparationTime}</span>
                  </div>
                )}
                
                {item.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Category</span>
                    <span className="text-gray-900 capitalize">{item.category}</span>
                  </div>
                )}
              </div>
              
              {/* Nutrition facts if available */}
              {item.nutritionFacts && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Nutrition Facts</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(item.nutritionFacts).map(([key, value]) => (
                      <div key={key} className="bg-gray-100 rounded-lg px-3 py-1">
                        <span className="text-gray-500 text-sm capitalize">{key}:</span>
                        <span className="text-gray-800 text-sm ml-1">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags if available */}
              {item.tags && item.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Details</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Add to cart button (fixed at bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex justify-between items-center">
              {quantity > 0 ? (
                <div className="flex items-center bg-black rounded-full w-full justify-between px-6 py-3">
                  <button
                    onClick={handleDecrementQuantity}
                    className="bg-white rounded-full h-8 w-8 flex items-center justify-center text-black"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-white text-lg font-medium">{quantity}</span>
                  <button
                    onClick={handleAddToCart}
                    className="bg-white rounded-full h-8 w-8 flex items-center justify-center text-black"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="bg-black hover:bg-gray-900 text-white rounded-full w-full py-3 flex items-center justify-center gap-2 text-lg font-medium transition-colors"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderCard;