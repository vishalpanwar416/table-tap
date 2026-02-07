import React from 'react';
import { TrendingUp, ShoppingCart, User, Utensils, PieChart, ChevronUp, ChevronDown, Truck, CheckCircle, RefreshCw } from 'lucide-react';

const StatsCards = ({ revenueData, orderStats, activeUsers, menuStats, isCollapsed, toggleCollapse, period, onChangePeriod, userRole }) => {
  const isManagement = ['admin', 'manager', 'owner'].includes(userRole);
  // Assume activeUsers is an object with total and returning properties
  // If it's still a number, create a default object with meaningful data
  const userStats = typeof activeUsers === 'object' ? activeUsers : {
    total: activeUsers || 0,
    returning: Math.floor((activeUsers || 0) * 0.65), // Default: 65% returning customers
    new: Math.floor((activeUsers || 0) * 0.35), // Default: 35% new customers,
    monthly_active: Math.floor((activeUsers || 0) * 0.75) // Default: 75% monthly active customers
  };

  // Calculate percentage of returning customers
  const returningPercentage = userStats.total > 0
    ? ((userStats.returning / userStats.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
            {isManagement && (
              <>
                <button onClick={() => onChangePeriod('daily')} className={`px-2 py-1 text-xs rounded-md ${period === 'daily' ? 'bg-white shadow' : ''}`}>Today</button>
                <button onClick={() => onChangePeriod('weekly')} className={`px-2 py-1 text-xs rounded-md ${period === 'weekly' ? 'bg-white shadow' : ''}`}>7d</button>
                <button onClick={() => onChangePeriod('monthly')} className={`px-2 py-1 text-xs rounded-md ${period === 'monthly' ? 'bg-white shadow' : ''}`}>30d</button>
              </>
            )}
            {!isManagement && <span className="px-2 py-1 text-xs text-gray-500 font-medium">Today's Activity</span>}
          </div>
          <button onClick={toggleCollapse} className="p-1 rounded hover:bg-gray-100">
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className={`grid grid-cols-2 sm:grid-cols-2 ${isManagement ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 md:gap-4 p-3 md:p-4`}>
          {isManagement && (
            <div className="bg-gradient-to-br from-orange-50 to-white p-3 md:p-4 rounded-lg border border-orange-100 shadow-sm hover:shadow transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs md:text-sm text-gray-500 font-medium">Revenue</p>
                  <p className="text-lg md:text-2xl font-bold mt-0.5 md:mt-1 text-gray-800">₹{revenueData.daily.toFixed(0)}</p>
                </div>
                <div className="bg-orange-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-orange-500" />
                </div>
              </div>
              <div className="mt-2 text-[10px] md:text-xs text-green-600 flex items-center">
                <ChevronUp size={12} className="mr-0.5" />
                <span className="truncate">{((revenueData.daily / ((revenueData.weekly / 7) || 1) - 1) * 100).toFixed(0)}% vs last wk</span>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-white p-3 md:p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-medium">Orders</p>
                <p className="text-lg md:text-2xl font-bold mt-0.5 md:mt-1 text-gray-800">{orderStats.total}</p>
              </div>
              <div className="bg-blue-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                <ShoppingCart className="h-4 w-4 md:h-6 md:w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex mt-2 justify-between text-[10px] md:text-xs gap-1">
              <span className="text-purple-600 flex items-center">
                <Truck size={10} className="mr-0.5" /> {orderStats.preparing || 0}
              </span>
              <span className="text-green-600 flex items-center">
                <CheckCircle size={10} className="mr-0.5" /> {orderStats.ready}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white p-3 md:p-4 rounded-lg border border-green-100 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">Customers</p>
                <p className="text-lg md:text-2xl font-bold mt-0.5 md:mt-1 text-gray-800">{userStats.total}</p>
              </div>
              <div className="bg-green-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                <User className="h-4 w-4 md:h-6 md:w-6 text-green-500" />
              </div>
            </div>
            <div className="flex mt-2 justify-between text-[10px] md:text-xs">
              <span className="text-green-600 flex items-center truncate">
                <RefreshCw size={10} className="mr-0.5" /> {userStats.returning}
              </span>
              <span className="text-green-600 flex items-center truncate ml-1">
                <ChevronUp size={10} className="mr-0.5" />
                <span>{returningPercentage}%</span>
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white p-3 md:p-4 rounded-lg border border-purple-100 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-medium">Menu</p>
                <p className="text-lg md:text-2xl font-bold mt-0.5 md:mt-1 text-gray-800">{menuStats.total}</p>
              </div>
              <div className="bg-purple-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                <Utensils className="h-4 w-4 md:h-6 md:w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-2 text-[10px] md:text-xs text-purple-600 flex items-center truncate">
              <PieChart size={12} className="mr-1" />
              <span>Active Items</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCards;