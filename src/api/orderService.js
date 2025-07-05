// src/api/orderService.js
import { supabase } from '../supabase';
import { createNotification } from './notificationService';

// Create a new order
export const createOrder = async (orderData) => {
  try {
    console.log('Creating order with data:', orderData);
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Calculate GST (assuming 5% GST)
    const subtotal = orderData.total || 0;
    const gst = subtotal * 0.05; // 5% GST
    const discount = orderData.discount || 0;
    const total = subtotal + gst - discount;
    
    // Set initial status to 'pending'
    const order = {
      order_number: orderNumber,
      user_id: orderData.userId,
      restaurant_id: orderData.restaurant_id,
      table_number: orderData.tableNumber || 'N/A',
      items: orderData.items,
      subtotal: subtotal,
      gst: gst,
      discount: discount,
      total: total,
      payment_method: orderData.payment_method || 'razorpay',
      payment_status: 'pending',
      status: 'pending',
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      special_instructions: orderData.special_instructions,
      tracking: {
        ready: { status: false, timestamp: null },
        completed: { status: false, timestamp: null },
        confirmed: { status: false, timestamp: null },
        preparing: { status: false, timestamp: null }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Processed order data:', order);

    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Order created successfully:', data);
    
    // Create manager notification for new order
    await createManagerOrderNotification(data);
    
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Helper function to create manager notification for new orders
const createManagerOrderNotification = async (order) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        title: 'New Order',
        message: `New order #${order.id} received`,
        type: 'order',
        is_manager_notification: true,
        read: false,
        data: order
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating manager notification:', error);
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
    console.error('Error fetching user orders:', error);
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
    console.error('Error fetching restaurant orders:', error);
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
    console.error('Error fetching orders by status:', error);
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
    console.error('Error cancelling order:', error);
    throw error;
  }
};

// Update payment status
export const updatePaymentStatus = async (orderId, paymentData) => {
  try {
    const updateData = {
      payment_status: paymentData.status,
      payment_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (paymentData.razorpay_order_id) {
      updateData.razorpay_order_id = paymentData.razorpay_order_id;
    }
    if (paymentData.razorpay_payment_id) {
      updateData.razorpay_payment_id = paymentData.razorpay_payment_id;
    }
    if (paymentData.razorpay_signature) {
      updateData.razorpay_signature = paymentData.razorpay_signature;
    }
    if (paymentData.notes) {
      updateData.payment_notes = paymentData.notes;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};