import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};

function getDiscountedPrice(item) {
  if (!item.discounttype || !item.discountvalue) return item.price;
  return item.discounttype === 'Percentage'
    ? (item.price - (item.price * (item.discountvalue / 100)))
    : Math.max(0, item.price - item.discountvalue);
}

const SearchResultsOverlay = ({ 
  items = [], 
  onItemClick, 
  onRequestCloseOverlay,
  cartItems = [],
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem
}) => {
  // Memoize cart quantities map to prevent unnecessary re-renders
  const cartQuantities = useMemo(() => 
    new Map(cartItems.map(item => [item.id, item.quantity])), 
    [cartItems]
  );

  const handleItemClick = useCallback((item) => {
    if (onItemClick) onItemClick(item);
  }, [onItemClick]);

  const handleCartClick = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(item);
  }, [onAddToCart]);

  const handleIncrement = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(item);
  }, [onAddToCart]);

  const handleDecrement = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const cartQuantity = cartQuantities.get(item.id) || 0;
    if (cartQuantity === 1) {
      if (onRemoveItem) onRemoveItem(item.id, item.category);
    } else {
      if (onUpdateQuantity) onUpdateQuantity(item.id, item.category, cartQuantity - 1);
    }
  }, [cartQuantities, onRemoveItem, onUpdateQuantity]);

  return (
    <div
      className="fixed left-0 right-0 top-16 z-50 flex flex-col items-center w-full px-2 sm:px-0"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-2xl flex flex-col gap-2 max-h-[60vh] overflow-y-auto mt-2 pointer-events-auto">
        <AnimatePresence>
          {items.length === 0 ? (
            <motion.div
              className="text-center text-gray-400 py-8 text-base bg-white/80 rounded-xl shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >No items found.</motion.div>
          ) : (
            items.map((item) => {
              const discountedPrice = getDiscountedPrice(item);
              const hasDiscount = item.discounttype && item.discountvalue;
              const cartQuantity = cartQuantities.get(item.id) || 0;
              
              return (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-3 bg-black/70 rounded-xl p-2 sm:p-3 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 hover:bg-black/80 backdrop-blur-md border border-white/5 cursor-pointer"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={itemVariants}
                  onClick={() => handleItemClick(item)}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { handleItemClick(item); } }}
                  aria-label={`View details for ${item.name}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg border border-gray-700 flex-shrink-0 shadow-sm"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate text-base sm:text-lg drop-shadow-sm">{item.name}</span>
                      <span className="flex items-center gap-2 ml-2">
                        {hasDiscount ? (
                          <>
                            <span className="text-xs text-gray-400 line-through">₹{Number(item.price).toFixed(0)}</span>
                            <span className="text-orange-400 font-semibold text-sm sm:text-base drop-shadow">₹{discountedPrice.toFixed(0)}</span>
                          </>
                        ) : (
                          <span className="text-orange-400 font-semibold text-sm sm:text-base drop-shadow">₹{Number(item.price).toFixed(0)}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-0.5">{item.category}</span>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="bg-orange-900/60 text-orange-300 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="text-gray-400 text-xs">+{item.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Cart Controls */}
                  <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <AnimatePresence mode="wait">
                      {cartQuantity > 0 ? (
                        <motion.div 
                          key="quantity-controls"
                          className="flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full px-2 py-1 shadow-lg"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <button
                            onClick={(e) => handleDecrement(e, item)}
                            className="text-white px-1 text-xs hover:text-orange-200 transition-colors"
                            type="button"
                          >
                            −
                          </button>
                          <span className="px-1 text-xs font-semibold">
                            {cartQuantity}
                          </span>
                          <button
                            onClick={(e) => handleIncrement(e, item)}
                            className="text-white px-1 text-xs hover:text-green-200 transition-colors"
                            type="button"
                          >
                            +
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="add-button"
                          onClick={(e) => handleCartClick(e, item)}
                          className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-full px-2 py-1 flex items-center space-x-1 text-xs shadow-lg transition-all duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          type="button"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>Add</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchResultsOverlay; 