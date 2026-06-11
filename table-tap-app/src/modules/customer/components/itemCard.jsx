import React, { useEffect, useState } from 'react';
import { Heart, ShoppingBag, Minus, Plus, Star, Clock, Flame, Tag } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useCart } from '../../shared/config/CartContent';
import { useLikes } from '../../shared/config/LikesContent';
import PriceDisplay from './PriceDisplay';
import FoodImageWithFallback from './FoodImageWithFallback';

const OrderCard = ({ isOpen, onClose, item }) => {
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { toggleLike, likedItems } = useLikes();
  const [isLikedAnimating, setIsLikedAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isLiked = item
    ? likedItems.some((likedItem) => String(likedItem.id) === String(item.id))
    : false;
  const cartItem = item ? cartItems.find((i) => String(i.id) === String(item.id)) : null;
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

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setIsLikedAnimating(true);
    toggleLike(item);
    setTimeout(() => setIsLikedAnimating(false), 600);
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Order Card */}
          <motion.div
            initial={{ y: '100%', scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: '100%', scale: 0.95, opacity: 0 }}
            transition={{
              type: 'spring',
              duration: 0.5,
              bounce: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-white via-gray-50 to-white rounded-t-[32px] z-50 shadow-2xl overflow-hidden max-h-[75vh] max-w-[450px] md:max-w-4xl mx-auto border border-gray-100"
            drag="y"
            dragConstraints={{ top: 0, bottom: 300 }}
            dragElastic={0.3}
            style={{ y }}
            onDragEnd={(event, info) => {
              // Only close if dragged down (positive y values)
              if (info.offset.y > 150 || (info.velocity.y > 800 && info.offset.y > 0)) {
                onClose();
              }
            }}
          >
            {/* REMOVE OR COMMENT OUT THE CROSS BUTTON */}
            {/* <button
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button> */}

            {/* Image and like button */}
            <div className="relative w-full h-64 md:h-80 overflow-hidden">
              {/* Loading skeleton */}
              {!imageLoaded && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <motion.div
                className="w-full h-full"
                initial={{ scale: 1.1 }}
                animate={{ scale: imageLoaded ? 1 : 1.1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <FoodImageWithFallback
                  src={item.image}
                  alt={item.name}
                  category={item.category}
                  itemName={item.name}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                />
              </motion.div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

              {/* Badge for popular items */}
              {item.tags?.includes('popular') && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
                  className="absolute top-4 right-16 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg"
                >
                  <Flame className="h-3 w-3" />
                  Popular
                </motion.div>
              )}

              {/* Rating badge */}
              {item.rating && (
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-gray-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg border border-gray-200/50"
                >
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {item.rating}
                </motion.div>
              )}

              {/* Enhanced like button */}
              <motion.button
                className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-full p-2.5 shadow-lg z-10 border border-gray-200/50"
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLikeClick}
              >
                <motion.div
                  animate={
                    isLikedAnimating
                      ? {
                          scale: [1, 1.4, 1],
                          rotate: [0, 15, -15, 0],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  <Heart
                    className={`h-6 w-6 transition-all duration-300 ${
                      isLiked
                        ? 'text-red-500 fill-red-500 drop-shadow-lg'
                        : 'text-gray-600 hover:text-red-400'
                    }`}
                  />
                </motion.div>
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-4 pb-24 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 320px)' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex justify-between items-start mb-2"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-0.5 leading-tight">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {item.preparationTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.preparationTime}</span>
                      </div>
                    )}
                    {item.category && (
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-xs capitalize">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex-shrink-0 ml-2"
                >
                  <PriceDisplay item={item} className="text-xl font-bold text-black" />
                </motion.div>
              </motion.div>

              {/* Order Details Section - compact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-white/40 backdrop-blur-md rounded-xl p-3 mb-4 border border-gray-200/50"
              >
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <div className="w-0.5 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full flex-shrink-0"></div>
                  Order Details
                </h3>

                <div className="space-y-2">
                  {/* Preparation Time */}
                  {item.preparationTime && (
                    <div className="flex justify-between items-center px-2.5 py-2 bg-white/70 rounded-lg">
                      <span className="flex items-center gap-1.5 text-gray-700 text-sm font-medium">
                        <Clock className="h-3 w-3 text-orange-500 flex-shrink-0" /> Preparation Time
                      </span>
                      <span className="text-gray-900 text-sm font-semibold">
                        {item.preparationTime}
                      </span>
                    </div>
                  )}
                  {/* Description (no label) */}
                  {item.description && (
                    <div className="px-2.5 py-2 bg-white/70 rounded-lg text-gray-600 text-xs leading-snug">
                      {item.description}
                    </div>
                  )}
                  {/* Category */}
                  {item.category && (
                    <div className="flex justify-between items-center px-2.5 py-2 bg-white/70 rounded-lg">
                      <span className="flex items-center gap-1.5 text-gray-700 text-sm font-medium">
                        <Tag className="h-3 w-3 text-purple-500 flex-shrink-0" /> Category
                      </span>
                      <span className="text-gray-900 text-sm font-semibold capitalize">
                        {item.category}
                      </span>
                    </div>
                  )}
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="px-2.5 py-2 bg-white/40 backdrop-blur-md rounded-lg">
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag, idx) => {
                          const tagLower = tag.toLowerCase();
                          let tagClass =
                            'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800';
                          if (tagLower === 'veg') {
                            tagClass = 'bg-green-100 text-green-700 border-green-200';
                          } else if (
                            tagLower === 'non veg' ||
                            tagLower === 'non-veg' ||
                            tagLower === 'nonvegetarian' ||
                            tagLower === 'non vegetarian'
                          ) {
                            tagClass = 'bg-red-100 text-red-700 border-red-200';
                          }
                          return (
                            <span
                              key={tag}
                              className={`text-[11px] font-medium px-2 py-1 rounded-full border ${tagClass}`}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Nutrition facts if available */}
              {item.nutritionFacts && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mb-4"
                >
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-green-500 to-blue-500 rounded-full flex-shrink-0"></div>
                    Nutrition Facts
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(item.nutritionFacts).map(([key, value]) => (
                      <motion.div
                        key={key}
                        className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg px-2.5 py-2 border border-green-200/50"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-gray-600 text-xs capitalize font-medium">{key}:</span>
                        <span className="text-gray-800 text-xs ml-1 font-semibold">{value}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tags if available */}
              {/* This block is removed as tags are now part of Order Details */}
            </div>

            {/* Add to cart button (fixed at bottom) */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-4"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {quantity > 0 ? (
                  <motion.div
                    key="quantity-controls"
                    className="flex items-center bg-gradient-to-r from-black via-gray-900 to-black text-white rounded-2xl w-full justify-between px-6 py-2.5 shadow-2xl"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, type: 'spring' }}
                  >
                    <motion.button
                      onClick={handleDecrementQuantity}
                      className="bg-white/20 backdrop-blur-sm rounded-full h-8 w-8 flex items-center justify-center text-white border border-white/30"
                      whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,255,255,0.3)' }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Minus className="h-4 w-4" />
                    </motion.button>
                    <motion.span
                      className="text-white text-lg font-bold"
                      key={quantity}
                      initial={{ scale: 1.3, y: -10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ duration: 0.3, type: 'spring' }}
                    >
                      {quantity}
                    </motion.span>
                    <motion.button
                      onClick={handleAddToCart}
                      className="bg-white/20 backdrop-blur-sm rounded-full h-8 w-8 flex items-center justify-center text-white border border-white/30"
                      whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,255,255,0.3)' }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="add-button"
                    onClick={handleAddToCart}
                    className="bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:via-black hover:to-gray-900 text-white rounded-2xl w-full py-2.5 flex items-center justify-center gap-2 text-base font-semibold shadow-2xl transition-all duration-300 group"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, type: 'spring' }}
                  >
                    <motion.div
                      className="flex-shrink-0"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </motion.div>
                    <span className="leading-none pt-0.5">Add to Cart</span>
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                    />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderCard;
