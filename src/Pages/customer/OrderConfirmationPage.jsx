import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { supabase } from '../../supabase';

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getOrderDetails } = useOrders();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState('');

  useEffect(() => {
    const initializeOrder = async () => {
      try {
        const orderId = location.state?.orderId;
        if (!orderId) return navigate('/');

        const order = await getOrderDetails(orderId);
        setOrderDetails(order);
        startStatusUpdates(orderId);
        calculateETA(order.created_at);

        // Automatically redirect to my-orders after 5 seconds
        setTimeout(() => navigate('/my-orders'), 5000);
      } catch (err) {
        console.error(err);
        navigate('/payment-failed');
      } finally {
        setLoading(false);
      }
    };

    initializeOrder();
  }, []);

  const startStatusUpdates = (orderId) => {
    supabase
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

  // Handle the track order button click
  const handleTrackOrder = () => {
    if (orderDetails && orderDetails.id) {
      navigate(`/track-order/${orderDetails.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Processing your order...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between py-10 px-6 text-center">
      <button onClick={() => navigate('/')} className="text-orange-500 self-start">
        <ChevronLeft />
      </button>

      <div className="flex flex-col items-center space-y-6 mt-10">
        {/* Custom animation */}
        <div className="relative w-36 h-36">
          <div className="w-full h-full border-4 border-white rounded-full"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-spin origin-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold">¡Order Confirmed!</h1>
          <p className="text-white mt-2">Your order has been placed successfully</p>
        </div>

        <div>
          <p className="text-white">Delivery by {eta}</p>
        </div>

        <button
          onClick={handleTrackOrder}
          className="text-orange-500 font-semibold text-lg hover:underline"
        >
          Track my order
        </button>
      </div>

      <div className="text-white text-sm mt-10">
        If you have any questions, please reach out directly to our customer support
      </div>
    </div>
  );
};

export default OrderConfirmationPage;