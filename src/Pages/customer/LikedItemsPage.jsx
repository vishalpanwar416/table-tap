import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/customer/Header';
import Sidebar from '../../components/customer/Slidebar';
import CartSidebar from '../../components/customer/CartSidebar';
import { profileImg } from '../../assets/images/Food/Index';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';
import { useLikes } from '../../config/LikesContent';
import NotificationSidebar from '../../components/customer/NotificationSlidebar';
import OrderCard from '../../components/customer/itemCard';
import FoodImageWithFallback from '../../components/customer/FoodImageWithFallback';

// Page transition variants
const pageVariants = {
  initial: { 
    opacity: 0,
    x: 20,
    scale: 0.98
  },
  animate: { 
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// Stagger animation for grid items
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.9
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const LikedItemCard = ({ item, onItemClick, index = 0 }) => {
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { toggleLike, likedItems } = useLikes();
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
    setIsLikedAnimating(true);
    toggleLike(item);
    setTimeout(() => setIsLikedAnimating(false), 600);
  }, [toggleLike, item]);

  // Discount tag
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

  // Price calculation
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
            onClick={() => onItemClick(item)}
            loading="lazy"
          />
        </motion.div>
        
        {/* Enhanced like button */}
        <motion.button
          className="absolute top-2 left-2 z-20 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm"
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
              className={`h-4 w-4 transition-colors duration-200 ${
                isLiked ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-400"
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
              {quantity > 0 ? (
                <motion.div 
                  key="quantity-controls"
                  className="flex items-center bg-gradient-to-r from-black to-gray-800 text-white rounded-full px-2 py-0.5 shadow-lg"
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
                    key={quantity}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {quantity}
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
                  className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-full px-2 py-0.5 flex items-center space-x-1 text-xs shadow-lg transition-all duration-200"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Add</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex justify-end mt-1">
          <DiscountTag />
        </div>
      </div>
    </motion.div>
  );
};

const LikedItemsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const { likedItems, loading } = useLikes();
  const containerRef = useRef(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);

  // Real-time search handler
  const handleSearch = useCallback((query) => {
    setSearchTerm(query);
  }, []);

  // Clear search when search is closed
  const handleSearchClose = useCallback(() => {
    setSearchTerm('');
    setIsSearchActive(false);
  }, []);

  // Filtered liked items based on search
  const filteredLikedItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return likedItems;
    }
    
    return likedItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [likedItems, searchTerm]);

  const toggle = {
    sidebar: () => setIsSidebarOpen(!isSidebarOpen),
    cart: () => setIsCartOpen(!isCartOpen),
    search: () => setIsSearchActive(!isSearchActive),
    notification: () => setIsNotificationOpen(!isNotificationOpen),
  };

  const handleImageClick = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  };

  if (loading) {
    return (
      <motion.div 
        className="text-white text-center p-4 min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading your liked items...</p>
        </div>
      </motion.div>
    );
  }

  if (!likedItems || likedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-lg font-bold text-gray-700 mb-2">No Liked Items</h2>
        <p className="text-gray-400">You haven't liked any items yet.</p>
      </div>
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
        <Header 
          isSearchActive={isSearchActive}
          toggleSearch={toggle.search}
          toggleSidebar={toggle.sidebar}
          toggleNotifications={toggle.notification}
          toggleCart={toggle.cart}
          cartItems={cartItems}
          onSearch={handleSearch}
          onSearchClose={handleSearchClose}
          showRestaurantInfo={false}
          className="mb-2 md:mb-3"
        />

        <motion.button 
          className="absolute left-4 top-7 md:left-8 md:top-8 text-orange-500 hover:text-orange-600 transition-colors z-10"
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={30} className="md:w-8 md:h-8" />
        </motion.button>

        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggle.sidebar}
          profileImg={profileImg}
          userName="Vishal Panwar"
          userEmail="Vishalpanwar416@gmail.com"
        />

        {isNotificationOpen && (
          <NotificationSidebar 
            isOpen={isNotificationOpen}
            onClose={toggle.notification}
          />
        )}

        <CartSidebar
          isOpen={isCartOpen}
          onClose={toggle.cart}
          cartItems={cartItems}
        />

        <motion.div 
          className="pt-4 md:pt-6 pb-6 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-3xl md:text-3xl text-center text-white font-spartan-medium">
            Liked Items
          </h1>
        </motion.div>

        <motion.div 
          ref={containerRef}
          className="bg-white rounded-3xl p-4 md:p-6 flex-1 flex flex-col min-h-[calc(100vh-200px)] overflow-y-auto shadow-xl"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <motion.p 
            className="justify-center text-center text-black font-medium text-lg md:text-xl mb-4 md:mb-6 font-spartan-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            It's time to buy your favorite dish.
          </motion.p>

          {/* Search Results Count */}
          {searchTerm && (
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <p className="text-gray-600 text-sm">
                {filteredLikedItems.length} result{filteredLikedItems.length !== 1 ? 's' : ''} for "{searchTerm}"
              </p>
            </motion.div>
          )}
          
          {/* Items Grid */}
          {filteredLikedItems.length > 0 ? (
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredLikedItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                >
                  <LikedItemCard item={item} onItemClick={handleImageClick} index={idx} />
                </motion.div>
              ))}
            </motion.div>
          ) : searchTerm ? (
            <motion.div 
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No items found</h3>
              <p className="text-gray-600 text-center text-sm">
                No liked items match your search "{searchTerm}"
              </p>
            </motion.div>
          ) : null}

          <OrderCard
            isOpen={isOrderCardOpen}
            onClose={() => setIsOrderCardOpen(false)}
            item={selectedItem}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LikedItemsPage;