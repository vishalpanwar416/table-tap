import React, { useState, useMemo, useCallback, memo, lazy } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../config/CartContent";
import { useLikes } from "../../config/LikesContent";
import OrderCard from './itemCard';
import { useRef } from "react";
import { LazyImage } from "../../utils/imageOptimization";

// Move FoodItem component outside to prevent recreation on every render
const FoodItem = memo(({ item, onItemClick, index = 0, cartQuantity = 0, isLiked = false, onAddToCart, onUpdateQuantity, onRemoveItem, onToggleLike }) => {
  const [isLikedAnimating, setIsLikedAnimating] = useState(false);
  
  const handleAddClick = useCallback(() => onAddToCart(item), [onAddToCart, item]);
  const handleIncrement = useCallback(() => onAddToCart(item), [onAddToCart, item]);
  const handleDecrement = useCallback(() => {
    if (cartQuantity === 1) {
      onRemoveItem(item.id, item.category);
    } else {
      onUpdateQuantity(item.id, item.category, cartQuantity - 1);
    }
  }, [cartQuantity, onRemoveItem, onUpdateQuantity, item.id, item.category]);

  const handleLikeClick = useCallback((e) => {
    e.stopPropagation();
    setIsLikedAnimating(true);
    onToggleLike(item);
    setTimeout(() => setIsLikedAnimating(false), 600);
  }, [onToggleLike, item]);

  // Helper for the discount tag
  const DiscountTag = () =>
    item.discounttype && item.discountvalue ? (
      <motion.span 
        className="text-[10px] bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {item.discounttype === 'Percentage'
          ? `${item.discountvalue}% OFF`
          : `₹${item.discountvalue} OFF`}
      </motion.span>
    ) : null;

  // Helper for the price display
  const discountedPrice = useMemo(() => {
    if (!item.discounttype || !item.discountvalue) return item.price;
    return item.discounttype === 'Percentage'
      ? (item.price - (item.price * (item.discountvalue / 100)))
      : Math.max(0, item.price - item.discountvalue);
  }, [item.price, item.discounttype, item.discountvalue]);

  return (
    <motion.div
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 min-w-[140px] max-w-[150px] flex flex-col relative"
      style={{ willChange: 'transform' }}
      initial={{ transform: 'translateY(25px) scale(0.9)' }}
      animate={{ transform: 'translateY(0px) scale(1)' }}
      whileHover={{ transform: 'translateY(-6px) scale(1.03)' }}
      transition={{
        delay: index * 0.06,
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <div className="relative h-28 overflow-hidden bg-gray-100">
        {/* Discount badge in top right with animation */}
        <motion.div
          className="absolute top-1 right-2 z-10"
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          whileHover={{ scale: 1.15, rotate: 5 }}
        >
          <DiscountTag />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <LazyImage
            src={item.image}
            alt={item.name}
            category={item.category}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onItemClick && onItemClick(item)}
          />
        </motion.div>
        
        {/* Enhanced like button */}
        <motion.button 
          className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-full p-1 z-10 shadow-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLikeClick}
        >
          <motion.div
            animate={isLikedAnimating ? { 
              scale: [1, 1.3, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            <Heart 
              className={`h-4 w-4 md:w-6 md:h-6 transition-colors duration-200 ${
                isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
            />
          </motion.div>
        </motion.button>
      </div>
      
      <div className="flex flex-col flex-1 justify-between py-1 px-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <motion.h4 
              className="text-xs font-bold text-gray-900 truncate"
              whileHover={{ color: '#f97316' }}
              transition={{ duration: 0.2 }}
            >
              {item.name}
            </motion.h4>
            <div className="flex items-center space-x-1">
              {item.discounttype && item.discountvalue ? (
                <>
                  <motion.span 
                    className="text-[10px] text-gray-400 line-through"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    ₹{Number(item.price).toFixed(0)}
                  </motion.span>
                  <motion.span 
                    className="text-sm font-bold text-orange-600"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    ₹{discountedPrice.toFixed(0)}
                  </motion.span>
                </>
              ) : (
                <motion.span 
                  className="text-sm font-bold text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  ₹{Number(item.price).toFixed(0)}
                </motion.span>
              )}
            </div>
          </div>
          <div className="ml-1">
            <AnimatePresence mode="wait">
              {cartQuantity > 0 ? (
                <motion.div 
                  key="quantity-controls"
                  className="flex items-center bg-gradient-to-r from-black to-gray-800 text-white rounded-full px-2 py-2 items-center shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={handleDecrement}
                    className="text-white px-1 text-xs hover:text-orange-300 transition-colors"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                  >
                    −
                  </motion.button>
                  <motion.span 
                    className="px-1 text-xs font-semibold"
                    key={cartQuantity}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {cartQuantity}
                  </motion.span>
                  <motion.button
                    onClick={handleIncrement}
                    className="text-white px-1 text-xs hover:text-green-300 transition-colors"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                  >
                    +
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="add-button"
                  onClick={handleAddClick}
                  className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-full px-2 py-2 flex items-center space-x-1 text-xs shadow-lg transition-all duration-200 items-center"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Add</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Removed the old DiscountTag from here */}
        {/* <div className="flex justify-end mt-1"><DiscountTag /></div> */}
      </div>
    </motion.div>
  );
});

FoodItem.displayName = 'FoodItem';

const BestSellers = ({ foodItems }) => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { likedItems, toggleLike } = useLikes();

  // Memoize cart quantities map to prevent unnecessary re-renders
  const cartQuantities = useMemo(() => 
    new Map(cartItems.map(item => [item.id, item.quantity])), 
    [cartItems]
  );
  
  // Memoize liked items set to prevent unnecessary re-renders
  const likedItemsSet = useMemo(() => 
    new Set(likedItems.map(item => item.id)), 
    [likedItems]
  );

  // Memoize callback functions to prevent child re-renders
  const handleAddToCart = useCallback((item) => {
    addToCart(item);
  }, [addToCart]);

  const handleUpdateQuantity = useCallback((itemId, category, newQuantity) => {
    updateQuantity(itemId, category, newQuantity);
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((itemId, category) => {
    removeItem(itemId, category);
  }, [removeItem]);

  const handleToggleLike = useCallback((item) => {
    toggleLike(item);
  }, [toggleLike]);

  const handleViewAll = () => {
    navigate('/best-sellers');
  };

  const handleOpenItemCard = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  };

  const handleCloseItemCard = () => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="mt-6 text-black">
      <div className="flex justify-between items-center mb-3 px-4">
        <h2 className="text-xl font-thick font-spartan-bold md:text-3xl">Best Seller</h2>
        <button 
          onClick={handleViewAll}
          className="text-orange-500 text-sm flex items-center md:text-xl hover:underline"
        >
          View All <span className="ml-1 md:text-xl">›</span>
        </button>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2 scroll-smooth px-4">
        {foodItems.map((item, index) => (
          <FoodItem 
            key={item.id}
            item={item}
            onItemClick={handleOpenItemCard}
            index={index}
            cartQuantity={cartQuantities.get(item.id) || 0}
            isLiked={likedItemsSet.has(item.id)}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onToggleLike={handleToggleLike}
          />
        ))}
      </div>
      <OrderCard isOpen={isOrderCardOpen} onClose={handleCloseItemCard} item={selectedItem} />
    </div>
  );
};

export default BestSellers;