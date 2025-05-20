// src/api/orderService.js
import { supabase } from '../supabase';
import { createNotification } from './notificationService';

// Create a new order
export const createOrder = async (orderData) => {
  try {
    // Set initial status to 'pending'
    const order = {
      ...orderData,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (error) throw error;
    
    // Create admin notification for new order
    await createAdminOrderNotification(data);
    
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Helper function to create admin notification for new orders
const createAdminOrderNotification = async (order) => {
  try {
    const orderItems = order.items || [];
    const itemCount = orderItems.length;
    const totalAmount = order.total || 0;
    
    // Create detailed notification
    await createNotification({
      title: 'New Order Received',
      message: `Order #${order.id.slice(0, 8)} - ${itemCount} items`,
      type: 'new_order',
      order_id: order.id,
      is_admin_notification: true,
      order_details: {
        items: orderItems,
        total: totalAmount,
        table: order.table_number || order.tableNumber,
        customer: order.customerName,
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('Error creating admin notification:', error);
    // Don't throw here to prevent order creation from failing
  }
};

// Get orders by user ID
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId) // Ensure column name matches your DB
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  // Define allowed statuses
  const allowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'cancelled', 'rejected', 'completed'];

  if (!allowedStatuses.includes(status)) {
    console.error(`Invalid status: ${status}`);
    return Promise.reject(new Error(`Invalid status: ${status}`));
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating order status:', error);
      throw error;
    }
    
    // Create notification for user about status update
    await createOrderStatusNotification(data);
    
    console.log(`Order ${orderId} status updated to ${status} successfully`);
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Helper function to create user notification for order status updates
const createOrderStatusNotification = async (order) => {
  try {
    // Skip if no user_id
    if (!order.user_id) return;
    
    let title, message;
    
    switch (order.status) {
      case 'preparing':
        title = 'Order Accepted';
        message = `Your order #${order.id.slice(0, 8)} is now being prepared`;
        break;
      case 'ready':
        title = 'Order Ready';
        message = `Your order #${order.id.slice(0, 8)} is ready for pickup/delivery`;
        break;
      case 'delivered':
        title = 'Order Delivered';
        message = `Your order #${order.id.slice(0, 8)} has been delivered`;
        break;
      case 'rejected':
        title = 'Order Rejected';
        message = `Your order #${order.id.slice(0, 8)} has been rejected`;
        break;
      case 'completed':
        title = 'Order Completed';
        message = `Your order #${order.id.slice(0, 8)} has been completed`;
        break;
      default:
        title = `Order ${order.status}`;
        message = `Your order #${order.id.slice(0, 8)} status: ${order.status}`;
    }
    
    await createNotification({
      title,
      message,
      type: `order_${order.status}`,
      order_id: order.id,
      user_id: order.user_id
    });
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
    console.error('Error fetching order:', error);
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
export const subscribeToNewOrders = (callback) => {
  return supabase
    .channel('new-orders')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders'
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
};

// Get orders by status for admin
export const getOrdersByStatus = async (status) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching ${status} orders:`, error);
    throw error;
  }
};