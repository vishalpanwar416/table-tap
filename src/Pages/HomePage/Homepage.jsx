import React, { useState, useRef, useEffect, useMemo, useCallback, memo, Suspense, lazy } from 'react';
import { ArrowRight, Heart, ShoppingBag, Star, Clock, Flame, X } from 'lucide-react';
import { useLikes } from '../../config/LikesContent';
import { MenuDropdown, Divider } from '../../components/customer/MenuDropdown';
import CategoryButtons from '../../components/customer/CategoryButtons';
import BestSellers from '../../components/customer/Bestseller';
import Header from '../../components/customer/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../config/CartContent';
import LogoutPopup from '../../components/auth/LogoutPopup';
import DynamicGreeting from '../../components/customer/Greetings';
import LikedItems from '../../components/customer/LikedItems';
import { useFoodData } from '../../context/FoodDataContext';
import FloatingCartButton from '../../components/customer/FloatingCartButton';
import Tags from '../../components/customer/Tags';
import { useRestaurant } from '../../Pages/Restaurantselection/RestaurantContext';
import { useScrollLock, useMultiScrollLock } from '../../hooks/useScrollLock';
import SearchResultsOverlay from '../../components/customer/SearchResultsOverlay';

// Enhanced lazy loading with preloading hints
const Maincarosel = lazy(() => import('../../components/customer/Maincarosel'), {
  suspense: true
});
const Sidebar = lazy(() => import('../../components/customer/Slidebar'), {
  suspense: true
});
const NotificationSidebar = lazy(() => import('../../components/customer/NotificationSlidebar'), {
  suspense: true
});
const CartSidebar = lazy(() => import('../../components/customer/CartSidebar'), {
  suspense: true
});
const OrderCard = lazy(() => import('../../components/customer/OrderCard'), {
  suspense: true
});
const RecommendationItems = lazy(() => import('../../components/customer/RecommendationItems'), {
  suspense: true
});

// Enhanced loading skeleton components with better UX
const CarouselSkeleton = memo(() => (
  <div className="relative pt-3 pb-3 mx-2 my-2">
    <div className="w-full h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
));

const SidebarSkeleton = memo(() => (
  <div className="fixed inset-0 z-50 bg-black/50">
    <div className="fixed left-0 top-0 h-full w-80 bg-white animate-pulse">
      <div className="p-4 space-y-4">
        <div className="h-6 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
));

// Optimized animation variants with reduced motion support
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { 
      duration: prefersReducedMotion() ? 0.1 : 0.3 
    } 
  },
  exit: { 
    opacity: 0, 
    transition: { 
      duration: prefersReducedMotion() ? 0.05 : 0.2 
    } 
  }
};

const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: { 
      duration: prefersReducedMotion() ? 0.1 : 0.4, 
      ease: "easeOut" 
    }
  }
};

const staggerItems = {
  animate: {
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.1
    }
  }
};

// Enhanced scroll management with intersection observer
const useScrollToCategory = (categoryButtonsRef) => {
  return useCallback((delay = 300) => {
    if (!categoryButtonsRef.current) return;
    
    const element = categoryButtonsRef.current;
    const rect = element.getBoundingClientRect();
    const headerHeight = 80;
    const viewportHeight = window.innerHeight;

    // Only scroll if element is not visible
    if (rect.top < headerHeight || rect.bottom > viewportHeight) {
      const scrollTop = window.pageYOffset + rect.top - headerHeight - 10;
      
      // Use smooth scroll with fallback
      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      } else {
        // Fallback for older browsers
        window.scrollTo(0, scrollTop);
      }
    }
  }, [categoryButtonsRef]);
};

// Memoized main component
const HomePage = memo(() => {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const { addToCart, cartItems, removeItem, updateQuantity } = useCart();
  
  // Use the global food data context (move this to the top)
  const { 
    bestSellerItems, 
    recommendedItems, 
    allFoodItems, 
    loading, 
    error, 
    retryLoadData,
    initializeData,
    currentRestaurantId
  } = useFoodData();
  
  // State management with useReducer for complex state
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Debounced search handler
  const searchTimeout = useRef();
  const handleSearch = useCallback((query) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchTerm(query);
    }, 250);
  }, []);
  const handleSearchClose = useCallback(() => {
    setSearchTerm('');
    setIsSearchActive(false);
  }, []);
  const [pendingOrderItem, setPendingOrderItem] = useState(null);
  
  // Filter all food items by search term
  const searchedItems = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return allFoodItems.filter(item =>
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }, [allFoodItems, searchTerm]);
  
  // Refs
  const categoryButtonsRef = useRef(null);
  const menuDropdownRef = useRef(null);
  const scrollRef = useRef(null);
  const searchBarContainerRef = useRef(null);
  const pendingItemRef = useRef(null);
  
  const scrollToCategory = useScrollToCategory(categoryButtonsRef);
  
  // Initialize data when restaurantId changes
  useEffect(() => {
    if (restaurantId && restaurantId !== currentRestaurantId) {
      initializeData(restaurantId);
    }
  }, [restaurantId, currentRestaurantId, initializeData]);

  // Constants
  const categories = useMemo(() => ['Snacks', 'Main Course', 'Beverages', 'Dessert', 'Offers'], []);

  // Memoized filtered menu items with debouncing
  const filteredMenuItems = useMemo(() => {
    if (!activeCategory || !allFoodItems.length) return [];
    return allFoodItems.filter(item => item.category === activeCategory);
  }, [allFoodItems, activeCategory]);

  // Optimized event handlers
  const toggles = useMemo(() => ({
    search: () => setIsSearchActive(prev => !prev),
    sidebar: () => setIsSidebarOpen(prev => !prev),
    cart: () => setIsCartOpen(prev => !prev),
    notifications: () => setIsNotificationOpen(prev => !prev)
  }), []);

  const handleCategoryClick = useCallback((category, event) => {
    if (activeCategory === category && menuOpen) {
      setMenuOpen(false);
      setActiveCategory('');
    } else {
      setActiveCategory(category);
      setMenuOpen(true);
      scrollToCategory();
    }
  }, [activeCategory, menuOpen, scrollToCategory]);
  
  const handleItemClick = useCallback((item) => {
    setPendingOrderItem(item);
    setIsSearchActive(false);
    if (menuOpen) setMenuOpen(false);
  }, [menuOpen]);

  const handleOverlayExit = useCallback(() => {
    if (pendingOrderItem) {
      setSelectedItem(pendingOrderItem);
      setIsOrderCardOpen(true);
      setPendingOrderItem(null);
    }
  }, [pendingOrderItem]);

  const handleScroll = useCallback((scrollOffset) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      container.scrollTo({
        left: container.scrollLeft + scrollOffset,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleCloseMenu = useCallback(() => setMenuOpen(false), []);
  const handleCloseOrderCard = useCallback(() => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  }, []);
  
  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLogoutOpen(false);
    setIsSidebarOpen(false);
    navigate('/login');
  }, [navigate]);

  // Enhanced click outside handler with performance optimization
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (!menuDropdownRef.current || !categoryButtonsRef.current) return;
      const isOutsideMenuDropdown = !menuDropdownRef.current.contains(event.target);
      const isOutsideCategoryButtons = !categoryButtonsRef.current.contains(event.target);

      if (isOutsideMenuDropdown && isOutsideCategoryButtons) {
        setMenuOpen(false);
        setActiveCategory('');
      }
    };

    // Use passive listener for better performance
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Custom backdrop click handler
  const handleBackdropClick = useCallback((e) => {
    if (e.target.closest('[data-searchbar-area]')) {
      // Clicked inside searchbar, do nothing
      return;
    }
    handleSearchClose();
  }, [handleSearchClose]);

  // Lock scroll when any sidebar is open
  useMultiScrollLock({
    cart: isCartOpen,
    sidebar: isSidebarOpen,
    notifications: isNotificationOpen
  });

  // Error boundary with retry mechanism
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black p-4">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">Unable to load menu data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Enhanced loading state with progressive loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading delicious menu...</p>
          <div className="mt-4 w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleSearchResultClick = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
    // Do NOT close the overlay here; only X button should close it
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Backdrop for searchbar close - only for homepage search */}
        {isSearchActive && (
          <div
            className="fixed left-0 right-0 bottom-0 top-16 z-40 bg-black/40 transition-opacity duration-300 pointer-events-auto"
            aria-hidden="true"
            onClick={handleBackdropClick}
          />
        )}
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl mx-auto relative overflow-visible flex-col"
        >
          {/* Modals and Sidebars with enhanced loading */}
          <LogoutPopup 
            isOpen={isLogoutOpen}
            onClose={() => setIsLogoutOpen(false)}
            onConfirm={handleLogout}
          />
          
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <Suspense fallback={<SidebarSkeleton />}>
                <Sidebar
                  isSidebarOpen={isSidebarOpen}
                  toggleSidebar={toggles.sidebar}
                  onLogout={() => setIsLogoutOpen(true)}
                />
              </Suspense>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isNotificationOpen && (
              <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
                <NotificationSidebar 
                  isOpen={isNotificationOpen}
                  onClose={toggles.notifications}
                />
              </Suspense>
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {isCartOpen && (
              <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
                <CartSidebar
                  isOpen={isCartOpen}
                  onClose={() => setIsCartOpen(false)}
                  cartItems={cartItems}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                />
              </Suspense>
            )}
          </AnimatePresence>
          
          {/* Order Card with error boundary */}
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
            <OrderCard 
              isOpen={isOrderCardOpen}
              onClose={handleCloseOrderCard}
              item={selectedItem}
            />
          </Suspense>

          {/* Header */}
          <div ref={searchBarContainerRef}>
            <Header 
              isSearchActive={isSearchActive}
              toggleSearch={toggles.search}
              toggleSidebar={toggles.sidebar}
              toggleNotifications={toggles.notifications}
              toggleCart={toggles.cart}
              cartItems={cartItems}
              showRestaurantInfo={true}
              className="mb-2 md:mb-3"
              onSearch={handleSearch}
              onSearchClose={handleSearchClose}
            />
          </div>

          {/* Overlay for search results */}
          <AnimatePresence onExitComplete={handleOverlayExit}>
            {isSearchActive && searchTerm.trim() && (
              <SearchResultsOverlay
                items={searchedItems}
                onItemClick={handleSearchResultClick}
                onRequestCloseOverlay={() => setIsSearchActive(false)}
                cartItems={cartItems}
                onAddToCart={addToCart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
              />
            )}
          </AnimatePresence>

          {/* Main Content with progressive loading */}
          <motion.div 
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className="flex-1 flex flex-col"
          >
            {/* Greeting */}
            <motion.div {...slideUp} className="px-0 text-white">
              <DynamicGreeting />
            </motion.div>

            {/* Carousel with enhanced loading */}
            <motion.div {...slideUp}>
              <Suspense fallback={<CarouselSkeleton />}>
                <div className="relative pt-3 pb-3 my-2">
                  <Maincarosel />
                </div>
              </Suspense>
            </motion.div>

            {/* Main Content Area with conditional rendering */}
            <motion.div {...slideUp} className="bg-white rounded-t-[30px] rounded-b-none py-4 flex-1 justify-center item-center">
              <CategoryButtons
                activeCategory={activeCategory}
                handleCategoryClick={handleCategoryClick}
                categoryButtonsRef={categoryButtonsRef}
                menuOpen={menuOpen}
              />

              {/* Menu Dropdown with optimized rendering */}
              <AnimatePresence mode="wait">
                {menuOpen && (
                  <MenuDropdown
                    menuOpen={menuOpen}
                    handleCloseMenu={handleCloseMenu}
                    activeCategory={activeCategory}
                    menuItems={filteredMenuItems}
                    categories={categories}
                    onCategoryChange={handleCategoryChange}
                    onItemClick={handleItemClick}
                  />
                )}
              </AnimatePresence>

              <Divider />

              {/* Content Sections - Only show when menu is closed with progressive loading */}
              {!menuOpen && (
                <>
                  <motion.div variants={staggerItems}>
                    <BestSellers 
                      foodItems={bestSellerItems} 
                      onAddToCart={addToCart} 
                      onItemClick={handleItemClick}
                    />
                  </motion.div>
                  
                  <Divider />

                  <LikedItems 
                    foodItems={allFoodItems} 
                    onItemClick={handleItemClick}
                  />

                  <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse mx-4" />}>
                    <motion.div>
                      <RecommendationItems
                        allFoodItems={recommendedItems}
                        onItemClick={handleItemClick}
                        scrollRef={scrollRef}
                        scroll={handleScroll}
                      />
                    </motion.div>
                  </Suspense>
                  
                  {allFoodItems.length > 0 && (
                    <motion.div variants={staggerItems}>
                      <Divider />
                      <Tags 
                        foodItems={allFoodItems} 
                        onItemClick={handleItemClick}
                      />
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        
        <FloatingCartButton 
          toggleCart={toggles.cart}
          isCartOpen={isCartOpen}
          isSidebarOpen={isSidebarOpen}
          isNotificationOpen={isNotificationOpen}
        />
      </div>
    </div>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;