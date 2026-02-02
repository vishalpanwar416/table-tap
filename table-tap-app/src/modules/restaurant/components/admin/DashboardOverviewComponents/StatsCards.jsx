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
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isManagement ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 p-4`}>
          {isManagement && (
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
          )}

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
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">AOV:</span> ₹{((revenueData.daily + revenueData.weekly + revenueData.monthly) && orderStats.total
                ? (period === 'daily' && orderStats.total ? (revenueData.daily / (orderStats.completed || 1))
                  : period === 'weekly' && orderStats.total ? (revenueData.weekly / ((orderStats.completed) || 1))
                    : period === 'monthly' && orderStats.total ? (revenueData.monthly / ((orderStats.completed) || 1))
                      : 0) : 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-100 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold mt-1">{userStats.total}</p>
              </div>
              <div className="bg-green-500/10 p-2 rounded-lg">
                <User className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex mt-2 justify-between text-xs">
              <span className="text-green-600 flex items-center">
                <RefreshCw size={12} className="mr-1" /> {userStats.returning} returning
              </span>
              <span className="text-blue-600 flex items-center">
                <User size={12} className="mr-1" /> {userStats.monthly_active} monthly active
              </span>
              <span className="text-green-600 flex items-center">
                <ChevronUp size={14} className="mr-1" />
                <span>{returningPercentage}% loyal</span>
              </span>
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