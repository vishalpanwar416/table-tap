import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Maincarosel from '../../components/customer/Maincarosel';
import { MenuDropdown, Divider } from '../../components/customer/MenuDropdown';
import RecommendationItem from '../../components/customer/RecommendationItems';
import CategoryButtons from '../../components/customer/CategoryButtons';
import BestSellers from '../../components/customer/Bestseller';
import Header from '../../components/customer/Header';
import Sidebar from '../../components/customer/Slidebar';
import NotificationSidebar from '../../components/customer/NotificationSlidebar';  
import CartSidebar from '../../components/customer/CartSidebar';
import OrderCard from '../../components/customer/itemCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../config/CartContent';
import LogoutPopup from '../../components/auth/LogoutPopup';
import DynamicGreeting from '../../components/customer/Greetings';
import LikedItems from '../../components/customer/LikedItems';
import { fetchFoodItems } from '../../components/foodData';
import FloatingCartButton from '../../components/customer/FloatingCartButton';
import Tags from '../../components/customer/Tags';
import RecommendationItems from '../../components/customer/RecommendationItems';
import { useRestaurant } from '../../context/RestaurantContext';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
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

export default function HomePage() {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const categoryButtonsRef = useRef(null);
  const { addToCart, cartItems, removeItem, updateQuantity } = useCart();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const scrollRef = useRef(null);
  const [allFoodItems, setAllFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // New state for OrderCard
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchFoodItems(restaurantId);
      setAllFoodItems(data);
      setLoading(false);
    };
    loadData();
  }, [restaurantId]);

  if (loading) {
    return <div className="text-white text-center p-4">Loading menu...</div>;
  }
  
  const bestSellerItems = allFoodItems.filter(item => 
    item.tags?.some(tag => tag.toLowerCase() === 'bestseller')
  );
  
  const handleCategoryClick = (category, event) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left,
      width: buttonRect.width
    });
    
    setActiveCategory(category.name);
    setMenuOpen(true);
  };
  
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
    // Close other menus when opening order card
    if (menuOpen) setMenuOpen(false);
  };

  const scroll = (scrollOffset) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const start = container.scrollLeft;

      container.scrollTo({
        left: start + scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  const toggle = {
    search: () => setIsSearchActive(!isSearchActive),
    sidebar: () => setIsSidebarOpen(!isSidebarOpen),
    cart: () => setIsCartOpen(!isCartOpen),
    notifications: () => setIsNotificationOpen(!isNotificationOpen)
  };
  
  const handleCloseMenu = () => setMenuOpen(false);
  const handleCloseOrderCard = () => setIsOrderCardOpen(false);

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
            <LogoutPopup 
              isOpen={isLogoutOpen}
              onClose={() => setIsLogoutOpen(false)}
              onConfirm={() => {
                setIsLogoutOpen(false);
                setIsSidebarOpen(false);
                navigate('/login');
              }}
            />
            <AnimatePresence>
              {isSidebarOpen && (
                <Sidebar
                  isSidebarOpen={isSidebarOpen}
                  toggleSidebar={toggle.sidebar}
                  onLogout={() => setIsLogoutOpen(true)}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isNotificationOpen && (
                <NotificationSidebar 
                  isOpen={isNotificationOpen}
                  onClose={toggle.notifications}
                />
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {isCartOpen && (
                <CartSidebar
                  isOpen={isCartOpen}
                  onClose={() => setIsCartOpen(false)}
                  cartItems={cartItems}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                />
              )}
            </AnimatePresence>
            
            {/* Order Card Component */}
            <OrderCard 
              isOpen={isOrderCardOpen}
              onClose={handleCloseOrderCard}
              item={selectedItem}
            />

          <Header 
            isSearchActive={isSearchActive}
            toggleSearch={toggle.search}
            toggleSidebar={toggle.sidebar}
            toggleNotifications={toggle.notifications}
            toggleCart={toggle.cart}
            cartItems={cartItems}
            className="mb-2 md:mb-3"
          />

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

            <motion.div 
            {...slideUp} 
            >
              <div className="relative pt-3 pb-3 mx-2 my-2">
                <Maincarosel />
              </div>
            </motion.div>

            <motion.div {...slideUp} className="bg-white rounded-t-[30px] rounded-b-none px-6 py-6 pb-2 flex-1 justify-center item-center">
              <CategoryButtons
                activeCategory={activeCategory}
                handleCategoryClick={handleCategoryClick}
                categoryButtonsRef={categoryButtonsRef}
              />

            <AnimatePresence>
              {menuOpen && (
                <MenuDropdown 
                key={activeCategory}
                menuOpen={menuOpen}
                handleCloseMenu={handleCloseMenu}
                menuPosition={menuPosition}
                activeCategory={activeCategory}
                menuItems={allFoodItems.filter(item => item.category === activeCategory)} 
                categoryButtonsRef={categoryButtonsRef}
                onAddToCart={addToCart}
                onItemClick={handleItemClick}
              />
              )}
            </AnimatePresence>

              <Divider />

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

              <motion.div>
                <RecommendationItems
                  allFoodItems={allFoodItems || []}
                  onItemClick={handleItemClick}
                  scrollRef={scrollRef}
                  scroll={scroll}
                />
              </motion.div>
              {!loading && (
                <motion.div variants={staggerItems}>
                  <Divider />
                  <Tags 
                    foodItems={allFoodItems} 
                    onItemClick={handleItemClick}
                  />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        <FloatingCartButton toggleCart={toggle.cart} />
      </div>
    </div>
  );
}