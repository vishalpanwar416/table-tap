import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../shared/config/CartContent';
import {
  ChevronLeft,
  CreditCard,
  QrCode,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Smartphone,
} from 'lucide-react';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';
import { useAuth } from '../../shared/config/AuthContext';
import {
  loadRazorpayScript,
  initializeRazorpayPayment,
  getRestaurantPaymentImage,
  verifyRazorpaySignature,
  createOrder,
  checkPendingFailedOrders,
  notifyPaymentOrderMismatch,
} from '../api/paymentService';
import LoadingScreen from '../../shared/components/LoadingScreen';

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
  const lastPaymentIdRef = useRef(null);
  // Synchronous re-entry guard: isProcessing is React state, so it updates on
  // the next render — too late to block a fast double-tap. A ref flips
  // immediately and stops a second handler from starting the flow twice.
  const isSubmittingRef = useRef(false);
  // Stable idempotency key for offline (direct/UPI) payments. Previously these
  // used `Date.now()` regenerated on every click, so the duplicate guard never
  // matched across clicks. Generated once per order attempt and only reset
  // after a successful order so retries of a failed order reuse the same key.
  const idempotencyKeyRef = useRef(null);
  const getIdempotencyKey = (prefix) => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
    return `${prefix}-${idempotencyKeyRef.current}`;
  };
  const { restaurant } = useRestaurant();
  const { user, loading: authLoading } = useAuth();

  // Customer contact info state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Computed customer details with fallbacks
  const finalCustomerName =
    customerName || user?.user_metadata?.full_name || guestDetails?.name || 'Guest Customer';
  const finalCustomerEmail =
    customerEmail || user?.email || guestDetails?.email || 'guest@example.com';
  const finalCustomerPhone =
    customerPhone || user?.user_metadata?.phone || guestDetails?.phone || '';
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

  const calculatePriceDetails = useCallback(() => {
    let originalTotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;

    cartItems.forEach((item) => {
      const originalItemTotal = item.price * item.quantity;
      originalTotal += originalItemTotal;

      const effectivePrice =
        item.effectivePrice !== undefined ? item.effectivePrice : calculateEffectivePrice(item);

      const itemDiscount = (item.price - effectivePrice) * item.quantity;
      discountAmount += itemDiscount;

      const itemSubtotal = effectivePrice * item.quantity;

      const isWater =
        item.name &&
        (item.name.toLowerCase().includes('water') || item.category?.toLowerCase() === 'water');

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
      finalTotal,
    };
  }, [cartItems, calculateEffectivePrice]);

  const { originalTotal, discountAmount, subtotalAfterDiscount, cgst, sgst, finalTotal } =
    calculatePriceDetails();

  useEffect(() => {
    const loadPaymentScript = async () => {
      try {
        await loadRazorpayScript();
        setScriptLoaded(true);
        setScriptError(null);
      } catch (error) {
        console.error('Failed to load Razorpay script:', error);
        setScriptError(
          'Payment gateway failed to load. Please try again later or choose Pay At Restaurant.',
        );
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

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePayment = async () => {
    if (isSubmittingRef.current) return; // prevent double-submit on fast taps
    isSubmittingRef.current = true;
    setIsProcessing(true);

    try {
      if (paymentMethod === 'direct') {
        await processOrder({
          razorpay_payment_id: getIdempotencyKey('DIRECT'),
          razorpay_order_id: getIdempotencyKey('DIRECT-ORDER'),
          razorpay_signature: 'NA',
        });
        // processOrder navigates away on success; reset here for the failure
        // path so the user can retry.
        isSubmittingRef.current = false;
        setIsProcessing(false);
        return;
      }

      if (paymentMethod === 'razorpay') {
        const amountInPaise = Math.round(finalTotal * 100); // Razorpay expects paise
        const rzp = initializeRazorpayPayment({
          razorpayKeyId: restaurant.razorpay_key_id,
          amount: amountInPaise,
          restaurantName: restaurant.name,
          restaurantLogo: getRestaurantPaymentImage(restaurant),
          restaurantId: restaurant.id,
          customerName: finalCustomerName,
          customerEmail: finalCustomerEmail,
          customerPhone: finalCustomerPhone,
          tableNumber,
          specialInstructions,
          themeColor: '#F37254',
          onSuccess: async (response) => {
            setIsProcessing(true);
            try {
              await processOrder({
                ...response,
                payment_method: 'razorpay',
              });
            } finally {
              isSubmittingRef.current = false;
              setIsProcessing(false);
            }
          },
          onDismiss: () => {
            isSubmittingRef.current = false;
            setIsProcessing(false);
          },
          onFailure: (error) => {
            setScriptError(error || 'Payment failed');
            isSubmittingRef.current = false;
            setIsProcessing(false);
          },
        });

        // Keep the button disabled while the Razorpay modal is open; the flow
        // resolves in onSuccess/onDismiss/onFailure above. (Previously a
        // `finally` reset isProcessing right after open(), re-enabling the
        // button mid-payment and allowing duplicate orders.)
        rzp.open();
        return;
      }

      // ...rest of your payment logic for other methods if any...
      isSubmittingRef.current = false;
      setIsProcessing(false);
    } catch (error) {
      setScriptError(error.message || 'Payment failed');
      isSubmittingRef.current = false;
      setIsProcessing(false);
    }
  };

  // Enhanced processOrder function with proper error handling
  const processOrder = async (paymentResponse) => {
    // Basic guard: avoid duplicate order creation for the same payment in a single session
    if (
      paymentResponse?.razorpay_payment_id &&
      lastPaymentIdRef.current === paymentResponse.razorpay_payment_id
    ) {
      console.warn('Duplicate payment callback ignored', paymentResponse.razorpay_payment_id);
      return true;
    }

    let refundInitiated = false;

    try {
      if (!paymentResponse || !paymentResponse.razorpay_payment_id) {
        throw new Error('Missing payment confirmation details');
      }

      lastPaymentIdRef.current = paymentResponse.razorpay_payment_id;

      // Ensure restaurant data is available
      if (!restaurant || !restaurant.id) {
        throw new Error('Restaurant data not available');
      }

      // CRITICAL SECURITY STEP: Verify Razorpay signature for online payments
      // Skip verification for DIRECT (cash) and manual UPI payments
      const isDirectPayment = paymentResponse.razorpay_payment_id.startsWith('DIRECT-');
      const isManualUpi = paymentResponse.razorpay_payment_id.startsWith('UPI-');

      // Only attempt signature verification when we have all required fields from Razorpay
      if (!isDirectPayment && !isManualUpi) {
        const hasSignature = !!paymentResponse.razorpay_signature;
        const hasOrderId = !!paymentResponse.razorpay_order_id;

        if (hasSignature && hasOrderId) {
          setIsProcessing(true);
          setScriptError(null);

          const isVerified = await verifyRazorpaySignature(
            paymentResponse.razorpay_payment_id,
            paymentResponse.razorpay_order_id,
            paymentResponse.razorpay_signature,
          );

          if (!isVerified) {
            throw new Error(
              'Payment verification failed. If you have already paid, please contact support with your payment ID.',
            );
          }
        } else {
          // Some gateways return only payment_id when no server-side order was created.
          // Don't block order creation; we will log and proceed so the order isn't lost.
          console.warn('Skipping signature verification: missing order_id or signature', {
            hasOrderId,
            hasSignature,
          });
        }
      }

      // Guest validation (if applicable)
      if (!user) {
        // ... guest validation as before ...
        if (!finalCustomerName || finalCustomerName.trim() === '') {
          throw new Error('Customer name is required');
        }
        if (finalCustomerEmail && finalCustomerEmail.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(finalCustomerEmail.trim())) {
            throw new Error('Please enter a valid email address');
          }
        }
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(finalCustomerPhone.trim())) {
          throw new Error('Please enter a valid 10-digit phone number');
        }
      }

      // CRITICAL: Store payment data before order creation
      const paymentData = {
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        signature: paymentResponse.razorpay_signature,
        amount: finalTotal,
        currency: 'INR',
        status: 'captured',
        method: paymentMethod,
        timestamp: new Date().toISOString(),
        customerEmail: finalCustomerEmail.trim(),
        customerPhone: finalCustomerPhone.trim(),
        restaurantId: restaurant.id,
      };
      sessionStorage.setItem(
        `payment_${paymentResponse.razorpay_payment_id}`,
        JSON.stringify(paymentData),
      );

      // Try to create order with retry mechanism
      const order = await createOrderWithRetry({
        restaurantId: restaurant.id,
        userId: user ? user.id : null,
        customerName: finalCustomerName.trim(),
        customerEmail: finalCustomerEmail.trim(),
        customerPhone: finalCustomerPhone.trim(),
        tableNumber,
        restaurantName: restaurant.name,
        items: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          effectivePrice: item.effectivePrice,
          name: item.name,
          category: item.category,
          image: item.image,
        })),
        razorpayOrderId: paymentResponse.razorpay_order_id || null,
        razorpayPaymentId: paymentResponse.razorpay_payment_id || null,
        razorpaySignature: paymentResponse.razorpay_signature || null,
        paymentMethod:
          paymentMethod === 'razorpay' ? 'razorpay' : paymentMethod === 'upi' ? 'upi' : 'direct',
        paymentStatus: 'completed',
        specialInstructions,
        totalAmount: finalTotal,
      });

      // Order created successfully - clear backup payment data
      sessionStorage.removeItem(`payment_${paymentResponse.razorpay_payment_id}`);

      // Order placed: invalidate the idempotency key so a genuinely new order
      // gets a fresh key instead of reusing this one.
      idempotencyKeyRef.current = null;

      clearCart();
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
          specialInstructions,
          paymentId: paymentResponse.razorpay_payment_id,
        },
      });
      return true;
    } catch (error) {
      console.error('processOrder error:', error);
      // CRITICAL: Handle payment success but order creation failure
      if (
        paymentResponse.razorpay_payment_id &&
        !paymentResponse.razorpay_payment_id.startsWith('DIRECT-')
      ) {
        await handlePaymentSuccessOrderFailure(paymentResponse, error);
      } else {
        setScriptError(`Order creation failed: ${error.message}`);
        setIsProcessing(false);
      }
      lastPaymentIdRef.current = null; // allow retry for this payment if it was not completed
      return false;
    }
  };

  // Function to handle payment success but order creation failure
  const handlePaymentSuccessOrderFailure = async (paymentResponse, originalError) => {
    try {
      setScriptError(
        `IMPORTANT: Your payment was successful but there was an issue creating your order. ` +
          `Please don't worry - your money is safe. Use the options below to retry, or contact ` +
          `support with this Payment ID if you need help. ` +
          `Payment ID: ${paymentResponse.razorpay_payment_id}`,
      );
      // 1. Store the failed order attempt for manual processing
      const failedOrderData = {
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        signature: paymentResponse.razorpay_signature,
        amount: finalTotal,
        currency: 'INR',
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: finalCustomerPhone,
        restaurantId: restaurant.id,
        tableNumber,
        items: cartItems,
        specialInstructions,
        paymentMethod,
        errorMessage: originalError.message,
        timestamp: new Date().toISOString(),
        status: 'payment_success_order_failed',
      };
      sessionStorage.setItem(
        `failed_order_${paymentResponse.razorpay_payment_id}`,
        JSON.stringify(failedOrderData),
      );
      // 2. Best-effort alert to the team + customer via the payment-alert edge
      // function (also handles the customer email). Never throws.
      await notifyPaymentOrderMismatch(failedOrderData, restaurant?.name);
      // 3. Show recovery options to user
      showPaymentRecoveryOptions(paymentResponse.razorpay_payment_id, originalError.message, {
        retryOrderCreation: async () => {
          try {
            const storedData = sessionStorage.getItem(
              `failed_order_${paymentResponse.razorpay_payment_id}`,
            );
            if (!storedData) throw new Error('No stored order data found');
            const failedOrderData = JSON.parse(storedData);
            const order = await createOrderWithRetry({
              restaurantId: failedOrderData.restaurantId,
              userId: user ? user.id : null,
              customerName: failedOrderData.customerName,
              customerEmail: failedOrderData.customerEmail,
              customerPhone: failedOrderData.customerPhone,
              restaurantName: restaurant.name,
              tableNumber: failedOrderData.tableNumber,
              items: failedOrderData.items.map((item) => ({
                ...item,
                effectivePrice: item.effectivePrice || item.price,
              })),
              razorpayOrderId: failedOrderData.orderId,
              razorpayPaymentId: failedOrderData.paymentId,
              razorpaySignature: failedOrderData.signature,
              paymentMethod: failedOrderData.paymentMethod,
              paymentStatus: 'completed',
              specialInstructions: failedOrderData.specialInstructions,
              totalAmount: failedOrderData.amount,
              isRetry: true,
            });
            if (order) {
              sessionStorage.removeItem(`failed_order_${paymentResponse.razorpay_payment_id}`);
              clearCart();
              navigate('/order-confirmation-page', {
                state: {
                  orderId: order.id,
                  orderNumber: order.order_number,
                  restaurantId: failedOrderData.restaurantId,
                  restaurantName: restaurant.name,
                  totalAmount: order.total,
                  tableNumber: failedOrderData.tableNumber,
                  paymentMethod: failedOrderData.paymentMethod,
                  customerName: failedOrderData.customerName,
                  customerEmail: failedOrderData.customerEmail,
                  customerPhone: failedOrderData.customerPhone,
                  specialInstructions: failedOrderData.specialInstructions,
                  paymentId: paymentResponse.razorpay_payment_id,
                  wasRetry: true,
                },
              });
              closeRecoveryDialog();
            }
          } catch (error) {
            alert('Retry failed. Please contact customer support.');
          }
        },
        contactSupport: () => {
          const supportPhone = restaurant.phone || '1800-xxx-xxxx';
          const supportEmail = restaurant.email || 'support@restaurant.com';
          const message = `Payment ID: ${paymentResponse.razorpay_payment_id}\nAmount: ₹${finalTotal}\nRestaurant: ${restaurant.name}\nTable: ${tableNumber}\nIssue: Payment successful but order creation failed\nError: ${originalError.message}`;
          if (supportPhone) {
            window.open(
              `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`,
              '_blank',
            );
          } else {
            window.open(
              `mailto:${supportEmail}?subject=Payment Issue - ${paymentResponse.razorpay_payment_id}&body=${encodeURIComponent(message)}`,
              '_blank',
            );
          }
        },
        closeRecoveryDialog,
      });
    } catch (error) {
      console.error('Error handling payment success order failure:', error);
      setScriptError(
        `Payment successful but order creation failed. Payment ID: ${paymentResponse.razorpay_payment_id}. ` +
          `Please contact customer support immediately.`,
      );
    }
    setIsProcessing(false);
  };

  // Retry mechanism for order creation
  const createOrderWithRetry = async (orderData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const orderDataWithAttempt = { ...orderData, creationAttempt: attempt };
        const order = await createOrder(orderDataWithAttempt);
        if (order && order.id) {
          return order;
        } else {
          throw new Error('Order creation returned empty response');
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Order creation failed after ${maxRetries} attempts: ${error.message}`);
        }
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  // Function to notify backend about payment-order mismatch
  // Function to show recovery options to user — built with DOM APIs (no innerHTML) to prevent XSS
  const showPaymentRecoveryOptions = (
    paymentId,
    errorMessage,
    { retryOrderCreation, contactSupport, closeRecoveryDialog },
  ) => {
    const overlay = document.createElement('div');
    overlay.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-2xl max-w-md mx-4';

    const title = document.createElement('h3');
    title.className = 'text-lg font-bold mb-4 text-red-600';
    title.textContent = 'Payment Successful, Order Issue';

    const desc = document.createElement('p');
    desc.className = 'text-gray-700 mb-4';
    desc.textContent =
      "Your payment was processed successfully, but there was an issue creating your order. Don't worry — your money is safe!";

    const errorBox = document.createElement('div');
    errorBox.className = 'mb-4 bg-red-50 p-3 rounded text-xs text-red-700 font-mono break-all';
    errorBox.textContent = `Error: ${String(errorMessage || 'Unknown error')}`;

    const paymentIdBox = document.createElement('div');
    paymentIdBox.className = 'mb-4';
    const paymentIdLabel = document.createElement('p');
    paymentIdLabel.className = 'text-sm text-gray-600';
    paymentIdLabel.textContent = 'Payment ID: ';
    const paymentIdSpan = document.createElement('span');
    paymentIdSpan.className = 'font-mono';
    paymentIdSpan.textContent = String(paymentId || '');
    paymentIdLabel.appendChild(paymentIdSpan);
    paymentIdBox.appendChild(paymentIdLabel);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'space-y-3';

    const makeBtn = (text, cls, handler) => {
      const btn = document.createElement('button');
      btn.className = cls;
      btn.textContent = text;
      btn.onclick = handler;
      return btn;
    };

    btnContainer.appendChild(
      makeBtn(
        'Retry Order Creation',
        'w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600',
        retryOrderCreation,
      ),
    );
    btnContainer.appendChild(
      makeBtn(
        'Contact Support',
        'w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600',
        contactSupport,
      ),
    );
    btnContainer.appendChild(
      makeBtn(
        'Close',
        'w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300',
        closeRecoveryDialog,
      ),
    );

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(errorBox);
    card.appendChild(paymentIdBox);
    card.appendChild(btnContainer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  };

  // Function to retry order creation with stored payment data
  const retryOrderCreation = async (paymentId) => {
    try {
      const storedData = sessionStorage.getItem(`failed_order_${paymentId}`);
      if (!storedData) throw new Error('No stored order data found');
      const failedOrderData = JSON.parse(storedData);
      const order = await createOrderWithRetry({
        restaurantId: failedOrderData.restaurantId,
        userId: user ? user.id : null,
        customerName: failedOrderData.customerName,
        customerEmail: failedOrderData.customerEmail,
        customerPhone: failedOrderData.customerPhone,
        restaurantName: restaurant.name,
        tableNumber: failedOrderData.tableNumber,
        items: failedOrderData.items.map((item) => ({
          ...item,
          effectivePrice: item.effectivePrice || item.price,
        })),
        razorpayOrderId: failedOrderData.orderId,
        razorpayPaymentId: failedOrderData.paymentId,
        razorpaySignature: failedOrderData.signature,
        paymentMethod: failedOrderData.paymentMethod,
        paymentStatus: 'completed',
        specialInstructions: failedOrderData.specialInstructions,
        totalAmount: failedOrderData.amount,
        isRetry: true,
      });
      if (order) {
        sessionStorage.removeItem(`failed_order_${paymentId}`);
        clearCart();
        navigate('/order-confirmation-page', {
          state: {
            orderId: order.id,
            orderNumber: order.order_number,
            restaurantId: failedOrderData.restaurantId,
            restaurantName: restaurant.name,
            totalAmount: order.total,
            tableNumber: failedOrderData.tableNumber,
            paymentMethod: failedOrderData.paymentMethod,
            customerName: failedOrderData.customerName,
            customerEmail: failedOrderData.customerEmail,
            customerPhone: failedOrderData.customerPhone,
            specialInstructions: failedOrderData.specialInstructions,
            paymentId: paymentId,
            wasRetry: true,
          },
        });
        closeRecoveryDialog();
      }
    } catch (error) {
      alert('Retry failed. Please contact customer support.');
    }
  };

  // Function to contact support
  const contactSupport = (paymentId) => {
    const supportPhone = restaurant.phone || '1800-xxx-xxxx';
    const supportEmail = restaurant.email || 'support@restaurant.com';
    const message = `Payment ID: ${paymentId}\nAmount: ₹${finalTotal}\nRestaurant: ${restaurant.name}\nTable: ${tableNumber}\nIssue: Payment successful but order creation failed`;
    if (supportPhone) {
      window.open(`https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(
        `mailto:${supportEmail}?subject=Payment Issue - ${paymentId}&body=${encodeURIComponent(message)}`,
        '_blank',
      );
    }
  };

  // Function to close recovery dialog
  const closeRecoveryDialog = () => {
    const dialog = document.querySelector('.fixed.inset-0');
    if (dialog) dialog.remove();
  };

  // Check for pending failed orders on load (payment succeeded but order
  // creation failed). The service signature is
  // checkPendingFailedOrders(userId, showPaymentRecoveryOptions): the first arg
  // must be the user id so the DB lookup is scoped correctly, and the second is
  // the callback invoked with the failed payment id. Depends on user?.id so it
  // re-runs once auth resolves (user is null on the first render).
  useEffect(() => {
    checkPendingFailedOrders(user?.id ?? null, (paymentId) => {
      showPaymentRecoveryOptions(
        paymentId,
        'Your previous payment was successful, but the order was not created.',
        {
          retryOrderCreation: () => retryOrderCreation(paymentId),
          contactSupport: () => contactSupport(paymentId),
          closeRecoveryDialog,
        },
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Function to create general UPI payment URL
  const createUPIPaymentUrl = (upiId, amount, merchantName) => {
    // Remove any spaces and special characters from UPI ID
    const cleanUpiId = upiId.replace(/\s+/g, '').replace(/[^a-zA-Z0-9@.-]/g, '');

    // Create general UPI payment URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=Food Order Payment`;

    return upiUrl;
  };

  const handleUPIPayment = async () => {
    if (isSubmittingRef.current) return; // prevent double-submit on fast taps
    if (!restaurant.upi_id) {
      setScriptError('UPI payment is not configured for this restaurant.');
      return;
    }
    isSubmittingRef.current = true;

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
          'If you cancelled the payment, click Cancel to go back.',
      );

      if (confirmed) {
        setIsProcessing(true);
        const result = await processOrder({
          razorpay_payment_id: getIdempotencyKey('UPI'),
          razorpay_order_id: getIdempotencyKey('UPI-ORDER'),
          razorpay_signature: 'NA',
          upi_id: restaurant.upi_id,
          payment_method: 'upi',
        });

        if (!result) {
          setIsProcessing(false);
        }
      }
    } catch (error) {
      setScriptError(`Failed to open UPI payment: ${error.message}`);
      setIsProcessing(false);
    } finally {
      // Reset the re-entry guard. On success processOrder navigates away and
      // this is moot; on cancel/failure it re-enables the button for a retry.
      isSubmittingRef.current = false;
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading restaurant details...</div>
      </div>
    );
  }

  if (authLoading) {
    return <LoadingScreen message="Loading authentication..." variant="page" />;
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-mobile-shell md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="w-full px-6 py-8 relative flex items-center justify-center">
          <button
            onClick={handleGoBack}
            className="absolute left-4 text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-10"
            aria-label="Go back"
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
          <div
            className={`transition-all duration-700 ${animateItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
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
              <p className="text-center text-gray-600 text-sm">
                Choose your preferred payment method
              </p>
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
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
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
                      <span className="font-bold text-green-800">{restaurant.name}</span>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-sm text-blue-800 text-center">
                        💡 <strong>Tip:</strong> After completing the UPI payment, you'll be asked
                        to confirm your order. Make sure to complete the payment in your UPI app
                        first.
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
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        paymentMethod === 'razorpay' ? 'bg-orange-500' : 'bg-gray-100'
                      }`}
                    >
                      <CreditCard
                        size={24}
                        className={paymentMethod === 'razorpay' ? 'text-white' : 'text-gray-500'}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-lg">Online Payment</div>
                      <div className="text-sm text-gray-600">
                        Credit/Debit Card, UPI, Net Banking
                      </div>
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
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        paymentMethod === 'upi' ? 'bg-orange-500' : 'bg-gray-100'
                      }`}
                    >
                      <Smartphone
                        size={24}
                        className={paymentMethod === 'upi' ? 'text-white' : 'text-gray-500'}
                      />
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
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      paymentMethod === 'direct' ? 'bg-orange-500' : 'bg-gray-100'
                    }`}
                  >
                    <QrCode
                      size={24}
                      className={paymentMethod === 'direct' ? 'text-white' : 'text-gray-500'}
                    />
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
                  const isWater =
                    item.name &&
                    (item.name.toLowerCase().includes('water') ||
                      item.category?.toLowerCase() === 'water');
                  const hasDiscount = item.discounttype && item.discountvalue;
                  const originalTotal = (item.price * item.quantity).toFixed(2);
                  const discountedPrice =
                    item.effectivePrice !== undefined
                      ? Number(item.effectivePrice).toFixed(2)
                      : Number(calculateEffectivePrice(item)).toFixed(2);
                  const discountedTotal = (Number(discountedPrice) * item.quantity).toFixed(2);

                  return (
                    <div
                      key={`${item.id}-${item.category}`}
                      className={`flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0 transition-all duration-300 ${animateItems ? 'animate-in slide-in-from-left-2' : ''}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {item.name} × {item.quantity}
                        </div>
                        {hasDiscount && (
                          <div className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded-full inline-block mt-1">
                            {item.discounttype === 'Percentage' && `${item.discountvalue}% off`}
                            {item.discounttype === 'Fixed' &&
                              `₹${Math.min(item.discountvalue, item.price) * item.quantity} off`}
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
                    <span className="text-green-600 font-semibold">
                      - ₹{discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-800">
                    ₹{subtotalAfterDiscount.toFixed(2)}
                  </span>
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
                  <span className="text-2xl font-bold text-orange-600">
                    ₹{finalTotal.toFixed(2)}
                  </span>
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
          <div className="max-w-mobile-shell md:max-w-4xl lg:max-w-6xl mx-auto">
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
