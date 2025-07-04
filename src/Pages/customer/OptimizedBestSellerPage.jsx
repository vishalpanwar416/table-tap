import React, { useState, useRef, useEffect, useMemo, useCallback, memo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../Restaurantselection/RestaurantContext';
import { fetchBestSellerItems } from '../../api/foodData';
import { OptimizedPageWrapper, itemVariants, staggerContainer } from '../../components/customer/OptimizedPageWrapper';
import OptimizedFoodItem from '../../components/customer/OptimizedFoodItem';
import { usePerformanceMonitor } from '../../hooks/usePerformance';
import { useCache } from '../../utils/cacheManager';

// Lazy load heavy components
const OrderCard = lazy(() => import('../../components/customer/itemCard'));

// Loading skeleton for food items
const FoodItemSkeleton = memo(() => (
  <div className="bg-white rounded-xl p-4 animate-pulse">
    <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
));

const OptimizedBestSellerPage = memo(() => {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const { setCache, getCache } = useCache();
  
  // Performance monitoring
  usePerformanceMonitor('BestSellerPage');
  
  // State management
  const [bestSellerItems, setBestSellerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'price', 'popularity'
  
  // Refs
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Memoized filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = bestSellerItems;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [bestSellerItems, searchTerm, sortBy]);

  // Data fetching with caching
  const loadBestSellers = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = `bestsellers_${restaurantId}`;
      const cachedData = getCache(cacheKey);
      
      if (cachedData) {
        setBestSellerItems(cachedData);
        setLoading(false);
        return;
      }

      // Fetch from API
      const data = await fetchBestSellerItems(restaurantId);
      
      // Cache the data
      setCache(cacheKey, data, 5 * 60 * 1000); // 5 minutes
      
      setBestSellerItems(data);
    } catch (err) {
      console.error('Error loading best sellers:', err);
      setError('Failed to load best sellers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, setCache, getCache]);

  // Load data on mount
  useEffect(() => {
    loadBestSellers();
  }, [loadBestSellers]);

  // Event handlers
  const handleOpenItemCard = useCallback((item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  }, []);

  const handleCloseItemCard = useCallback(() => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
  }, []);

  const handleRetry = useCallback(() => {
    loadBestSellers();
  }, [loadBestSellers]);

  // Empty state component
  const EmptyState = memo(() => (
    <motion.div 
      className="flex flex-col items-center justify-center py-12 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {searchTerm ? 'No items found' : 'No best sellers yet'}
      </h2>
      <p className="text-gray-500 text-center text-sm max-w-xs">
        {searchTerm 
          ? 'Try adjusting your search terms'
          : 'Check back later for our featured items'
        }
      </p>
    </motion.div>
  ));

  return (
    <OptimizedPageWrapper
      title="Best Sellers"
      showBackButton
      onBack={handleBack}
      loading={loading}
      error={error}
      onRetry={handleRetry}
    >
      {/* Search and Sort Controls */}
      <motion.div 
        className="bg-white rounded-t-[30px] flex-1 p-6"
        variants={itemVariants}
      >
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search best sellers..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-3 pl-10 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'name', label: 'Name' },
              { key: 'price', label: 'Price' },
              { key: 'popularity', label: 'Popular' }
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

        {/* Food Items Grid */}
        <div ref={containerRef} className="flex-1">
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
                >
                  <OptimizedFoodItem
                    item={item}
                    onImageClick={() => handleOpenItemCard(item)}
                    variant="default"
                  />
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

OptimizedBestSellerPage.displayName = 'OptimizedBestSellerPage';

export default OptimizedBestSellerPage; 