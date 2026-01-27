import React, { useMemo } from 'react';
import { Edit, Trash2, Tag, Eye, EyeOff, Utensils } from 'lucide-react';
import { toggleFoodItemActive } from '../../../../customer/api/foodService';

const FoodItemCard = ({ item, handleEdit, handleDelete, fetchFoodItems }) => {
  // Calculate discounted price
  const discountedPrice = useMemo(() => {
    if (!item.discounttype || !item.discountvalue) return item.price;
    
    if (item.discounttype === 'Percentage') {
      return item.price - (item.price * (item.discountvalue / 100));
    } else if (item.discounttype === 'Fixed') {
      return Math.max(0, item.price - item.discountvalue);
    }
    return item.price;
  }, [item.price, item.discounttype, item.discountvalue]);

  const handleToggle = async () => {
    try {
      await toggleFoodItemActive(item.id, !item.is_active);
      await fetchFoodItems(); // Refresh the list
    } catch (error) {
      alert('Failed to update item status');
    }
  };

  return (
    <div className={`group relative bg-gradient-to-br from-white via-orange-50 to-white border border-orange-100 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:scale-[1.025] transition-all duration-300 ${
      !item.is_active ? 'opacity-60' : ''
    }`}>
      {/* BADGES: Elegant pill badges with gradient */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow bg-gradient-to-r ${
          item.is_active 
            ? 'from-green-200 to-green-400 text-green-900' 
            : 'from-red-200 to-red-400 text-red-900'
        }`}>
          {item.is_active ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Inactive
            </>
          )}
        </span>
        {item.discounttype && item.discountvalue > 0 && (
          <span className="bg-gradient-to-r from-red-400 to-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow">
            {item.discounttype === 'Percentage' 
              ? `${item.discountvalue}% OFF` 
              : `₹${item.discountvalue} OFF`
            }
          </span>
        )}
      </div>

      {/* Toggle Switch */}
      <div className="absolute top-3 right-3 z-10">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.is_active}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
        </label>
      </div>

      {/* IMAGE: Increase height, keep rounded corners, overlay for readability */}
      <div className="relative h-52 bg-gray-100 overflow-hidden rounded-t-2xl">
        {item.image ? (
          <>
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-orange-300 bg-orange-50">
            <Utensils className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* CONTENT: Decrease padding, compact layout, visually improved */}
      <div className="p-3">
        {/* Top Row: Name (left) and Price (right) */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-extrabold text-gray-900 text-base leading-tight truncate"
              title={item.name}
            >
              {item.name}
            </h3>
            <p className="text-gray-500 text-xs truncate" title={item.description}>
              {item.description}
            </p>
            <div className="mt-1 flex flex-wrap gap-1 items-center">
              <span className="inline-flex items-center bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold shadow-sm">
                <Utensils className="w-3 h-3 mr-1" />
                {item.category}
              </span>
              {item.tags && item.tags.length > 0 && (
                <>
                  {item.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full shadow-sm">
                      #{tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      +{item.tags.length - 2}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Price Section: Right-aligned */}
          <div className="ml-3 text-right flex-shrink-0 min-w-[90px]">
            {item.discounttype && item.discountvalue ? (
              <div>
                <span className="text-gray-400 text-xs line-through block">₹{item.price.toFixed(2)}</span>
                <div className="text-orange-600 font-extrabold text-base">₹{discountedPrice.toFixed(2)}</div>
                <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
                  You save ₹{(item.price - discountedPrice).toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="text-orange-600 font-extrabold text-base">₹{item.price.toFixed(2)}</div>
            )}
          </div>
        </div>
        {/* Action Buttons and Status Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleEdit(item)}
              className="flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
              aria-label="Edit item"
              title="Edit"
            >
              <Edit size={18} />
            </button>
            <button 
              onClick={() => handleDelete(item.id)}
              className="flex items-center justify-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
              aria-label="Delete item"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
          {/* Quick Status Indicator */}
          <div className="flex items-center text-xs text-gray-400">
            {item.is_active ? (
              <>
                <Eye size={12} className="mr-1" />
                Visible
              </>
            ) : (
              <>
                <EyeOff size={12} className="mr-1" />
                Hidden
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
};

export default React.memo(FoodItemCard);