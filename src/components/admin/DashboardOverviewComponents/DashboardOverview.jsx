import React, { useState, useEffect } from 'react';
import StatsCards from './StatsCards';
import RevenueChart from './RevenueChart';
import ActiveOrders from './ActiveOrders';
import PopularItems from './PopularItems';
import { generateChartData, formatDate, getStatusIcon, getStatusBadge } from './helpers';

const DashboardOverview = ({ orders, foodItems, updateOrderStatus, setActiveTab }) => {
  const [revenueData, setRevenueData] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, ready: 0, completed: 0, preparing: 0 });
  const [activeUsers, setActiveUsers] = useState(0);
  const [menuStats, setMenuStats] = useState({ total: 0, popular: [] });
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [isCollapsed, setIsCollapsed] = useState({ stats: false, chart: false });
  const [chartData, setChartData] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const now = new Date();
    const ready = orders.filter(o => o.status === 'ready').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;

    setOrderStats({
      total: ready + completed,
      preparing,
      ready,
      completed
    });

    const dailyOrders = orders.filter(order => {
      const date = new Date(order.created_at);
      return order.status === 'completed' && date.toDateString() === now.toDateString();
    });

    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyOrders = orders.filter(order => {
      const date = new Date(order.created_at);
      return order.status === 'completed' && date >= weekStart;
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = orders.filter(order => {
      const date = new Date(order.created_at);
      return order.status === 'completed' && date >= monthStart;
    });

    setRevenueData({
      daily: dailyOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
      weekly: weeklyOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
      monthly: monthlyOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
    });

    setActiveUsers(new Set(orders.map(o => o.userId || o.customerEmail || o.id)).size);

    // Calculate most ordered items - only from completed orders
    const itemCountMap = {};
    
    // Count occurrences of each item in completed orders only
    orders.filter(order => order.status === 'completed').forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemId = item.id || item.itemId;
          if (itemId) {
            itemCountMap[itemId] = (itemCountMap[itemId] || 0) + (item.quantity || 1);
          }
        });
      }
    });
    
    // Sort food items by their order count
    const popularItems = foodItems
      .map(item => ({
        ...item,
        orderCount: itemCountMap[item.id] || 0
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 6);
    
    setMenuStats({ 
      total: foodItems.length, 
      popular: popularItems 
    });

    setChartData(generateChartData(orders));
  }, [orders, foodItems]);

  const toggleCollapse = section => {
    setIsCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleOrderExpansion = orderId => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const activeOrders = orders.filter(order =>
    ['pending', 'preparing'].includes(order.status)
  );

  return (
    <div className="space-y-6">
      <StatsCards
        revenueData={revenueData}
        orderStats={orderStats}
        activeUsers={activeUsers}
        menuStats={menuStats}
        isCollapsed={isCollapsed.stats}
        toggleCollapse={() => toggleCollapse('stats')}
      />
      <RevenueChart
        chartData={chartData}
        chartPeriod={chartPeriod}
        isCollapsed={isCollapsed.chart}
        toggleCollapse={() => toggleCollapse('chart')}
        onChangePeriod={setChartPeriod}
      />
      <ActiveOrders
        orders={activeOrders}
        expandedOrderId={expandedOrderId}
        toggleOrderExpansion={toggleOrderExpansion}
        updateOrderStatus={updateOrderStatus}
        getStatusIcon={getStatusIcon}
        getStatusBadge={getStatusBadge}
        formatDate={formatDate}
        setActiveTab={setActiveTab}
      />
      <PopularItems items={menuStats.popular} />
    </div>
  );
};

export default DashboardOverview;