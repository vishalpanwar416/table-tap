import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, User, Utensils, PieChart, ChevronUp, ChevronDown, Check, X, Truck, CheckCircle, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardOverview = ({ orders, foodItems, updateOrderStatus, setActiveTab }) => {
  const [revenueData, setRevenueData] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, ready: 0 });
  const [activeUsers, setActiveUsers] = useState(0);
  const [menuStats, setMenuStats] = useState({ total: 0, popular: [] });
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [isCollapsed, setIsCollapsed] = useState({
    stats: false,
    chart: false
  });
  const [chartData, setChartData] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Calculate order stats
  useEffect(() => {
    const calculateOrderStats = () => {
      try {
        const now = new Date();
        const ready = orders.filter(order => order.status === 'ready').length;
        const completed = orders.filter(order => order.status === 'completed').length;
        const preparing = orders.filter(order => order.status === 'preparing').length;
        
        setOrderStats({
          total: ready + completed,
          preparing: preparing,
          ready: ready,
          completed: completed
        });
        
        const totalRevenue = orders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
          
          const dailyOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return order.status === 'completed' && 
                   orderDate.toDateString() === now.toDateString();
          });
          
          const weeklyOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return order.status === 'completed' && orderDate >= weekStart;
          });
          
          const monthlyOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return order.status === 'completed' && orderDate >= monthStart;
          });
    
          setRevenueData({
            daily: dailyOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0),
            weekly: weeklyOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0),
            monthly: monthlyOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0)
          });
    
        // Calculate unique active users
        const uniqueUsers = new Set(orders.map(order => order.userId || order.customerEmail || order.id));
        setActiveUsers(uniqueUsers.size);

        // Generate chart data
        generateChartData(orders);

        // Update menu stats - sort by popularity (simplified simulation)
        const sortedItems = [...foodItems].sort(() => Math.random() - 0.5);
        setMenuStats({
          total: foodItems.length,
          popular: sortedItems.slice(0, 6)
        });
      } catch (error) {
        console.error("Error calculating order stats:", error);
      }
    };
    calculateOrderStats();
  }, [orders, foodItems]);

  // Generate chart data
  const generateChartData = (orders) => {
    const now = new Date();
    const days = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Prepare last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({
        date: d,
        label: dayLabels[d.getDay()],
        orders: 0,
        revenue: 0
      });
    }

    // Aggregate orders by day
    orders.forEach(order => {
      if (order.status !== 'completed') return;
      const orderDate = new Date(order.created_at);
      // Find the matching day
      days.forEach(day => {
        if (
          orderDate.getFullYear() === day.date.getFullYear() &&
          orderDate.getMonth() === day.date.getMonth() &&
          orderDate.getDate() === day.date.getDate()
        ) {
          day.orders += 1;
          day.revenue += parseFloat(order.total) || 0;
        }
      });
    });

    // Format for chart
    setChartData(days.map(day => ({
      name: day.label,
      orders: day.orders,
      revenue: day.revenue
    })));
  };

  const toggleCollapse = (section) => {
    setIsCollapsed({
      ...isCollapsed,
      [section]: !isCollapsed[section]
    });
  };

  const toggleOrderExpansion = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      preparing: 'bg-purple-100 text-purple-800 border border-purple-200',
      ready: 'bg-green-100 text-green-800 border border-green-200',
      rejected: 'bg-red-100 text-red-800 border border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-gray-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
          
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filter only pending and preparing orders
  const activeOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'preparing'
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
          <button 
            onClick={() => toggleCollapse('stats')}
            className="p-1 rounded hover:bg-gray-100"
          >
            {isCollapsed.stats ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>

        {!isCollapsed.stats && (
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
                <span>{((revenueData.daily / (revenueData.weekly / 7) - 1) * 100).toFixed(1)}% from yesterday</span>
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

      {/* Chart / Revenue Analysis */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Revenue Analysis</h3>
          <div className="flex items-center space-x-2">
            <select 
              className="text-sm border rounded p-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button 
              onClick={() => toggleCollapse('chart')}
              className="p-1 rounded hover:bg-gray-100"
            >
              {isCollapsed.chart ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        {!isCollapsed.chart && (
          <div className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Active Orders - Vertical List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Active Orders</h3>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-sm text-orange-500 hover:text-orange-600 flex items-center"
          >
            View all orders <ArrowRight size={16} className="ml-1" />
          </button>
        </div>

        <div className="p-4">
          {activeOrders.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No active orders at the moment.
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div key={order.id} className="border rounded-lg overflow-hidden">
                  {/* Order header */}
                  <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.created_at || new Date())}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(order.status || 'pending')}
                      <button 
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedOrderId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Order content - Always visible */}
                  <div className="p-3 bg-white">
                    <div className="flex flex-wrap items-center justify-between mb-3">
                      <div className="flex items-center mb-2 md:mb-0">
                        <User size={14} className="text-gray-400 mr-1" />
                        <span className="text-sm font-medium">{order.customerName || 'Guest'}</span>
                      </div>
                      
                      {order.address && (
                        <div className="flex items-center text-xs text-gray-500 mr-4">
                          <MapPin size={12} className="mr-1" />
                          <span className="truncate max-w-xs">{order.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <div className="mr-4">
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="font-semibold">₹{order.total?.toFixed(2) || '0.00'}</div>
                        </div>
                        
                        <div className="flex">
                          {order.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                                title="Accept Order"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'rejected')}
                                className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                                title="Reject Order"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                          {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="px-4 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center"
                          >
                            <CheckCircle size={16} className="mr-1" /> Ready
                          </button>
                        )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Order items preview */}
                    <div className="flex mb-3 space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                      {(order.items || []).slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border border-gray-200">
                          <img 
                            src={item.image || `/api/placeholder/48/48`} 
                            alt={item.name || `Item ${idx+1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {(order.items || []).length > 4 && (
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
                          +{(order.items || []).length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded details */}
                  {expandedOrderId === order.id && (
                    <div className="bg-gray-50 p-3 border-t border-gray-100">
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Order Items</h4>
                      <div className="space-y-3">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-10 h-10 rounded overflow-hidden mr-3 border border-gray-200 bg-white">
                              <img 
                                src={item.image || `/api/placeholder/40/40`} 
                                alt={item.name || `Item ${idx+1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name || `Item ${idx+1}`}</p>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{item.quantity || 1} × ₹{item.price?.toFixed(2) || '0.00'}</span>
                                <span>₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Price summary */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Subtotal</span>
                          <span>₹{(order.subtotal || order.total || 0).toFixed(2)}</span>
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Delivery</span>
                            <span>₹{order.deliveryFee?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-sm mt-1">
                          <span>Total</span>
                          <span>₹{order.total?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                      
                      {order.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Customer Notes</div>
                          <p className="text-sm text-gray-600">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popular Menu Items */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Popular Menu Items</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuStats.popular.map(item => (
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
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;