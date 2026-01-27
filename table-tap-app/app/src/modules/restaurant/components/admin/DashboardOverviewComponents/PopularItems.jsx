import React from 'react';

const PopularItems = ({ items }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Most Ordered Items</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all">
              <div className="w-16 h-16 overflow-hidden rounded-md border border-gray-200">
                <img 
                  src={item.image || `/api/placeholder/64/64`} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">₹{item.price}</p>
                <div className="mt-1 flex items-center">
                  <div className="flex space-x-2">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      {item.category}
                    </span>
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                      {item.orderCount || 0} orders
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularItems;