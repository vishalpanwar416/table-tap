import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Heart, ShoppingBag, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Sidebar from '../components/Slidebar';
import CartSidebar from '../components/CartSidebar';
import { profileImg } from '../../../assets/images/Food';
import { useCart } from '../../shared/config/CartContent';
import { useNavigate } from 'react-router-dom';
import { useLikes } from '../../shared/config/LikesContent';
import NotificationSidebar from '../components/NotificationSlidebar';
import OrderCard from '../components/itemCard';
import FoodImageWithFallback from '../components/FoodImageWithFallback';
import { useMultiScrollLock } from '../../shared/hooks/useScrollLock';
import LoadingScreen from '../../shared/components/LoadingScreen';

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
    e.preventDefault();
    setIsLikedAnimating(true);
    requestAnimationFrame(() => toggleLike(item));
    setTimeout(() => setIsLikedAnimating(false), 600);
  }, [toggleLike, item]);

  // Discount tag component
  const DiscountTag = () =>
    item.discounttype && item.discountvalue ? (
      <span className="text-xs bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
        {item.discounttype === 'Percentage'
          ? `${item.discountvalue}% OFF`
          : `₹${item.discountvalue} OFF`}
      </span>
    ) : null;

  return (
    <div
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 overflow-hidden border border-gray-100 relative"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {/* Discount Tag moved to top-right */}
        <div className="absolute top-3 right-3 z-30">
          <DiscountTag />
        </div>
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
              className={`h-5 w-5 transition-colors duration-200 ${isLiked
                ? "text-red-500 fill-red-500"
                : "text-gray-600 hover:text-red-400"
                }`}
            />
          </motion.div>
        </motion.button>
      </div>

      {/* Redesigned bottom part */}
      <div className="p-5 flex flex-col gap-1 h-full justify-between">
        {/* Name and Price Row */}
        <div className="flex items-center justify-between">
          <h4 className="text-xl md:text-2xl font-extrabold text-gray-900 truncate font-spartan">
            {item.name}
          </h4>
          <div className="flex items-end gap-2">
            {item.discounttype && item.discountvalue ? (
              <>
                <span className="text-xs md:text-sm text-gray-400 line-through font-spartan">
                  ₹{Number(item.price).toFixed(0)}
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-orange-600 leading-none font-spartan">
                  ₹{(
                    item.discounttype === "Percentage"
                      ? item.price - (item.price * (item.discountvalue / 100))
                      : Math.max(0, item.price - item.discountvalue)
                  ).toFixed(0)}
                </span>
              </>
            ) : (
              <span className="text-xl md:text-2xl font-extrabold text-gray-900 leading-none font-spartan">
                ₹{Number(item.price).toFixed(0)}
              </span>
            )}
          </div>
        </div>
        {/* Description and Add/Quantity Row */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-sm line-clamp-2 flex-1 font-spartan">
            {item.description}
          </p>
          <div className="ml-2">
            <AnimatePresence mode="wait">
              {quantity > 0 ? (
                <motion.div
                  key="quantity-controls"
                  className="flex items-center bg-gradient-to-r from-black to-gray-800 rounded-full px-2 py-1 shadow"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={handleDecrement}
                    className="text-white hover:text-orange-300 rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors font-spartan"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Decrease quantity"
                  >
                    −
                  </motion.button>
                  <span className="text-white text-base font-semibold select-none px-2 font-spartan">
                    {quantity}
                  </span>
                  <motion.button
                    onClick={handleIncrement}
                    className="text-white hover:text-green-300 rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors font-spartan"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Increase quantity"
                  >
                    +
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="add-button"
                  onClick={handleAddClick}
                  className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-full px-4 py-1.5 shadow flex items-center gap-1 text-base font-semibold font-spartan"
                  whileHover={{
                    scale: 1.08,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.15)"
                  }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  aria-label={`Add ${item.name} to cart`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 2).map((tag, tagIndex) => (
              <span
                key={tag}
                className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-200 font-spartan"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="text-gray-500 text-xs font-medium px-2.5 py-1 font-spartan">
                +{item.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
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

  // Lock scroll when any sidebar is open
  useMultiScrollLock({
    cart: isCartOpen,
    sidebar: isSidebarOpen,
    notifications: isNotificationOpen
  });

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
    return <LoadingScreen message="Loading your liked items..." variant="page" />;
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
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col relative">
        <div className="relative flex items-center mb-2 md:mb-3">
          <motion.button
            className="absolute left-2 text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-20"
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go back"
          >
            <ChevronLeft size={30} className="md:w-8 md:h-8" />
          </motion.button>

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
            className="w-full"
          />
        </div>

        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggle.sidebar}
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
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            >
              {filteredLikedItems.map((item, idx) => (
                <div key={item.id}>
                  <LikedItemCard item={item} onItemClick={handleImageClick} index={idx} />
                </div>
              ))}
            </div>
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