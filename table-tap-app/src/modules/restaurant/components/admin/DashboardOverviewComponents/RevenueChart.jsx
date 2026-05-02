import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, TrendingUp, ShoppingBag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const RevenueChart = ({ chartData, chartPeriod, isCollapsed, toggleCollapse, onChangePeriod }) => {
  const [mobileMetric, setMobileMetric] = useState('revenue');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate totals for mobile view
  const totalRevenue = chartData.reduce((acc, curr) => acc + (parseFloat(curr.revenue) || 0), 0);
  const totalOrders = chartData.reduce((acc, curr) => acc + (parseInt(curr.orders) || 0), 0);

  // Custom Toolkit for Mobile
  const CustomMobileTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className={`text-sm font-bold ${mobileMetric === 'revenue' ? 'text-orange-600' : 'text-blue-600'}`}>
            {mobileMetric === 'revenue' ? `₹${payload[0].value.toFixed(2)}` : `${payload[0].value} Orders`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Desktop View */}
      {!isMobile && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Revenue Analysis</h3>
            <div className="flex items-center space-x-2">
              <select
                className="text-sm border rounded p-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                value={chartPeriod}
                onChange={(e) => onChangePeriod(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                onClick={toggleCollapse}
                className="p-1 rounded hover:bg-gray-100"
              >
                {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          {!isCollapsed && (
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
      )}

      {/* Mobile View */}
      {isMobile && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-50 rounded-lg">
                <TrendingUp size={20} className="text-gray-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Analytics</h3>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['daily', 'weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => onChangePeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${chartPeriod === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setMobileMetric('revenue')}
              className={`flex-1 p-4 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden ${mobileMetric === 'revenue'
                ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
                : 'bg-white border-gray-200 hover:border-orange-100'
                }`}
            >
              <div className={`text-xs font-semibold mb-1 ${mobileMetric === 'revenue' ? 'text-orange-600' : 'text-gray-500'}`}>
                Revenue
              </div>
              <div className="text-xl font-bold text-gray-900">
                ₹{totalRevenue.toLocaleString()}
              </div>
              {mobileMetric === 'revenue' && (
                <div className="absolute right-0 top-0 p-3 opacity-10">
                  <TrendingUp size={40} className="text-orange-600" />
                </div>
              )}
            </button>

            <button
              onClick={() => setMobileMetric('orders')}
              className={`flex-1 p-4 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden ${mobileMetric === 'orders'
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                : 'bg-white border-gray-200 hover:border-blue-100'
                }`}
            >
              <div className={`text-xs font-semibold mb-1 ${mobileMetric === 'orders' ? 'text-blue-600' : 'text-gray-500'}`}>
                Orders
              </div>
              <div className="text-xl font-bold text-gray-900">
                {totalOrders}
              </div>
              {mobileMetric === 'orders' && (
                <div className="absolute right-0 top-0 p-3 opacity-10">
                  <ShoppingBag size={40} className="text-blue-600" />
                </div>
              )}
            </button>
          </div>

          {/* Chart Area */}
          <div className="h-56 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  dy={10}
                />
                <Tooltip content={<CustomMobileTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey={mobileMetric}
                  stroke={mobileMetric === 'revenue' ? '#f97316' : '#3b82f6'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#${mobileMetric === 'revenue' ? 'colorRevenue' : 'colorOrders'})`}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default RevenueChart;
