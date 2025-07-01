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
import { 
  fetchFoodItems, 
  fetchBestSellerItems, 
  fetchRecommendedItems 
} from '../../api/foodData';
import FloatingCartButton from '../../components/customer/FloatingCartButton';
import Tags from '../../components/customer/Tags';
import { useRestaurant } from '../../Pages/Restaurantselection/RestaurantContext';

// Lazy load heavy components
const Maincarosel = lazy(() => import('../../components/customer/Maincarosel'));
const Sidebar = lazy(() => import('../../components/customer/Slidebar'));
const NotificationSidebar = lazy(() => import('../../components/customer/NotificationSlidebar'));
const CartSidebar = lazy(() => import('../../components/customer/CartSidebar'));
const OrderCard = lazy(() => import('../../components/customer/itemCard'));
const RecommendationItems = lazy(() => import('../../components/customer/RecommendationItems'));

// Loading skeleton components
const CarouselSkeleton = () => (
  <div className="relative pt-3 pb-3 mx-2 my-2">
    <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
  </div>
);

const SidebarSkeleton = () => (
  <div className="fixed inset-0 z-50 bg-black/50">
    <div className="fixed left-0 top-0 h-full w-80 bg-white animate-pulse">
      <div className="p-4 space-y-4">
        <div className="h-6 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const staggerItems = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Custom hook for scroll management
const useScrollToCategory = () => {
  const categoryButtonsRef = useRef(null);
  
  return useCallback((delay = 500) => {
    setTimeout(() => {
      if (categoryButtonsRef.current) {
        const element = categoryButtonsRef.current;
        const rect = element.getBoundingClientRect();
        const headerHeight = 80;

        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          const scrollTop = window.pageYOffset + rect.top - headerHeight - 10;
          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      }
    }, delay);
  }, []);
};

// Custom hook for data fetching with error handling
const useFoodData = (restaurantId) => {
  const [bestSellerItems, setBestSellerItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [allFoodItems, setAllFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Critical data first - parallel loading
        const [bestSellers, recommended] = await Promise.all([
          fetchBestSellerItems(restaurantId).catch(err => {
            console.warn('Failed to load best sellers:', err);
            return [];
          }),
          fetchRecommendedItems(restaurantId).catch(err => {
            console.warn('Failed to load recommendations:', err);
            return [];
          })
        ]);

        setBestSellerItems(bestSellers);
        setRecommendedItems(recommended);
        setLoading(false);

        // Background loading for full menu
        fetchFoodItems(restaurantId)
          .then(setAllFoodItems)
          .catch(err => {
            console.warn('Failed to load all food items:', err);
            setAllFoodItems([]);
          });

      } catch (error) {
        console.error('Critical data loading failed:', error);
        setError(error);
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantId]);

  return { bestSellerItems, recommendedItems, allFoodItems, loading, error };
};

export default function HomePage() {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const { addToCart, cartItems, removeItem, updateQuantity } = useCart();
  
  // State management
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  
  // Refs
  const categoryButtonsRef = useRef(null);
  const menuDropdownRef = useRef(null);
  const scrollRef = useRef(null);
  
  // Custom hooks
  const { bestSellerItems, recommendedItems, allFoodItems, loading, error } = useFoodData(restaurantId);
  const scrollToCategory = useScrollToCategory();
  
  // Constants
  const categories = useMemo(() => ['Snacks', 'Main Course', 'Beverages', 'Dessert', 'Offers'], []);

  // Memoized filtered menu items
  const filteredMenuItems = useMemo(() => {
    return allFoodItems.filter(item => item.category === activeCategory);
  }, [allFoodItems, activeCategory]);

  // Event handlers
  const toggles = useMemo(() => ({
    search: () => setIsSearchActive(prev => !prev),
    sidebar: () => setIsSidebarOpen(prev => !prev),
    cart: () => setIsCartOpen(prev => !prev),
    notifications: () => setIsNotificationOpen(prev => !prev)
  }), []);

  const handleCategoryClick = useCallback((category, event) => {
    if (activeCategory === category.name && menuOpen) {
      setMenuOpen(false);
      setActiveCategory('');
    } else {
      setActiveCategory(category.name);
      setMenuOpen(true);
      scrollToCategory();
    }
  }, [activeCategory, menuOpen, scrollToCategory]);
  
  const handleItemClick = useCallback((item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
    if (menuOpen) setMenuOpen(false);
  }, [menuOpen]);

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
  const handleCloseOrderCard = useCallback(() => setIsOrderCardOpen(false), []);
  
  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLogoutOpen(false);
    setIsSidebarOpen(false);
    navigate('/login');
  }, [navigate]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuOpen) return;

      const isOutsideMenuDropdown = menuDropdownRef.current && !menuDropdownRef.current.contains(event.target);
      const isOutsideCategoryButtons = categoryButtonsRef.current && !categoryButtonsRef.current.contains(event.target);

      if (isOutsideMenuDropdown && isOutsideCategoryButtons) {
        setMenuOpen(false);
        setActiveCategory('');
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Error boundary
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black p-4">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">Unable to load menu data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading delicious menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-black p-4">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl mx-auto relative overflow-visible flex-col"
        >
          {/* Modals and Sidebars */}
          <LogoutPopup 
            isOpen={isLogoutOpen}
            onClose={() => setIsLogoutOpen(false)}
            onConfirm={handleLogout}
          />
          
          <AnimatePresence>
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

          <AnimatePresence>
            {isNotificationOpen && (
              <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
                <NotificationSidebar 
                  isOpen={isNotificationOpen}
                  onClose={toggles.notifications}
                />
              </Suspense>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
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
          
          {/* Order Card */}
          <Suspense fallback={null}>
            <OrderCard 
              isOpen={isOrderCardOpen}
              onClose={handleCloseOrderCard}
              item={selectedItem}
            />
          </Suspense>

          {/* Header */}
          <Header 
            isSearchActive={isSearchActive}
            toggleSearch={toggles.search}
            toggleSidebar={toggles.sidebar}
            toggleNotifications={toggles.notifications}
            toggleCart={toggles.cart}
            cartItems={cartItems}
            className="mb-2 md:mb-3"
          />

          {/* Main Content */}
          <motion.div 
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className="flex-1 flex flex-col"
          >
            {/* Greeting */}
            <motion.div {...slideUp} className="px-4 text-white">
              <DynamicGreeting />
            </motion.div>

            {/* Carousel */}
            <motion.div {...slideUp}>
              <Suspense fallback={<CarouselSkeleton />}>
                <div className="relative pt-3 pb-3 mx-2 my-2">
                  <Maincarosel />
                </div>
              </Suspense>
            </motion.div>

            {/* Main Content Area */}
            <motion.div {...slideUp} className="bg-white rounded-t-[30px] rounded-b-none py-6 pb-2 flex-1 justify-center item-center">
              <CategoryButtons
                activeCategory={activeCategory}
                handleCategoryClick={handleCategoryClick}
                categoryButtonsRef={categoryButtonsRef}
                menuOpen={menuOpen}
              />

              {/* Menu Dropdown */}
              <AnimatePresence>
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

              {/* Content Sections - Only show when menu is closed */}
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
        
        <FloatingCartButton toggleCart={toggles.cart} />
      </div>
    </div>
  );
}