import React, { useMemo, useCallback, useEffect, useState, lazy, Suspense, memo, useRef } from "react";
import { ShoppingBag, Heart, ArrowLeft, Filter, Star, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../config/CartContent";
import { useLikes } from "../../config/LikesContent";
import { useRestaurant } from "../../Pages/Restaurantselection/RestaurantContext";
import { fetchBestSellerItems } from "../../api/foodData";
import { useNavigate } from 'react-router-dom';
import FoodImageWithFallback from '../../components/customer/FoodImageWithFallback';
import { useScrollLock, useMultiScrollLock } from '../../hooks/useScrollLock';

// Lazy load components for better performance
const Header = lazy(() => import('../../components/customer/Header'));
const Sidebar = lazy(() => import('../../components/customer/Slidebar'));
const CartSidebar = lazy(() => import('../../components/customer/CartSidebar'));
const NotificationSidebar = lazy(() => import('../../components/customer/NotificationSlidebar'));
const LogoutPopup = lazy(() => import('../../components/auth/LogoutPopup'));
const OrderCard = lazy(() => import('../../components/customer/itemCard'));
const FloatingCartButton = lazy(() => import('../../components/customer/FloatingCartButton'));

// Enhanced loading skeletons
const HeaderSkeleton = memo(() => (
  <div className="bg-black p-4 mb-2 md:mb-3">
    <div className="flex items-center justify-between">
      <div className="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
      <div className="flex space-x-2">
        <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
));

const ItemSkeleton = memo(() => (
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
));

// Progressive Image Component (same as MenuDropdown)
const ProgressiveImage = ({ src, alt, className, placeholderColor = '#f3f4f6', delay = 0, priority = false }) => {
  const [imageState, setImageState] = useState('waiting');
  const [imageSrc, setImageSrc] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef();
  const observerRef = useRef();
  const timeoutRef = useRef();
  const isUnmountedRef = useRef(false);

  const loadImage = useCallback((src, retry = false) => {
    if (retry) setRetryCount(prev => prev + 1);
    
    const img = new Image();
    img.onload = () => {
      if (!isUnmountedRef.current) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setImageSrc(src);
            setImageState('loaded');
          });
        });
      }
    };

    img.onerror = () => {
      if (!isUnmountedRef.current && retryCount < 2) {
        setTimeout(() => loadImage(src, true), 1000 * (retryCount + 1));
      } else if (!isUnmountedRef.current) {
        setImageState('error');
      }
    };
    
    img.loading = priority ? 'eager' : 'lazy';
    img.src = src;
  }, [retryCount]);

  useEffect(() => {
    isUnmountedRef.current = false;
    
    if (priority) {
      setImageState('loading');
      loadImage(src);
      return;
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!imgRef.current || isUnmountedRef.current) return;

      setImageState('loading');
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isUnmountedRef.current) {
            loadImage(src);
            observer.disconnect();
          }
        },
        { 
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
        observerRef.current = observer;
      }
    }, delay);

    return () => {
      isUnmountedRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [src, delay, priority, loadImage]);

  return (
    <div ref={imgRef} className={`${className} relative overflow-hidden`}>
      {(imageState === 'waiting' || imageState === 'loading') && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: placeholderColor }}
        >
          <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
        </div>
      )}
      
      {imageState === 'loaded' && (
        <img
          src={imageSrc}
          alt={alt}
          className={`${className} absolute inset-0 transition-opacity duration-500 will-change-transform`}
          loading="lazy"
          decoding="async"
          style={{ 
    opacity: 1, 
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        />
      )}
    </div>
  );
};

// Price Display Component (same as MenuDropdown)
const PriceDisplay = ({ item }) => {
  const discountedPrice = useMemo(() => {
    if (!item.discounttype || !item.discountvalue) return item.price;
    return item.discounttype === 'Percentage'
      ? (item.price - (item.price * (item.discountvalue / 100)))
      : Math.max(0, item.price - item.discountvalue);
  }, [item.price, item.discounttype, item.discountvalue]);

  return (
    <div className="flex items-center space-x-1 mt-0.5">
      {item.discounttype && item.discountvalue ? (
        <>
          <span className="text-[10px] text-gray-400 line-through">
            ₹{Number(item.price).toFixed(0)}
          </span>
          <span className="text-sm font-bold text-orange-600">
            ₹{discountedPrice.toFixed(0)}
          </span>
          <span className="text-[9px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
            {item.discounttype === 'Percentage'
              ? `${item.discountvalue}% OFF`
              : `₹${item.discountvalue} OFF`}
          </span>
        </>
      ) : (
        <span className="text-sm font-bold text-gray-900">
          ₹{Number(item.price).toFixed(0)}
        </span>
      )}
    </div>
  );
};

// Enhanced BestSeller Item Component matching MenuDropdown style
const BestSellerItem = memo(({ item, onItemClick, index = 0 }) => {
  const { toggleLike, likedItems } = useLikes();
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const [isLikedAnimating, setIsLikedAnimating] = useState(false);
  
  const cartItem = useMemo(() => cartItems.find(i => i.id === item.id), [cartItems, item.id]);
  const quantity = cartItem?.quantity || 0;
  const isLiked = useMemo(() => likedItems.some(likedItem => likedItem.id === item.id), [likedItems, item.id]);

  const handleAddClick = useCallback(() => addToCart(item), [addToCart, item]);
  const handleIncrement = useCallback(() => addToCart(item), [addToCart, item]);
  const handleDecrement = useCallback(() => {
    if (quantity === 1) {
      removeItem(item.id, item.category);
    } else {
      updateQuantity(item.id, item.category, quantity - 1);
    }
  }, [quantity, removeItem, updateQuantity, item.id, item.category]);

  const handleLikeClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLikedAnimating(true);
    requestAnimationFrame(() => toggleLike(item));
    setTimeout(() => setIsLikedAnimating(false), 600);
  }, [toggleLike, item]);

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
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 pointer-events-none"></div>
        
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <FoodImageWithFallback
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover cursor-pointer"
            category={item.category}
            itemName={item.name}
            onClick={() => onItemClick && onItemClick(item)}
            loading="lazy"
          />
        </motion.div>
        
        {/* Enhanced like button */}
        <motion.button 
          className="absolute top-3 left-3 z-20 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLikeClick}
          aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
        >
          <motion.div
            animate={isLikedAnimating ? { 
              scale: [1, 1.3, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            <Heart
              className={`h-5 w-5 transition-colors duration-200 ${
                isLiked
                  ? "text-red-500 fill-red-500"
                  : "text-gray-600 hover:text-red-400"
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
                className="flex items-center bg-gradient-to-r from-black to-gray-800 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg"
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
                className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-full px-4 py-2 shadow-lg transition-all duration-200 flex items-center space-x-2"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
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
            <PriceDisplay item={item} />
          </motion.div>
        </div>
        
        <motion.p 
          className="text-gray-600 text-sm mb-3 line-clamp-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {item.description}
        </motion.p>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 2).map((tag, tagIndex) => (
              <motion.span
                key={tag}
                className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-200"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + tagIndex * 0.1 }}
              >
                {tag}
              </motion.span>
            ))}
            {item.tags.length > 2 && (
              <motion.span 
                className="text-gray-500 text-xs font-medium px-2.5 py-1"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                +{item.tags.length - 2}
              </motion.span>
            )}
          </div>
        )}
        
        <div className="flex justify-end mt-2">
          <DiscountTag />
        </div>
      </div>
    </motion.div>
  );
});

BestSellerItem.displayName = 'BestSellerItem';

// Optimized animation variants
const pageVariants = {
  initial: { 
    opacity: 0,
    y: 20
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.1 : 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: {
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.05 : 0.2,
      ease: "easeIn"
    }
  }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.05
    }
  }
};

// Debounce utility
function useDebouncedCallback(callback, delay) {
  const timeoutRef = useRef();
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

// Enhanced BestSeller Page
const BestSellerPage = memo(() => {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const { cartItems } = useCart();
  const containerRef = useRef(null);

  // State management
  const [bestSellerItems, setBestSellerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [searchTerm, setSearchTerm] = useState(''); // Search state

  // Debounced search callback
  const debouncedSetSearchTerm = useDebouncedCallback((query) => {
    setSearchTerm(query);
  }, 250);

  // Real-time search handler (debounced)
  const handleSearch = useCallback((query) => {
    debouncedSetSearchTerm(query);
  }, [debouncedSetSearchTerm]);

  // Clear search when search is closed
  const handleSearchClose = useCallback(() => {
    setSearchTerm('');
    setIsSearchActive(false);
  }, []);

  const closeSearch = useCallback(() => setIsSearchActive(false), []);
  const openSearch = useCallback(() => setIsSearchActive(true), []);

  // Enhanced data fetching with caching
  useEffect(() => {
    if (!restaurantId) return;

    const loadBestSellers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check cache first
        const cacheKey = `bestsellers_${restaurantId}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 min cache
            setBestSellerItems(data);
            setLoading(false);
            return;
          }
        }

        const data = await fetchBestSellerItems(restaurantId);
        setBestSellerItems(data);
        
        // Cache the data
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error loading best sellers:', error);
        setError('Failed to load best sellers. Please try again.');
        setBestSellerItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadBestSellers();
  }, [restaurantId]);

  // Optimized event handlers
  const toggles = useMemo(() => ({
    sidebar: () => setIsSidebarOpen(prev => !prev),
    cart: () => setIsCartOpen(prev => !prev),
    search: () => setIsSearchActive(prev => !prev),
    notification: () => setIsNotificationOpen(prev => !prev),
  }), []);

  const handleOpenItemCard = useCallback((item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  }, []);

  const handleCloseItemCard = useCallback(() => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLogoutOpen(false);
    setIsSidebarOpen(false);
    navigate('/login');
  }, [navigate]);

  // Updated filteredAndSortedItems with real-time search
  const filteredAndSortedItems = useMemo(() => {
    let items = bestSellerItems;

    // Apply real-time search filter
    if (searchTerm.trim()) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Then apply sorting
    switch (sortBy) {
      case 'price-low':
        return items.sort((a, b) => a.price - b.price);
      case 'price-high':
        return items.sort((a, b) => b.price - a.price);
      case 'name':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case 'rating':
        return items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default: // popularity
        return items;
    }
  }, [bestSellerItems, searchTerm, sortBy]);

  // Lock scroll when cart is open
  useMultiScrollLock({
    cart: isCartOpen,
    sidebar: isSidebarOpen,
    notifications: isNotificationOpen
  });

  // Loading state with enhanced UX
  if (loading) {
    return (
      <motion.div 
        className="flex justify-center items-center min-h-screen bg-black p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center text-white">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-orange-300 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDelay: '-0.5s' }}></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Best Sellers</h2>
          <p className="text-gray-400">Discovering our most popular dishes...</p>
          <div className="mt-6 w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div 
        className="flex justify-center items-center min-h-screen bg-black p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex justify-center items-start min-h-screen bg-black p-4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        
        {/* Modals and Sidebars */}
        <Suspense fallback={null}>
      <LogoutPopup 
          isOpen={isLogoutOpen}
          onClose={() => setIsLogoutOpen(false)}
            onConfirm={handleLogout}
          />
        </Suspense>
        
        {/* Header with real-time search */}
        <Suspense fallback={<HeaderSkeleton />}>
          <Header 
            isSearchActive={isSearchActive}
            toggleSearch={isSearchActive ? closeSearch : openSearch}
            onSearch={handleSearch}
            onSearchClose={handleSearchClose}
            cartItems={cartItems}
            showRestaurantInfo={false} // Hide restaurant info on best seller page
            className="mb-2 md:mb-3"
          />
        </Suspense>

        {/* Back Button */}
        <motion.button 
          className="absolute left-4 top-7 md:left-8 md:top-8 text-orange-500 hover:text-orange-600 transition-colors z-10"
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={30} className="md:w-8 md:h-8" />
        </motion.button>

        {/* Sidebars */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
        <Sidebar
          isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggles.sidebar}
          onLogout={() => setIsLogoutOpen(true)}
        />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isCartOpen && (
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
        <CartSidebar
          isOpen={isCartOpen}
                onClose={toggles.cart}
          cartItems={cartItems}
        />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isNotificationOpen && (
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
           <NotificationSidebar 
             isOpen={isNotificationOpen}
                onClose={toggles.notification}
            />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Page Title */}
        <motion.div 
          className="pt-4 md:pt-6 pb-4 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-4xl text-center text-white font-spartan-medium">
            Best Sellers
          </h1>
          <p className="text-center text-gray-400 mt-2 text-sm md:text-base">
            Our most loved dishes by customers
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          ref={containerRef}
          className="bg-white rounded-3xl p-4 md:p-6 flex-1 flex flex-col min-h-[calc(100vh-200px)] overflow-y-auto shadow-xl"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          {/* Sort Options */}
          <motion.div 
            className="mb-4 flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Sort by:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </motion.div>

          {/* Real-time Results Count */}
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <p className="text-gray-600 text-sm">
              {searchTerm ? (
                <>
                  {filteredAndSortedItems.length} result{filteredAndSortedItems.length !== 1 ? 's' : ''} for "{searchTerm}"
                </>
              ) : (
                <>
                  {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? 's' : ''} found
                </>
              )}
            </p>
          </motion.div>
          
          {/* Items Grid - Matching MenuDropdown style */}
          {filteredAndSortedItems.length > 0 ? (
          <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
              {filteredAndSortedItems.map((item, index) => (
              <motion.div 
                key={item.id} 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
              >
                  <BestSellerItem 
                    item={item} 
                    index={index}
                    onItemClick={handleOpenItemCard}
                  />
              </motion.div>
            ))}
          </motion.div>
          ) : (
            <motion.div 
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Star className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No items found</h3>
              <p className="text-gray-600 text-center text-sm">
                No best sellers available at the moment.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Floating Cart Button */}
      <Suspense fallback={null}>
        <FloatingCartButton 
          toggleCart={toggles.cart}
          isCartOpen={isCartOpen}
          isSidebarOpen={isSidebarOpen}
          isNotificationOpen={isNotificationOpen}
        />
      </Suspense>

      {/* Order Card */}
      <Suspense fallback={null}>
        <OrderCard 
          isOpen={isOrderCardOpen} 
          onClose={handleCloseItemCard} 
          item={selectedItem} 
        />
      </Suspense>
    </motion.div>
  );
});

BestSellerPage.displayName = 'BestSellerPage';

export default BestSellerPage;