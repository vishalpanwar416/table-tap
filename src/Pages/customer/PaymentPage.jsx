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
        console.log('Razorpay already loaded');
        setScriptLoaded(true);
        return;
      }

      try {
        console.log('Loading Razorpay script...');
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          if (!window.Razorpay) {
            console.error('Razorpay not found in window object after script load');
            setScriptError('Payment gateway failed to initialize properly');
            return;
          }
          setScriptLoaded(true);
          setScriptError(null);
        };

        script.onerror = (error) => {
          console.error('Failed to load Razorpay script:', error);
          setScriptError('Failed to load payment gateway. Please try again later or choose Pay At Restaurant.');
        };

        document.body.appendChild(script);
        
        return () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (error) {
        console.error('Error in Razorpay script loading:', error);
        setScriptError('Payment setup failed. Please try again later.');
      }
    };

    loadRazorpay();
  }, []);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          // Don't block the payment process if user fetch fails
          return;
        }
        
        if (data && data.user) {
          console.log('User authenticated:', data.user.id);
          setUser(data.user);
        } else {
          console.log('No authenticated user found');
        }
      } catch (error) {
        console.error('User fetch exception:', error);
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

      // Use environment variable first (safer), then fall back to restaurant config if needed
      const razorpayKeyId = process.env.REACT_APP_RAZORPAY_KEY_ID || restaurant.razorpay_key_id;
      
      // Fail gracefully with helpful error message
      if (!razorpayKeyId) {
        console.error('Missing Razorpay key in both environment and restaurant config');
        setScriptError('Payment gateway configuration issue. Please try paying at restaurant instead.');
        setIsProcessing(false);
        return;
      }

      // Ensure the amount is valid and properly formatted
      const amountInPaise = Math.round(parseFloat(total) * 100);
      if (isNaN(amountInPaise) || amountInPaise <= 0) {
        setScriptError('Invalid order amount. Please check your cart and try again.');
        setIsProcessing(false);
        return;
      }

      console.log('Setting up Razorpay with:', {
        keyId: razorpayKeyId ? 'Valid key present' : 'Missing key',
        amount: amountInPaise,
        currency: restaurant.currency || 'INR'
      });

      const options = {
        key: razorpayKeyId,
        amount: amountInPaise,
        currency: restaurant.currency || 'INR',
        name: restaurant.name || 'Restaurant Order',
        description: `Order at ${restaurant.name || 'Restaurant'}`,
        image: restaurant.logo_url || '/logo.png',
        handler: async (response) => {
          if (!response.razorpay_payment_id) {
            setScriptError('Payment failed: Missing payment confirmation');
            setIsProcessing(false);
            return;
          }
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
        },
        // Add better error handling
        notes: {
          restaurant_id: restaurant.id || '1',
          table_number: tableNumber || 'N/A'  
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response) => {
        console.error('Razorpay failure details:', response.error);
        setScriptError(`Payment failed: ${response.error.description || 'Gateway error'}`);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      setScriptError(`Failed to initialize payment: ${error.message || 'Unknown error'}`);
      setIsProcessing(false);
    }
  };
  
  // Process the order with better error handling
  const processOrder = async (response) => {
    try {
      if (!response || !response.razorpay_payment_id) {
        throw new Error('Missing payment confirmation details');
      }

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
        user_id: user?.id || null, // Handle anonymous orders
        table_number: tableNumber || 'N/A',
        items: cartItems,
        subtotal: parseFloat(subtotal) || 0,
        gst: parseFloat(gst) || 0,
        discount: 0,
        total: parseFloat(total) || 0,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || '',
        razorpay_signature: response.razorpay_signature || '',
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

      console.log('Submitting order to database:', orderData.order_number);

      // Save order to Supabase with better error handling
      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Order creation error:', error);
        throw new Error(error.message || 'Database error');
      }

      if (!order || !order.id) {
        throw new Error('Order created but missing ID');
      }

      console.log('Order successfully created:', order.id);

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
      console.error('Order processing error:', error);
      setScriptError('Payment successful but order creation failed: ' + (error.message || 'Unknown error'));
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

      {/* Error Message */}
      {scriptError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{scriptError}</span>
          </div>
          <div className="flex justify-end mt-2">
            <button 
              onClick={() => setScriptError(null)}
              className="text-sm underline text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
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