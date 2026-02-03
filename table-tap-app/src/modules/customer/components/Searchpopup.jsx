import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchPopup = ({ 
  isOpen, 
  onClose, 
  foodItems = [], 
  onItemClick,
  searchQuery = '',
  onSearchChange 
}) => {
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentQuery, setCurrentQuery] = useState(searchQuery);

  useEffect(() => {
    if (currentQuery.trim()) {
      const filtered = foodItems.filter(item => 
        item.name.toLowerCase().includes(currentQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(currentQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(currentQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(currentQuery.toLowerCase()))
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  }, [currentQuery, foodItems]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setCurrentQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
    onClose();
  };

  const handleClose = () => {
    setCurrentQuery('');
    if (onSearchChange) {
      onSearchChange('');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search food, drinks, etc."
                value={currentQuery}
                onChange={handleSearchChange}
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                autoFocus
              />
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {currentQuery.trim() === '' ? (
              <div className="p-6 text-center text-gray-500">
                <Search size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-1">Search Menu</p>
                <p className="text-sm">Start typing to find food items</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-lg font-medium mb-1">No results found</p>
                <p className="text-sm">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="py-2">
                <div className="px-4 py-2 bg-gray-50 text-gray-600 text-sm font-medium">
                  {filteredItems.length} result{filteredItems.length > 1 ? 's' : ''} found
                </div>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <button
                      onClick={() => handleItemClick(item)}
                      className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              {item.category}
                            </span>
                            <span className="font-semibold text-gray-900">
                              ${item.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchPopup;