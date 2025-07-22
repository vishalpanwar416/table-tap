import React, { useState, useEffect } from 'react';
import StatsCards from './StatsCards';
import RevenueChart from './RevenueChart';
import ActiveOrders from './ActiveOrders';
import PopularItems from './PopularItems';
import { generateChartData, formatDate, getStatusIcon, getStatusBadge } from './helpers';
import * as XLSX from 'xlsx';
import { supabase } from '../../../supabase';

const DashboardOverview = ({ foodItems, updateOrderStatus, setActiveTab }) => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [revenueData, setRevenueData] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, ready: 0, completed: 0, preparing: 0 });
  const [activeUsers, setActiveUsers] = useState(0);
  const [menuStats, setMenuStats] = useState({ total: 0, popular: [] });
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [isCollapsed, setIsCollapsed] = useState({ stats: false, chart: false });
  const [chartData, setChartData] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    let loadingTimeout;
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        loadingTimeout = setTimeout(() => {
          setOrdersLoading(false);
          setOrdersError('Orders request took too long. Please try again.');
        }, 15000);

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
        setOrdersError('');
      } catch (error) {
        setOrdersError('Failed to load orders: ' + (error.message || error));
      } finally {
        clearTimeout(loadingTimeout);
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, []);

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

  // Helper to filter orders by period
  const getOrdersByPeriod = (period) => {
    const now = new Date();
    if (period === 'daily') {
      return orders.filter(order => {
        const date = new Date(order.created_at);
        return date.toDateString() === now.toDateString();
      });
    }
    if (period === 'weekly') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orders.filter(order => {
        const date = new Date(order.created_at);
        return date >= weekStart;
      });
    }
    if (period === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return orders.filter(order => {
        const date = new Date(order.created_at);
        return date >= monthStart;
      });
    }
    return [];
  };

  // Helper to format order data for Excel
  const formatOrdersForExcel = (orders) => {
    return orders.map(order => ({
      ID: order.id,
      OrderNumber: order.order_number || '',
      UserID: order.user_id || '',
      CustomerName: order.customer_name || '',
      CustomerEmail: order.customer_email || '',
      CustomerPhone: order.customer_phone || '',
      TableNumber: order.table_number || '',
      Status: order.status || '',
      PaymentMethod: order.payment_method || '',
      PaymentStatus: order.payment_status || '',
      PaymentNotes: order.payment_notes || '',
      PaymentTimestamp: order.payment_timestamp ? new Date(order.payment_timestamp).toLocaleString() : '',
      Subtotal: order.subtotal || 0,
      GST: order.gst || 0,
      Discount: order.discount || 0,
      Total: parseFloat(order.total) || 0,
      RazorpayOrderID: order.razorpay_order_id || '',
      RazorpayPaymentID: order.razorpay_payment_id || '',
      RazorpaySignature: order.razorpay_signature || '',
      SpecialInstructions: order.special_instructions || '',
      CancelReason: order.cancel_reason || '',
      CreatedAt: order.created_at ? new Date(order.created_at).toLocaleString() : '',
      UpdatedAt: order.updated_at ? new Date(order.updated_at).toLocaleString() : '',
      CompletedAt: order.completed_at ? new Date(order.completed_at).toLocaleString() : '',
      Items: (order.items || []).map(i => `${i.name || i.title} x${i.quantity || 1}`).join(', ')
    }));
  };

  // Helper to add a total row
  const addTotalRow = (data) => {
    if (data.length === 0) return data;
    const total = data.reduce((sum, row) => sum + (parseFloat(row.Total) || 0), 0);
    // Create an empty row for spacing
    const emptyRow = {};
    Object.keys(data[0]).forEach(key => emptyRow[key] = '');
    // Create the total row
    const totalRow = { ...emptyRow, Status: 'TOTAL', Total: total };
    return [...data, emptyRow, totalRow];
  };

  // Download handler
  const handleDownload = (period) => {
    let data = [];
    let sheetName = '';
    if (period === 'daily') {
      data = formatOrdersForExcel(getOrdersByPeriod('daily'));
      data = addTotalRow(data);
      sheetName = 'Daily Orders';
    } else if (period === 'weekly') {
      data = formatOrdersForExcel(getOrdersByPeriod('weekly'));
      data = addTotalRow(data);
      sheetName = 'Weekly Orders';
    } else if (period === 'monthly') {
      data = formatOrdersForExcel(getOrdersByPeriod('monthly'));
      data = addTotalRow(data);
      sheetName = 'Monthly Orders';
    } else {
      // All
      const daily = addTotalRow(formatOrdersForExcel(getOrdersByPeriod('daily')));
      const weekly = addTotalRow(formatOrdersForExcel(getOrdersByPeriod('weekly')));
      const monthly = addTotalRow(formatOrdersForExcel(getOrdersByPeriod('monthly')));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daily), 'Daily Orders');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(weekly), 'Weekly Orders');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthly), 'Monthly Orders');
      XLSX.writeFile(wb, 'OrderDetails.xlsx');
      setShowDownloadMenu(false);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `OrderDetails-${sheetName.replace(' ', '')}.xlsx`);
    setShowDownloadMenu(false);
  };

  return (
    <div className="space-y-6">
      {ordersLoading && (
        <div className="text-center py-8 text-gray-500">Loading orders...</div>
      )}
      {ordersError && (
        <div className="text-center py-8 text-red-500">{ordersError}</div>
      )}
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