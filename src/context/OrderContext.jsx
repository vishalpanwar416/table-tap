// src/context/OrderContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../config/AuthContext';
// Correct the import paths to match your actual file structure
import { 
  createOrder, 
  getUserOrders, 
  subscribeToOrderUpdates,
  getOrderById
} from '../api/orderService'; // Updated path

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
  const { user } = useAuth(); // Get current user from auth context
  const navigate = useNavigate();

  // Fetch user orders when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  // Fetch user orders from Supabase
  const fetchUserOrders = useCallback(async () => {
    if (!user?.id) {
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
  
  // Place a new order
  const placeOrder = async (orderData) => {
    try {
      setLoading(true);
      
      // Add user ID to order data
      const fullOrderData = {
        ...orderData,
        userId: user?.id,
        customerName: user?.user_metadata?.full_name || user?.email || 'Guest',
        customerEmail: user?.email
      };
      
      // Create order in Supabase
      // In placeOrder function
const newOrder = await createOrder(fullOrderData);

// Create detailed admin notification
await createNotification({
  title: 'New Order Received',
  message: `Order #${newOrder.id.slice(0, 8)}`,
  type: 'order_received',
  orderId: newOrder.id,
  isAdminNotification: true,
  orderDetails: { // Include full order details
    items: newOrder.items,
    total: newOrder.total,
    customer: newOrder.customerName,
    table: newOrder.tableNumber,
    createdAt: newOrder.created_at
  }
});
      // Set current order
      setCurrentOrder(newOrder);
      
      // Add order to local state
      setUserOrders(prev => [newOrder, ...prev]);
      
      // Subscribe to order updates
      subscribeToOrderStatus(newOrder.id);
      
      return newOrder;
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place your order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to order status updates
  const subscribeToOrderStatus = (orderId) => {
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
      
      // Create notification for user based on status
      handleOrderStatusNotification(updatedOrder);
    });
    
    return subscription;
  };

  // Handle notifications based on order status changes
  const handleOrderStatusNotification = async (order) => {
    let notificationData = null;
    
    switch (order.status) {
      case 'accepted':
        notificationData = {
          title: 'Order Accepted',
          message: `Your order #${order.id.slice(0, 8)} has been accepted and is being prepared`,
          type: 'order_accepted',
          orderId: order.id,
          userId: order.userId
        };
        break;
      case 'preparing':
        notificationData = {
          title: 'Order Preparing',
          message: `Your order #${order.id.slice(0, 8)} is now being prepared`,
          type: 'order_preparing',
          orderId: order.id,
          userId: order.userId
        };
        break;
      case 'completed':
        notificationData = {
          title: 'Order Completed',
          message: `Your order #${order.id.slice(0, 8)} is ready!`,
          type: 'order_completed',
          orderId: order.id,
          userId: order.userId
        };
        break;
      case 'rejected':
        notificationData = {
          title: 'Order Rejected',
          message: `Unfortunately, your order #${order.id.slice(0, 8)} could not be fulfilled`,
          type: 'order_rejected',
          orderId: order.id,
          userId: order.userId
        };
        break;
      default:
        break;
    }
    
    if (notificationData && order.userId) {
      await createNotification(notificationData);
    }
  };

  // Get a specific order by ID
  const getOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      const order = await getOrderById(orderId);
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
    loading, // Add this line
    error,   // Add this line
    placeOrder,
    fetchUserOrders,
    getOrderDetails,
    subscribeToOrderStatus
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