import { supabase, SUPABASE_URL } from '../../../shared/supabase';
import { createNotification } from '../../../shared/api/notificationService';
import { logActivity } from '../../../shared/api/activityLogService';
import { sendOrderStatusEmail, sendBillToCustomer } from '../../../shared/api/emailService';
import axios from 'axios';

// Note: Order creation has been moved to paymentService.js
// This file now focuses on order management and status updates

// Process refund for an order via Razorpay
export const processRefund = async (order) => {
  try {
    // Validate that order has required payment info
    if (!order.razorpay_payment_id) {
      console.warn('Cannot process refund: No Razorpay payment ID found');
      return { success: false, error: 'No payment ID found for refund' };
    }

    if (order.payment_status !== 'completed') {
      console.warn('Cannot process refund: Payment status is not completed');
      return { success: false, error: 'Payment was not completed' };
    }

    // Get the session for authorization
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Call the Supabase edge function to process refund
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/process-refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          payment_id: order.razorpay_payment_id,
          order_id: order.id,
          amount: order.total, // Full refund
          notes: {
            order_id: order.id,
            order_number: order.order_number,
            reason: order.cancel_reason || 'Order rejected by restaurant',
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Refund processing failed:', result);
      return { success: false, error: result.error || 'Refund failed' };
    }

    console.log('Refund processed successfully:', result);
    return { success: true, refund: result.refund };
  } catch (error) {
    console.error('Error processing refund:', error);
    return { success: false, error: error.message };
  }
};

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

  // Auto-process refund when order is rejected and payment was completed
  let refundResult = null;
  if (status === 'rejected' && updatedOrder) {
    if (updatedOrder.payment_status === 'completed' && updatedOrder.razorpay_payment_id) {
      console.log('Processing automatic refund for rejected order:', updatedOrder.id);
      refundResult = await processRefund({
        ...updatedOrder,
        cancel_reason: cancelReason || 'Order rejected by restaurant',
      });
      
      if (refundResult.success) {
        console.log('Refund processed successfully:', refundResult.refund);
      } else {
        console.error('Refund processing failed:', refundResult.error);
      }
    } else {
      console.log('Skipping refund - payment not completed or no payment ID:', {
        payment_status: updatedOrder.payment_status,
        has_payment_id: !!updatedOrder.razorpay_payment_id,
      });
    }
  }

  if (userData && updatedOrder) {
    const activityDetails = { 
      old_status: null, 
      new_status: status, 
      cancel_reason: cancelReason 
    };
    
    // Add refund info to activity log if refund was processed
    if (refundResult) {
      activityDetails.refund_processed = refundResult.success;
      if (refundResult.refund) {
        activityDetails.refund_id = refundResult.refund.id;
        activityDetails.refund_amount = refundResult.refund.amount;
      }
      if (refundResult.error) {
        activityDetails.refund_error = refundResult.error;
      }
    }

    await logActivity({
      restaurant_id: updatedOrder.restaurant_id,
      user_id: userData.id,
      user_name: userData.user_name || userData.full_name || 'Staff',
      user_role: userData.role || userData.profile_role || 'staff',
      action_type: 'order',
      action_name: 'status_change',
      target_id: updatedOrder.id,
      target_name: `Order #${updatedOrder.order_number || updatedOrder.id.slice(0, 8)}`,
      details: activityDetails,
      description: `Order status changed to ${status}${cancelReason ? ' (Reason: ' + cancelReason + ')' : ''}${refundResult?.success ? ' - Refund processed' : ''}`
    });
  }

  // Helper function call to notify user (with refund info if applicable)
  await createOrderStatusNotification(updatedOrder, refundResult);

  // Auto email billing: send emails on acceptance, rejection, or completion when restaurant has it enabled
  const customerEmail = updatedOrder.customer_email;
  if (customerEmail) {
    let restaurant = null;
    try {
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', updatedOrder.restaurant_id)
        .maybeSingle();
      restaurant = restData;
    } catch (e) {
      console.warn('[Auto email] Could not fetch restaurant:', e);
    }
    // Require online billing enabled from admin (billing_features_enabled + online_bill_enabled) and auto email billing on
    const onlineBillingEnabled = restaurant?.billing_features_enabled !== false && restaurant?.online_bill_enabled !== false;
    if (restaurant?.auto_email_billing_enabled && onlineBillingEnabled) {
      const orderLabel = `Order #${updatedOrder.order_number || updatedOrder.id?.slice(0, 8) || 'N/A'}`;
      try {
        if (status === 'preparing') {
          await sendOrderStatusEmail(updatedOrder, restaurant, 'accepted');
          await logActivity({
            restaurant_id: restaurant.id,
            user_id: null,
            user_name: 'System (Auto)',
            user_role: 'system',
            action_type: 'email',
            action_name: 'auto_email_sent',
            target_id: updatedOrder.id,
            target_name: orderLabel,
            details: { email_kind: 'accepted', recipient_email: customerEmail },
            description: `Auto email (order accepted) sent to ${customerEmail}`
          });
        } else if (status === 'rejected') {
          await sendOrderStatusEmail(updatedOrder, restaurant, 'rejected');
          await logActivity({
            restaurant_id: restaurant.id,
            user_id: null,
            user_name: 'System (Auto)',
            user_role: 'system',
            action_type: 'email',
            action_name: 'auto_email_sent',
            target_id: updatedOrder.id,
            target_name: orderLabel,
            details: { email_kind: 'rejected', recipient_email: customerEmail },
            description: `Auto email (order rejected) sent to ${customerEmail}`
          });
        } else if (status === 'completed') {
          await sendBillToCustomer(updatedOrder, restaurant);
          await logActivity({
            restaurant_id: restaurant.id,
            user_id: null,
            user_name: 'System (Auto)',
            user_role: 'system',
            action_type: 'email',
            action_name: 'auto_email_sent',
            target_id: updatedOrder.id,
            target_name: orderLabel,
            details: { email_kind: 'bill', recipient_email: customerEmail, amount: updatedOrder.total },
            description: `Auto email (bill on completion) sent to ${customerEmail}`
          });
        }
      } catch (emailErr) {
        console.warn('[Auto email] Failed to send:', emailErr);
      }
    }
  }

  return updatedOrder;
};

// Helper function to create user notification for order status updates
const createOrderStatusNotification = async (order, refundResult = null) => {
  try {
    console.log('[Notification] Attempting to create notification for order:', {
      orderId: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      status: order.status,
      refundProcessed: refundResult?.success || false
    });

    // Skip if no user_id (guest orders)
    if (!order.user_id) {
      console.warn('[Notification] Skipping notification - Order has no user_id (guest order)');
      return;
    }

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
        // Include refund information in the message if refund was successful
        if (refundResult?.success && refundResult.refund) {
          message = `Your order #${order.order_number} has been rejected. A refund of ₹${refundResult.refund.amount} has been initiated and will be credited to your account within 5-7 business days.`;
        } else if (order.payment_status === 'completed') {
          // Payment was made but refund failed
          message = `Your order #${order.order_number} has been rejected. Your refund is being processed and will be credited soon.`;
        } else {
          // No payment was made (COD or pending payment)
          message = `Your order #${order.order_number} has been rejected`;
        }
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

    // Build metadata with refund info if applicable
    const metadata = { order_status: order.status };
    if (refundResult?.success && refundResult.refund) {
      metadata.refund_id = refundResult.refund.id;
      metadata.refund_amount = refundResult.refund.amount;
      metadata.refund_status = refundResult.refund.status;
    }

    await createNotification({
      title,
      message,
      type,
      order_id: order.id,
      user_id: order.user_id,
      metadata
    });
    console.log('Notification created for user:', order.user_id);
  } catch (error) {
    console.error('Error creating order status notification:', error);
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
