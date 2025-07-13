import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { supabase } from '../../supabase';

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getOrderDetails } = useOrders();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState('');
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
        calculateETA(order.created_at);

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

  const calculateETA = (createdAt) => {
    const etaDate = new Date(createdAt);
    etaDate.setMinutes(etaDate.getMinutes() + 45);

    const options = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      weekday: 'short',
      day: 'numeric'
    };

    setEta(etaDate.toLocaleString('en-US', options));
  };

  const handleTrackOrder = () => {
    if (orderDetails && orderDetails.id) {
      navigate(`/track-order/${orderDetails.id}`);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Processing your order...</p>
        </div>
      </div>
    );
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
        <button onClick={handleGoHome} className="text-orange-500">
          <ChevronLeft size={30} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <CheckCircle className="w-24 h-24 text-green-500" />
            <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
          </div>
        </div>

        {/* Order Confirmation */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-gray-300 mb-4">Your order has been placed successfully</p>
          
          {orderDetails.order_number && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400">Order Number</p>
              <p className="text-lg font-semibold text-orange-500">{orderDetails.order_number}</p>
            </div>
          )}

          {orderDetails.table_number && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-orange-500" />
              <span>Table {orderDetails.table_number}</span>
            </div>
          )}
        </div>

        {/* ETA */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">Estimated Delivery</span>
          </div>
          <p className="text-lg">{eta}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={handleTrackOrder}
            className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Track My Order
          </button>
          
          <button
            onClick={() => navigate('/my-orders')}
            className="w-full border border-orange-500 text-orange-500 py-3 px-6 rounded-lg font-semibold hover:bg-orange-500 hover:text-white transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 text-center">
        <p className="text-sm text-gray-400">
          If you have any questions, please contact our customer support
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;