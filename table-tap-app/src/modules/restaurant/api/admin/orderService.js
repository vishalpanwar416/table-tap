import { supabase } from '../../../shared/supabase';
import { createNotification } from '../../../shared/api/notificationService';
import { logActivity } from '../../../shared/api/activityLogService';
import axios from 'axios';

// Note: Order creation has been moved to paymentService.js
// This file now focuses on order management and status updates

// Helper function to create admin notification for new orders
const createManagerOrderNotification = async (order) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        title: 'New Order',
        message: `New order #${order.id} received`,
        type: 'order_received',
        is_admin_notification: true,
        read: false,
        metadata: { order: order }
      }]);

    if (error) throw error;
  } catch (error) {
  }
};

// Get orders by user ID
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get all orders for a specific restaurant
export const getRestaurantOrders = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, cancelReason = null, userData = null) => {
  const updates = { status };
  if (cancelReason) {
    updates.cancel_reason = cancelReason;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select();

  if (error) throw error;
  const updatedOrder = data[0];

  if (userData && updatedOrder) {
    await logActivity({
      restaurant_id: updatedOrder.restaurant_id,
      user_id: userData.id,
      user_name: userData.user_name || userData.full_name || 'Staff',
      user_role: userData.role || userData.profile_role || 'staff',
      action_type: 'order',
      action_name: 'status_change',
      target_id: updatedOrder.id,
      target_name: `Order #${updatedOrder.order_number || updatedOrder.id.slice(0, 8)}`,
      details: { old_status: null, new_status: status, cancel_reason: cancelReason },
      description: `Order status changed to ${status}${cancelReason ? ' (Reason: ' + cancelReason + ')' : ''}`
    });
  }

  // Helper function call to notify user
  await createOrderStatusNotification(updatedOrder);

  return updatedOrder;
};

// Helper function to create user notification for order status updates
const createOrderStatusNotification = async (order) => {
  try {
    // Skip if no user_id
    if (!order.user_id) return;

    let title, message, type;

    switch (order.status) {
      case 'confirmed':
        title = 'Order Accepted';
        message = `Your order #${order.order_number} has been accepted`;
        type = 'order_accepted';
        break;
      case 'preparing':
        title = 'Order Preparing';
        message = `Your order #${order.order_number} is now being prepared`;
        type = 'order_preparing';
        break;
      case 'ready':
        title = 'Order Ready';
        message = `Your order #${order.order_number} is ready for pickup`;
        type = 'order_ready';
        break;
      case 'rejected':
        title = 'Order Rejected';
        message = `Your order #${order.order_number} has been rejected`;
        type = 'order_rejected';
        break;
      case 'completed':
        title = 'Order Completed';
        message = `Your order #${order.order_number} has been completed`;
        type = 'order_ready'; // Using order_ready for completed orders
        break;
      default:
        title = `Order ${order.status}`;
        message = `Your order #${order.order_number} status: ${order.status}`;
        type = 'order_received';
    }

    await createNotification({
      title,
      message,
      type,
      order_id: order.id,
      user_id: order.user_id,
      metadata: { order_status: order.status }
    });
  } catch (error) {
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Listen for order status changes
export const subscribeToOrderUpdates = (orderId, callback) => {
  return supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
};

// Listen for new orders (admin side)
export const subscribeToNewOrders = (restaurantId, callback) => {
  return supabase
    .channel(`restaurant-orders-${restaurantId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: `restaurant_id=eq.${restaurantId}`
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
};

// Get orders by status
export const getOrdersByStatus = async (status, restaurantId = null) => {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('status', status);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (orderId, reason, userData = null) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancel_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    if (userData && data) {
      await logActivity({
        restaurant_id: data.restaurant_id,
        user_id: userData.id,
        user_name: userData.user_name || userData.full_name || 'Staff',
        user_role: userData.role || userData.profile_role || 'staff',
        action_type: 'order',
        action_name: 'cancelled',
        target_id: data.id,
        target_name: `Order #${data.order_number || data.id.slice(0, 8)}`,
        details: { reason },
        description: `Order cancelled. Reason: ${reason}`
      });
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Note: Payment status updates have been moved to paymentService.js

// Get orders by period (daily, weekly, monthly)
export const getOrdersByPeriod = (orders, period) => {
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

// Format orders for Excel export
export const formatOrdersForExcel = (orders) => {
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

// Add a total row to Excel data
export const addTotalRow = (data) => {
  if (data.length === 0) return data;
  const total = data.reduce((sum, row) => sum + (parseFloat(row.Total) || 0), 0);
  const emptyRow = {};
  Object.keys(data[0]).forEach(key => emptyRow[key] = '');
  const totalRow = { ...emptyRow, Status: 'TOTAL', Total: total };
  return [...data, emptyRow, totalRow];
};

// Status sorting order (export if used outside)
export const STATUS_ORDER = {
  pending: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
  rejected: 4,
};

// Get subtotal for an order
export const getOrderSubtotal = (order) => {
  return (order.items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );
};

// Get counts by status for dashboard
export const getStatusCounts = (orders) => {
  const counts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    rejected: 0
  };
  orders.forEach(order => {
    if (counts[order.status] !== undefined) {
      counts[order.status]++;
    }
  });
  return counts;
};

// Fetch all orders with optional restaurant filter
export const fetchAllOrders = async (restaurantId = null) => {
  try {
    let query = supabase
      .from('orders')
      .select('*');

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
};

// Subscribe to all order changes with better error handling
export const subscribeToAllOrderChanges = (restaurantId, callback) => {
  if (!restaurantId) {
    console.warn('No restaurantId provided for real-time subscription');
    return null;
  }

  try {
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('Real-time order update:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to order changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error in real-time subscription');
        }
      });

    return channel;
  } catch (error) {
    console.error('Error setting up real-time subscription:', error);
    return null;
  }
}

// Unsubscribe from a channel with better error handling
export function unsubscribeFromOrderChanges(channel) {
  if (channel) {
    try {
      supabase.removeChannel(channel);
      console.log('Successfully unsubscribed from order changes');
    } catch (error) {
      console.error('Error unsubscribing from order changes:', error);
    }
  }
}

// Handle order download with all options
export const handleOrderDownload = (orders, period, status = null) => {
  let filteredOrders = [...orders];

  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  } else if (period) {
    filteredOrders = getOrdersByPeriod(filteredOrders, period);
  }

  const formattedData = formatOrdersForExcel(filteredOrders);
  const dataWithTotal = addTotalRow(formattedData);

  return {
    data: dataWithTotal,
    sheetName: status
      ? `${status.charAt(0).toUpperCase() + status.slice(1)} Orders`
      : period
        ? `${period.charAt(0).toUpperCase() + period.slice(1)} Orders`
        : 'All Orders'
  };
};

// Filter orders by status and search query
export const filterOrders = (orders, { statusFilter = 'all', searchQuery = '' } = {}) => {
  const searchLower = (searchQuery || '').toLowerCase();
  return orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchLower) {
      return (
        (order.id && order.id.toLowerCase().includes(searchLower)) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchLower)) ||
        (order.customer_phone && order.customer_phone.toLowerCase().includes(searchLower)) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchLower)) ||
        (order.table_number && order.table_number.toString().includes(searchLower)) ||
        (order.items && order.items.some(item => item.name && item.name.toLowerCase().includes(searchLower)))
      );
    }
    return true;
  });
};

// Sort orders by a given field and direction
export const sortOrders = (orders, sortBy = 'created_at', sortDirection = 'desc') => {
  return [...orders].sort((a, b) => {
    if (sortBy === 'created_at') {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    if (sortBy === 'total') {
      const totalA = a.total || 0;
      const totalB = b.total || 0;
      return sortDirection === 'asc' ? totalA - totalB : totalB - totalA;
    }
    if (sortBy === 'status') {
      const statusA = STATUS_ORDER[a.status] ?? 99;
      const statusB = STATUS_ORDER[b.status] ?? 99;
      return sortDirection === 'asc' ? statusA - statusB : statusB - statusA;
    }
    return 0;
  });
};

// Get next status options based on current status
export const getNextStatusOptions = (currentStatus) => {
  const statusFlow = {
    pending: ['preparing', 'rejected'],
    preparing: ['ready', 'rejected'],
    ready: ['completed'],
    // No further actions for rejected or completed
  };
  return statusFlow[currentStatus] || [];
};

export const fetchTopOrderedItemsLastMonth = async () => {
  // Adjust endpoint as per your backend
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const response = await axios.get('/api/orders', {
    params: {
      startDate: lastMonth.toISOString(),
      endDate: now.toISOString(),
    }
  });

  const orders = response.data; // Array of orders

  // Aggregate item counts
  const itemMap = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!itemMap[item.id]) {
        itemMap[item.id] = { ...item, orderCount: 0 };
      }
      itemMap[item.id].orderCount += item.quantity || 1;
    });
  });

  // Convert to array and sort
  const sortedItems = Object.values(itemMap).sort((a, b) => b.orderCount - a.orderCount);

  // Return top 10 (or any number you want)
  return sortedItems.slice(0, 10);
};