import React, { useMemo } from 'react';
import { Edit, Trash2, Tag } from 'lucide-react';

const FoodItemCard = ({ item, handleEdit, handleDelete }) => {
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

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-24 h-24 bg-gray-100">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <div className="flex-1 p-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
            <div className="text-right">
              {item.discounttype && item.discountvalue ? (
                <div>
                  <span className="text-gray-400 text-xs line-through mr-1">₹{item.price.toFixed(2)}</span>
                  <span className="text-orange-500 font-semibold">₹{discountedPrice.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-orange-500 font-semibold">₹{item.price.toFixed(2)}</span>
              )}
              
              {item.discounttype && item.discountvalue > 0 && (
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <Tag size={12} className="mr-1" />
                  {item.discounttype === 'Percentage' 
                    ? `${item.discountvalue}% off` 
                    : `₹${item.discountvalue} off`
                  }
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
          <div className="flex justify-between items-center mt-2">
            <div>
              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                {item.category}
              </span>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {item.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{item.tags.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-1">
              <button 
                onClick={() => handleEdit(item)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                aria-label="Edit item"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                aria-label="Delete item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FoodItemCard);