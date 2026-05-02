import React from 'react';
import { TrendingUp, ShoppingCart, User, Utensils, PieChart, ChevronUp, ChevronDown, Truck, CheckCircle, RefreshCw, BarChart3 } from 'lucide-react';

const StatsCards = ({ revenueData, orderStats, activeUsers, menuStats, isCollapsed, toggleCollapse, period, onChangePeriod, userRole }) => {
  const isManagement = ['admin', 'manager', 'owner'].includes(userRole);

  const userStats = typeof activeUsers === 'object' ? activeUsers : {
    total: activeUsers || 0,
    returning: Math.floor((activeUsers || 0) * 0.65),
    new: Math.floor((activeUsers || 0) * 0.35),
    monthly_active: Math.floor((activeUsers || 0) * 0.75)
  };

  const returningPercentage = userStats.total > 0
    ? ((userStats.returning / userStats.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      <div className="flex justify-between items-center p-3 md:p-5 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight">Quick Insights</h3>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            {isManagement ? (
              ['daily', 'weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => onChangePeriod(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${period === p
                    ? 'bg-white text-orange-600 shadow-sm border border-orange-100'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1, 3)}
                </button>
              ))
            ) : (
              <span className="px-3 py-1.5 text-[10px] text-orange-600 font-bold uppercase tracking-widest">
                Real-time
              </span>
            )}
          </div>
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors"
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className={`p-2.5 md:p-5 grid grid-cols-2 ${isManagement ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-2 md:gap-5`}>
          {isManagement && (
            <div className="group relative overflow-hidden bg-white p-3 md:p-4 rounded-xl border border-gray-100 hover:border-orange-200 transition-all hover:shadow-xl hover:shadow-orange-500/5">
              <div className="flex justify-between items-start mb-1.5">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                  <TrendingUp size={16} className="md:w-5 md:h-5" />
                </div>
                <div className="flex items-center gap-0.5 text-[8px] md:text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  <ChevronUp size={8} />
                  <span>{((revenueData.daily / ((revenueData.weekly / 7) || 1) - 1) * 100).toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
              <h4 className="text-base md:text-2xl font-black text-gray-900 mt-0.5 tracking-tight truncate">
                ₹{revenueData.daily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h4>
            </div>
          )}

          <div className="group relative overflow-hidden bg-white p-3 md:p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-all hover:shadow-xl hover:shadow-blue-500/5">
            <div className="flex justify-between items-start mb-1.5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <ShoppingCart size={16} className="md:w-5 md:h-5" />
              </div>
              <span className="text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                Order
              </span>
            </div>
            <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Orders</p>
            <h4 className="text-base md:text-2xl font-black text-gray-900 mt-0.5 tracking-tight">
              {orderStats.total}
            </h4>
            <div className="mt-2 flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-gray-400">
              <span className="text-orange-500">{orderStats.preparing || 0}P</span>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="text-green-500">{orderStats.ready}R</span>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white p-3 md:p-4 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-500/5">
            <div className="flex justify-between items-start mb-1.5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <User size={16} className="md:w-5 md:h-5" />
              </div>
              <div className="text-[8px] md:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                {returningPercentage}%
              </div>
            </div>
            <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Guests</p>
            <h4 className="text-base md:text-2xl font-black text-gray-900 mt-0.5 tracking-tight">
              {userStats.total}
            </h4>
          </div>

          <div className="group relative overflow-hidden bg-white p-3 md:p-4 rounded-xl border border-gray-100 hover:border-amber-200 transition-all hover:shadow-xl hover:shadow-amber-500/5">
            <div className="flex justify-between items-start mb-1.5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Utensils size={16} className="md:w-5 md:h-5" />
              </div>
            </div>
            <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Dishes</p>
            <h4 className="text-base md:text-2xl font-black text-gray-900 mt-0.5 tracking-tight">
              {menuStats.total}
            </h4>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCards;