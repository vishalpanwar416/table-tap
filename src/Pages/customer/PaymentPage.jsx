import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../config/CartContent';
import { ChevronLeft, CreditCard, QrCode, CheckCircle, AlertCircle, Clock, MapPin, User, Mail, Phone, Shield, Lock, Smartphone } from 'lucide-react';
import { useRestaurant } from '../Restaurantselection/RestaurantContext';
import { useAuth } from '../../config/AuthContext';
import { 
  loadRazorpayScript,
  initializeRazorpayPayment,
  createOrder,
  validatePaymentData
} from '../../api/paymentService';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart, calculateEffectivePrice } = useCart();

  const tableNumber = location.state?.tableNumber || 'Not Specified';
  const specialInstructions = location.state?.specialInstructions || '';
  const guestDetails = location.state?.guestDetails;

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [animateItems, setAnimateItems] = useState(false);
  const { restaurant } = useRestaurant();
  const { user, loading: authLoading } = useAuth();


  // Customer contact info state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Computed customer details with fallbacks
  const finalCustomerName = customerName || user?.user_metadata?.full_name || guestDetails?.name || 'Guest Customer';
  const finalCustomerEmail = customerEmail || user?.email || guestDetails?.email || 'guest@example.com';
  const finalCustomerPhone = customerPhone || user?.user_metadata?.phone || guestDetails?.phone || '';

  // Available payment methods based on restaurant settings
  const availablePaymentMethods = [];
  if (restaurant?.razorpay_key_id) {
    availablePaymentMethods.push('razorpay');
  }
  if (restaurant?.upi_id) {
    availablePaymentMethods.push('upi');
  }
  availablePaymentMethods.push('direct');

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateItems(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);



  if (!restaurant) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading restaurant details...</div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading authentication...</div>
      </div>
    );
  }

  const calculatePriceDetails = useCallback(() => {
    let originalTotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    
    cartItems.forEach(item => {
      const originalItemTotal = item.price * item.quantity;
      originalTotal += originalItemTotal;
      
      const effectivePrice = item.effectivePrice !== undefined ? 
        item.effectivePrice : 
        calculateEffectivePrice(item);
      
      const itemDiscount = (item.price - effectivePrice) * item.quantity;
      discountAmount += itemDiscount;
      
      const itemSubtotal = effectivePrice * item.quantity;
      
      const isWater = item.name && 
        (item.name.toLowerCase().includes('water') || 
         item.category?.toLowerCase() === 'water');
         
      if (!isWater) {
        taxableAmount += itemSubtotal;
      }
    });
    
    const cgst = taxableAmount * 0.025;
    const sgst = taxableAmount * 0.025;
    const subtotalAfterDiscount = originalTotal - discountAmount;
    const finalTotal = subtotalAfterDiscount + cgst + sgst;
    
    return {
      originalTotal,
      discountAmount,
      subtotalAfterDiscount,
      cgst,
      sgst,
      finalTotal
    };
  }, [cartItems, calculateEffectivePrice]);

  const { 
    originalTotal, 
    discountAmount, 
    subtotalAfterDiscount, 
    cgst, 
    sgst, 
    finalTotal 
  } = calculatePriceDetails();

  useEffect(() => {
    const loadPaymentScript = async () => {
      try {
        await loadRazorpayScript();
        setScriptLoaded(true);
        setScriptError(null);
      } catch (error) {
        console.error('Failed to load Razorpay script:', error);
        setScriptError('Payment gateway failed to load. Please try again later or choose Pay At Restaurant.');
      }
    };

    loadPaymentScript();
  }, []);

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to load
    }

    // Handle user data setting with better error handling
    const setUserData = async () => {
      try {
        if (user) {
          setCustomerName(user.user_metadata?.full_name || '');
          setCustomerEmail(user.email || '');
          setCustomerPhone(user.user_metadata?.phone || '');
        } else if (guestDetails) {
          setCustomerName(guestDetails.name || '');
          setCustomerEmail(guestDetails.email || '');
          setCustomerPhone(guestDetails.phone || '');
        } else {
          // Set default values for guest users
          setCustomerName('');
          setCustomerEmail('');
          setCustomerPhone('');
        }
      } catch (error) {
        console.warn('Error setting user data:', error);
        // Set default values on error
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
      }
    };

    setUserData();
  }, [user, authLoading, guestDetails]);

  const generateOrderNumber = () => {
    const restaurantPrefix = restaurant?.name?.substring(0, 3).toUpperCase() || 'RST';
    const timestamp = new Date().getTime().toString().substring(9, 13);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${restaurantPrefix}-${timestamp}-${random}`;
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePayment = async () => {
    if (!restaurant) {
      setScriptError('Restaurant data not loaded');
      return;
    }

    if (cartItems.length === 0) {
      setScriptError('Your cart is empty.');
      return;
    }
    
    setIsProcessing(true);

    try {
      if (paymentMethod === 'direct') {
        const result = await processOrder({
          razorpay_payment_id: 'DIRECT-' + Date.now(),
          razorpay_order_id: 'DIRECT-ORDER-' + Date.now(),
          razorpay_signature: 'NA'
        });
        
        if (!result) {
          setIsProcessing(false);
        }
        return;
      }
      
      if (!scriptLoaded) {
        setScriptError('Payment processor not loaded. Please try again or choose Pay At Restaurant.');
        setIsProcessing(false);
        return;
      }

      // Validate payment data
      const validationErrors = validatePaymentData({
        amount: finalTotal,
        restaurantId: restaurant.id,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        tableNumber: tableNumber
      });

      if (validationErrors.length > 0) {
        setScriptError(validationErrors.join(', '));
        setIsProcessing(false);
        return;
      }

      // Initialize Razorpay payment
      const rzp = await initializeRazorpayPayment({
        amount: finalTotal,
        restaurantName: restaurant.name,
        restaurantLogo: restaurant.logo_url,
        restaurantId: restaurant.id,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: finalCustomerPhone,
        tableNumber,
        specialInstructions,
        themeColor: restaurant.theme_color,
        onSuccess: async (response) => {
          if (!response.razorpay_payment_id) {
            setScriptError('Payment failed: Missing payment confirmation');
            setIsProcessing(false);
            return;
          }
          await processOrder(response);
        },
        onDismiss: () => setIsProcessing(false),
        onFailure: (error) => {
          setScriptError(`Payment failed: ${error}`);
          setIsProcessing(false);
        }
      });

      rzp.open();
    } catch (error) {
      setScriptError(`Failed to initialize payment: ${error.message || 'Unknown error'}`);
      setIsProcessing(false);
    }
  };
  
  const processOrder = async (response) => {
    try {
      if (!response || !response.razorpay_payment_id) {
        throw new Error('Missing payment confirmation details');
      }

      // Ensure restaurant data is available
      if (!restaurant || !restaurant.id) {
        throw new Error('Restaurant data not available');
      }

      // Enhanced validation for guest users
      if (!user) {
        console.log('Processing guest order with details:', {
          customerName: finalCustomerName,
          customerEmail: finalCustomerEmail,
          customerPhone: finalCustomerPhone
        });

        // Validate guest data before creating order
        if (!finalCustomerName || finalCustomerName.trim() === '') {
          throw new Error('Customer name is required');
        }
        if (!finalCustomerEmail || finalCustomerEmail.trim() === '') {
          throw new Error('Customer email is required');
        }
        if (!finalCustomerPhone || finalCustomerPhone.trim() === '') {
          throw new Error('Customer phone is required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(finalCustomerEmail.trim())) {
          throw new Error('Please enter a valid email address');
        }

        // Validate phone format
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(finalCustomerPhone.trim())) {
          throw new Error('Please enter a valid 10-digit phone number');
        }
      }

      // Create order using payment service
      const order = await createOrder({
        restaurantId: restaurant.id,
        userId: user ? user.id : null,
        customerName: finalCustomerName.trim(),
        customerEmail: finalCustomerEmail.trim(),
        customerPhone: finalCustomerPhone.trim(),
        tableNumber,
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          category: item.category,
          image: item.image
        })),
        razorpayOrderId: response.razorpay_order_id || null,
        razorpayPaymentId: response.razorpay_payment_id || null,
        razorpaySignature: response.razorpay_signature || null,
        paymentMethod: paymentMethod === 'razorpay' ? 'razorpay' : paymentMethod === 'upi' ? 'upi' : 'direct',
        paymentStatus: 'completed',
        specialInstructions
      });

      clearCart();
      
      // Navigate to order confirmation with all necessary data
      navigate('/order-confirmation-page', {
        state: {
          orderId: order.id,
          orderNumber: order.order_number,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          totalAmount: order.total,
          tableNumber,
          paymentMethod,
          customerName: finalCustomerName,
          customerEmail: finalCustomerEmail,
          customerPhone: finalCustomerPhone,
          specialInstructions
        }
      });
      
      return true;
    } catch (error) {
      console.error('processOrder error:', error);
      setScriptError(`Payment successful but order creation failed: ${error.message}`);
      setIsProcessing(false);
      return false;
    }
  };

  // Function to create general UPI payment URL
  const createUPIPaymentUrl = (upiId, amount, merchantName) => {
    // Remove any spaces and special characters from UPI ID
    const cleanUpiId = upiId.replace(/\s+/g, '').replace(/[^a-zA-Z0-9@.-]/g, '');
    
    // Create general UPI payment URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=Food Order Payment`;
    
    return upiUrl;
  };

  const handleUPIPayment = async () => {
    if (!restaurant.upi_id) {
      setScriptError('UPI payment is not configured for this restaurant.');
      return;
    }

    try {
      const upiUrl = createUPIPaymentUrl(restaurant.upi_id, finalTotal, restaurant.name);
      
      // Try to open UPI app
      const link = document.createElement('a');
      link.href = upiUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show confirmation dialog instead of auto-processing
      const confirmed = window.confirm(
        'UPI payment app should have opened. Please complete the payment and then click OK to confirm your order.\n\n' +
        'If you cancelled the payment, click Cancel to go back.'
      );

      if (confirmed) {
        setIsProcessing(true);
        const result = await processOrder({
          razorpay_payment_id: 'UPI-' + Date.now(),
          razorpay_order_id: 'UPI-ORDER-' + Date.now(),
          razorpay_signature: 'NA',
          upi_id: restaurant.upi_id,
          payment_method: 'upi'
        });
        
        if (!result) {
          setIsProcessing(false);
        }
      }

    } catch (error) {
      setScriptError(`Failed to open UPI payment: ${error.message}`);
    }
  };



  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="w-full px-6 py-8 relative flex justify-center">
          <button 
            onClick={handleGoBack} 
            className="absolute left-4 top-8 text-orange-500 hover:text-orange-400 transition-colors duration-200 p-2 rounded-full hover:bg-orange-500/10"
          >
            <ChevronLeft size={30} />
          </button>
          <div className="text-center">
            <h1 className="text-white text-3xl font-bold mb-2">Payment</h1>
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <Lock size={16} />
              <span className="text-sm">Secure Payment</span>
            </div>
          </div>
        </div>

        {/* Enhanced Restaurant info */}
        <div className="px-6 pb-4 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">{restaurant.name}</h2>
            <p className="text-sm text-gray-300 flex items-center justify-center gap-1">
              <MapPin size={14} />
              {restaurant.address}
            </p>
          </div>
        </div>

        {/* Enhanced Main content */}
        <div className="bg-gradient-to-br from-gray-50 to-white w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan overflow-y-auto shadow-2xl">
          <div className={`transition-all duration-700 ${animateItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            
            {/* Enhanced Header with Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">1</span>
                  </div>
                  <div className="w-12 h-1 bg-gray-300 rounded"></div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">2</span>
                  </div>
                  <div className="w-12 h-1 bg-orange-500 rounded"></div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                </div>
              </div>
              <h2 className="justify-center text-center text-gray-800 text-3xl font-bold mb-2">
                Complete Your Payment
              </h2>
              <p className="text-center text-gray-600 text-sm">Choose your preferred payment method</p>
            </div>

            {/* Enhanced Error Display */}
            {scriptError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle size={18} className="text-red-400" />
                <span className="flex-1">{scriptError}</span>
                <button 
                  onClick={() => setScriptError(null)} 
                  className="text-sm underline text-red-700 hover:text-red-900 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Copy Success Message */}
            {showCopySuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                <CheckCircle size={18} className="text-green-400" />
                <span className="flex-1">UPI ID copied to clipboard!</span>
              </div>
            )}

            {/* Enhanced Payment Method Selection */}
            <div className="mb-8">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800">
                <CreditCard size={20} className="text-orange-500" />
                Payment Method
              </h3>
              
              {/* UPI Payment Details - Show when UPI is selected */}
              {paymentMethod === 'upi' && restaurant.upi_id && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-green-800">
                    <Smartphone size={18} className="text-green-600" />
                    UPI Payment Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">UPI ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-800 bg-green-100 px-3 py-1 rounded-lg">
                          {restaurant.upi_id}
                        </span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(restaurant.upi_id);
                            setShowCopySuccess(true);
                            setTimeout(() => setShowCopySuccess(false), 2000);
                          }}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Copy UPI ID"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Amount:</span>
                      <span className="font-bold text-green-800 bg-green-100 px-3 py-1 rounded-lg">
                        ₹{finalTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Merchant:</span>
                      <span className="font-bold text-green-800">
                        {restaurant.name}
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-sm text-blue-800 text-center">
                        💡 <strong>Tip:</strong> After completing the UPI payment, you'll be asked to confirm your order. Make sure to complete the payment in your UPI app first.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4">
                {/* Online Payment - Only show if razorpay_key_id exists */}
                {availablePaymentMethods.includes('razorpay') && (
                  <button 
                    onClick={() => setPaymentMethod('razorpay')} 
                    className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 hover:shadow-lg ${
                      paymentMethod === 'razorpay' 
                        ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      paymentMethod === 'razorpay' ? 'bg-orange-500' : 'bg-gray-100'
                    }`}>
                      <CreditCard size={24} className={paymentMethod === 'razorpay' ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-lg">Online Payment</div>
                      <div className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield size={12} className="text-green-500" />
                        <span className="text-xs text-green-600">Secure & Encrypted</span>
                      </div>
                    </div>
                    {paymentMethod === 'razorpay' && (
                      <CheckCircle size={20} className="text-orange-500" />
                    )}
                  </button>
                )}

                {/* UPI Payment - Only show if upi_id exists */}
                {availablePaymentMethods.includes('upi') && (
                  <button 
                    onClick={() => setPaymentMethod('upi')} 
                    className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 hover:shadow-lg ${
                      paymentMethod === 'upi' 
                        ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      paymentMethod === 'upi' ? 'bg-orange-500' : 'bg-gray-100'
                    }`}>
                      <Smartphone size={24} className={paymentMethod === 'upi' ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-lg">UPI Payment</div>
                      <div className="text-sm text-gray-600">Pay to: {restaurant.upi_id}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield size={12} className="text-green-500" />
                        <span className="text-xs text-green-600">Instant & Secure</span>
                      </div>
                    </div>
                    {paymentMethod === 'upi' && (
                      <CheckCircle size={20} className="text-orange-500" />
                    )}
                  </button>
                )}
                
                {/* Pay At Restaurant - Always available */}
                <button 
                  onClick={() => setPaymentMethod('direct')} 
                  className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 hover:shadow-lg ${
                    paymentMethod === 'direct' 
                      ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 shadow-md' 
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    paymentMethod === 'direct' ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <QrCode size={24} className={paymentMethod === 'direct' ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-lg">Pay At Restaurant</div>
                    <div className="text-sm text-gray-600">Cash, Card or UPI at counter</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-blue-500" />
                      <span className="text-xs text-blue-600">Pay when served</span>
                    </div>
                  </div>
                  {paymentMethod === 'direct' && (
                    <CheckCircle size={20} className="text-orange-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Enhanced Order Summary */}
            <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100 shadow-sm">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800">
                <CheckCircle size={20} className="text-green-500" />
                Order Summary
              </h3>
              
              {/* Table Info */}
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" />
                  <span className="text-blue-800 font-medium">Table {tableNumber}</span>
                </div>
              </div>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-4">
                {cartItems.map((item, index) => {
                const isWater = item.name && (item.name.toLowerCase().includes('water') || item.category?.toLowerCase() === 'water');
                const hasDiscount = item.discounttype && item.discountvalue;
                const originalTotal = (item.price * item.quantity).toFixed(2);
                const discountedPrice = item.effectivePrice !== undefined ? Number(item.effectivePrice).toFixed(2) : Number(calculateEffectivePrice(item)).toFixed(2);
                const discountedTotal = (Number(discountedPrice) * item.quantity).toFixed(2);
                   
                return (
                    <div 
                      key={`${item.id}-${item.category}`} 
                      className={`flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0 transition-all duration-300 ${animateItems ? 'animate-in slide-in-from-left-2' : ''}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{item.name} × {item.quantity}</div>
                        {hasDiscount && (
                          <div className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded-full inline-block mt-1">
                            {item.discounttype === 'Percentage' && `${item.discountvalue}% off`}
                            {item.discounttype === 'Fixed' && `₹${item.discountvalue * item.quantity} off`}
                          </div>
                        )}
                        {isWater && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full inline-block mt-1">
                            GST exempt
                          </span>
                        )}
                    </div>
                    <div className="text-right">
                        {hasDiscount ? (
                          <>
                            <p className="text-gray-400 text-sm line-through">₹{originalTotal}</p>
                            <p className="font-bold text-gray-800">₹{discountedTotal}</p>
                          </>
                        ) : (
                          <span className="font-bold text-gray-800">₹{originalTotal}</span>
                        )}
                    </div>
                  </div>
                );
              })}
              </div>
              
              {/* Enhanced Price Breakdown */}
              <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Original Total</span>
                  <span className="font-semibold text-gray-800">₹{originalTotal.toFixed(2)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-medium">Discount</span>
                    <span className="text-green-600 font-semibold">- ₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{subtotalAfterDiscount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">CGST (2.5%)</span>
                  <span className="font-semibold text-gray-800">₹{cgst.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">SGST (2.5%)</span>
                  <span className="font-semibold text-gray-800">₹{sgst.toFixed(2)}</span>
                </div>
                
                <div className="border-t-2 border-gray-200 my-4"></div>
                
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-orange-600">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Info Display */}
            <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
                <User size={18} className="text-blue-500" />
                Customer Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-blue-400" />
                  <span className="text-gray-700">{finalCustomerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-400" />
                  <span className="text-gray-700">{finalCustomerEmail}</span>
                </div>
                {finalCustomerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-blue-400" />
                    <span className="text-gray-700">{finalCustomerPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pb-32"></div>
        </div>



        {/* Floating Payment Button */}
        <div className="fixed bottom-0 left-0 right-0 px-6 py-4 z-50">
          <div className="max-w-[390px] md:max-w-4xl lg:max-w-6xl mx-auto">
            <button 
              onClick={paymentMethod === 'upi' ? handleUPIPayment : handlePayment} 
              disabled={isProcessing || cartItems.length === 0} 
              className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                isProcessing || cartItems.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-600 text-white hover:bg-gray-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : paymentMethod === 'razorpay' ? (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={18} />
                  Pay ₹{finalTotal.toFixed(2)} Now
                </span>
              ) : paymentMethod === 'upi' ? (
                <span className="flex items-center justify-center gap-2">
                  <Smartphone size={18} />
                  Pay via UPI
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={18} />
                  Place Order - Pay at Restaurant
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;