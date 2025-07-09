import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      opacity: { duration: 0.32, ease: 'easeOut' },
      y: { duration: 0.32, ease: 'easeOut' },
      scale: { type: 'spring', stiffness: 180, damping: 22, mass: 0.8 },
    }
  }
};

function getDiscountedPrice(item) {
  if (!item.discounttype || !item.discountvalue) return item.price;
  return item.discounttype === 'Percentage'
    ? (item.price - (item.price * (item.discountvalue / 100)))
    : Math.max(0, item.price - item.discountvalue);
}

const SearchResultsOverlay = ({ items = [] }) => {
  return (
    <div
      className="fixed left-0 right-0 top-16 z-50 flex flex-col items-center w-full px-2 sm:px-0 pointer-events-none"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-2xl flex flex-col gap-2 max-h-[60vh] overflow-y-auto mt-2 pointer-events-auto">
        <AnimatePresence>
          {items.length === 0 ? (
            <motion.div
              className="text-center text-gray-400 py-8 text-base bg-white/80 rounded-xl shadow-md"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            >No items found.</motion.div>
          ) : (
            items.map((item) => {
              const discountedPrice = getDiscountedPrice(item);
              const hasDiscount = item.discounttype && item.discountvalue;
              return (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-3 bg-black/70 rounded-xl p-2 sm:p-3 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 hover:scale-[1.025] transition-all duration-300 hover:bg-black/80 backdrop-blur-md border border-white/5"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={itemVariants}
                  layout
                  whileHover={{ scale: 1.025, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45)' }}
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