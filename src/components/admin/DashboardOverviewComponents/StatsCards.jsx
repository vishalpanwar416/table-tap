import React from 'react';
import { TrendingUp, ShoppingCart, User, Utensils, PieChart, ChevronUp, ChevronDown, Truck, CheckCircle } from 'lucide-react';

const StatsCards = ({ revenueData, orderStats, activeUsers, menuStats, isCollapsed, toggleCollapse }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
        <button onClick={toggleCollapse} className="p-1 rounded hover:bg-gray-100">
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-lg border border-orange-100 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Revenue</p>
                <p className="text-2xl font-bold mt-1">₹{revenueData.daily.toFixed(2)}</p>
              </div>
              <div className="bg-orange-500/10 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <ChevronUp size={14} />
              <span>{((revenueData.daily / ((revenueData.weekly / 7) || 1) - 1) * 100).toFixed(1)}% from yesterday</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold mt-1">{orderStats.total}</p>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex mt-2 justify-between text-xs">
              <span className="text-purple-600 flex items-center">
                <Truck size={12} className="mr-1" /> {orderStats.preparing || 0} preparing
              </span>
              <span className="text-green-600 flex items-center">
                <CheckCircle size={12} className="mr-1" /> {orderStats.ready} ready
              </span>
              <span className="text-blue-600 flex items-center">
                <CheckCircle size={12} className="mr-1" /> {orderStats.completed} completed
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-100 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold mt-1">{activeUsers}</p>
              </div>
              <div className="bg-green-500/10 p-2 rounded-lg">
                <User className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <CheckCircle size={14} className="mr-1" />
              <span>{((activeUsers / 100) * 100).toFixed(1)}% returning customers</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-100 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Menu Items</p>
                <p className="text-2xl font-bold mt-1">{menuStats.total}</p>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <Utensils className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-2 text-xs text-purple-600 flex items-center">
              <PieChart size={14} className="mr-1" />
              <span>Categories available</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCards;
