// Enhanced MenuDropdown.jsx with improvements
import { ChevronUp, Heart, ShoppingBag, Star, Clock, Flame } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCart } from "../../config/CartContent";
import { useLikes } from "../../config/LikesContent";
import PriceDisplay from './PriceDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import { flushSync } from 'react-dom';
import React from 'react';
import SimpleFoodImage from './SimpleFoodImage';
import { LazyImage } from '../../utils/imageOptimization';
import FoodImageWithFallback from './FoodImageWithFallback';

// Enhanced MenuItem with skeleton loading
const MenuItem = React.memo(({ 
  item, 
  quantity, 
  isLiked, 
  onAddToCart, 
  onUpdateQuantity, 
  onToggleLike,
  index = 0,
  isLoading = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleAddClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    requestAnimationFrame(() => onAddToCart(item));
  }, [onAddToCart, item]);

  const handleIncrement = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    requestAnimationFrame(() => onAddToCart(item));
  }, [onAddToCart, item]);

  const handleDecrement = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    requestAnimationFrame(() => onUpdateQuantity(item.id, item.category, quantity - 1));
  }, [onUpdateQuantity, item.id, item.category, quantity]);

  const handleLikeClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    requestAnimationFrame(() => onToggleLike(item.id));
  }, [onToggleLike, item.id]);

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
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 will-change-transform"
      style={{ transform: 'translateZ(0)' }}
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 pointer-events-none"></div>
        
        <FoodImageWithFallback
          src={item.image}
          alt={item.name}
          category={item.category}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        
        <button
          className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 will-change-transform active:scale-95"
          onClick={handleLikeClick}
          aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          style={{ transform: 'translateZ(0)' }}
        >
          <Heart
            className={`h-5 w-5 transition-all duration-200 ${
              isLiked
                ? "text-red-500 fill-red-500 scale-110"
                : "text-gray-600 hover:text-red-500"
            }`}
          />
        </button>

        {item.rating && (
          <div className="absolute top-3 right-3 z-20 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-medium">{item.rating}</span>
          </div>
        )}

        {item.prep_time && (
          <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <Clock className="h-3 w-3 text-gray-600" />
            <span className="text-gray-800 text-xs font-medium">{item.prep_time}</span>
          </div>
        )}

        <div className="absolute bottom-3 right-3 z-20">
          {quantity > 0 ? (
            <div className="flex items-center bg-black backdrop-blur-sm rounded-full px-3 py-2 shadow-lg will-change-transform">
              <button
                onClick={handleDecrement}
                className="text-white hover:bg-white/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors font-bold active:scale-95 transform duration-100"
                aria-label="Decrease quantity"
                style={{ transform: 'translateZ(0)' }}
              >
                −
              </button>
              <span className="text-white text-sm font-medium px-3 select-none" role="status" aria-live="polite">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="text-white hover:bg-white/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors font-bold active:scale-95 transform duration-100"
                aria-label="Increase quantity"
                style={{ transform: 'translateZ(0)' }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              className="bg-black hover:bg-gray-800 text-white rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 active:scale-95 transform will-change-transform"
              aria-label={`Add ${item.name} to cart`}
              style={{ transform: 'translateZ(0)' }}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm font-medium">Add</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
            {item.name}
          </h4>
          <PriceDisplay
            item={item}
            className="text-xl font-bold text-gray-900 ml-2"
            percentageClass="bg-orange-100 text-orange-800"
          />
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description || "Delicious food item"}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {item.category && (
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                {item.category}
              </span>
            )}
            {item.tags && item.tags.length > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                {item.tags[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

MenuItem.displayName = 'MenuItem';

// Removed search and filter functionality

// Enhanced infinite scroll hook with better performance
const useInfiniteScroll = (items, itemsPerPage = 8) => {
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef();
  const loadingRef = useRef();

  const visibleItems = useMemo(() => 
    items.slice(0, visibleCount), 
    [items, visibleCount]
  );

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    const scheduleLoad = window.requestIdleCallback || ((cb) => setTimeout(cb, 16));
    
    scheduleLoad(() => {
      setVisibleCount(prev => Math.min(prev + itemsPerPage, items.length));
      setIsLoading(false);
    }, { timeout: 1000 });
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
        rootMargin: '100px'
      }
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
    loadingRef
  };
};

// Main MenuDropdown component with centered category and orange up arrow
export const MenuDropdown = ({ menuOpen, handleCloseMenu, activeCategory, menuItems = [], error, refetch }) => {
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { likedItems, toggleLike } = useLikes();
  
  const { visibleItems, hasMore, loadingRef, isLoading } = useInfiniteScroll(menuItems, 8);

  const cartQuantities = useMemo(() => 
    new Map(cartItems.map(item => [item.id, item.quantity])), 
    [cartItems]
  );
  
  const likedItemsSet = useMemo(() => 
    new Set(likedItems.map(item => item.id)), 
    [likedItems]
  );

  const handleAddToCart = useCallback((item) => {
    flushSync(() => addToCart(item));
  }, [addToCart]);

  const handleUpdateQuantity = useCallback((itemId, category, newQuantity) => {
    flushSync(() => {
      if (newQuantity <= 0) {
        removeItem(itemId, category);
      } else {
        updateQuantity(itemId, category, newQuantity);
      }
    });
  }, [removeItem, updateQuantity]);

  const handleToggleLike = useCallback((itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    if (item) {
      flushSync(() => toggleLike(item));
    }
  }, [toggleLike, menuItems]);

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
          visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
          exit: { opacity: 0, y: 20, transition: { duration: 0.3, ease: "easeIn" } }
        }}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full bg-gray-50 rounded-t-3xl shadow-2xl border-t border-gray-200 mt-6"
      >
        <header className="sticky top-0 bg-gray-50/95 backdrop-blur-lg z-30 p-4 border-b border-gray-200">
          <div className="flex justify-center items-center max-w-7xl mx-auto relative">
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

        <main className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
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