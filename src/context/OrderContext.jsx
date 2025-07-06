// src/context/OrderContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../config/AuthContext';
import { useRestaurant } from '../Pages/Restaurantselection/RestaurantContext';
import { 
  createOrder, 
  getUserOrders, 
  subscribeToOrderUpdates,
  getOrderById,
  updatePaymentStatus
} from '../api/orderService';

// Create a dummy notification service function if you don't have it yet
const createNotification = async (data) => {
  console.log("Notification created:", data);
  // Implement the actual notification creation when ready
};

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [userOrders, setUserOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Always call useRestaurant hook, but handle the case where context might not be available
  const restaurantContext = useRestaurant();
  const { restaurant, loading: restaurantLoading, error: restaurantError } = restaurantContext || {
    restaurant: null,
    loading: false,
    error: null
  };
  
  const navigate = useNavigate();

  // Fetch user orders from Supabase
  const fetchUserOrders = useCallback(async () => {
    if (!user?.id) {
      setUserOrders([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const orders = await getUserOrders(user.id);
      setUserOrders(orders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
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

      const orderWithRestaurant = {
        ...orderData,
        restaurant_id: restaurant.id,
        user_id: user?.id || null,
      };

      console.log('Placing order with data:', orderWithRestaurant);
      const result = await createOrder(orderWithRestaurant);
      return result;
    } catch (error) {
      console.error('Error placing order:', error);
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
      console.error('Error updating payment status:', err);
      throw err;
    }
  };

  // Subscribe to order status updates
  const subscribeToOrderStatus = (orderId) => {
    if (!orderId) {
      console.warn('No order ID provided for subscription');
      return null;
    }

    const subscription = subscribeToOrderUpdates(orderId, (updatedOrder) => {
      console.log('Order status updated:', updatedOrder);
      
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
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    userOrders,
    currentOrder,
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