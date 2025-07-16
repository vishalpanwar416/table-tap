// src/api/orderService.js
import { supabase } from '../supabase';
import { createNotification } from './notificationService';

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
export const updateOrderStatus = async (orderId, status) => {
  const allowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'cancelled', 'rejected', 'completed'];

  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Update tracking based on status
    if (status === 'confirmed') {
      updateData.tracking = {
        confirmed: { status: true, timestamp: new Date().toISOString() },
        preparing: { status: false, timestamp: null },
        ready: { status: false, timestamp: null },
        completed: { status: false, timestamp: null }
      };
    } else if (status === 'preparing') {
      updateData.tracking = {
        confirmed: { status: true, timestamp: null },
        preparing: { status: true, timestamp: new Date().toISOString() },
        ready: { status: false, timestamp: null },
        completed: { status: false, timestamp: null }
      };
    } else if (status === 'ready') {
      updateData.tracking = {
        confirmed: { status: true, timestamp: null },
        preparing: { status: true, timestamp: null },
        ready: { status: true, timestamp: new Date().toISOString() },
        completed: { status: false, timestamp: null }
      };
    } else if (status === 'completed') {
      updateData.tracking = {
        confirmed: { status: true, timestamp: null },
        preparing: { status: true, timestamp: null },
        ready: { status: true, timestamp: null },
        completed: { status: true, timestamp: new Date().toISOString() }
      };
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    
    // Create notification for user about status update
    await createOrderStatusNotification(data);
    
    return data;
  } catch (error) {
    throw error;
  }
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
export const cancelOrder = async (orderId, reason) => {
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
    return data;
  } catch (error) {
    throw error;
  }
};

// Note: Payment status updates have been moved to paymentService.js