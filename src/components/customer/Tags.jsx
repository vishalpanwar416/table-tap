import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../../config/CartContent';
import { useLikes } from '../../config/LikesContent';
import { LazyImage } from '../../utils/imageOptimization';

// Individual RecommendationItem component
const RecommendationItem = ({ item, onImageClick }) => {
  const { toggleLike, likedItems } = useLikes();
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();

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

  // Discount tag
  const DiscountTag = () =>
    item.discounttype && item.discountvalue ? (
      <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
        {item.discounttype === 'Percentage'
          ? `${item.discountvalue}% OFF`
          : `₹${item.discountvalue} OFF`}
      </span>
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
      className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100 min-w-[140px] max-w-[150px] h-[180px] flex flex-col"
      style={{ transform: 'translateZ(0)' }}
    >
      <div className="relative h-28 overflow-hidden bg-gray-100 flex-shrink-0">
        <LazyImage
          src={image}
          alt={name}
          category={category}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onImageClick && onImageClick(item)}
        />
        <button 
          className="absolute top-2 left-2 bg-white/70 rounded-full p-1 z-10"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(item);
          }}
        >
          <Heart 
            className={`h-4 w-4 md:w-6 md:h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
          />
        </button>
      </div>
      <div className="flex flex-col flex-1 justify-between py-1 px-2 min-h-0">
        <div className="flex items-start justify-between min-h-0">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-gray-900 truncate leading-tight">{item.name}</h4>
            <div className="flex items-center space-x-1 mt-0.5">
              {item.discounttype && item.discountvalue ? (
                <>
                  <span className="text-[10px] text-gray-400 line-through">
                    ₹{Number(item.price).toFixed(0)}
                  </span>
                  <span className="text-sm font-bold text-orange-600">
                    ₹{discountedPrice.toFixed(0)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-gray-900">
                  ₹{Number(item.price).toFixed(0)}
                </span>
              )}
            </div>
          </div>
          <div className="ml-1 flex-shrink-0">
            {quantity > 0 ? (
              <div className="flex items-center bg-black/90 text-white rounded-full px-2 py-0.5 shadow">
                <button
                  onClick={handleDecrement}
                  className="text-white px-1 text-xs"
                >−</button>
                <span className="px-1 text-xs">{quantity}</span>
                <button
                  onClick={handleAddToCart}
                  className="text-white px-1 text-xs"
                >+</button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="bg-black/90 hover:bg-gray-800 text-white rounded-full px-2 py-0.5 flex items-center space-x-1 text-xs shadow"
              >
                <ShoppingBag className="h-3 w-3" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-1 flex-shrink-0">
          <DiscountTag />
        </div>
      </div>
    </motion.div>
  );
};

const Tags = ({ foodItems = [], onItemClick }) => {
  const [expandedTags, setExpandedTags] = useState(new Set());
  const scrollRefs = useRef({});

  // Group food items by tags, excluding bestseller and recommended
  const groupedByTags = React.useMemo(() => {
    const tagGroups = {};
    
    // Add null check for foodItems
    if (!foodItems || !Array.isArray(foodItems)) {
      return tagGroups;
    }
    
    foodItems.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase();
          // Skip bestseller and recommended tags
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
      <div className="mt-6 px-1 text-black">
        <h2 className="text-xl font-thick font-spartan-bold md:text-3xl mb-3">
          Browse by Categories
        </h2>
        <div className="text-gray-500 text-center py-4">
          No categories available
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 px-1 text-black pb-[100px]">
      <h2 className="text-xl font-thick font-spartan-bold md:text-3xl mb-3">
        Browse by Categories
      </h2>
      
      <div className="space-y-6">
        {Object.entries(groupedByTags).map(([tagKey, tagData]) => (
          <div key={tagKey} className="space-y-3">
            {/* Tag Header */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => toggleTag(tagKey)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-800 capitalize hover:text-orange-500 transition-colors md:text-2xl"
                type="button"
              >
                <span>{tagData.name}</span>
                {expandedTags.has(tagKey) ? (
                  <ChevronUp className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </button>
              
              {expandedTags.has(tagKey) && (
                <button
                  onClick={() => scroll(tagKey, scrollRefs.current[tagKey]?.clientWidth || 300)}
                  className="p-2 rounded-full bg-white text-gray-500 hover:bg-gray-100 transition-colors shadow-sm"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Expandable Content */}
            {expandedTags.has(tagKey) && (
              <div
                ref={(el) => scrollRefs.current[tagKey] = el}
                className="flex space-x-4 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
              >
                {tagData.items.map((item, index) => (
                  <div
                    key={`${tagKey}-${item.id}-${index}`}
                    className="opacity-0 animate-fade-in"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <RecommendationItem 
                      item={item} 
                      onImageClick={onItemClick} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Remove the style jsx block and add these classes to your CSS file or use inline styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Tags;