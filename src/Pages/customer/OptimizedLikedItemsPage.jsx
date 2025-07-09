import React, { useState, useEffect, useCallback, useMemo, memo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLikes } from '../../config/LikesContent';
import { OptimizedPageWrapper, itemVariants, staggerContainer } from '../../components/customer/OptimizedPageWrapper';
import OptimizedFoodItem from '../../components/customer/OptimizedFoodItem';
import { usePerformanceMonitor } from '../../hooks/usePerformance';
import { useDebounce } from '../../hooks/usePerformance';

// Lazy load heavy components
const OrderCard = lazy(() => import('../../components/customer/itemCard'));

const OptimizedLikedItemsPage = memo(() => {
  const navigate = useNavigate();
  const { likedItems, removeLike } = useLikes();
  
  // Performance monitoring
  usePerformanceMonitor('LikedItemsPage');
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'price', 'date'
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(null);

  // Debounced search
  const debouncedSearch = useDebounce((value) => {
    setSearchTerm(value);
  }, 300);

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = likedItems;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'date':
          return new Date(b.likedAt || 0) - new Date(a.likedAt || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [likedItems, searchTerm, sortBy]);

  // Event handlers
  const handleBack = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  const handleOpenItemCard = useCallback((item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  }, []);

  const handleCloseItemCard = useCallback(() => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  }, []);

  const handleRemoveLike = useCallback(async (item) => {
    setIsRemoving(item.id);
    try {
      await removeLike(item);
    } catch (error) {
    } finally {
      setIsRemoving(null);
    }
  }, [removeLike]);

  const handleSearch = useCallback((e) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
  }, []);

  // Empty state component
  const EmptyState = memo(() => (
    <motion.div 
      className="flex flex-col items-center justify-center py-12 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Heart className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {searchTerm ? 'No items found' : 'No liked items yet'}
      </h2>
      <p className="text-gray-500 text-center text-sm max-w-xs">
        {searchTerm 
          ? 'Try adjusting your search terms'
          : 'Start liking items to see them here'
        }
      </p>
      {!searchTerm && (
        <button
          onClick={handleBack}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Browse Menu
        </button>
      )}
    </motion.div>
  ));

  return (
    <OptimizedPageWrapper
      title="Liked Items"
      showBackButton
      onBack={handleBack}
    >
      <motion.div 
        className="bg-white rounded-t-[30px] flex-1 p-6"
        variants={itemVariants}
      >
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search liked items..."
              onChange={handleSearch}
              className="w-full px-4 py-3 pl-10 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Sort Controls */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'name', label: 'Name' },
              { key: 'price', label: 'Price' },
              { key: 'date', label: 'Recently Liked' }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => handleSortChange(option.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortBy === option.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        {filteredAndSortedItems.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-600 text-sm">
              {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {/* Items Grid */}
        <div className="flex-1">
          {filteredAndSortedItems.length > 0 ? (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredAndSortedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                  className="relative group"
                >
                  <OptimizedFoodItem
                    item={item}
                    onImageClick={() => handleOpenItemCard(item)}
                    variant="default"
                  />
                  
                  {/* Remove like button */}
                  <button
                    onClick={() => handleRemoveLike(item)}
                    disabled={isRemoving === item.id}
                    className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                    aria-label="Remove from favorites"
                  >
                    {isRemoving === item.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState />
          )}
        </div>
      </motion.div>

      {/* Order Card Modal */}
      <Suspense fallback={null}>
        <OrderCard 
          isOpen={isOrderCardOpen}
          onClose={handleCloseItemCard}
          item={selectedItem}
        />
      </Suspense>
    </OptimizedPageWrapper>
  );
});

OptimizedLikedItemsPage.displayName = 'OptimizedLikedItemsPage';

export default OptimizedLikedItemsPage; 