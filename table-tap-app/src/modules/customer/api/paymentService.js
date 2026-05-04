// src/api/paymentService.js
import { supabase } from '../../shared/supabase';
import { createNotification } from '../../shared/api/notificationService';

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
export const initializeRazorpayPayment = ({
  razorpayKeyId,
  amount,
  restaurantName,
  restaurantLogo,
  restaurantId,
  customerName,
  customerEmail,
  customerPhone,
  tableNumber,
  specialInstructions,
  themeColor,
  onSuccess,
  onDismiss,
  onFailure,
}) => {
  try {
    const rzp = new window.Razorpay({
      key: razorpayKeyId,
      amount: amount,
      currency: 'INR',
      name: restaurantName || 'Restaurant Order',
      description: `Order at ${restaurantName || 'Restaurant'}`,
      image: restaurantLogo || '/logo.png',
      handler: onSuccess,
      prefill: {
        name: customerName || 'Valued Customer',
        email: customerEmail,
        contact: customerPhone,
      },
      theme: { color: themeColor || '#F37254' },
      modal: {
        ondismiss: onDismiss,
      },
      notes: {
        restaurant_id: restaurantId || '1',
        table_number: tableNumber || 'N/A',
        special_instructions: specialInstructions,
      },
    });

    rzp.on('payment.failed', (response) => {
      if (onFailure) {
        onFailure(response.error.description || 'Gateway error');
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
export const verifyRazorpaySignature = async (paymentId, orderId, signature) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        payment_id: paymentId,
        order_id: orderId,
        signature: signature,
      },
    });

    if (error) {
      console.error('Payment verification error:', error);
      return false;
    }

    return data?.verified === true;
  } catch (err) {
    console.error('Payment verification exception:', err);
    return false;
  }
};

// ========= ORDER CREATION AND MANAGEMENT =========

/**
 * Calculate order totals with GST and discounts
 */
export const calculateOrderTotals = (items, discountValue = 0, discountType = 'percentage') => {
  let originalTotal = 0;
  let discountAmount = 0;
  let taxableAmount = 0;

  items.forEach((item) => {
    const originalItemTotal = item.price * item.quantity;
    originalTotal += originalItemTotal;

    // Calculate effective price after item-level discounts
    const effectivePrice = item.effectivePrice !== undefined ? item.effectivePrice : item.price; // Use original price if no item-level discount

    const itemDiscount = (item.price - effectivePrice) * item.quantity;
    discountAmount += itemDiscount;

    const itemSubtotal = effectivePrice * item.quantity;

    // Check if the item is water (exempt from GST)
    const isWater =
      item.name &&
      (item.name.toLowerCase().includes('water') || item.category?.toLowerCase() === 'water');

    if (!isWater) {
      taxableAmount += itemSubtotal;
    }
  });

  // Apply global discount if specified
  if (discountValue > 0) {
    let globalDiscountAmount = 0;
    if (discountType === 'percentage') {
      globalDiscountAmount = (originalTotal * discountValue) / 100;
      // Adjust taxable amount proportionally
      const discountRatio = discountValue / 100;
      taxableAmount = taxableAmount * (1 - discountRatio);
    } else if (discountType === 'flat') {
      globalDiscountAmount = Math.min(discountValue, originalTotal); // Don't exceed total
      // Adjust taxable amount proportionally
      const discountRatio = globalDiscountAmount / originalTotal;
      taxableAmount = taxableAmount * (1 - discountRatio);
    }
    discountAmount += globalDiscountAmount;
  }

  const cgst = taxableAmount * 0.025; // 2.5% CGST
  const sgst = taxableAmount * 0.025; // 2.5% SGST
  const subtotalAfterDiscount = originalTotal - discountAmount;
  const finalTotal = subtotalAfterDiscount + cgst + sgst;

  return {
    subtotal: originalTotal,
    discountAmount,
    subtotalAfterDiscount,
    cgst,
    sgst,
    finalTotal,
  };
};

/**
 * Create a new order in Supabase
 */
export const createOrder = async (orderData) => {
  try {
    // FIX: Add robust, final validation for guest user data before insertion.
    // This acts as a final guard against invalid data, regardless of frontend state.
    if (!orderData.userId && !orderData.isAdmin) {
      // Strict validation only for non-admin guest orders
      if (!orderData.customerName || orderData.customerName.trim() === '') {
        throw new Error('Customer name is required.');
      }
      if (!orderData.customerPhone || orderData.customerPhone.trim() === '') {
        throw new Error('Customer phone is required.');
      }
    }

    // Calculate price details
    const totals = calculateOrderTotals(orderData.items, orderData.discountPercentage || 0);

    // Order number is now auto-generated by DB trigger (REST-PAY-123456)

    const order = {
      // order_number: generated automatically
      restaurant_id: orderData.restaurantId,
      user_id: orderData.userId || null, // null for guest users
      // Ensure data is trimmed to prevent whitespace issues with RLS
      customer_name: (orderData.customerName || 'Walk-in Customer').trim(),
      // Use provided email or generate a placeholder based on phone
      customer_email:
        orderData.customerEmail && orderData.customerEmail.trim() !== ''
          ? orderData.customerEmail.trim()
          : `guest_${orderData.customerPhone.replace(/[^0-9]/g, '')}@tabletap.com`,
      customer_phone: (orderData.customerPhone || '').trim(),
      table_number: orderData.tableNumber || 'Not Specified',
      items: orderData.items.map((item) => ({
        food_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        category: item.category,
        image: item.image,
        note: item.note || null,
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
      status: orderData.status || 'pending',
      special_instructions: orderData.specialInstructions || null,
      tracking: orderData.tracking || {
        confirmed: { status: true, timestamp: new Date().toISOString() },
        preparing: { status: false, timestamp: null },
        ready: { status: false, timestamp: null },
        completed: { status: false, timestamp: null },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      isGuest: !orderData.userId,
    });

    const { data, error } = await supabase.from('orders').insert([order]).select().single();

    if (error) {
      console.error('Supabase order creation error:', error);
      // Log the detailed error from Supabase
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
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
        total_amount: order.total,
      },
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
      updated_at: new Date().toISOString(),
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
      .select(
        `
        *,
        restaurant:restaurants(
          id,
          name,
          logo_url,
          contact_phone
        )
      `,
      )
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
      .select(
        `
        *,
        restaurant:restaurants(
          id,
          name,
          logo_url
        )
      `,
      )
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
      .select(
        `
        *,
        user:users(
          id,
          email,
          user_metadata
        )
      `,
      )
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
      payment_status: 'completed',
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
    if (
      paymentResponse.razorpay_payment_id &&
      !paymentResponse.razorpay_payment_id.startsWith('DIRECT-') &&
      !paymentResponse.razorpay_payment_id.startsWith('UPI-')
    ) {
      const isValid = await verifyRazorpaySignature(
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_order_id,
        paymentResponse.razorpay_signature,
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
      payment_status: 'completed',
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
        amount: orderData.total,
      },
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
        amount: orderData.total,
      },
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
    currency: currency,
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
    razorpay: 'Online Payment',
    direct: 'Pay at Restaurant',
    card: 'Credit/Debit Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
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
    pending: 'text-yellow-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    cancelled: 'text-gray-600',
    refunded: 'text-blue-600',
  };

  return colors[status?.toLowerCase()] || 'text-gray-600';
};

// Helper: Retry mechanism for order creation
const createOrderWithRetry = async (orderData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const orderDataWithAttempt = { ...orderData, creationAttempt: attempt };
      const order = await createOrder(orderDataWithAttempt);
      if (order && order.id) {
        return order;
      } else {
        throw new Error('Order creation returned empty response');
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Order creation failed after ${maxRetries} attempts: ${error.message}`);
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Helper: Notify backend and customer about payment-order mismatch (Client-side logging fallback)
const notifyPaymentOrderMismatch = async (failedOrderData, restaurantName) => {
  // Log locally for now to prevent UI errors if backend function is missing
  console.warn('PAYMENT MISMATCH ALERT:', {
    message: 'Payment succeeded but order creation failed',
    data: failedOrderData,
    restaurant: restaurantName,
  });

  // Try to invoke the function, but catch safely
  try {
    const { data, error } = await supabase.functions.invoke('payment-alert', {
      body: {
        type: 'payment_success_order_failed',
        data: failedOrderData,
        urgency: 'high',
        customerEmail: failedOrderData.customerEmail,
        customerName: failedOrderData.customerName,
        restaurantName: restaurantName,
        paymentId: failedOrderData.paymentId,
        amount: failedOrderData.amount,
        tableNumber: failedOrderData.tableNumber,
      },
    });
    if (error) console.error('Alert function error:', error);
  } catch (e) {
    // Ignore alert failures to keep the UI recovery flow active
    console.log('Could not send remote alert, local recovery active.');
  }
};

// Deprecated: Consolidated into notifyPaymentOrderMismatch
const sendOrderFailureNotification = async (failedOrderData, restaurant) => {
  // This is now handled by the payment-alert edge function
  return Promise.resolve();
};

// Helper: Show recovery options to user
const showPaymentRecoveryOptions = (
  paymentId,
  { retryOrderCreation, contactSupport, closeRecoveryDialog },
) => {
  const recoveryDialog = document.createElement('div');
  recoveryDialog.className =
    'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  recoveryDialog.innerHTML = `
    <div class="bg-white p-6 rounded-2xl max-w-md mx-4">
      <h3 class="text-lg font-bold mb-4 text-red-600">Payment Successful, Order Issue</h3>
      <p class="text-gray-700 mb-4">
        Your payment was processed successfully, but there was an issue creating your order. 
        Don't worry - your money is safe!
      </p>
      <div class="mb-4">
        <p class="text-sm text-gray-600">Payment ID: <span class="font-mono">${paymentId}</span></p>
      </div>
      <div class="space-y-3">
        <button id="retryOrderBtn" class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
          Retry Order Creation
        </button>
        <button id="contactSupportBtn" class="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600">
          Contact Support
        </button>
        <button id="closeRecoveryBtn" class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300">
          Close
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(recoveryDialog);

  document.getElementById('retryOrderBtn').onclick = retryOrderCreation;
  document.getElementById('contactSupportBtn').onclick = contactSupport;
  document.getElementById('closeRecoveryBtn').onclick = closeRecoveryDialog;
};

const closeRecoveryDialog = () => {
  const dialog = document.querySelector('.fixed.inset-0');
  if (dialog) dialog.remove();
};

export const processOrderWithPayment = async ({
  paymentResponse,
  restaurant,
  user,
  cartItems,
  finalCustomerName,
  finalCustomerEmail,
  finalCustomerPhone,
  tableNumber,
  specialInstructions,
  paymentMethod,
  finalTotal,
  clearCart,
  navigate,
  setScriptError,
  setIsProcessing,
}) => {
  try {
    if (!paymentResponse || !paymentResponse.razorpay_payment_id) {
      throw new Error('Missing payment confirmation details');
    }
    if (!restaurant || !restaurant.id) {
      throw new Error('Restaurant data not available');
    }
    // Guest validation
    if (!user) {
      if (!finalCustomerName || finalCustomerName.trim() === '') {
        throw new Error('Customer name is required');
      }
      if (!finalCustomerPhone || finalCustomerPhone.trim() === '') {
        throw new Error('Customer phone is required');
      }
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(finalCustomerPhone.trim())) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      // Email is optional for guests now
      if (finalCustomerEmail && finalCustomerEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(finalCustomerEmail.trim())) {
          throw new Error('Please enter a valid email address');
        }
      }
    }

    // Store payment data before order creation
    const paymentData = {
      paymentId: paymentResponse.razorpay_payment_id,
      orderId: paymentResponse.razorpay_order_id,
      signature: paymentResponse.razorpay_signature,
      amount: finalTotal,
      currency: 'INR',
      status: 'captured',
      method: paymentMethod,
      timestamp: new Date().toISOString(),
      customerEmail: finalCustomerEmail.trim(),
      customerPhone: finalCustomerPhone.trim(),
      restaurantId: restaurant.id,
    };
    localStorage.setItem(
      `payment_${paymentResponse.razorpay_payment_id}`,
      JSON.stringify(paymentData),
    );

    // Try to create order with retry mechanism
    const order = await createOrderWithRetry({
      restaurantId: restaurant.id,
      userId: user ? user.id : null,
      customerName: (finalCustomerName || 'Guest').trim(),
      customerEmail:
        finalCustomerEmail && finalCustomerEmail.trim() !== ''
          ? finalCustomerEmail.trim()
          : `guest_${finalCustomerPhone.replace(/[^0-9]/g, '')}@tabletap.com`,
      customerPhone: (finalCustomerPhone || '').trim(),
      tableNumber,
      items: cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        category: item.category,
        image: item.image,
      })),
      razorpayOrderId: paymentResponse.razorpay_order_id || null,
      razorpayPaymentId: paymentResponse.razorpay_payment_id || null,
      razorpaySignature: paymentResponse.razorpay_signature || null,
      paymentMethod:
        paymentMethod === 'razorpay' ? 'razorpay' : paymentMethod === 'upi' ? 'upi' : 'direct',
      paymentStatus: 'completed',
      specialInstructions,
      totalAmount: finalTotal,
    });

    // Order created successfully - clear backup payment data
    localStorage.removeItem(`payment_${paymentResponse.razorpay_payment_id}`);

    clearCart();
    navigate('/order-confirmation-page', {
      state: {
        orderId: order.id,
        orderNumber: order.order_number,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        totalAmount: order.total,
        tableNumber,
        paymentMethod,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: finalCustomerPhone,
        specialInstructions,
        paymentId: paymentResponse.razorpay_payment_id,
      },
    });
    return true;
  } catch (error) {
    // Handle payment success but order creation failure
    if (
      paymentResponse.razorpay_payment_id &&
      !paymentResponse.razorpay_payment_id.startsWith('DIRECT-')
    ) {
      await handlePaymentSuccessOrderFailure({
        paymentResponse,
        restaurant,
        cartItems,
        finalCustomerName,
        finalCustomerEmail,
        finalCustomerPhone,
        tableNumber,
        specialInstructions,
        paymentMethod,
        finalTotal,
        setScriptError,
        setIsProcessing,
        user,
        navigate,
        clearCart,
      });
    } else {
      setScriptError(`Order creation failed: ${error.message}`);
      setIsProcessing(false);
    }
    return false;
  }
};

const handlePaymentSuccessOrderFailure = async ({
  paymentResponse,
  restaurant,
  cartItems,
  finalCustomerName,
  finalCustomerEmail,
  finalCustomerPhone,
  tableNumber,
  specialInstructions,
  paymentMethod,
  finalTotal,
  setScriptError,
  setIsProcessing,
  user,
  navigate,
  clearCart,
}) => {
  try {
    setScriptError(
      `IMPORTANT: Your payment was successful but there was an issue creating your order. ` +
        `Please don't worry - your money is safe. Our team has been notified and will contact you shortly. ` +
        `Payment ID: ${paymentResponse.razorpay_payment_id}`,
    );
    // 1. Store the failed order attempt for manual processing
    const failedOrderData = {
      paymentId: paymentResponse.razorpay_payment_id,
      orderId: paymentResponse.razorpay_order_id,
      signature: paymentResponse.razorpay_signature,
      amount: finalTotal,
      currency: 'INR',
      customerName: finalCustomerName,
      customerEmail: finalCustomerEmail,
      customerPhone: finalCustomerPhone,
      restaurantId: restaurant.id,
      tableNumber,
      items: cartItems,
      specialInstructions,
      paymentMethod,
      errorMessage: 'Order creation failed after payment',
      timestamp: new Date().toISOString(),
      status: 'payment_success_order_failed',
    };
    // 1. Persist failed order to DB so it survives browser close/refresh
    try {
      await supabase.from('failed_payment_orders').insert({
        razorpay_payment_id: failedOrderData.paymentId,
        razorpay_order_id: failedOrderData.orderId,
        razorpay_signature: failedOrderData.signature,
        restaurant_id: failedOrderData.restaurantId,
        user_id: user ? user.id : null,
        customer_name: failedOrderData.customerName,
        customer_email: failedOrderData.customerEmail,
        customer_phone: failedOrderData.customerPhone,
        table_number: failedOrderData.tableNumber,
        items: failedOrderData.items,
        amount: failedOrderData.amount,
        payment_method: failedOrderData.paymentMethod,
        special_instructions: failedOrderData.specialInstructions,
        error_message: failedOrderData.errorMessage,
        status: 'pending_recovery',
      });
    } catch (dbError) {
      // DB insert failed — fall back to sessionStorage as last resort
      console.error('Failed to persist failed order to DB:', dbError);
      sessionStorage.setItem(
        `failed_order_${failedOrderData.paymentId}`,
        JSON.stringify(failedOrderData),
      );
    }
    // 2. Notify backend
    try {
      await notifyPaymentOrderMismatch(failedOrderData, restaurant.name);
    } catch (notifyError) {
      console.error('Notify failed:', notifyError);
    }
    // 3. Show recovery options to user
    showPaymentRecoveryOptions(paymentResponse.razorpay_payment_id, {
      retryOrderCreation: async () => {
        try {
          // Prefer DB record; fall back to sessionStorage
          let recoveryData = failedOrderData;
          const { data: dbRecord } = await supabase
            .from('failed_payment_orders')
            .select('*')
            .eq('razorpay_payment_id', paymentResponse.razorpay_payment_id)
            .eq('status', 'pending_recovery')
            .single();
          if (dbRecord) {
            recoveryData = {
              paymentId: dbRecord.razorpay_payment_id,
              orderId: dbRecord.razorpay_order_id,
              signature: dbRecord.razorpay_signature,
              restaurantId: dbRecord.restaurant_id,
              customerName: dbRecord.customer_name,
              customerEmail: dbRecord.customer_email,
              customerPhone: dbRecord.customer_phone,
              tableNumber: dbRecord.table_number,
              items: dbRecord.items,
              amount: dbRecord.amount,
              paymentMethod: dbRecord.payment_method,
              specialInstructions: dbRecord.special_instructions,
            };
          }
          const order = await createOrderWithRetry({
            restaurantId: recoveryData.restaurantId,
            userId: user ? user.id : null,
            customerName: recoveryData.customerName,
            customerEmail: recoveryData.customerEmail,
            customerPhone: recoveryData.customerPhone,
            tableNumber: recoveryData.tableNumber,
            items: recoveryData.items,
            razorpayOrderId: recoveryData.orderId,
            razorpayPaymentId: recoveryData.paymentId,
            razorpaySignature: recoveryData.signature,
            paymentMethod: recoveryData.paymentMethod,
            paymentStatus: 'completed',
            specialInstructions: recoveryData.specialInstructions,
            totalAmount: recoveryData.amount,
            isRetry: true,
          });
          if (order) {
            // Mark DB record as recovered
            await supabase
              .from('failed_payment_orders')
              .update({ status: 'recovered', recovered_order_id: order.id })
              .eq('razorpay_payment_id', paymentResponse.razorpay_payment_id);
            sessionStorage.removeItem(`failed_order_${paymentResponse.razorpay_payment_id}`);
            clearCart();
            navigate('/order-confirmation-page', {
              state: {
                orderId: order.id,
                orderNumber: order.order_number,
                restaurantId: recoveryData.restaurantId,
                restaurantName: restaurant.name,
                totalAmount: order.total,
                tableNumber: recoveryData.tableNumber,
                paymentMethod: recoveryData.paymentMethod,
                customerName: recoveryData.customerName,
                customerEmail: recoveryData.customerEmail,
                customerPhone: recoveryData.customerPhone,
                specialInstructions: recoveryData.specialInstructions,
                paymentId: paymentResponse.razorpay_payment_id,
                wasRetry: true,
              },
            });
            closeRecoveryDialog();
          }
        } catch (error) {
          alert('Retry failed. Please contact customer support.');
        }
      },
      contactSupport: () => {
        const supportPhone = restaurant.phone || '1800-xxx-xxxx';
        const supportEmail = restaurant.email || 'support@restaurant.com';
        const message = `Payment ID: ${paymentResponse.razorpay_payment_id}\nAmount: ₹${finalTotal}\nRestaurant: ${restaurant.name}\nTable: ${tableNumber}\nIssue: Payment successful but order creation failed`;
        if (supportPhone) {
          window.open(
            `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`,
            '_blank',
          );
        } else {
          window.open(
            `mailto:${supportEmail}?subject=Payment Issue - ${paymentResponse.razorpay_payment_id}&body=${encodeURIComponent(message)}`,
            '_blank',
          );
        }
      },
      closeRecoveryDialog,
    });
  } catch (error) {
    setScriptError(
      `Payment successful but order creation failed. Payment ID: ${paymentResponse.razorpay_payment_id}. ` +
        `Please contact customer support immediately.`,
    );
  }
  setIsProcessing(false);
};

// Check for pending failed orders on app load — queries DB first, falls back to sessionStorage
export const checkPendingFailedOrders = async (userId, showPaymentRecoveryOptions) => {
  try {
    // 1. Check DB for unrecovered failed orders belonging to this user
    if (userId) {
      const { data: dbRecords } = await supabase
        .from('failed_payment_orders')
        .select('razorpay_payment_id')
        .eq('user_id', userId)
        .eq('status', 'pending_recovery')
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbRecords && dbRecords.length > 0) {
        setTimeout(() => {
          showPaymentRecoveryOptions(dbRecords[0].razorpay_payment_id);
        }, 1000);
        return;
      }
    }

    // 2. Fall back to sessionStorage (for guest users or DB failures)
    const keys = Object.keys(sessionStorage);
    const failedOrderKeys = keys.filter((key) => key.startsWith('failed_order_'));
    if (failedOrderKeys.length > 0) {
      const paymentId = failedOrderKeys[0].replace('failed_order_', '');
      setTimeout(() => {
        showPaymentRecoveryOptions(paymentId);
      }, 1000);
    }
  } catch (err) {
    console.error('checkPendingFailedOrders error:', err);
  }
};

export default {
  // Razorpay functions
  loadRazorpayScript,
  initializeRazorpayPayment,
  verifyRazorpaySignature,
  processRazorpayPayment,

  // Order functions
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
  getPaymentStatusColor,
  processOrderWithPayment,
  checkPendingFailedOrders,
};
