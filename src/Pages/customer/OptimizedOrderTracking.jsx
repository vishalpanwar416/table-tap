import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Package, Truck, XCircle, MapPin, Phone } from 'lucide-react';
import { OptimizedPageWrapper, itemVariants } from '../../components/customer/OptimizedPageWrapper';
import { useOrders } from '../../context/OrderContext';
import { usePerformanceMonitor } from '../../hooks/usePerformance';

const OptimizedOrderTracking = memo(() => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { userOrders } = useOrders();
  
  // Performance monitoring
  usePerformanceMonitor('OrderTracking');
  
  // State management
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  // Find order by ID
  useEffect(() => {
    if (!orderId || !userOrders.length) return;

    const foundOrder = userOrders.find(o => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
      setLoading(false);
    } else {
      setError('Order not found');
      setLoading(false);
    }
  }, [orderId, userOrders]);

  // Calculate estimated time
  useEffect(() => {
    if (!order) return;

    const orderTime = new Date(order.created_at);
    const now = new Date();
    const timeDiff = now - orderTime;
    const estimatedMinutes = Math.max(15, Math.floor(timeDiff / (1000 * 60)) + 15);
    
    const estimatedTime = new Date(orderTime.getTime() + (estimatedMinutes * 60 * 1000));
    setEstimatedTime(estimatedTime);
  }, [order]);

  // Status configuration
  const statusConfig = useMemo(() => ({
    pending: {
      icon: <Clock className="w-6 h-6 text-yellow-500" />,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      label: 'Order Placed',
      description: 'Your order has been received and is being processed'
    },
    preparing: {
      icon: <Package className="w-6 h-6 text-purple-500" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      label: 'Preparing',
      description: 'Your order is being prepared in the kitchen'
    },
    ready: {
      icon: <Truck className="w-6 h-6 text-blue-500" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Ready for Pickup',
      description: 'Your order is ready for pickup'
    },
    completed: {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      color: 'bg-green-50 text-green-700 border-green-200',
      label: 'Completed',
      description: 'Order has been completed'
    },
    rejected: {
      icon: <XCircle className="w-6 h-6 text-red-500" />,
      color: 'bg-red-50 text-red-700 border-red-200',
      label: 'Cancelled',
      description: 'Order has been cancelled'
    }
  }), []);

  // Status timeline
  const statusTimeline = useMemo(() => {
    if (!order) return [];

    const timeline = [
      { status: 'pending', label: 'Order Placed', completed: true }
    ];

    if (['preparing', 'ready', 'completed'].includes(order.status)) {
      timeline.push({ status: 'preparing', label: 'Preparing', completed: true });
    }

    if (['ready', 'completed'].includes(order.status)) {
      timeline.push({ status: 'ready', label: 'Ready', completed: true });
    }

    if (order.status === 'completed') {
      timeline.push({ status: 'completed', label: 'Completed', completed: true });
    }

    if (order.status === 'rejected') {
      timeline.push({ status: 'rejected', label: 'Cancelled', completed: true });
    }

    return timeline;
  }, [order]);

  const handleBack = useCallback(() => {
    navigate('/my-orders');
  }, [navigate]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    // Re-fetch orders or reload page
    window.location.reload();
  }, []);

  // Timeline component
  const Timeline = memo(() => (
    <div className="space-y-4">
      {statusTimeline.map((step, index) => (
        <motion.div
          key={step.status}
          className="flex items-start space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className={`p-2 rounded-full ${step.completed ? statusConfig[step.status]?.color : 'bg-gray-100'}`}>
            {step.completed ? statusConfig[step.status]?.icon : <Clock className="w-6 h-6 text-gray-400" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{step.label}</h3>
            <p className="text-sm text-gray-500">
              {step.completed ? statusConfig[step.status]?.description : 'Pending...'}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  ));

  // Order details component
  const OrderDetails = memo(() => (
    <div className="bg-white rounded-xl p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Order ID</span>
          <span className="font-semibold text-gray-800">#{order.id}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Order Date</span>
          <span className="font-semibold text-gray-800">
            {new Date(order.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Amount</span>
          <span className="font-bold text-lg text-gray-800">₹{order.total_amount}</span>
        </div>
        
        {estimatedTime && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Estimated Ready Time</span>
            <span className="font-semibold text-gray-800">
              {estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  ));

  // Items list component
  const ItemsList = memo(() => (
    <div className="bg-white rounded-xl p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
      
      <div className="space-y-3">
        {order.items?.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div>
              <p className="font-medium text-gray-800">{item.name}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <p className="font-semibold text-gray-800">₹{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  ));

  // Contact info component
  const ContactInfo = memo(() => (
    <div className="bg-white rounded-xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Need Help?</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-orange-500" />
          <div>
            <p className="font-medium text-gray-800">Restaurant Location</p>
            <p className="text-sm text-gray-500">Visit us for pickup</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Phone className="w-5 h-5 text-orange-500" />
          <div>
            <p className="font-medium text-gray-800">Contact Restaurant</p>
            <p className="text-sm text-gray-500">+91 98765 43210</p>
          </div>
        </div>
      </div>
    </div>
  ));

  return (
    <OptimizedPageWrapper
      title="Order Tracking"
      showBackButton
      onBack={handleBack}
      loading={loading}
      error={error}
      onRetry={handleRetry}
    >
      <motion.div 
        className="bg-white rounded-t-[30px] flex-1 p-6"
        variants={itemVariants}
      >
        {order && (
          <>
            {/* Current Status */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-full ${statusConfig[order.status]?.color}`}>
                  {statusConfig[order.status]?.icon}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    {statusConfig[order.status]?.label}
                  </h1>
                  <p className="text-gray-500">
                    {statusConfig[order.status]?.description}
                  </p>
                </div>
              </div>
              
              <Timeline />
            </div>

            <OrderDetails />
            <ItemsList />
            <ContactInfo />
          </>
        )}
      </motion.div>
    </OptimizedPageWrapper>
  );
});

OptimizedOrderTracking.displayName = 'OptimizedOrderTracking';

export default OptimizedOrderTracking; 