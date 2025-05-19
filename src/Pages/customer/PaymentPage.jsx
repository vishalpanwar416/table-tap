import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../config/CartContent';
import { supabase } from '../../supabase';
import { ChevronLeft, CreditCard, QrCode } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  const tableNumber = location.state?.tableNumber;
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const { restaurant } = useRestaurant();

  // Early return if restaurant data isn't loaded yet
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading restaurant details...</div>
      </div>
    );
  }

  // Calculate total with GST
  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      let price = item.price;
      if (item.discountType === 'percentage') {
        price *= (1 - item.discountValue / 100);
      } else if (item.discountType === 'fixed') {
        price -= item.discountValue;
      }
      return sum + (price * item.quantity);
    }, 0);
    
    const gst = subtotal * 0.05;
    return {
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: (subtotal + gst).toFixed(2)
    };
  };

  const { subtotal, gst, total } = calculateTotal();

  // Load Razorpay SDK
  useEffect(() => {
    const loadRazorpay = async () => {
      if (window.Razorpay) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        if (!window.Razorpay) {
          setScriptError('Payment processor failed to load');
          return;
        }
        setScriptLoaded(true);
      };

      script.onerror = () => {
        setScriptError('Failed to load payment processor');
      };

      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    };

    loadRazorpay();
  }, []);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setScriptError('Failed to load user data');
      }
    };
  
    fetchUser();
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Generate order_number
  const generateOrderNumber = () => {
    const restaurantPrefix = restaurant?.name?.substring(0, 3).toUpperCase() || 'RST';
    const timestamp = new Date().getTime().toString().substring(9, 13);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${restaurantPrefix}-${timestamp}-${random}`;
  };

  // Handle going back
  const handleGoBack = () => {
    navigate(-1);
  };

  // Handle Razorpay payment with better error handling
  const handlePayment = async () => {
    if (!restaurant) {
      setScriptError('Restaurant data not loaded');
      return;
    }

    if (!isMounted || cartItems.length === 0) {
      setScriptError('Unable to process payment at this time');
      return;
    }
    
    setIsProcessing(true);

    try {
      // For direct payment without razorpay, process immediately
      if (paymentMethod === 'direct') {
        await processOrder({
          razorpay_payment_id: 'DIRECT-' + Date.now(),
          razorpay_order_id: 'DIRECT-ORDER-' + Date.now(),
          razorpay_signature: 'NA'
        });
        return;
      }
      
      // Otherwise use Razorpay
      if (!scriptLoaded || !window.Razorpay) {
        setScriptError('Payment processor not loaded. Please try again or choose Pay At Restaurant.');
        setIsProcessing(false);
        return;
      }

      // Use restaurant-specific Razorpay key or fallback to environment variable
      const razorpayKeyId = restaurant.razorpay_key_id || process.env.REACT_APP_RAZORPAY_KEY_ID;
      
      if (!razorpayKeyId) {
        setScriptError('Payment processor not configured for this restaurant');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: Math.round(total * 100),
        currency: restaurant.currency || 'INR',
        name: restaurant.name,
        description: `Order at ${restaurant.name}`,
        image: restaurant.logo_url || '/logo.png',
        handler: async (response) => {
          await processOrder(response);
        },
        prefill: {
          name: user?.user_metadata?.full_name || 'Customer',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: { color: restaurant.theme_color || '#F37254' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response) => {
        setScriptError(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      setScriptError('Failed to initialize payment');
      setIsProcessing(false);
    }
  };
  
  // Process the order with better error handling
  const processOrder = async (response) => {
    try {
      // Get current user information
      const customer_name = user?.user_metadata?.full_name || 'Customer';
      const customer_email = user?.email || '';
      const customer_phone = user?.phone || '';
      
      // Prepare tracking data according to schema
      const tracking = {
        confirmed: { status: true, timestamp: new Date().toISOString() },
        preparing: { status: false, timestamp: null },
        ready: { status: false, timestamp: null },
        completed: { status: false, timestamp: null }
      };
      
      // Create order data object matching the database schema
      const orderData = {
        order_number: generateOrderNumber(),
        user_id: user?.id,
        restaurant_id: restaurant?.id,
        table_number: tableNumber || 'N/A',
        items: cartItems,
        subtotal: parseFloat(subtotal),
        gst: parseFloat(gst),
        discount: 0,
        total: parseFloat(total),
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        payment_method: paymentMethod,
        payment_status: 'completed',
        payment_timestamp: new Date().toISOString(),
        status: 'pending',
        tracking: tracking,
        customer_name: customer_name,
        customer_email: customer_email,
        customer_phone: customer_phone,
        special_instructions: ''
      };

      // Save order to Supabase with better error handling
      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Order creation error:', error);
        setScriptError(`Order creation failed: ${error.message || 'Database error'}`);
        setIsProcessing(false);
        return;
      }

      // Clear cart and navigate to success page
      clearCart();
      navigate('/order-success', {
        state: {
          orderId: order.id,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          totalAmount: parseFloat(total),
          tableNumber,
          cartItems
        }
      });
    } catch (error) {
      console.error('Error details:', error);
      setScriptError('Payment successful but order creation failed: ' + (error.message || error));
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-center relative">
        <button onClick={handleGoBack} className="absolute left-4 text-orange-500">
          <ChevronLeft size={30} />
        </button>
        <h1 className="text-2xl font-bold">Payment</h1>
      </div>

      {/* Restaurant info */}
      <div className="px-4 py-2 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">{restaurant.name}</h2>
          <p className="text-sm text-gray-300">{restaurant.address}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white text-black rounded-t-3xl p-6 mt-2 flex-1 overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Complete Your Payment</h2>

        {scriptError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
            {scriptError}
            <button 
              onClick={() => setScriptError(null)}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-col space-y-6">
          {/* Payment Method Selection */}
          <div className="flex flex-col space-y-3">
            <h3 className="font-semibold text-lg">Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                  paymentMethod === 'razorpay' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200'
                }`}
              >
                <CreditCard className={`${paymentMethod === 'razorpay' ? 'text-orange-500' : 'text-gray-500'}`} />
                <div className="text-left">
                  <div className="font-semibold">Online Payment</div>
                  <div className="text-sm text-gray-500">Credit/Debit Card, UPI, Net Banking</div>
                </div>
              </button>
              
              <button
                onClick={() => setPaymentMethod('direct')}
                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                  paymentMethod === 'direct' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200'
                }`}
              >
                <QrCode className={`${paymentMethod === 'direct' ? 'text-orange-500' : 'text-gray-500'}`} />
                <div className="text-left">
                  <div className="font-semibold">Pay At Restaurant</div>
                  <div className="text-sm text-gray-500">Cash, Card or UPI at counter</div>
                </div>
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-lg p-4">
            <h3 className="font-bold mb-2">Order Summary</h3>
            <p className="text-sm text-gray-600 mb-2">
              Table: {tableNumber || 'Not specified'}
            </p>
            {cartItems.map(item => (
              <div key={`${item.id}-${item.category}`} 
                className="flex justify-between py-2 border-b">
                <span>{item.name} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>GST (5%)</span>
                <span>₹{gst}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing || cartItems.length === 0}
            className={`w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl shadow-md transition-colors ${
              isProcessing || cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? 'Processing...' : paymentMethod === 'razorpay' 
              ? `Pay ₹${total} Now` 
              : `Place Order - Pay at Restaurant`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;