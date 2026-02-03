import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle, MapPin } from 'lucide-react';
import { useOrders } from '../../shared/context/OrderContext';
import { supabase } from '../../shared/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../../shared/components/LoadingScreen';

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getOrderDetails } = useOrders();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeOrder = async () => {
      console.log('OrderConfirmationPage: Initializing with state:', location.state);

      try {
        const orderId = location.state?.orderId;
        console.log('OrderConfirmationPage: Order ID:', orderId);

        if (!orderId) {
          setError('No order ID provided');
          setLoading(false);
          return;
        }

        const order = await getOrderDetails(orderId);
        console.log('OrderConfirmationPage: Retrieved order:', order);

        setOrderDetails(order);
        startStatusUpdates(orderId);

        // Auto-redirect after 8 seconds
        setTimeout(() => navigate('/my-orders'), 8000);
      } catch (err) {
        console.error('OrderConfirmationPage: Error:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    initializeOrder();
  }, [location.state?.orderId, navigate, getOrderDetails]);

  const startStatusUpdates = (orderId) => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setOrderDetails(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleTrackOrder = () => {
    if (orderDetails && orderDetails.id) {
      navigate(`/track-order/${orderDetails.id}`);
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  if (loading) {
    return <LoadingScreen message="Processing your order..." variant="page" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/my-orders')} className="text-orange-500 mt-4">
            View My Orders
          </button>
          <button onClick={() => navigate('/')} className="text-orange-500 mt-4 ml-4">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p>Order not found</p>
          <button onClick={handleGoHome} className="text-orange-500 mt-4">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-8">
        <button
          onClick={handleGoHome}
          className="text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          aria-label="Go back to home"
        >
          <ChevronLeft size={30} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Success Animation */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
            >
              <CheckCircle className="w-24 h-24 text-green-500 drop-shadow-lg" />
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-green-500 rounded-full opacity-20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* Order Confirmation */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Order Confirmed!</h1>
          <p className="text-gray-300 mb-4">Your order has been placed successfully</p>

          {orderDetails.order_number && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 shadow-lg border border-white/10">
              <p className="text-xs text-gray-400">Order Number</p>
              <p className="text-lg font-semibold text-orange-400 tracking-wider">{orderDetails.order_number}</p>
            </div>
          )}

          {orderDetails.table_number && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-orange-400" />
              <span className="font-medium">Table {orderDetails.table_number}</span>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="space-y-4 w-full max-w-sm"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/my-orders')}
            className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:bg-orange-600 transition-colors"
          >
            Track My Order
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoHome}
            className="w-full border border-orange-500 text-orange-400 py-3 px-6 rounded-lg font-semibold hover:bg-orange-500 hover:text-white transition-colors"
          >
            Order More
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="px-6 py-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-sm text-gray-400">
          If you have any questions, please contact our customer support
        </p>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationPage;