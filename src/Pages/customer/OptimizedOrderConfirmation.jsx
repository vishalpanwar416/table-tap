import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, MapPin, Phone, Share2, Download } from 'lucide-react';
import { OptimizedPageWrapper, itemVariants } from '../../components/customer/OptimizedPageWrapper';
import { usePerformanceMonitor } from '../../hooks/usePerformance';

const OptimizedOrderConfirmation = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Performance monitoring
  usePerformanceMonitor('OrderConfirmation');
  
  // State management
  const [orderDetails, setOrderDetails] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Get order details from location state
  useEffect(() => {
    const details = location.state?.orderDetails;
    const orderId = location.state?.orderId;
    const paymentSuccess = location.state?.paymentSuccess;

    if (details && orderId) {
      setOrderDetails({
        ...details,
        id: orderId,
        paymentSuccess
      });

      // Calculate estimated time
      const now = new Date();
      const estimatedTime = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes
      setEstimatedTime(estimatedTime);
    }
  }, [location.state]);

  // Update countdown timer
  useEffect(() => {
    if (!estimatedTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = estimatedTime - now;
      
      if (diff > 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining({ minutes, seconds });
      } else {
        setTimeRemaining({ minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedTime]);

  // Event handlers
  const handleBackToHome = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  const handleTrackOrder = useCallback(() => {
    if (orderDetails?.id) {
      navigate(`/order-tracking/${orderDetails.id}`);
    }
  }, [navigate, orderDetails]);

  const handleShareOrder = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'My Order',
        text: `Order #${orderDetails?.id} - ${orderDetails?.items?.length} items`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Order #${orderDetails?.id}`);
    }
  }, [orderDetails]);

  const handleDownloadReceipt = useCallback(() => {
    // Generate and download receipt
    const receipt = `
      Order Receipt
      =============
      Order ID: ${orderDetails?.id}
      Date: ${new Date().toLocaleDateString()}
      Time: ${new Date().toLocaleTimeString()}
      
      Items:
      ${orderDetails?.items?.map(item => 
        `${item.name} x${item.quantity} - ₹${item.price * item.quantity}`
      ).join('\n')}
      
      Total: ₹${orderDetails?.total}
    `;
    
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${orderDetails?.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [orderDetails]);

  // Success animation component
  const SuccessAnimation = memo(() => (
    <motion.div
      className="text-center mb-8"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
      <p className="text-gray-600">Your order has been successfully placed</p>
    </motion.div>
  ));

  // Order details component
  const OrderDetailsCard = memo(() => (
    <motion.div
      className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100"
      variants={itemVariants}
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Order ID</span>
          <span className="font-semibold text-gray-800">#{orderDetails?.id}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Order Date</span>
          <span className="font-semibold text-gray-800">
            {new Date().toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Amount</span>
          <span className="font-bold text-lg text-gray-800">₹{orderDetails?.total}</span>
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
    </motion.div>
  ));

  // Items list component
  const ItemsList = memo(() => (
    <motion.div
      className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100"
      variants={itemVariants}
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
      
      <div className="space-y-3">
        {orderDetails?.items?.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div>
              <p className="font-medium text-gray-800">{item.name}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
          </div>
        ))}
      </div>
    </motion.div>
  ));

  // Countdown timer component
  const CountdownTimer = memo(() => (
    <motion.div
      className="bg-orange-50 rounded-xl p-6 mb-6 border border-orange-200"
      variants={itemVariants}
    >
      <div className="text-center">
        <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Estimated Wait Time</h3>
        {timeRemaining && (
          <div className="text-2xl font-bold text-orange-600">
            {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')}
          </div>
        )}
        <p className="text-sm text-gray-600 mt-2">Your order will be ready soon!</p>
      </div>
    </motion.div>
  ));

  // Action buttons component
  const ActionButtons = memo(() => (
    <motion.div
      className="space-y-4"
      variants={itemVariants}
    >
      <button
        onClick={handleTrackOrder}
        className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
      >
        Track Order
      </button>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleShareOrder}
          className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share
        </button>
        
        <button
          onClick={handleDownloadReceipt}
          className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Receipt
        </button>
      </div>
      
      <button
        onClick={handleBackToHome}
        className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
      >
        Back to Home
      </button>
    </motion.div>
  ));

  // Restaurant info component
  const RestaurantInfo = memo(() => (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      variants={itemVariants}
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4">Restaurant Info</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-orange-500" />
          <div>
            <p className="font-medium text-gray-800">Pickup Location</p>
            <p className="text-sm text-gray-500">123 Restaurant Street, City</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Phone className="w-5 h-5 text-orange-500" />
          <div>
            <p className="font-medium text-gray-800">Contact</p>
            <p className="text-sm text-gray-500">+91 98765 43210</p>
          </div>
        </div>
      </div>
    </motion.div>
  ));

  if (!orderDetails) {
    return (
      <OptimizedPageWrapper title="Order Confirmation">
        <motion.div 
          className="bg-white rounded-t-[30px] flex-1 p-6 flex items-center justify-center"
          variants={itemVariants}
        >
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-2">No Order Found</h1>
            <p className="text-gray-500 mb-4">Please place an order first</p>
            <button
              onClick={handleBackToHome}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </motion.div>
      </OptimizedPageWrapper>
    );
  }

  return (
    <OptimizedPageWrapper title="Order Confirmation">
      <motion.div 
        className="bg-white rounded-t-[30px] flex-1 p-6"
        variants={itemVariants}
      >
        <SuccessAnimation />
        <OrderDetailsCard />
        <ItemsList />
        <CountdownTimer />
        <RestaurantInfo />
        <ActionButtons />
      </motion.div>
    </OptimizedPageWrapper>
  );
});

OptimizedOrderConfirmation.displayName = 'OptimizedOrderConfirmation';

export default OptimizedOrderConfirmation; 