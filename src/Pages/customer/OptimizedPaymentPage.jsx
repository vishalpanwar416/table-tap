import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Wallet, QrCode, CheckCircle, Lock } from 'lucide-react';
import { OptimizedPageWrapper, itemVariants } from '../../components/customer/OptimizedPageWrapper';
import { useCart } from '../../config/CartContent';
import { usePerformanceMonitor } from '../../hooks/usePerformance';
import { useDebounce } from '../../hooks/usePerformance';

const OptimizedPaymentPage = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  
  // Performance monitoring
  usePerformanceMonitor('PaymentPage');
  
  // State management
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Get order details from location state
  const orderDetails = useMemo(() => {
    return location.state?.orderDetails || {
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: 0,
      deliveryFee: 0
    };
  }, [location.state, cartItems]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = orderDetails.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% tax
    const deliveryFee = subtotal > 500 ? 0 : 50; // Free delivery above ₹500
    const total = subtotal + tax + deliveryFee;
    
    return { subtotal, tax, deliveryFee, total };
  }, [orderDetails.items]);

  // Payment methods configuration
  const paymentMethods = useMemo(() => [
    {
      id: 'card',
      icon: <CreditCard className="w-6 h-6" />,
      label: 'Credit/Debit Card',
      description: 'Pay with your card'
    },
    {
      id: 'upi',
      icon: <QrCode className="w-6 h-6" />,
      label: 'UPI',
      description: 'Pay with UPI apps'
    },
    {
      id: 'wallet',
      icon: <Wallet className="w-6 h-6" />,
      label: 'Digital Wallet',
      description: 'Pay with wallet'
    }
  ], []);

  // Event handlers
  const handleBack = useCallback(() => {
    navigate('/order-confirmation');
  }, [navigate]);

  const handlePaymentMethodChange = useCallback((method) => {
    setPaymentMethod(method);
    setError(null);
  }, []);

  const handleCardInputChange = useCallback((field, value) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  }, []);

  const formatCardNumber = useCallback((value) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }, []);

  const formatExpiry = useCallback((value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }, []);

  const validateCard = useCallback(() => {
    const errors = [];
    
    if (cardDetails.number.replace(/\s/g, '').length !== 16) {
      errors.push('Card number must be 16 digits');
    }
    
    if (!cardDetails.name.trim()) {
      errors.push('Cardholder name is required');
    }
    
    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      errors.push('Invalid expiry date (MM/YY)');
    }
    
    if (cardDetails.cvv.length !== 3) {
      errors.push('CVV must be 3 digits');
    }
    
    return errors;
  }, [cardDetails]);

  const handlePayment = useCallback(async () => {
    if (paymentMethod === 'card') {
      const errors = validateCard();
      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        setPaymentSuccess(true);
        clearCart();
        
        // Navigate to success page after delay
        setTimeout(() => {
          navigate('/order-confirmation', { 
            state: { 
              orderId: Date.now(),
              paymentSuccess: true,
              orderDetails 
            }
          });
        }, 2000);
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [paymentMethod, validateCard, clearCart, navigate, orderDetails]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsProcessing(false);
    setPaymentSuccess(false);
  }, []);

  // Payment method component
  const PaymentMethodCard = memo(({ method, isSelected, onClick }) => (
    <motion.div
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected 
          ? 'border-orange-500 bg-orange-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {method.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{method.label}</h3>
          <p className="text-sm text-gray-500">{method.description}</p>
        </div>
      </div>
    </motion.div>
  ));

  // Card form component
  const CardForm = memo(() => (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Number
        </label>
        <input
          type="text"
          value={cardDetails.number}
          onChange={(e) => handleCardInputChange('number', formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          maxLength="19"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardDetails.name}
          onChange={(e) => handleCardInputChange('name', e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date
          </label>
          <input
            type="text"
            value={cardDetails.expiry}
            onChange={(e) => handleCardInputChange('expiry', formatExpiry(e.target.value))}
            placeholder="MM/YY"
            maxLength="5"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVV
          </label>
          <input
            type="text"
            value={cardDetails.cvv}
            onChange={(e) => handleCardInputChange('cvv', e.target.value.replace(/\D/g, ''))}
            placeholder="123"
            maxLength="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>
    </motion.div>
  ));

  // Success state
  if (paymentSuccess) {
    return (
      <OptimizedPageWrapper title="Payment Successful">
        <motion.div 
          className="bg-white rounded-t-[30px] flex-1 p-6 flex items-center justify-center"
          variants={itemVariants}
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-500">Your order has been confirmed.</p>
          </div>
        </motion.div>
      </OptimizedPageWrapper>
    );
  }

  return (
    <OptimizedPageWrapper
      title="Payment"
      showBackButton
      onBack={handleBack}
      error={error}
      onRetry={handleRetry}
    >
      <motion.div 
        className="bg-white rounded-t-[30px] flex-1 p-6"
        variants={itemVariants}
      >
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
              </div>
            ))}
            
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (5%)</span>
                <span className="text-gray-800">₹{totals.tax}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="text-gray-800">₹{totals.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-800">Total</span>
                <span className="text-gray-800">₹{totals.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h2>
          
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                isSelected={paymentMethod === method.id}
                onClick={() => handlePaymentMethodChange(method.id)}
              />
            ))}
          </div>
        </div>

        {/* Payment Form */}
        {paymentMethod === 'card' && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Card Details</h2>
            <CardForm />
          </div>
        )}

        {paymentMethod === 'upi' && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">UPI Payment</h2>
            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <QrCode className="w-32 h-32 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Scan QR code with your UPI app</p>
            </div>
          </div>
        )}

        {paymentMethod === 'wallet' && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Digital Wallet</h2>
            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <Wallet className="w-32 h-32 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Pay with your digital wallet</p>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <div className="mt-8">
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Pay ₹{totals.total}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </OptimizedPageWrapper>
  );
});

OptimizedPaymentPage.displayName = 'OptimizedPaymentPage';

export default OptimizedPaymentPage; 