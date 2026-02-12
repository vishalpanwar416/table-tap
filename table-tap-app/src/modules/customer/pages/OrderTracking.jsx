import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, XCircle, Truck, MapPin, CreditCard, ShoppingBag, User, X, LogIn, Archive } from 'lucide-react';
import { useOrders } from '../../shared/context/OrderContext';
import { useAuth } from '../../shared/config/AuthContext';
import { supabase } from '../../shared/supabase';
import LoadingScreen from '../../shared/components/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getOrderDetails, subscribeToOrderStatus, currentOrder, loading, error } = useOrders();
  const { user } = useAuth();
  const [statusPercentage, setStatusPercentage] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Get guest history
  const guestOrderIds = JSON.parse(localStorage.getItem('guestOrderIds') || '[]');

  // Get order ID from params, router state, or fallback to storage
  const orderId = id || location.state?.orderId || localStorage.getItem('lastGuestOrderId');

  // Fetch initial details
  useEffect(() => {
    if (orderId) {
      getOrderDetails(orderId);
    }
  }, [orderId, getOrderDetails]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!orderId) return;

    // Create subscription
    const subscription = subscribeToOrderStatus(orderId);

    // Cleanup subscription on unmount or ID change
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [orderId, subscribeToOrderStatus]);

  useEffect(() => {
    if (currentOrder) {
      // Update progress bar based on status
      switch (currentOrder.status) {
        case 'pending':
          setStatusPercentage(25);
          break;
        case 'accepted':
          setStatusPercentage(50);
          break;
        case 'preparing':
          setStatusPercentage(75);
          break;
        case 'completed':
          setStatusPercentage(100);
          break;
        case 'rejected':
          setStatusPercentage(0);
          break;
        default:
          setStatusPercentage(0);
      }
    }
  }, [currentOrder]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-8 h-8 text-blue-500" />;
      case 'preparing':
        return <Truck className="w-8 h-8 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-500" />;
    }
  };

  const statusMessages = {
    pending: "Your order is waiting to be accepted by the restaurant.",
    accepted: "Good news! Your order has been accepted.",
    preparing: "Your food is being prepared right now.",
    completed: "Your order is ready! Please collect from the restaurant.",
    rejected: "We're sorry, your order couldn't be fulfilled at this time."
  };

  const handleLoginRedirect = () => {
    // Navigate to login and pass current location to return to
    navigate('/login', {
      state: {
        returnUrl: `/order-tracking`,
        orderId: currentOrder?.id
      }
    });
  };

  if (loading) {
    return <LoadingScreen message="Loading order..." variant="page" />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md shadow-lg text-center">
          <h3 className="text-red-600 text-xl font-semibold mb-2">Error Loading Order</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/home')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full transition-colors shadow-sm font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md shadow-lg text-center">
          <h3 className="text-white text-xl font-semibold mb-2">Order Not Found</h3>
          <p className="text-gray-400 mb-4">We couldn't find the order you're looking for.</p>
          <button
            onClick={() => navigate('/home')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full transition-colors shadow-sm font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex items-center justify-between">
          <button
            className="text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-10"
            onClick={() => navigate('/home')}
            aria-label="Go back to home"
          >
            <ChevronLeft size={30} />
          </button>

          <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-gray-100 text-2xl font-medium">
              Order Tracking
            </h1>
            <p className="text-orange-100/60 text-xs mt-1 text-center">#{currentOrder.id.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* Guest History & Login Buttons */}
          <div className="flex items-center gap-2">
            {!user && guestOrderIds.length > 1 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-white hover:text-orange-400 p-2 rounded-full transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md z-10"
                aria-label="View order history"
              >
                <Archive size={20} />
              </button>
            )}

            {!user ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-white hover:text-orange-400 p-2 rounded-full transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md z-10"
                aria-label="Login to save order"
              >
                <User size={20} />
              </button>
            ) : (
              <div className="w-10"></div>
            )}
          </div>
        </div>

        {/* Main Content - White block with rounded top corners */}
        <div className="flex-1 flex flex-col bg-gray-100 rounded-t-3xl overflow-hidden shadow-2xl">
          <div className="flex-1 overflow-y-auto pb-24">

            {/* Status Card */}
            <div className="bg-white p-6 pb-8 rounded-b-3xl shadow-sm mb-4">
              <div className="flex flex-col items-center mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-3 p-4 bg-gray-50 rounded-full"
                >
                  {getStatusIcon(currentOrder.status)}
                </motion.div>
                <h2 className="text-xl font-bold text-gray-800 capitalize mb-1">{currentOrder.status}</h2>
                <p className="text-sm text-gray-500">{formatDate(currentOrder.created_at)}</p>
              </div>

              {/* Progress Bar */}
              <div className="relative pt-1 px-2">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-full bg-orange-100 text-orange-600">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold inline-block text-orange-600">
                      {statusPercentage}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${statusPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"
                  ></motion.div>
                </div>
                <p className="text-center text-sm text-gray-600 font-medium px-4">
                  {statusMessages[currentOrder.status] || "Tracking your order..."}
                </p>
              </div>
            </div>

            {/* Guest Promo Banner (Inline) */}
            {!user && (
              <div className="px-4 mb-4">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full bg-orange-500 rounded-2xl p-4 flex items-center justify-between shadow-lg text-left group hover:bg-orange-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full text-white">
                      <LogIn size={18} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Save this Order</p>
                      <p className="text-orange-100 text-xs">Login to keep tracking history</p>
                    </div>
                  </div>
                  <ChevronLeft size={16} className="text-white/70 rotate-180 group-hover:text-white transition-colors" />
                </button>
              </div>
            )}

            {/* Order Details */}
            <div className="px-4 space-y-4">

              {/* Order Items */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-orange-500" />
                  Order Items
                </h3>
                <div className="divide-y divide-gray-100">
                  {currentOrder.items && currentOrder.items.map((item, index) => (
                    <div key={index} className="py-3 flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-800 text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location/Table */}
              {currentOrder.tableNumber && (
                <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <MapPin size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Delivering to</p>
                    <p className="text-gray-800 font-bold">Table {currentOrder.tableNumber}</p>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
                  <CreditCard size={18} className="text-green-500" />
                  Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{(currentOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (5%)</span>
                    <span>₹{(currentOrder.gst || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-100 my-2 pt-2 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>₹{(currentOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Action Button */}
        <div className="absolute bottom-6 left-0 right-0 px-6 max-w-[390px] md:max-w-4xl lg:max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-black transition-transform transform active:scale-95 flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} />
            Back to Home
          </button>
        </div>
      </div>

      {/* Login Modal Popup */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowLoginModal(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm pointer-events-auto relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-100 rounded-full blur-2xl opacity-60"></div>

                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="text-center mt-2">
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500">
                    <LogIn size={28} />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Save Your Order
                  </h3>

                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Login to add this order to your history and track it anytime. Don't lose track of your delicious food!
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={handleLoginRedirect}
                      className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30"
                    >
                      Login / Sign Up
                    </button>

                    <button
                      onClick={() => setShowLoginModal(false)}
                      className="w-full py-3.5 text-gray-500 font-medium hover:text-gray-700 transition-colors text-sm"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Guest History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowHistoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm pointer-events-auto relative">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Archive className="text-orange-500" size={24} />
                  Recent Orders
                </h3>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {guestOrderIds.map((guestId, index) => (
                    <button
                      key={guestId}
                      onClick={() => {
                        navigate(`/order-tracking/${guestId}`);
                        setShowHistoryModal(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors ${guestId === currentOrder?.id
                        ? 'bg-orange-50 border border-orange-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <div className="text-left">
                        <p className={`font-medium text-sm ${guestId === currentOrder?.id ? 'text-orange-700' : 'text-gray-800'}`}>
                          Order #{guestId.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {index === 0 ? 'Latest' : 'Previous'}
                        </p>
                      </div>
                      <ChevronLeft size={16} className={`rotate-180 ${guestId === currentOrder?.id ? 'text-orange-500' : 'text-gray-400'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div >
  );
};

export default OrderTracking;