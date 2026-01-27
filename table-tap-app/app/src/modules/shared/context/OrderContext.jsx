// src/context/OrderContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../config/AuthContext';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updatePaymentStatus
} from '../../customer/api/paymentService';
import { subscribeToOrderUpdates } from '../../restaurant/api/admin/orderService'; // Add this import
import { supabase } from '../supabase';

// Create a dummy notification service function if you don't have it yet
const createNotification = async (data) => {
  // Implement the actual notification creation when ready
};

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [userOrders, setUserOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Safely access restaurant context with proper error handling
  let restaurantContext = null;
  let restaurant = null;
  let restaurantLoading = false;
  let restaurantError = null;

  try {
    restaurantContext = useRestaurant();
    if (restaurantContext) {
      restaurant = restaurantContext.restaurant;
      restaurantLoading = restaurantContext.loading;
      restaurantError = restaurantContext.error;
    }
  } catch (err) {
    // Continue without restaurant context - this is normal for admin pages
  }

  const navigate = useNavigate();

  // Fetch user orders from Supabase with pagination support
  const fetchUserOrders = useCallback(async (page = 1, pageSize = 10) => {
    if (!user?.id) {
      setUserOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setUserOrders(data || []);
      setOrdersTotal(count || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch user orders when component mounts or user changes
  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  // Place a new order with proper null checking
  const placeOrder = useCallback(async (orderData) => {
    try {
      // Check if restaurant context is still loading
      if (restaurantLoading) {
        throw new Error('Restaurant data is still loading. Please try again.');
      }

      // Check if there's a restaurant error
      if (restaurantError) {
        throw new Error(`Restaurant error: ${restaurantError}`);
      }

      // Check if restaurant is available
      if (!restaurant) {
        throw new Error('No restaurant selected. Please select a restaurant first.');
      }

      if (!restaurant.id) {
        throw new Error('Restaurant ID is missing. Please try again.');
      }

      // Map to paymentService.createOrder expected fields
      const orderWithRestaurant = {
        restaurantId: restaurant.id,
        restaurantName: restaurant?.name,
        userId: user?.id || null,
        customerName: orderData.customerName || orderData.name || '',
        customerEmail: orderData.customerEmail || orderData.email || '',
        customerPhone: orderData.customerPhone || orderData.phone || '',
        tableNumber: orderData.tableNumber || orderData.table_number,
        items: orderData.items || [],
        discountPercentage: orderData.discountPercentage || 0,
        // Payment fields (optional, when available)
        razorpayOrderId: orderData.razorpayOrderId,
        razorpayPaymentId: orderData.razorpayPaymentId,
        razorpaySignature: orderData.razorpaySignature,
        paymentMethod: orderData.paymentMethod,
        specialInstructions: orderData.specialInstructions,
      };

      const result = await createOrder(orderWithRestaurant);
      return result;
    } catch (error) {
      throw error;
    }
  }, [restaurant, restaurantLoading, restaurantError, user?.id]);

  // Update payment status
  const updateOrderPayment = async (orderId, paymentData) => {
    try {
      const updatedOrder = await updatePaymentStatus(orderId, paymentData);

      // Update order in local state
      setUserOrders(prev =>
        prev.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );

      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(updatedOrder);
      }

      return updatedOrder;
    } catch (err) {
      throw err;
    }
  };

  // Subscribe to order status updates
  const subscribeToOrderStatus = (orderId) => {
    if (!orderId) {
      return null;
    }

    const subscription = subscribeToOrderUpdates(orderId, (updatedOrder) => {

      // Update order in local state
      setUserOrders(prev =>
        prev.map(order =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );

      // Update current order if it's the one being viewed
      if (currentOrder && currentOrder.id === updatedOrder.id) {
        setCurrentOrder(updatedOrder);
      }
    });

    return subscription;
  };

  // Get a specific order by ID
  const getOrderDetails = async (orderId) => {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      setLoading(true);
      const order = await getOrderById(orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      setCurrentOrder(order);

      // Subscribe to status updates for this order
      subscribeToOrderStatus(orderId);

      return order;
    } catch (err) {
      setError('Failed to load order details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    userOrders,
    currentOrder,
    ordersTotal,
    loading: loading || restaurantLoading, // Include restaurant loading state
    error: error || restaurantError, // Include restaurant error state
    placeOrder,
    updateOrderPayment,
    fetchUserOrders,
    getOrderDetails,
    subscribeToOrderStatus,
    restaurant // Expose restaurant data for components that need it
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};