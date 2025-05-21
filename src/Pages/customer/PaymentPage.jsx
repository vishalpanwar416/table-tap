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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneError, setPhoneError] = useState('');

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
    let subtotal = 0;
    let taxableAmount = 0;
    
    cartItems.forEach(item => {
      let price = item.price;
      
      if (item.discountType === 'percentage') {
        price = item.price * (1 - item.discountValue/100);
      } else if (item.discountType === 'fixed') {
        price = item.price - item.discountValue;
      }
      
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      
      // Check if the item is water (exempt from GST)
      const isWater = item.name && 
        (item.name.toLowerCase().includes('water') || 
         item.category?.toLowerCase() === 'water');
         
      if (!isWater) {
        taxableAmount += itemTotal;
      }
    });
    
    // Calculate taxes (split into CGST and SGST equally, each at 2.5%)
    const cgst = taxableAmount * 0.025; // 2.5% CGST
    const sgst = taxableAmount * 0.025; // 2.5% SGST
    
    return {
      subtotal: subtotal.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      total: (subtotal + cgst + sgst).toFixed(2)
    };
  };

  const { subtotal, cgst, sgst, total } = calculateTotal();

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
          
          // Set phone number from user metadata if available
          if (data.user.user_metadata && data.user.user_metadata.phone) {
            setPhoneNumber(data.user.user_metadata.phone);
          }
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

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    // Basic validation for Indian phone numbers (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // Handle phone number change
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    if (value && !validatePhoneNumber(value)) {
      setPhoneError('Please enter a valid 10-digit phone number');
    } else {
      setPhoneError('');
    }
  };

  // Update user phone in database
  const updateUserPhone = async () => {
    if (!user || !phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return false;
    }

    try {
      // Update user metadata with phone number
      const { error } = await supabase.auth.updateUser({
        data: { phone: phoneNumber }
      });

      if (error) {
        console.error('Error updating user phone:', error);
        return false;
      }
      
      console.log('User phone updated successfully');
      return true;
    } catch (error) {
      console.error('User phone update exception:', error);
      return false;
    }
  };

  // Handle Razorpay payment with better error handling
  const handlePayment = async () => {
    // First check if we need to collect phone number
    // if (!phoneNumber) {
    //   setShowPhoneInput(true);
    //   return;
    // }
    
    // // Validate phone number
    // if (!validatePhoneNumber(phoneNumber)) {
    //   setPhoneError('Please enter a valid 10-digit phone number');
    //   setShowPhoneInput(true);
    //   return;
    // }
    
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
      // Update user phone number in database first
      if (user) {
        await updateUserPhone();
      }
      
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
          contact: phoneNumber || ''
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
      const customer_phone = phoneNumber || '';
      
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
        gst: parseFloat(cgst) + parseFloat(sgst) || 0,
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
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex justify-center">
          <button
            onClick={handleGoBack}
            className="absolute left-4 top-8 text-orange-500"
          >
            <ChevronLeft size={30} />
          </button>
          <h1 className="text-gray-100 text-3xl font-medium font-spartan">Payment</h1>
        </div>

        {/* Restaurant info */}
        <div className="px-6 pb-4 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{restaurant.name}</h2>
            <p className="text-sm text-gray-300">{restaurant.address}</p>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-gray-200 w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan">
          <h2 className="justify-center text-center text-black text-3xl font-semibold mb-8">Complete Your Payment</h2>

          {/* Error Message */}
          {scriptError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
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
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <h3 className="font-bold mb-2">Order Summary</h3>
              <p className="text-sm text-gray-600 mb-2">
                Table: {tableNumber || 'Not specified'}
              </p>
              {cartItems.map(item => {
                // Check if the item is water
                const isWater = item.name && 
                  (item.name.toLowerCase().includes('water') || 
                   item.category?.toLowerCase() === 'water');
                   
                return (
                  <div key={`${item.id}-${item.category}`} 
                    className="flex justify-between py-2 border-b">
                    <div>
                      <span>{item.name} × {item.quantity}</span>
                      {isWater && (
                        <span className="ml-2 text-xs text-green-600">(GST exempt)</span>
                      )}
                    </div>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">CGST (2.5%)</span>
                  <span>₹{cgst}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">SGST (2.5%)</span>
                  <span>₹{sgst}</span>
                </div>
                <div className="flex justify-between font-bold mt-2">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>

            {/* Phone Number Input */}
            {(!phoneNumber || showPhoneInput || phoneError) && (
              <div className="flex flex-col space-y-2">
                <label className="font-semibold text-lg" htmlFor="phone-input">
                  Enter your Phone Number
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500"
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                />
                {phoneError && (
                  <span className="text-red-600 text-sm">{phoneError}</span>
                )}
              </div>
            )}

            {/* Place Order Button */}
            <div className="mt-auto pt-6">
              <button
                onClick={handlePayment}
                disabled={isProcessing || cartItems.length === 0}
                className={`w-full bg-gray-600 text-white py-3 rounded-full font-medium text-lg ${
                  isProcessing || cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
                } transition-colors`}
              >
                {isProcessing ? 'Processing...' : phoneNumber ? (
                  paymentMethod === 'razorpay' 
                    ? `Pay ₹${total} Now` 
                    : `Place Order - Pay at Restaurant`
                ) : 'Continue with Phone Number'}
              </button>
            </div>
            
            {/* Bottom Spacing */}
            <div className="pb-5"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;