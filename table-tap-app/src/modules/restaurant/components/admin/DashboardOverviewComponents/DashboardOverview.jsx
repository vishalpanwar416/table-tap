import React, { useState, useEffect, useRef, Suspense } from 'react';
import StatsCards from './StatsCards';
import ActiveOrders from './ActiveOrders';
import PopularItems from './PopularItems';
import { generateChartData, formatDate, getStatusIcon, getStatusBadge } from './helpers';
import { getCachedOrders } from '../../../api/admin/orderService';
// Lazy load RevenueChart (contains heavy Recharts library ~200KB)
const RevenueChart = React.lazy(() => import('./RevenueChart'));
const DashboardOverview = ({
  foodItems,
  updateOrderStatus,
  setActiveTab,
  restaurant,
  userRole,
}) => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [revenueData, setRevenueData] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    ready: 0,
    completed: 0,
    preparing: 0,
  });
  const [activeUsers, setActiveUsers] = useState(0);
  const [menuStats, setMenuStats] = useState({ total: 0, popular: [] });
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [isCollapsed, setIsCollapsed] = useState({ stats: false, chart: false });
  const [chartData, setChartData] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const ordersChannelRef = useRef(null);
  const supabaseRef = useRef(null);

  useEffect(() => {
    let loadingTimeout;
    let cancelled = false;
    (async () => {
      const { supabase } = await import('../../../../shared/supabase');
      if (cancelled || !supabase) return;
      supabaseRef.current = supabase;

      const fetchOrders = async () => {
        if (!restaurant?.id) {
          setOrdersLoading(false);
          return;
        }

        try {
          // 1. Try to load from cache immediately for instant UI
          const cached = await getCachedOrders(restaurant.id);
          if (cached && cached.length > 0 && !cancelled) {
            setOrders(cached);
          } else {
            setOrdersLoading(true);
          }

          // Increase timeout to 30s but optimize query
          loadingTimeout = setTimeout(() => {
            if (!cancelled) {
              setOrdersLoading(false);
              if (orders.length === 0) {
                setOrdersError(
                  'Orders request took too long. The restaurant data might be too large. Please refresh or try again.',
                );
              }
            }
          }, 30000);

          let query = supabase.from('orders').select('*').eq('restaurant_id', restaurant.id);

          // Optimization: By default, only fetch last 90 days of data to prevent timeouts
          // Dashboard overview usually only needs recent stats.
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

          if (['captain', 'waiter', 'cashier'].includes(userRole)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.gte('created_at', today.toISOString());
          } else {
            // Admins/Managers get 90 days to keep dashboard snappy
            query = query.gte('created_at', ninetyDaysAgo.toISOString());
          }

          // Add a limit to keep the payload small and snappy
          const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

          if (cancelled) return;
          if (error) throw error;
          setOrders(data || []);
          setOrdersError('');
        } catch (error) {
          if (!cancelled) setOrdersError('Failed to load orders: ' + (error.message || error));
        } finally {
          clearTimeout(loadingTimeout);
          if (!cancelled) setOrdersLoading(false);
        }
      };

      fetchOrders();

      if (ordersChannelRef.current) {
        supabase.removeChannel(ordersChannelRef.current);
        ordersChannelRef.current = null;
      }

      const channel = supabase
        .channel(`dashboard-orders-${restaurant.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurant.id}`,
          },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            setOrders((prev) => {
              let next = [...prev];
              if (eventType === 'INSERT' && newRecord) {
                next = [newRecord, ...next];
              } else if (eventType === 'UPDATE' && newRecord) {
                next = next.map((o) => (o.id === newRecord.id ? { ...o, ...newRecord } : o));
              } else if (eventType === 'DELETE' && oldRecord) {
                next = next.filter((o) => o.id !== oldRecord.id);
              }
              return next;
            });
          },
        )
        .subscribe();

      ordersChannelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      const client = supabaseRef.current;
      if (client && ordersChannelRef.current) {
        client.removeChannel(ordersChannelRef.current);
      }
      ordersChannelRef.current = null;
    };
  }, [restaurant?.id, userRole]);

  useEffect(() => {
    const now = new Date();
    const pending = orders.filter((o) => o.status === 'pending').length;
    const ready = orders.filter((o) => o.status === 'ready').length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    const preparing = orders.filter((o) => o.status === 'preparing').length;

    setOrderStats({
      total: pending + preparing + ready + completed,
      pending,
      preparing,
      ready,
      completed,
    });

    const dailyOrders = orders.filter((order) => {
      const date = new Date(order.created_at);
      return order.status === 'completed' && date.toDateString() === now.toDateString();
    });

    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyOrders = orders.filter((order) => {
      const date = new Date(order.created_at);
      return order.status === 'completed' && date >= weekStart;
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = orders.filter((order) => {
      const date = new Date(order.created_at);
      return order.status === 'completed' && date >= monthStart;
    });

    setRevenueData({
      daily: dailyOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
      weekly: weeklyOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
      monthly: monthlyOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
    });

    setActiveUsers(
      new Set(orders.map((o) => o.user_id || o.customer_email || o.customer_phone || o.id)).size,
    );

    // Calculate most ordered items - only from completed orders
    const itemCountMap = {};

    // Count occurrences from non-rejected orders (preparing/ready/completed)
    const countStatuses = new Set(['preparing', 'ready', 'completed']);
    orders
      .filter((order) => countStatuses.has(order.status))
      .forEach((order) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const itemId = item.id || item.itemId || item.item_id || item.food_item_id;
            if (itemId) {
              itemCountMap[itemId] = (itemCountMap[itemId] || 0) + (item.quantity || 1);
            }
          });
        }
      });

    // Sort food items by their order count
    const popularItems = foodItems
      .map((item) => ({
        ...item,
        orderCount: itemCountMap[item.id] || 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 6);

    setMenuStats({
      total: foodItems.length,
      popular: popularItems,
    });

    setChartData(generateChartData(orders, chartPeriod));
  }, [orders, foodItems, chartPeriod]);

  const toggleCollapse = (section) => {
    setIsCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Optimistically update local orders when a status is changed from ActiveOrders
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      // Optimistic UI update
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      // Call upstream handler (will also trigger realtime update)
      await updateOrderStatus(orderId, status);
    } catch (e) {
      const client = supabaseRef.current;
      if (client && restaurant?.id) {
        const { data } = await client
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('created_at', { ascending: false })
          .limit(200);
        setOrders(data || []);
      }
    }
  };

  const activeOrders = orders.filter((order) => ['pending', 'preparing'].includes(order.status));

  // Helper to filter orders by period
  const getOrdersByPeriod = (period) => {
    const now = new Date();
    if (period === 'daily') {
      return orders.filter((order) => {
        const date = new Date(order.created_at);
        return date.toDateString() === now.toDateString();
      });
    }
    if (period === 'weekly') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orders.filter((order) => {
        const date = new Date(order.created_at);
        return date >= weekStart;
      });
    }
    if (period === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return orders.filter((order) => {
        const date = new Date(order.created_at);
        return date >= monthStart;
      });
    }
    return [];
  };

  // Helper to format order data for Excel
  const formatOrdersForExcel = (orders) => {
    return orders.map((order) => ({
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
      PaymentTimestamp: order.payment_timestamp
        ? new Date(order.payment_timestamp).toLocaleString()
        : '',
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
      Items: (order.items || []).map((i) => `${i.name || i.title} x${i.quantity || 1}`).join(', '),
    }));
  };

  // Helper to add a total row
  const addTotalRow = (data) => {
    if (data.length === 0) return data;
    const total = data.reduce((sum, row) => sum + (parseFloat(row.Total) || 0), 0);
    // Create an empty row for spacing
    const emptyRow = {};
    Object.keys(data[0]).forEach((key) => (emptyRow[key] = ''));
    // Create the total row
    const totalRow = { ...emptyRow, Status: 'TOTAL', Total: total };
    return [...data, emptyRow, totalRow];
  };

  // Download handler - lazy loads XLSX only when user clicks download
  const handleDownload = async (period) => {
    // Dynamically import XLSX only when needed (saves ~500KB from initial bundle)
    const XLSX = await import('xlsx');

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
      {ordersError && <div className="text-center py-8 text-red-500">{ordersError}</div>}
      <StatsCards
        revenueData={revenueData}
        orderStats={orderStats}
        activeUsers={activeUsers}
        menuStats={menuStats}
        isCollapsed={isCollapsed.stats}
        toggleCollapse={() => toggleCollapse('stats')}
        period={chartPeriod}
        onChangePeriod={setChartPeriod}
        userRole={userRole}
      />
      {['admin', 'manager', 'owner'].includes(userRole) && (
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/50">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>
          }
        >
          <RevenueChart
            chartData={chartData}
            chartPeriod={chartPeriod}
            isCollapsed={isCollapsed.chart}
            toggleCollapse={() => toggleCollapse('chart')}
            onChangePeriod={setChartPeriod}
          />
        </Suspense>
      )}
      <ActiveOrders
        orders={activeOrders}
        expandedOrderId={expandedOrderId}
        toggleOrderExpansion={toggleOrderExpansion}
        updateOrderStatus={handleUpdateOrderStatus}
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
