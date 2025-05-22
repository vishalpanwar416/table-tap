import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useLikes } from '../../config/LikesContent';

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

  return (
    <div className="w-[180px] flex-shrink-0 rounded-xl overflow-hidden relative shadow-lg group 
                    hover:shadow-xl transition-shadow duration-200
                    md:w-[280px] md:h-[220px]">
      <button
        onClick={() => onImageClick && onImageClick(item)}
        className="w-full h-32 md:h-[220px] block focus:outline-none"
        style={{ padding: 0, border: 'none', background: 'none' }}
      >
        <img 
          src={image} 
          alt={name} 
          className="w-full h-32 md:h-[220px] object-cover" 
        />
      </button>

      {/* Like Button */}
      <button 
        className="absolute top-2 left-2 bg-white/70 rounded-full p-1 z-10"
        onClick={() => toggleLike(item)}
      >
        <Heart 
          className={`h-4 w-4 md:h-6 md:w-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
        />
      </button>

      {/* Price Display */}
      <div className="absolute top-1 right-1 bg-black/80 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 min-w-[80px] min-h-[22px] md:min-w-[100px] md:min-h-[26px]">
        {item.discounttype && item.discountvalue ? (
          <>
            <span className="line-through text-gray-300 mr-1 whitespace-nowrap">₹{Number(item.price).toFixed(2)}</span>
            <span className="text-orange-400 font-semibold whitespace-nowrap">
              ₹{item.discounttype === 'Percentage'
                ? (item.price - (item.price * (item.discountvalue / 100))).toFixed(2)
                : Math.max(0, item.price - item.discountvalue).toFixed(2)
              }
            </span>
          </>
        ) : (
          <span className="font-semibold whitespace-nowrap text-white">₹{Number(item.price).toFixed(2)}</span>
        )}
      </div>

      {/* Cart Controls */}
      {quantity > 0 ? (
        <div className="absolute bottom-1 right-2 bg-black/80 text-white px-2 py-1 rounded-xl z-10 flex items-center gap-2 md: h-7">
          <button 
            onClick={handleDecrement}
            className="text-xs hover:bg-black/90 px-1 rounded md:text-[90%]"
          >
            -
          </button>
          <span className="text-xs md:text-[90%]">{quantity}</span>
          <button 
            onClick={handleAddToCart}
            className="text-xs hover:bg-black/90 px-1 rounded md:text-[90%]"
          >
            +
          </button>
        </div>
      ) : (
        <button 
          className="absolute bottom-1 right-1 bg-black/80 text-white px-2 py-1 rounded-xl z-10 flex items-center gap-1"
          onClick={handleAddToCart}
        >
          <ShoppingBag className="w-4 h-4 md:h-6 md:w-6" />
          <span className="text-[0%] md:text-[90%]">Add</span>
        </button>
      )}

      {/* Food Name Overlay */}
      <div className="absolute bottom-0 left-0 text-center px-0.2 pb-0.2">
        <span className="text-white text-xs font- bg-black/35 rounded-xl px-2 py-1 md:text-xl">
          {item.name}
        </span>
      </div>
    </div>
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
              >
                <h3>{tagData.name}</h3>
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
      
      <style jsx>{`
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