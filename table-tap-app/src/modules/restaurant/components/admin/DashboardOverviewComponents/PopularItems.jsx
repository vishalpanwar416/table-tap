import React from 'react';
import { Stars, ArrowUpRight } from 'lucide-react';

const PopularItems = ({ items }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="p-3 md:p-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
            <Stars className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight">Best Sellers</h3>
        </div>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">
          Top {items.length}
        </span>
      </div>
      <div className="p-2 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="group relative flex items-center gap-3 p-2 rounded-xl border border-gray-50 bg-white hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 active:scale-[0.98]"
            >
              <div className="relative w-12 h-12 md:w-20 md:h-20 flex-shrink-0">
                <div className="w-full h-full overflow-hidden rounded-lg border border-gray-100 group-hover:border-primary-100 transition-colors">
                  <img
                    src={item.image || `/api/placeholder/100/100`}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-md bg-gray-900 text-white flex items-center justify-center text-[9px] font-black italic shadow-lg">
                  {index + 1}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="font-bold text-gray-900 text-xs md:text-base leading-tight truncate">
                    {item.name}
                  </p>
                  <ArrowUpRight className="w-2.5 h-2.5 text-gray-300 group-hover:text-primary-500 transition-colors hidden md:block" />
                </div>
                <p className="text-[11px] md:text-sm font-black text-primary-600 mt-0.5">₹{item.price}</p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 text-[8px] md:text-[9px] font-bold rounded-md bg-gray-100 text-gray-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <div className="h-3 w-px bg-gray-100" />
                  <span className="text-[9px] md:text-[10px] font-bold text-green-600 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    {item.orderCount || 0} Sold
                  </span>
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