// src/api/paymentService.js
import { supabase } from '../supabase';
import { createNotification } from './notificationService';

// ========= RAZORPAY PAYMENT FUNCTIONS =========

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    // Add timeout for script loading
    const timeout = setTimeout(() => {
      reject(new Error('Razorpay script loading timeout'));
    }, 10000); // 10 second timeout

    script.onload = () => {
      clearTimeout(timeout);
      if (!window.Razorpay) {
        reject(new Error('Razorpay not found in window object after script load'));
        return;
      }
      resolve(window.Razorpay);
    };

    script.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error('Failed to load Razorpay script'));
    };

    document.body.appendChild(script);
  });
};

/**
 * Initialize Razorpay payment
 */
export const initializeRazorpayPayment = async (paymentData) => {
  try {
    const Razorpay = await loadRazorpayScript();
    
    const razorpayKeyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      throw new Error('Razorpay key not configured in environment variables');
    }

    const amountInPaise = Math.round(parseFloat(paymentData.amount) * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      throw new Error('Invalid order amount');
    }

    const options = {
      key: razorpayKeyId,
      amount: amountInPaise,
      currency: 'INR',
      name: paymentData.restaurantName || 'Restaurant Order',
      description: `Order at ${paymentData.restaurantName || 'Restaurant'}`,
      image: paymentData.restaurantLogo || '/logo.png',
      handler: paymentData.onSuccess,
      prefill: {
        name: paymentData.customerName || 'Valued Customer',
        email: paymentData.customerEmail,
        contact: paymentData.customerPhone
      },
      theme: { color: paymentData.themeColor || '#F37254' },
      modal: {
        ondismiss: paymentData.onDismiss
      },
      notes: {
        restaurant_id: paymentData.restaurantId || '1',
        table_number: paymentData.tableNumber || 'N/A',
        special_instructions: paymentData.specialInstructions
      }
    };

    const rzp = new Razorpay(options);
    
    rzp.on('payment.failed', (response) => {
      if (paymentData.onFailure) {
        paymentData.onFailure(response.error.description || 'Gateway error');
      }
    });

    return rzp;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyRazorpaySignature = (paymentId, orderId, signature) => {
  // Note: In a production environment, this should be done on the server side
  // This is a client-side placeholder - implement proper signature verification on your backend
  console.warn('Payment signature verification should be implemented on the server side');
  return true;
};

// ========= ORDER CREATION AND MANAGEMENT =========

/**
 * Generate unique order number
 */
export const generateOrderNumber = (restaurantName) => {
  const restaurantPrefix = restaurantName?.substring(0, 3).toUpperCase() || 'RST';
  const timestamp = new Date().getTime().toString().substring(9, 13);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${restaurantPrefix}-${timestamp}-${random}`;
};

/**
 * Calculate order totals with GST and discounts
 */
export const calculateOrderTotals = (items, discountPercentage = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const cgst = subtotalAfterDiscount * 0.025; // 2.5% CGST
  const sgst = subtotalAfterDiscount * 0.025; // 2.5% SGST
  const finalTotal = subtotalAfterDiscount + cgst + sgst;

  return {
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    cgst,
    sgst,
    finalTotal
  };
};

/**
 * Create a new order in Supabase
 */
export const createOrder = async (orderData) => {
  try {
    // FIX: Add robust, final validation for guest user data before insertion.
    // This acts as a final guard against invalid data, regardless of frontend state.
    if (!orderData.userId) { // This logic runs only for guest users
      console.log('Guest order validation - checking required fields:', {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone
      });

      if (!orderData.customerName || orderData.customerName.trim() === '') {
        throw new Error('Customer name is required for guest orders.');
      }
      if (!orderData.customerEmail || orderData.customerEmail.trim() === '') {
        throw new Error('Customer email is required for guest orders.');
      }
      if (!orderData.customerPhone || orderData.customerPhone.trim() === '') {
        throw new Error('Customer phone is required for guest orders.');
      }
    }

    // Calculate price details
    const totals = calculateOrderTotals(orderData.items, orderData.discountPercentage || 0);
    
    // Generate order number
    const orderNumber = generateOrderNumber(orderData.restaurantName);

    const order = {
      order_number: orderNumber,
      restaurant_id: orderData.restaurantId,
      user_id: orderData.userId || null, // null for guest users
      // Ensure data is trimmed to prevent whitespace issues with RLS
      customer_name: orderData.customerName.trim(),
      customer_email: orderData.customerEmail.trim(),
      customer_phone: orderData.customerPhone.trim(),
      table_number: orderData.tableNumber || 'Not Specified',
      items: orderData.items.map(item => ({
        food_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        category: item.category,
        image: item.image
      })),
      subtotal: totals.subtotalAfterDiscount,
      gst: totals.cgst + totals.sgst,
      discount: totals.discountAmount,
      total: totals.finalTotal,
      razorpay_order_id: orderData.razorpayOrderId || null,
      razorpay_payment_id: orderData.razorpayPaymentId || null,
      razorpay_signature: orderData.razorpaySignature || null,
      payment_method: orderData.paymentMethod || 'razorpay',
      payment_status: orderData.paymentStatus || 'pending',
      payment_timestamp: orderData.paymentTimestamp || new Date().toISOString(),
      status: 'pending',
      special_instructions: orderData.specialInstructions || null,
      tracking: {
        confirmed: { status: true, timestamp: new Date().toISOString() },
        preparing: { status: false, timestamp: null },
        ready: { status: false, timestamp: null },
        completed: { status: false, timestamp: null }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Attempting to create order with validated data:', {
      restaurantId: order.restaurant_id,
      userId: order.user_id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      tableNumber: order.table_number,
      total: order.total,
      itemsCount: order.items.length,
      isGuest: !orderData.userId
    });

    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (error) {
      console.error('Supabase order creation error:', error);
      // Log the detailed error from Supabase
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    // Create notification for new order
    await createManagerOrderNotification(data);
    
    return data;
  } catch (error) {
    console.error('Error in createOrder function:', error.message);
    throw error;
  }
};

/**
 * Create manager notification for new order
 */
const createManagerOrderNotification = async (order) => {
  try {
    await createNotification({
      title: 'New Order Received',
      message: `Order #${order.order_number} received for ₹${order.total}`,
      type: 'order_received',
      restaurant_id: order.restaurant_id,
      is_admin_notification: true,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
        total_amount: order.total
      }
    });
  } catch (error) {
    console.error('Failed to create manager notification:', error);
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (orderId, paymentData) => {
  try {
    const updateData = {
      payment_status: paymentData.status,
      payment_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add Razorpay specific fields if available
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
    throw error;
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(
          id,
          name,
          logo_url,
          contact_phone
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(
          id,
          name,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get restaurant orders
 */
export const getRestaurantOrders = async (restaurantId, filters = {}) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:users(
          id,
          email,
          user_metadata
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// ========= PAYMENT PROCESSING FUNCTIONS =========

/**
 * Process payment with Razorpay
 */
export const processRazorpayPayment = async (paymentData) => {
  try {
    const rzp = await initializeRazorpayPayment(paymentData);
    rzp.open();
    return rzp;
  } catch (error) {
    throw error;
  }
};

/**
 * Process direct payment (pay at restaurant)
 */
export const processDirectPayment = async (orderData) => {
  try {
    const result = await createOrder({
      ...orderData,
      razorpay_payment_id: 'DIRECT-' + Date.now(),
      razorpay_order_id: 'DIRECT-ORDER-' + Date.now(),
      razorpay_signature: 'NA',
      payment_method: 'direct',
      payment_status: 'completed'
    });
    
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Complete payment process
 */
export const completePayment = async (paymentResponse, orderData) => {
  try {
    // Verify payment if using Razorpay
    if (paymentResponse.razorpay_payment_id && paymentResponse.razorpay_payment_id !== 'DIRECT-' + Date.now()) {
      const isValid = verifyRazorpaySignature(
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_order_id,
        paymentResponse.razorpay_signature
      );
      
      if (!isValid) {
        throw new Error('Payment verification failed');
      }
    }

    // Create order
    const order = await createOrder({
      ...orderData,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      payment_status: 'completed'
    });

    // Create success notification
    await createNotification({
      title: 'Payment Successful',
      message: `Payment completed for order #${order.order_number}`,
      type: 'payment_success',
      user_id: orderData.userId,
      restaurant_id: orderData.restaurantId,
      metadata: {
        order_id: order.id,
        payment_id: paymentResponse.razorpay_payment_id,
        amount: orderData.total
      }
    });

    return order;
  } catch (error) {
    // Create failure notification
    await createNotification({
      title: 'Payment Failed',
      message: `Payment failed: ${error.message}`,
      type: 'payment_failed',
      user_id: orderData.userId,
      restaurant_id: orderData.restaurantId,
      metadata: {
        error: error.message,
        amount: orderData.total
      }
    });

    throw error;
  }
};

// ========= UTILITY FUNCTIONS =========

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Validate payment data
 */
export const validatePaymentData = (paymentData) => {
  const errors = [];

  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push('Invalid amount');
  }

  if (!paymentData.restaurantId) {
    errors.push('Restaurant ID is required');
  }

  if (!paymentData.customerName || paymentData.customerName.trim() === '') {
    errors.push('Customer name is required');
  }

  if (!paymentData.customerEmail || paymentData.customerEmail.trim() === '') {
    errors.push('Customer email is required');
  }

  if (!paymentData.tableNumber || paymentData.tableNumber.trim() === '') {
    errors.push('Table number is required');
  }

  return errors;
};

/**
 * Get payment method display name
 */
export const getPaymentMethodDisplayName = (method) => {
  const methods = {
    'razorpay': 'Online Payment',
    'direct': 'Pay at Restaurant',
    'card': 'Credit/Debit Card',
    'upi': 'UPI',
    'netbanking': 'Net Banking'
  };
  
  return methods[method] || method;
};

/**
 * Check if payment is completed
 */
export const isPaymentCompleted = (paymentStatus) => {
  return ['completed', 'paid', 'success'].includes(paymentStatus?.toLowerCase());
};

/**
 * Get payment status color
 */
export const getPaymentStatusColor = (status) => {
  const colors = {
    'pending': 'text-yellow-600',
    'completed': 'text-green-600',
    'failed': 'text-red-600',
    'cancelled': 'text-gray-600',
    'refunded': 'text-blue-600'
  };
  
  return colors[status?.toLowerCase()] || 'text-gray-600';
};

export default {
  // Razorpay functions
  loadRazorpayScript,
  initializeRazorpayPayment,
  verifyRazorpaySignature,
  processRazorpayPayment,
  
  // Order functions
  generateOrderNumber,
  calculateOrderTotals,
  createOrder,
  updatePaymentStatus,
  getOrderById,
  getUserOrders,
  getRestaurantOrders,
  
  // Payment processing
  processDirectPayment,
  completePayment,
  
  // Utility functions
  formatCurrency,
  validatePaymentData,
  getPaymentMethodDisplayName,
  isPaymentCompleted,
  getPaymentStatusColor
};