import React, { useState, useMemo, useCallback, memo } from 'react';
import { Filter, X, Sliders, Star, Tag, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUniqueCategories, getPriceRange, getRatingStats } from '../../shared/utils/searchAndFilter';

const BestSellerFilters = memo(({ 
  items, 
  filters, 
  onFiltersChange, 
  isOpen, 
  onToggle 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Memoized computed values
  const categories = useMemo(() => getUniqueCategories(items), [items]);
  const priceRange = useMemo(() => getPriceRange(items), [items]);
  const ratingStats = useMemo(() => getRatingStats(items), [items]);

  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters);
    onToggle();
  }, [localFilters, onFiltersChange, onToggle]);

  const handleResetFilters = useCallback(() => {
    const resetFilters = {
      category: 'all',
      priceRange: null,
      rating: null,
      discountOnly: false
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  }, [onFiltersChange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (localFilters.category !== 'all') count++;
    if (localFilters.priceRange) count++;
    if (localFilters.rating) count++;
    if (localFilters.discountOnly) count++;
    return count;
  }, [localFilters]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
        >
          <motion.div
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Filters</h3>
                {activeFiltersCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Category Filter */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-600" />
                  Category
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={localFilters.category === 'all'}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span>All Categories</span>
                  </label>
                  {categories.map(category => (
                    <label key={category} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={localFilters.category === category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  Price Range
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{priceRange.min.toFixed(2)}</span>
                    <span>₹{priceRange.max.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step={10}
                    value={localFilters.priceRange?.max || priceRange.max}
                    onChange={(e) => handleFilterChange('priceRange', {
                      min: priceRange.min,
                      max: parseInt(e.target.value)
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center text-sm text-gray-600">
                    Up to ₹{localFilters.priceRange?.max || priceRange.max}
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-600" />
                  Minimum Rating
                </h4>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <label key={rating} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={localFilters.rating === rating}
                        onChange={(e) => handleFilterChange('rating', parseInt(e.target.value))}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">& up</span>
                      </div>
                    </label>
                  ))}
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="rating"
                      value={null}
                      checked={localFilters.rating === null}
                      onChange={() => handleFilterChange('rating', null)}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600">Any rating</span>
                  </label>
                </div>
              </div>

              {/* Discount Only Filter */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localFilters.discountOnly}
                    onChange={(e) => handleFilterChange('discountOnly', e.target.checked)}
                    className="text-orange-500 focus:ring-orange-500 rounded"
                  />
                  <span className="font-medium">Show only discounted items</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

BestSellerFilters.displayName = 'BestSellerFilters';

export default BestSellerFilters; 