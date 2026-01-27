import React, { useState, useRef, memo } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, ArrowLeft, Star } from 'lucide-react';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useCart } from '../../shared/config/CartContent';
import { useLikes } from '../../shared/config/LikesContent';
import { LazyImage } from '../../shared/utils/imageOptimization';
import OrderCard from './itemCard';

// Enhanced RecommendationItem component with better animations
const RecommendationItem = memo(({ item, onImageClick, index }) => {
  const { toggleLike, likedItems } = useLikes();
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isLikedAnimating, setIsLikedAnimating] = useState(false);

  if (!item) return null;

  const { id, image, name, category } = item;

  const cartItem = cartItems.find(cartItem => cartItem.id === id);
  const quantity = cartItem?.quantity || 0;
  const isLiked = likedItems.some(likedItem => likedItem.id === id);

  const handleAddToCart = () => {
    addToCart(item);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      removeItem(id, category);
    } else {
      updateQuantity(id, category, quantity - 1);
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setIsLikedAnimating(true);
    toggleLike(item);
    setTimeout(() => setIsLikedAnimating(false), 600);
  };

  // Discount tag with animation
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
  const discountedPrice = React.useMemo(() => {
    if (!item.discounttype || !item.discountvalue) return item.price;
    return item.discounttype === 'Percentage'
      ? (item.price - (item.price * (item.discountvalue / 100)))
      : Math.max(0, item.price - item.discountvalue);
  }, [item.price, item.discounttype, item.discountvalue]);

  return (
    <motion.div
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 min-w-[140px] max-w-[150px] h-[160px] flex flex-col relative"
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
      {/* Hover overlay effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <div className="relative h-28 overflow-hidden bg-gray-100 flex-shrink-0">
        {/* Discount badge in top right with animation */}
        <motion.div
          className="absolute top-1 right-2 z-20"
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
            src={image}
            alt={name}
            category={category}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onImageClick && onImageClick(item)}
          />
        </motion.div>
        
        {/* Enhanced like button */}
        <motion.button 
          className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 z-10 shadow-sm"
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
              className={`h-4 w-4 md:w-5 md:h-5 transition-colors duration-200 ${
                isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
            />
          </motion.div>
        </motion.button>

        {/* Sparkle effect for liked items */}
      </div>

      <div className="flex flex-col flex-1 justify-between py-1 px-2 min-h-0">
        <div className="flex items-start justify-between min-h-0">
          <div className="flex-1 min-w-0">
            <motion.h4 
              className="text-xs font-bold text-gray-900 truncate leading-tight"
              whileHover={{ color: '#f97316' }}
              transition={{ duration: 0.2 }}
            >
              {item.name}
            </motion.h4>
            <div className="flex items-center space-x-1 mt-0.5">
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
          <div className="ml-1 flex-shrink-0">
            <AnimatePresence mode="wait">
              {quantity > 0 ? (
                <motion.div 
                  key="quantity-controls"
                  className="flex items-center bg-gradient-to-r from-black to-gray-800 text-white rounded-full px-2 py-1 shadow-lg"
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
                    onClick={handleAddToCart}
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
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-full px-3 py-1.5 flex items-center space-x-1 text-xs shadow-lg transition-all duration-200"
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
        {/* Removed the bottom DiscountTag section */}
      </div>
    </motion.div>
  );
});

// Enhanced scroll buttons component
const ScrollButtons = ({ tagKey, scrollRefs, onScroll }) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    const container = scrollRefs.current[tagKey];
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  React.useEffect(() => {
    const container = scrollRefs.current[tagKey];
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [tagKey]);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            onClick={() => onScroll(tagKey, -300)}
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-gray-800 transition-colors shadow-lg border border-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            onClick={() => onScroll(tagKey, 300)}
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-gray-800 transition-colors shadow-lg border border-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const Tags = ({ foodItems = [], onItemClick }) => {
  const [expandedTags, setExpandedTags] = useState(new Set());
  const scrollRefs = useRef({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);

  const handleOpenItemCard = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  };

  const handleCloseItemCard = () => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  };

  // Group food items by tags, excluding bestseller and recommended
  const groupedByTags = React.useMemo(() => {
    const tagGroups = {};
    
    if (!foodItems || !Array.isArray(foodItems)) {
      return tagGroups;
    }
    
    foodItems.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase();
          if (normalizedTag === 'bestseller' || normalizedTag === 'recommended') {
            return;
          }
          
          if (!tagGroups[normalizedTag]) {
            tagGroups[normalizedTag] = {
              name: tag,
              items: []
            };
          }
          tagGroups[normalizedTag].items.push(item);
        });
      }
    });

    return tagGroups;
  }, [foodItems]);

  const toggleTag = (tagKey) => {
    const newExpandedTags = new Set(expandedTags);
    if (newExpandedTags.has(tagKey)) {
      newExpandedTags.delete(tagKey);
    } else {
      newExpandedTags.add(tagKey);
    }
    setExpandedTags(newExpandedTags);
  };

  const scroll = (tagKey, scrollOffset) => {
    if (scrollRefs.current[tagKey]) {
      const container = scrollRefs.current[tagKey];
      const start = container.scrollLeft;

      container.scrollTo({
        left: start + scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  if (Object.keys(groupedByTags).length === 0) {
    return (
      <motion.div 
        className="mt-6 text-black"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-thick font-spartan-bold md:text-3xl mb-3 px-4">
          Browse by Categories
        </h2>
        <motion.div 
          className="text-gray-500 text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-4xl mb-2">🙁</div>
          <p>No categories available at the moment</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="mt-6 text-black pb-[100px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2 
        className="text-xl font-thick font-spartan-bold md:text-3xl mb-6 px-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Browse by Categories
      </motion.h2>
      
      <div className="space-y-8">
        {Object.entries(groupedByTags).map(([tagKey, tagData], tagIndex) => (
          <motion.div 
            key={tagKey} 
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: tagIndex * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
                        {/* Enhanced Tag Header */}
            <div className="grid grid-cols-3 items-center relative px-4">
              {/* Tag Name - Moves to center */}
              <motion.div
                className="col-start-1 col-end-2 flex items-center"
                animate={{ 
                  x: expandedTags.has(tagKey) ? '50%' : 0,
                  xPercent: expandedTags.has(tagKey) ? -50 : 0
                }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.25, 0.46, 0.45, 0.94] 
                }}
              >
                <motion.span
                  className="relative text-lg font-semibold text-gray-800 capitalize hover:text-orange-500 transition-colors md:text-2xl cursor-pointer whitespace-nowrap"
                  whileHover={{ color: '#f97316' }}
                  animate={{ 
                    scale: expandedTags.has(tagKey) ? 1.05 : 1
                  }}
                  transition={{ 
                    duration: 0.3, 
                    ease: [0.25, 0.46, 0.45, 0.94] 
                  }}
                  onClick={() => toggleTag(tagKey)}
                >
                  {tagData.name}
                  <motion.div
                    className="absolute -bottom-1 left-0 h-0.5 bg-orange-500"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    animate={{ 
                      width: expandedTags.has(tagKey) ? '100%' : 0 
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.span>
              </motion.div>

              {/* Fixed Arrow Button */}
              <motion.button
                onClick={() => toggleTag(tagKey)}
                className="col-start-3 col-end-4 flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors justify-self-end"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ 
                    rotate: expandedTags.has(tagKey) ? 180 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                </motion.div>
              </motion.button>
            </div>

            {/* Enhanced Expandable Content */}
            <AnimatePresence>
              {expandedTags.has(tagKey) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: "easeOut"
                  }}
                  className="overflow-hidden"
                >
                  <div
                    ref={(el) => scrollRefs.current[tagKey] = el}
                    className="flex space-x-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide px-4"
                  >
                    {tagData.items.map((item, index) => (
                      <RecommendationItem 
                        key={`${tagKey}-${item.id}-${index}`}
                        item={item} 
                        onImageClick={handleOpenItemCard}
                        index={index}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      
      <OrderCard 
        isOpen={isOrderCardOpen} 
        onClose={handleCloseItemCard} 
        item={selectedItem} 
      />
      
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.div>
  );
};

export default Tags;