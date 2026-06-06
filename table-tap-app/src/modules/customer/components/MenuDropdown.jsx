// Enhanced MenuDropdown.jsx with improvements
import { ChevronUp, Heart, ShoppingBag, Star, Clock, Flame } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCart } from '../../shared/config/CartContent';
import { useLikes } from '../../shared/config/LikesContent';
import PriceDisplay from './PriceDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import { flushSync } from 'react-dom';
import React from 'react';
import FoodImageWithFallback from './FoodImageWithFallback';

// Enhanced MenuItem with skeleton loading
const MenuItem = React.memo(
  ({
    item,
    quantity,
    isLiked,
    onAddToCart,
    onUpdateQuantity,
    onToggleLike,
    index = 0,
    isLoading = false,
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isLikedAnimating, setIsLikedAnimating] = useState(false);

    const handleAddClick = useCallback(
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        requestAnimationFrame(() => onAddToCart(item));
      },
      [onAddToCart, item],
    );

    const handleIncrement = useCallback(
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        requestAnimationFrame(() => onAddToCart(item));
      },
      [onAddToCart, item],
    );

    const handleDecrement = useCallback(
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        requestAnimationFrame(() => onUpdateQuantity(item.id, item.category, quantity - 1));
      },
      [onUpdateQuantity, item.id, item.category, quantity],
    );

    const handleLikeClick = useCallback(
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsLikedAnimating(true);
        requestAnimationFrame(() => onToggleLike(item.id));
        setTimeout(() => setIsLikedAnimating(false), 600);
      },
      [onToggleLike, item.id],
    );

    // Discount tag component
    const DiscountTag = () => {
      if (!item.discounttype || !item.discountvalue) return null;

      return (
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
      );
    };

    // Skeleton loading state
    if (isLoading) {
      return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
          <div className="h-48 bg-gray-200"></div>
          <div className="p-5">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-12"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative"
        style={{ willChange: 'transform' }}
        initial={{ transform: 'translateY(25px) scale(0.9)' }}
        animate={{ transform: 'translateY(0px) scale(1)' }}
        whileHover={{ transform: 'translateY(-6px) scale(1.02)' }}
        transition={{
          delay: index * 0.06,
          duration: 0.7,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 pointer-events-none"></div>

          <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
            <FoodImageWithFallback
              src={item.image}
              alt={item.name}
              category={item.category}
              className="w-full h-full object-cover cursor-pointer"
            />
          </motion.div>

          {/* Enhanced like button */}
          <motion.button
            className="absolute top-3 left-3 z-20 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLikeClick}
            aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
          >
            <motion.div
              animate={
                isLikedAnimating
                  ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 10, -10, 0],
                    }
                  : {}
              }
              transition={{ duration: 0.6 }}
            >
              <Heart
                className={`h-5 w-5 transition-colors duration-200 ${
                  isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-400'
                }`}
              />
            </motion.div>
          </motion.button>

          {item.rating && (
            <motion.div
              className="absolute top-3 right-3 z-20 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-medium">{item.rating}</span>
            </motion.div>
          )}

          {item.prep_time && (
            <motion.div
              className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Clock className="h-3 w-3 text-gray-600" />
              <span className="text-gray-800 text-xs font-medium">{item.prep_time}</span>
            </motion.div>
          )}

          <div className="absolute bottom-3 right-3 z-20">
            <AnimatePresence mode="wait">
              {quantity > 0 ? (
                <motion.div
                  key="quantity-controls"
                  className="flex items-center bg-gradient-to-r from-black to-gray-800 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={handleDecrement}
                    className="text-white hover:text-orange-300 rounded-full w-7 h-7 flex items-center justify-center transition-colors font-bold"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    aria-label="Decrease quantity"
                  >
                    −
                  </motion.button>
                  <motion.span
                    className="text-white text-sm font-medium px-3 select-none"
                    role="status"
                    aria-live="polite"
                    key={quantity}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {quantity}
                  </motion.span>
                  <motion.button
                    onClick={handleIncrement}
                    className="text-white hover:text-green-300 rounded-full w-7 h-7 flex items-center justify-center transition-colors font-bold"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    aria-label="Increase quantity"
                  >
                    +
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="add-button"
                  onClick={handleAddClick}
                  className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-full px-3 py-1.5 shadow-lg transition-all duration-200 flex items-center space-x-2"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  aria-label={`Add ${item.name} to cart`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-sm font-medium">Add</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <motion.h4
              className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1"
              whileHover={{ color: '#f97316' }}
              transition={{ duration: 0.2 }}
            >
              {item.name}
            </motion.h4>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PriceDisplay
                item={item}
                className="text-xl font-bold text-gray-900 ml-2"
                percentageClass="bg-orange-100 text-orange-800"
              />
            </motion.div>
          </div>

          <motion.p
            className="text-gray-600 text-sm mb-3 line-clamp-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {item.description || 'Delicious food item'}
          </motion.p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {item.category && (
                <motion.span
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {item.category}
                </motion.span>
              )}
              {item.tags && item.tags.length > 0 && (
                <motion.span
                  className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {item.tags[0]}
                </motion.span>
              )}
            </div>
            <DiscountTag />
          </div>
        </div>
      </motion.div>
    );
  },
);

MenuItem.displayName = 'MenuItem';

// Removed search and filter functionality

// Enhanced infinite scroll hook with better performance
const useInfiniteScroll = (items, itemsPerPage = 8) => {
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef();
  const loadingRef = useRef();

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    const scheduleLoad = window.requestIdleCallback || ((cb) => setTimeout(cb, 16));

    scheduleLoad(
      () => {
        setVisibleCount((prev) => Math.min(prev + itemsPerPage, items.length));
        setIsLoading(false);
      },
      { timeout: 1000 },
    );
  }, [isLoading, hasMore, itemsPerPage, items.length]);

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [items, itemsPerPage]);

  useEffect(() => {
    const currentRef = loadingRef.current;
    if (!currentRef || !hasMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      },
    );

    observerRef.current.observe(currentRef);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore]);

  return {
    visibleItems,
    isLoading,
    hasMore,
    loadingRef,
  };
};

// Main MenuDropdown component with centered category and orange up arrow
export const MenuDropdown = ({
  menuOpen,
  handleCloseMenu,
  activeCategory,
  menuItems = [],
  error,
  refetch,
}) => {
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { likedItems, toggleLike } = useLikes();

  const { visibleItems, hasMore, loadingRef, isLoading } = useInfiniteScroll(menuItems, 8);

  const cartQuantities = useMemo(
    () => new Map(cartItems.map((item) => [item.id, item.quantity])),
    [cartItems],
  );

  const likedItemsSet = useMemo(() => new Set(likedItems.map((item) => item.id)), [likedItems]);

  const handleAddToCart = useCallback(
    (item) => {
      flushSync(() => addToCart(item));
    },
    [addToCart],
  );

  const handleUpdateQuantity = useCallback(
    (itemId, category, newQuantity) => {
      flushSync(() => {
        if (newQuantity <= 0) {
          removeItem(itemId, category);
        } else {
          updateQuantity(itemId, category, newQuantity);
        }
      });
    },
    [removeItem, updateQuantity],
  );

  const handleToggleLike = useCallback(
    (itemId) => {
      const item = menuItems.find((i) => i.id === itemId);
      if (item) {
        flushSync(() => toggleLike(item));
      }
    },
    [toggleLike, menuItems],
  );

  if (!menuOpen) return null;

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Sorry, we couldn't load the menu. Please check your connection and try again.</p>
        <button onClick={refetch} className="mt-2 px-4 py-2 bg-orange-500 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
          exit: { opacity: 0, y: 20, transition: { duration: 0.3, ease: 'easeIn' } },
        }}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full bg-gray-50 rounded-t-3xl shadow-2xl border-t border-gray-200 mt-6"
      >
        <main className="p-0  max-h-[70vh] overflow-y-auto">
          <header className="sticky top-0 z-30 p-4">
            {/* Blur with white to transparent gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 to-transparent backdrop-blur-xl"></div>

            <div className="flex justify-center items-center max-w-7xl mx-auto relative z-10">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                {activeCategory} Menu
              </h3>
              <button
                onClick={handleCloseMenu}
                className="absolute right-0 p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <ChevronUp className="h-6 w-6" />
              </button>
            </div>
          </header>
          {menuItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No items available</h3>
              <p className="mt-1 text-sm text-gray-500">Please try another category.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {visibleItems.map((item, index) => (
                  <MenuItem
                    key={`${activeCategory}-${item.id}`}
                    item={item}
                    quantity={cartQuantities.get(item.id) || 0}
                    isLiked={likedItemsSet.has(item.id)}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onToggleLike={handleToggleLike}
                    index={index}
                  />
                ))}
              </div>

              {hasMore && (
                <div ref={loadingRef} className="flex justify-center py-8">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                    <span>Loading more...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </motion.div>
    </AnimatePresence>
  );
};

// Simple divider component
export const Divider = () => (
  <div className="my-6 w-full mx-auto h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent shadow-sm"></div>
);
