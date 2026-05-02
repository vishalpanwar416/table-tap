import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../shared/config/CartContent';
import { useLikes } from '../../shared/config/LikesContent';
import { LazyImage } from '../../shared/utils/imageOptimization';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useCallback, memo, useState } from 'react';
import OrderCard from './itemCard';

const RecommendationItem = memo(({
  item,
  onImageClick,
  index = 0,
  quantity = 0,
  isLiked = false,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onToggleLike
}) => {
  const [isLikedAnimating, setIsLikedAnimating] = useState(false);

  const handleAddClick = useCallback(() => onAddToCart(item), [onAddToCart, item]);
  const handleIncrement = useCallback(() => onAddToCart(item), [onAddToCart, item]);
  const handleDecrement = useCallback(() => {
    if (quantity === 1) {
      onRemoveItem(item.id, item.category);
    } else {
      onUpdateQuantity(item.id, item.category, quantity - 1);
    }
  }, [quantity, onRemoveItem, onUpdateQuantity, item.id, item.category]);

  const handleLikeClick = useCallback((e) => {
    e.stopPropagation();
    setIsLikedAnimating(true);
    onToggleLike(item);
    setTimeout(() => setIsLikedAnimating(false), 600);
  }, [onToggleLike, item]);

  // Helper for the discount tag
  const DiscountTag = () =>
    item.discounttype && item.discountvalue ? (
      <motion.span
        className="text-sm bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {item.discounttype === 'Percentage'
          ? `${item.discountvalue}% OFF`
          : `₹${item.discountvalue} OFF`}
      </motion.span>
    ) : null;

  // Helper for the price display
  const discountedPrice = useMemo(() => {
    if (!item.discounttype || !item.discountvalue) return item.price;
    return item.discounttype === 'Percentage'
      ? (item.price - (item.price * (item.discountvalue / 100)))
      : Math.max(0, item.price - item.discountvalue);
  }, [item.price, item.discounttype, item.discountvalue]);

  return (
    <div
      className="group bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 overflow-hidden border border-gray-100 w-[280px] h-[280px] flex flex-col relative"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100 flex-shrink-0">
        {/* Discount badge in top right with animation */}
        <motion.div
          className="absolute top-3 right-3 z-20"
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
            src={item.image}
            alt={item.name}
            category={item.category}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onImageClick && onImageClick(item)}
          />
        </motion.div>

        {/* Enhanced like button */}
        <motion.button
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2 z-10 shadow-sm"
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
              className={`h-6 w-6 md:w-7 md:h-7 transition-colors duration-200 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500 hover:text-red-400'
                }`}
            />
          </motion.div>
        </motion.button>
      </div>

      <div className="flex flex-col flex-1 justify-between py-2 px-4 min-h-0">
        <div className="flex items-start justify-between flex-1">
          <div className="flex-1 min-w-0 mr-3">
            <motion.h4
              className="text-base font-bold text-gray-900 truncate mb-1 leading-tight"
              whileHover={{ color: '#f97316' }}
              transition={{ duration: 0.2 }}
            >
              {item.name}
            </motion.h4>
            <div className="flex items-center space-x-2">
              {item.discounttype && item.discountvalue ? (
                <>
                  <motion.span
                    className="text-sm text-gray-400 line-through"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    ₹{Number(item.price).toFixed(0)}
                  </motion.span>
                  <motion.span
                    className="text-lg font-bold text-primary-600"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    ₹{discountedPrice.toFixed(0)}
                  </motion.span>
                </>
              ) : (
                <motion.span
                  className="text-lg font-bold text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  ₹{Number(item.price).toFixed(0)}
                </motion.span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <AnimatePresence mode="wait">
              {quantity > 0 ? (
                <motion.div
                  key="quantity-controls"
                  className="flex items-center bg-gradient-to-r from-black to-gray-800 text-white rounded-full px-3 py-1.5 shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={handleDecrement}
                    className="text-white px-2 text-base font-bold hover:text-primary-300 transition-colors"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                  >
                    −
                  </motion.button>
                  <motion.span
                    className="px-3 text-base font-semibold"
                    key={quantity}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {quantity}
                  </motion.span>
                  <motion.button
                    onClick={handleIncrement}
                    className="text-white px-2 text-base font-bold hover:text-green-300 transition-colors"
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
                  className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-full px-3 py-1.5 flex items-center space-x-2 text-sm shadow-lg transition-all duration-200"
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
                  <ShoppingBag className="h-5 w-5 flex-shrink-0" />
                  <span className="leading-none pt-0.5">Add</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

RecommendationItem.displayName = 'RecommendationItem';

const RecommendationItems = ({ allFoodItems = [], onItemClick, scrollRef, scroll }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { likedItems, toggleLike } = useLikes();

  // Memoize state maps to prevent children re-renders
  const cartQuantities = useMemo(() =>
    new Map(cartItems.map(item => [String(item.id), item.quantity])),
    [cartItems]
  );

  const likedItemsSet = useMemo(() =>
    new Set(likedItems.map(item => String(item.id))),
    [likedItems]
  );

  // Memoize handlers
  const handleAddToCart = useCallback((item) => addToCart(item), [addToCart]);
  const handleUpdateQuantity = useCallback((id, cat, qty) => updateQuantity(id, cat, qty), [updateQuantity]);
  const handleRemoveItem = useCallback((id, cat) => removeItem(id, cat), [removeItem]);
  const handleToggleLike = useCallback((item) => toggleLike(item), [toggleLike]);

  if (allFoodItems.length === 0) return null;

  const handleOpenItemCard = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  };

  const handleCloseItemCard = () => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="pb-2 text-black flex-1">
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-xl font-thick font-spartan-bold md:text-3xl">Our Best Recommendations</h2>
        <button
          onClick={() => scroll(scrollRef.current?.clientWidth || 300)}
          className="p-2 rounded-full bg-white text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto overflow-y-hidden scrollbar-hide pb-4 pt-2 md:pb-2 px-4"
        style={{ minHeight: allFoodItems.length > 0 ? 'auto' : '0' }}
      >
        {allFoodItems.map((item, index) => (
          <div
            key={item.id}
            className="flex-shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <RecommendationItem
              item={item}
              onImageClick={handleOpenItemCard}
              index={index}
              quantity={cartQuantities.get(String(item.id)) || 0}
              isLiked={likedItemsSet.has(String(item.id))}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onToggleLike={handleToggleLike}
            />
          </div>
        ))}
      </div>
      <OrderCard
        isOpen={isOrderCardOpen}
        onClose={handleCloseItemCard}
        item={selectedItem}
      />
    </div>
  );
};

export default RecommendationItems;