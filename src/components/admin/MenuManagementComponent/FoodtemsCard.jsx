import React, { useMemo } from 'react';
import { Edit, Trash2, Tag, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { toggleFoodItemActive } from '../../../api/foodService';

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
    <div className={`group relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 ${
      !item.is_active ? 'opacity-60' : ''
    }`}>
      {/* Status Badge */}
      <div className="absolute top-2 left-2 z-10">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          item.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {item.is_active ? (
            <>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              Active
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
              Inactive
            </>
          )}
        </span>
      </div>

      {/* Toggle Switch */}
      <div className="absolute top-2 right-2 z-10">
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

      {/* Image Section */}
      <div className="relative h-32 bg-gray-100">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-1">
                <Tag className="w-4 h-4" />
              </div>
              <p className="text-xs">No image</p>
            </div>
          </div>
        )}
        
        {/* Discount Badge */}
        {item.discounttype && item.discountvalue > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
            {item.discounttype === 'Percentage' 
              ? `${item.discountvalue}% OFF` 
              : `₹${item.discountvalue} OFF`
            }
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3">
        {/* Header */}
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {item.name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
          {item.description}
        </p>

        {/* Category & Tags */}
        <div className="mb-2">
          <span className="inline-block bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
            {item.category}
          </span>
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {item.tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  +{item.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-right">
            {item.discounttype && item.discountvalue ? (
              <div>
                <span className="text-gray-400 text-xs line-through">₹{item.price.toFixed(2)}</span>
                <div className="text-orange-600 font-bold text-base">₹{discountedPrice.toFixed(2)}</div>
              </div>
            ) : (
              <div className="text-orange-600 font-bold text-base">₹{item.price.toFixed(2)}</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex space-x-1">
            <button 
              onClick={() => handleEdit(item)}
              className="flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              aria-label="Edit item"
            >
              <Edit size={12} className="mr-1" />
              Edit
            </button>
            <button 
              onClick={() => handleDelete(item.id)}
              className="flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
              aria-label="Delete item"
            >
              <Trash2 size={12} className="mr-1" />
              Delete
            </button>
          </div>
          
          {/* Quick Status Indicator */}
          <div className="flex items-center text-xs text-gray-500">
            {item.is_active ? (
              <>
                <Eye size={10} className="mr-1" />
                Visible
              </>
            ) : (
              <>
                <EyeOff size={10} className="mr-1" />
                Hidden
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
};

export default React.memo(FoodItemCard);