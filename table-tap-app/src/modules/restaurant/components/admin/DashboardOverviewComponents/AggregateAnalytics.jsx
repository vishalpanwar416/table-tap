import React, { useState, useEffect } from 'react';
import { useAdminRestaurant } from '../../../../shared/context/AdminRestaurantContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Calendar,
  Store
} from 'lucide-react';

const AggregateAnalytics = ({ onSelectRestaurant }) => {
  const { ownedRestaurants, setOwnerRestaurant } = useAdminRestaurant();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aggregateData, setAggregateData] = useState(null);
  const [restaurantStats, setRestaurantStats] = useState([]);
  const [period, setPeriod] = useState('weekly');
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);

  // Fetch aggregate analytics data for all owned restaurants (dynamic import avoids chunk supabase undefined)
  const fetchAggregateData = async () => {
    if (!ownedRestaurants || ownedRestaurants.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { supabase } = await import('../../../../shared/supabase');
      if (!supabase) {
        setLoading(false);
        return;
      }

      const restaurantIds = ownedRestaurants.map(r => r.id);
      const now = new Date();

      // Calculate date ranges
      let startDate;
      if (period === 'daily') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'weekly') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Fetch orders for all restaurants
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('restaurant_id', restaurantIds)
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Process aggregate data
      let totalRevenue = 0;
      let totalOrders = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      const restaurantData = {};

      // Initialize restaurant data
      ownedRestaurants.forEach(r => {
        restaurantData[r.id] = {
          id: r.id,
          name: r.name,
          logo_url: r.logo_url,
          revenue: 0,
          orders: 0,
          completed: 0,
          pending: 0,
          preparing: 0,
          avgOrderValue: 0,
          popularItems: {},
          revenueByDay: {}
        };
      });

      // Process orders
      (ordersData || []).forEach(order => {
        const restaurantId = order.restaurant_id;
        const orderTotal = parseFloat(order.total) || 0;

        if (restaurantData[restaurantId]) {
          restaurantData[restaurantId].orders += 1;
          totalOrders += 1;

          if (order.status === 'completed') {
            restaurantData[restaurantId].revenue += orderTotal;
            restaurantData[restaurantId].completed += 1;
            totalRevenue += orderTotal;
            completedOrders += 1;

            // Track daily revenue
            const orderDate = new Date(order.created_at).toDateString();
            restaurantData[restaurantId].revenueByDay[orderDate] =
              (restaurantData[restaurantId].revenueByDay[orderDate] || 0) + orderTotal;
          } else if (order.status === 'pending') {
            restaurantData[restaurantId].pending += 1;
            pendingOrders += 1;
          } else if (order.status === 'preparing') {
            restaurantData[restaurantId].preparing += 1;
          }

          // Track popular items
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              const itemName = item.name || item.title || 'Unknown';
              restaurantData[restaurantId].popularItems[itemName] =
                (restaurantData[restaurantId].popularItems[itemName] || 0) + (item.quantity || 1);
            });
          }
        }
      });

      // Calculate average order value for each restaurant
      Object.keys(restaurantData).forEach(id => {
        const data = restaurantData[id];
        if (data.completed > 0) {
          data.avgOrderValue = data.revenue / data.completed;
        }
        // Convert popular items to sorted array
        data.topItems = Object.entries(data.popularItems)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
      });

      // Sort restaurants by revenue
      const sortedRestaurants = Object.values(restaurantData).sort((a, b) => b.revenue - a.revenue);

      setAggregateData({
        totalRevenue,
        totalOrders,
        completedOrders,
        pendingOrders,
        avgOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
        restaurantCount: ownedRestaurants.length
      });

      setRestaurantStats(sortedRestaurants);
    } catch (err) {
      console.error('Error fetching aggregate data:', err);
      setError('Failed to load aggregate analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregateData();
  }, [ownedRestaurants, period]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleRestaurantClick = async (restaurantId) => {
    if (onSelectRestaurant) {
      onSelectRestaurant(restaurantId);
    } else {
      await setOwnerRestaurant(restaurantId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading aggregate analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAggregateData}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <RefreshCw size={16} className="inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!ownedRestaurants || ownedRestaurants.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Restaurants Found</h3>
        <p className="text-gray-500">You don't have any restaurants associated with your account yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Building2 size={24} />
              </div>
              <h2 className="text-2xl font-bold">Multi-Restaurant Overview</h2>
            </div>
            <p className="text-white/80">
              Consolidated analytics across {aggregateData?.restaurantCount} restaurant{aggregateData?.restaurantCount > 1 ? 's' : ''}
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white/20 rounded-xl p-1">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
              {period}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(aggregateData?.totalRevenue || 0)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
              {aggregateData?.completedOrders || 0} completed
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{aggregateData?.totalOrders || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Orders</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BarChart3 size={20} className="text-primary-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(aggregateData?.avgOrderValue || 0)}</p>
          <p className="text-sm text-gray-500 mt-1">Avg Order Value</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Store size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{aggregateData?.restaurantCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Active Restaurants</p>
        </div>
      </div>

      {/* Restaurant Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-500" />
              Restaurant Performance
            </h3>
            <button
              onClick={fetchAggregateData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {restaurantStats.map((restaurant, index) => (
            <div key={restaurant.id} className="hover:bg-gray-50 transition-colors">
              {/* Restaurant Row */}
              <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedRestaurant(
                  expandedRestaurant === restaurant.id ? null : restaurant.id
                )}
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-primary-100 text-primary-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>

                {/* Restaurant Logo & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {restaurant.logo_url ? (
                      <img
                        src={restaurant.logo_url}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{restaurant.name}</p>
                    <p className="text-xs text-gray-500">
                      {restaurant.orders} orders • {restaurant.completed} completed
                    </p>
                  </div>
                </div>

                {/* Revenue */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900">{formatCurrency(restaurant.revenue)}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>

                {/* Expand Icon */}
                <div className="flex-shrink-0">
                  {expandedRestaurant === restaurant.id ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRestaurant === restaurant.id && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Avg Order</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(restaurant.avgOrderValue)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Pending</p>
                      <p className="font-semibold text-amber-600">{restaurant.pending}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Preparing</p>
                      <p className="font-semibold text-blue-600">{restaurant.preparing}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Completed</p>
                      <p className="font-semibold text-green-600">{restaurant.completed}</p>
                    </div>
                  </div>

                  {/* Top Items */}
                  {restaurant.topItems && restaurant.topItems.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Top Selling Items</p>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.topItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-white px-2 py-1 rounded-full border border-gray-200"
                          >
                            {item.name} ({item.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Full Dashboard Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestaurantClick(restaurant.id);
                    }}
                    className="mt-4 w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    View Full Dashboard
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Comparison Chart Placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary-500" />
          Revenue Comparison
        </h3>
        <div className="space-y-3">
          {restaurantStats.map((restaurant) => {
            const maxRevenue = Math.max(...restaurantStats.map(r => r.revenue)) || 1;
            const widthPercent = (restaurant.revenue / maxRevenue) * 100;

            return (
              <div key={restaurant.id} className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600 truncate">{restaurant.name}</div>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-amber-400 rounded-lg flex items-center justify-end px-2 transition-all duration-500"
                    style={{ width: `${Math.max(widthPercent, 5)}%` }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {formatCurrency(restaurant.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AggregateAnalytics;
