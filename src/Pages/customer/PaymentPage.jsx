import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../config/CartContent';
import { supabase } from '../../supabase';
import { ChevronLeft, CreditCard, QrCode } from 'lucide-react';
import { useRestaurant } from '../Restaurantselection/RestaurantContext';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart, calculateEffectivePrice } = useCart();

  // --- UPDATED: Receive all details from location state ---
  const tableNumber = location.state?.tableNumber;
  const specialInstructions = location.state?.specialInstructions || '';
  const guestDetails = location.state?.guestDetails; // { name, email, phone }

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const { restaurant } = useRestaurant();

  // --- NEW: State to hold customer contact info (from user or guest) ---
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading restaurant details...</div>
      </div>
    );
  }

  const calculatePriceDetails = () => {
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
  };

  const { 
    originalTotal, 
    discountAmount, 
    subtotalAfterDiscount, 
    cgst, 
    sgst, 
    finalTotal 
  } = calculatePriceDetails();

  useEffect(() => {
    const loadRazorpay = async () => {
      if (window.Razorpay) {
        setScriptLoaded(true);
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
          if (!window.Razorpay) {
            setScriptError('Payment gateway failed to initialize properly');
            return;
          }
          setScriptLoaded(true);
          setScriptError(null);
        };

        script.onerror = () => {
          setScriptError('Failed to load payment gateway. Please try again later or choose Pay At Restaurant.');
        };

        document.body.appendChild(script);
        
        return () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (error) {
        setScriptError('Payment setup failed. Please try again later.');
      }
    };

    loadRazorpay();
  }, []);

  // --- UPDATED: useEffect to set user and customer details ---
  useEffect(() => {
    const fetchUserAndSetDetails = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) console.error('Error fetching user:', error);
        
        if (data && data.user) {
          setUser(data.user);
          setCustomerName(data.user.user_metadata?.full_name || '');
          setCustomerEmail(data.user.email || '');
          setCustomerPhone(data.user.user_metadata?.phone || '');
        } else {
          // If no user, use guest details passed from previous page
          if (guestDetails) {
            setCustomerName(guestDetails.name);
            setCustomerEmail(guestDetails.email);
            setCustomerPhone(guestDetails.phone);
          }
        }
      } catch (error) {
        console.error('User fetch exception:', error);
      }
    };
  
    fetchUserAndSetDetails();
  }, [guestDetails]);

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
        await processOrder({
          razorpay_payment_id: 'DIRECT-' + Date.now(),
          razorpay_order_id: 'DIRECT-ORDER-' + Date.now(),
          razorpay_signature: 'NA'
        });
        return;
      }
      
      if (!scriptLoaded || !window.Razorpay) {
        setScriptError('Payment processor not loaded. Please try again or choose Pay At Restaurant.');
        setIsProcessing(false);
        return;
      }

      const razorpayKeyId = process.env.REACT_APP_RAZORPAY_KEY_ID || restaurant.razorpay_key_id;
      
      if (!razorpayKeyId) {
        setScriptError('Payment gateway configuration issue.');
        setIsProcessing(false);
        return;
      }

      const amountInPaise = Math.round(parseFloat(finalTotal) * 100);
      if (isNaN(amountInPaise) || amountInPaise <= 0) {
        setScriptError('Invalid order amount.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: amountInPaise,
        currency: 'INR',
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
          name: customerName || 'Valued Customer',
          email: customerEmail,
          contact: customerPhone
        },
        theme: { color: restaurant.theme_color || '#F37254' },
        modal: {
          ondismiss: () => setIsProcessing(false)
        },
        notes: {
          restaurant_id: restaurant.id || '1',
          table_number: tableNumber || 'N/A',
          special_instructions: specialInstructions
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response) => {
        setScriptError(`Payment failed: ${response.error.description || 'Gateway error'}`);
        setIsProcessing(false);
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

      const tracking = {
        confirmed: { status: true, timestamp: new Date().toISOString() },
        preparing: { status: false, timestamp: null },
        ready: { status: false, timestamp: null },
        completed: { status: false, timestamp: null }
      };
      
      // Updated order data structure to match your database
      const orderData = {
        restaurant_id: restaurant.id,
        customer_name: user?.full_name || 'Guest',
        customer_email: user?.email || '',
        customer_phone: user?.phone || '',
        table_number: tableNumber,
        items: cartItems.map(item => ({
          food_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        total_amount: finalTotal,
        status: 'pending',
        payment_method: 'online',
        notes: {
          restaurant_id: restaurant.id || '1',
          table_number: tableNumber || 'N/A',
          special_instructions: specialInstructions
        },
        address: '',
        delivery_type: 'delivery'
      };

      console.log('Creating order with data:', orderData);

      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Order creation error:', error);
        throw new Error(error.message || 'Failed to create order');
      }

      if (!order || !order.id) {
        throw new Error('Order created but missing ID');
      }

      console.log('Order created successfully:', order);
      clearCart();
      
      // Navigate to order confirmation
      navigate('/order-confirmation-page', {
        state: {
          orderId: order.id,
          orderNumber: order.order_number,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          totalAmount: finalTotal,
          tableNumber,
          paymentMethod,
          customerName,
          customerEmail,
          customerPhone,
          specialInstructions
        }
      });
    } catch (error) {
      console.error('Process order error:', error);
      setScriptError(`Payment successful but order creation failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex justify-center">
          <button onClick={handleGoBack} className="absolute left-4 top-8 text-orange-500">
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

          {scriptError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{scriptError}</span>
              </div>
              <div className="flex justify-end mt-2">
                <button onClick={() => setScriptError(null)} className="text-sm underline text-red-700 hover:text-red-900">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-3">
              <h3 className="font-semibold text-lg">Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('razorpay')} className={`p-4 rounded-lg border-2 flex items-center gap-3 ${paymentMethod === 'razorpay' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <CreditCard className={`${paymentMethod === 'razorpay' ? 'text-orange-500' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <div className="font-semibold">Online Payment</div>
                    <div className="text-sm text-gray-500">Credit/Debit Card, UPI, Net Banking</div>
                  </div>
                </button>
                <button onClick={() => setPaymentMethod('direct')} className={`p-4 rounded-lg border-2 flex items-center gap-3 ${paymentMethod === 'direct' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <QrCode className={`${paymentMethod === 'direct' ? 'text-orange-500' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <div className="font-semibold">Pay At Restaurant</div>
                    <div className="text-sm text-gray-500">Cash, Card or UPI at counter</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <h3 className="font-bold mb-4">Order Summary</h3>
              <p className="text-sm text-gray-600 mb-4">
                Table: {tableNumber || 'Not specified'}
              </p>
              
              {cartItems.map(item => {
                const isWater = item.name && (item.name.toLowerCase().includes('water') || item.category?.toLowerCase() === 'water');
                const hasDiscount = item.discounttype && item.discountvalue;
                const originalTotal = (item.price * item.quantity).toFixed(2);
                const discountedPrice = item.effectivePrice !== undefined ? Number(item.effectivePrice).toFixed(2) : Number(calculateEffectivePrice(item)).toFixed(2);
                const discountedTotal = (Number(discountedPrice) * item.quantity).toFixed(2);
                   
                return (
                  <div key={`${item.id}-${item.category}`} className="flex justify-between py-2 border-b">
                    <div>
                      <span>{item.name} × {item.quantity}</span>
                      {hasDiscount && ( <div className="text-green-600 text-sm"> {item.discounttype === 'Percentage' && `${item.discountvalue}% off`} {item.discounttype === 'Fixed' && `₹${item.discountvalue * item.quantity} off`} </div> )}
                      {isWater && ( <span className="ml-2 text-xs text-green-600">(GST exempt)</span> )}
                    </div>
                    <div className="text-right">
                      {hasDiscount ? ( <> <p className="text-gray-600 text-sm line-through">₹{originalTotal}</p> <p className="font-medium">₹{discountedTotal}</p> </> ) : ( <span>₹{originalTotal}</span> )}
                    </div>
                  </div>
                );
              })}
              
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between"> <span className="text-gray-600">Original Total</span> <span>₹{originalTotal.toFixed(2)}</span> </div>
                {discountAmount > 0 && ( <div className="flex justify-between"> <span className="text-green-600">Discount</span> <span className="text-green-600">- ₹{discountAmount.toFixed(2)}</span> </div> )}
                <div className="flex justify-between"> <span className="text-gray-600">Subtotal</span> <span>₹{subtotalAfterDiscount.toFixed(2)}</span> </div>
                <div className="flex justify-between"> <span className="text-gray-600">CGST (2.5%)</span> <span>₹{cgst.toFixed(2)}</span> </div>
                <div className="flex justify-between"> <span className="text-gray-600">SGST (2.5%)</span> <span>₹{sgst.toFixed(2)}</span> </div>
                <div className="border-t border-gray-300 my-4"></div>
                <div className="flex justify-between font-bold text-xl"> <span>Total</span> <span>₹{finalTotal.toFixed(2)}</span> </div>
              </div>
            </div>

            {/* REMOVED the complex phone number input logic from here for simplicity */}

            <div className="mt-auto pt-6">
              <button onClick={handlePayment} disabled={isProcessing || cartItems.length === 0} className={`w-full bg-gray-600 text-white py-3 rounded-full font-medium text-lg ${ isProcessing || cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700' } transition-colors`}>
                {isProcessing ? 'Processing...' : paymentMethod === 'razorpay' ? `Pay ₹${finalTotal.toFixed(2)} Now` : `Place Order - Pay at Restaurant`}
              </button>
            </div>
            
            <div className="pb-5"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;