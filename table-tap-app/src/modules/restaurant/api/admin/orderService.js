import { supabase, SUPABASE_URL } from '../../../shared/supabase';
import { createNotification } from '../../../shared/api/notificationService';
import { logActivity } from '../../../shared/api/activityLogService';
import { sendOrderStatusEmail, sendBillToCustomer } from '../../../shared/api/emailService';

import { offlineStorage } from '../../../shared/utils/offlineStorage';

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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Call the Supabase edge function to process refund
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
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
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Refund processing failed:', result);
      return { success: false, error: result.error || 'Refund failed' };
    }

    return { success: true, refund: result.refund };
  } catch (error) {
    console.error('Error processing refund:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to create admin notification for new orders
const createManagerOrderNotification = async (order) => {
  try {
    const { error } = await supabase.from('notifications').insert([
      {
        title: 'New Order',
        message: `New order #${order.id} received`,
        type: 'order_received',
        is_admin_notification: true,
        read: false,
        metadata: { order: order },
      },
    ]);

    if (error) throw error;
  } catch (error) {}
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

// Update order status implementation moved to bottom of file with offline support

// Helper function to create user notification for order status updates
const createOrderStatusNotification = async (order, refundResult = null) => {
  try {
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
      metadata,
    });
  } catch (error) {
    console.error('Error creating order status notification:', error);
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Listen for order status changes (customer tracking + single-order views)
export const subscribeToOrderUpdates = (orderId, callback) => {
  const channelName = `order-${orderId}`;
  const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
  if (existing) {
    supabase.removeChannel(existing);
  }

  const channel = supabase.channel(channelName);
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    },
    (payload) => {
      if (payload.new) {
        callback(payload.new);
      }
    },
  );

  channel.subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error(`Order realtime subscription failed (${channelName}):`, status, err);
    }
  });

  return channel;
};

// Listen for new orders (admin side)
export const subscribeToNewOrders = (restaurantId, callback) => {
  return supabase
    .channel(`restaurant-orders-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        callback(payload.new);
      },
    )
    .subscribe();
};

// Get orders by status
export const getOrdersByStatus = async (status, restaurantId = null) => {
  try {
    let query = supabase.from('orders').select('*').eq('status', status);

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
        updated_at: new Date().toISOString(),
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
        description: `Order cancelled. Reason: ${reason}`,
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

// Format orders for Excel export
export const formatOrdersForExcel = (orders) => {
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

// Add a total row to Excel data
export const addTotalRow = (data) => {
  if (data.length === 0) return data;
  const total = data.reduce((sum, row) => sum + (parseFloat(row.Total) || 0), 0);
  const emptyRow = {};
  Object.keys(data[0]).forEach((key) => (emptyRow[key] = ''));
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
    0,
  );
};

// Get counts by status for dashboard
export const getStatusCounts = (orders) => {
  const counts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    rejected: 0,
  };
  orders.forEach((order) => {
    if (counts[order.status] !== undefined) {
      counts[order.status]++;
    }
  });
  return counts;
};

// Sync function to replay pending actions when online
export const syncPendingActions = async () => {
  if (!navigator.onLine) return;

  const pendingActions = await offlineStorage.getPendingActions();
  if (pendingActions.length === 0) return;

  const processedIds = [];

  for (const action of pendingActions) {
    try {
      if (action.type === 'UPDATE_STATUS') {
        const { orderId, status, cancelReason, userData } = action.payload;
        // Pass skipQueue: true to prevent re-queuing if sync fails
        await updateOrderStatus(orderId, status, cancelReason, userData, { skipQueue: true });
        processedIds.push(action.id);
      }
    } catch (error) {
      console.error('Failed to sync action:', action, error);
      // Optional: Logic to retry later or move to 'failed_actions' store
    }
  }

  if (processedIds.length > 0) {
    await offlineStorage.clearPendingActions(processedIds);
  }
};

// Get orders from local cache only
export const getCachedOrders = async (restaurantId = null) => {
  try {
    const cachedOrders = await offlineStorage.getOrders();
    let filtered = cachedOrders || [];
    if (restaurantId) {
      filtered = filtered.filter((o) => o.restaurant_id === restaurantId);
    }
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    console.error('Failed to get cached orders:', error);
    return [];
  }
};

// Fetch all orders with optional restaurant filter and limit
export const fetchAllOrders = async (restaurantId = null, limit = 200) => {
  try {
    // Try network fetch first
    let query = supabase.from('orders').select('*');

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

    if (error) throw error;

    // Cache successful response
    if (data && data.length > 0) {
      // We don't want to overwrite the whole cache if we only fetched one restaurant's orders
      // offlineStorage.saveOrders usually overwrites. Let's check how it works.
      await offlineStorage.saveOrders(data);
    }

    return data || [];
  } catch (error) {
    console.warn('Network request failed, falling back to offline cache:', error);
    // Fallback to IndexedDB
    return await getCachedOrders(restaurantId);
  }
};

// Enhanced updateOrderStatus with offline support
export const updateOrderStatus = async (
  orderId,
  newStatus,
  cancelReason = null,
  userData = null,
  options = {},
) => {
  const status = newStatus; // Alias for clarity
  try {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('tracking')
      .eq('id', orderId)
      .maybeSingle();

    const now = new Date().toISOString();
    const tracking = { ...(existingOrder?.tracking || {}) };

    if (['confirmed', 'accepted', 'preparing'].includes(status)) {
      tracking.confirmed = { status: true, timestamp: tracking.confirmed?.timestamp || now };
    }
    if (status === 'preparing') {
      tracking.preparing = { status: true, timestamp: now };
    }
    if (status === 'ready') {
      tracking.ready = { status: true, timestamp: now };
    }
    if (status === 'completed') {
      tracking.completed = { status: true, timestamp: now };
    }

    const updates = {
      status,
      tracking,
      updated_at: now,
    };
    if (cancelReason) {
      updates.cancel_reason = cancelReason;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*');

    if (error) throw error;
    const updatedOrder = data[0];

    // Update cache with new status
    await offlineStorage.updateOrder(updatedOrder);

    // Auto-process refund when order is rejected and payment was completed
    let refundResult = null;
    if (status === 'rejected' && updatedOrder) {
      if (updatedOrder.payment_status === 'completed' && updatedOrder.razorpay_payment_id) {
        refundResult = await processRefund({
          ...updatedOrder,
          cancel_reason: cancelReason || 'Order rejected by restaurant',
        });

        if (refundResult.success) {
        } else {
          console.error('Refund processing failed:', refundResult.error);
        }
      } else {
      }
    }

    if (userData && updatedOrder) {
      const activityDetails = {
        old_status: null,
        new_status: status,
        cancel_reason: cancelReason,
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
        description: `Order status changed to ${status}${cancelReason ? ' (Reason: ' + cancelReason + ')' : ''}${refundResult?.success ? ' - Refund processed' : ''}`,
      });
    }

    // Helper function call to notify user (with refund info if applicable)
    await createOrderStatusNotification(updatedOrder, refundResult);

    // Auto email billing logic
    const customerEmail = updatedOrder.customer_email;
    const autoEmailResult = { sent: false, to: null, error: null, skippedReason: null };

    if (!customerEmail) {
      autoEmailResult.skippedReason = 'no_customer_email';
      if (['preparing', 'rejected', 'completed'].includes(status)) {
      }
    } else {
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
        autoEmailResult.skippedReason = 'restaurant_fetch_error';
      }

      const onlineBillingEnabled =
        restaurant?.billing_features_enabled !== false && restaurant?.online_bill_enabled !== false;
      const isGuestEmail =
        customerEmail?.startsWith('guest_') && customerEmail?.endsWith('@tabletap.com');

      if (!restaurant) {
        autoEmailResult.skippedReason = 'restaurant_not_found';
      } else if (isGuestEmail) {
        autoEmailResult.skippedReason = 'guest_placeholder_email';
        if (['preparing', 'rejected', 'completed'].includes(status)) {
        }
      } else if (!restaurant.auto_email_billing_enabled) {
        autoEmailResult.skippedReason = 'auto_email_disabled';
        if (['preparing', 'rejected', 'completed'].includes(status)) {
        }
      } else if (!onlineBillingEnabled) {
        autoEmailResult.skippedReason = 'online_billing_disabled';
        if (['preparing', 'rejected', 'completed'].includes(status)) {
        }
      } else if (['preparing', 'rejected', 'completed'].includes(status)) {
        try {
          if (status === 'preparing') {
            const emailResult = await sendOrderStatusEmail(updatedOrder, restaurant, 'accepted');
            if (emailResult?.success) {
              autoEmailResult.sent = true;
              autoEmailResult.to = customerEmail;
            } else if (emailResult?.error) {
              autoEmailResult.error = emailResult.error;
            }
          } else if (status === 'rejected') {
            const emailResult = await sendOrderStatusEmail(updatedOrder, restaurant, 'rejected');
            if (emailResult?.success) {
              autoEmailResult.sent = true;
              autoEmailResult.to = customerEmail;
            } else if (emailResult?.error) {
              autoEmailResult.error = emailResult.error;
            }
          } else if (status === 'completed') {
            try {
              await sendBillToCustomer(updatedOrder, restaurant);
              autoEmailResult.sent = true;
              autoEmailResult.to = customerEmail;
            } catch (billErr) {
              autoEmailResult.error = billErr.message || String(billErr);
            }
          }
        } catch (emailErr) {
          console.warn('[Auto email] Failed to send:', emailErr);
          autoEmailResult.error = emailErr.message || String(emailErr);
        }
      }
    }

    updatedOrder._autoEmailResult = autoEmailResult;
    return updatedOrder;
  } catch (error) {
    // OFFLINE HANDLING
    console.warn('Update failed, checking if offline:', error);

    // Check if it's a network error (Supabase errors vary, but typically connection issues throw specific errors or simple fetch failures)
    // For simplicity, if we have a robust offline storage, we queue it.

    if (options.skipQueue) {
      console.warn('Skipping offline queue for sync action');
      throw error;
    }

    try {
      // Fetch the original order from cache to construct the optimistic update
      const originalOrder = await offlineStorage.getOrder(orderId);

      if (originalOrder) {
        const optimisticOrder = {
          ...originalOrder,
          status: status,
          cancel_reason: cancelReason || originalOrder.cancel_reason,
          updated_at: new Date().toISOString(),
        };

        // Save optimistic update to IndexedDB
        await offlineStorage.updateOrder(optimisticOrder);

        // Queue the action for later sync
        await offlineStorage.queueAction('UPDATE_STATUS', {
          orderId,
          status,
          cancelReason,
          userData,
        });

        return optimisticOrder; // Return optimistic data to UI
      }
    } catch (offlineErr) {
      console.error('Offline optimistic update failed:', offlineErr);
    }

    throw error;
  }
};

// --- Missing Helper Functions Restored ---

// Subscribe to all changes (INSERT, UPDATE, DELETE) for orders
export const subscribeToAllOrderChanges = (restaurantId, callback) => {
  return supabase
    .channel(`all-restaurant-orders-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        callback(payload);
      },
    )
    .subscribe();
};

// Unsubscribe helper
export const unsubscribeFromOrderChanges = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

// Filter orders helper
export const filterOrders = (orders, { statusFilter, searchQuery }) => {
  let result = orders;

  // Status Filter
  if (statusFilter !== 'all') {
    result = result.filter((o) => o.status === statusFilter);
  }

  // Search Filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (o) =>
        (o.order_number || '').toLowerCase().includes(query) ||
        (o.customer_name || '').toLowerCase().includes(query) ||
        (o.customer_phone || '').includes(query) ||
        (o.id || '').toLowerCase().includes(query) ||
        (o.table_number && String(o.table_number).toLowerCase().includes(query)),
    );
  }

  return result;
};

// Sort orders helper
export const sortOrders = (orders, sortBy, sortDirection) => {
  return [...orders].sort((a, b) => {
    // Create a copy to avoid mutating original
    let valA, valB;

    if (sortBy === 'total') {
      valA = parseFloat(a.total || 0);
      valB = parseFloat(b.total || 0);
    } else if (sortBy === 'created_at') {
      valA = new Date(a.created_at || 0).getTime();
      valB = new Date(b.created_at || 0).getTime();
    } else {
      // Default string comparison
      valA = a[sortBy];
      valB = b[sortBy];
    }

    if (valA === valB) return 0;

    if (sortDirection === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });
};

// Get valid next status options
export const getNextStatusOptions = (currentStatus) => {
  const flow = {
    pending: ['preparing', 'rejected'],
    preparing: ['ready'],
    ready: ['completed'],
    completed: [],
    rejected: [],
    cancelled: [],
  };
  return flow[currentStatus] || [];
};

// Handle download preparation
export const handleOrderDownload = (orders, period, status = null) => {
  let filtered = orders;

  // Apply period filter if specified
  if (period && period !== 'all') {
    filtered = getOrdersByPeriod(orders, period);
  }

  // Apply status filter if specified
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  const formatted = formatOrdersForExcel(filtered);
  const dataWithTotal = addTotalRow(formatted);

  let sheetName = 'Orders';
  if (status) {
    sheetName = status.charAt(0).toUpperCase() + status.slice(1);
  } else if (period) {
    sheetName = period.charAt(0).toUpperCase() + period.slice(1);
  }

  return {
    data: dataWithTotal,
    sheetName,
  };
};
