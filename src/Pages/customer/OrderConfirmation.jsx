import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Trash2, Minus, Plus, ChevronDown, CheckCircle, Clock, MapPin, User, Mail, Phone, AlertCircle, Info, LogIn } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useRestaurant } from '../Restaurantselection/RestaurantContext';
import { getStoredRestaurantSelection } from '../../utils/restaurantCheck';
import { authService } from '../../api/authService';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const EVENTS = {
  MOUSE_DOWN: 'mousedown',
};
const ROUTES = {
  LOGIN: '/login',
  ORDER_CONFIRMATION: '/order-confirmation',
  PAYMENT: '/payment',
};
const PLACEHOLDER_IMG = '/api/placeholder/80/80';

// --- Subcomponents ---

const EmailExistsPopup = ({ show, onClose, onAccept, onReject, email }) => {
  const popupVariants = {
    hidden: { y: 100, opacity: 0, scale: 0.98 },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { y: 100, opacity: 0, scale: 0.98, transition: { duration: 0.25 } }
  };
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="popup-overlay"
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[3px]"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-label="Close popup"
          />
          <motion.div
            key="popup-content"
            className="fixed bottom-3 left-0 right-0 z-50 mx-auto p-6 shadow-2xl border border-orange-100"
            style={{ maxWidth: '390px', background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 60%, rgba(255,240,220,0.85) 100%)', backdropFilter: 'blur(12px)', borderRadius: '3rem' }}
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex flex-col items-center mb-4">
              <motion.div
                className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-2 shadow-lg"
                initial={{ boxShadow: '0 0 0 0 rgba(255,140,0,0.3)' }}
                animate={{ boxShadow: ['0 0 0 0 rgba(255,140,0,0.3)', '0 0 0 8px rgba(255,140,0,0.08)', '0 0 0 0 rgba(255,140,0,0.3)'] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              </motion.div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Account Found</h2>
              <p className="text-base text-gray-700 font-medium">The email <span className="font-semibold text-orange-600">{email}</span> is already registered.</p>
            </div>
            <p className="text-gray-500 text-xs text-center mb-6">Would you like to login to your existing account?</p>
            <div className="flex gap-4 justify-center px-2 mb-2">
              <button
                onClick={onReject}
                className="flex-1 bg-gray-200 text-gray-800 py-3 hover:bg-gray-300 transition-colors font-semibold shadow-sm"
                style={{ borderRadius: '3rem' }}
              >
                Use Different Email
              </button>
              <button
                onClick={onAccept}
                className="flex-1 bg-gray-800 text-white py-3 hover:bg-gray-700 transition-colors font-semibold shadow-lg flex items-center justify-center gap-2"
                style={{ borderRadius: '3rem' }}
              >
                <LogIn className="w-5 h-5" />
                Login
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const AnimatedError = ({ error }) => (
  <AnimatePresence>
    {error && (
      <motion.div
        className="my-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <AlertCircle size={18} className="text-red-400" />
        <span>{error}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

const TableSelector = ({
  availableTables,
  tableNumber,
  setTableNumber,
  showTableDropdown,
  setShowTableDropdown,
  dropdownRef,
  isLoadingTables,
  selectedTableDetails
}) => (
  <div className="mb-8">
    {selectedTableDetails && (
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-blue-800 text-sm">{`Table ${selectedTableDetails.tableNumber}`}</div>
              <div className="text-blue-700 text-xs">
                {selectedTableDetails.location ? `${selectedTableDetails.location} • ` : ''}
                {selectedTableDetails.capacity ? `${selectedTableDetails.capacity} people` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle size={12} className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-green-800 font-medium text-xs">Auto-selected</div>
              <div className="text-green-700 text-xs">From QR code</div>
            </div>
          </div>
        </div>
      </div>
    )}

    <label className="block text-gray-800 mb-3 text-lg font-semibold flex items-center gap-2">
      <MapPin size={20} className="text-orange-500" />
      Table Number
    </label>
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowTableDropdown(!showTableDropdown)}
        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-left flex justify-between items-center transition-all duration-200 hover:border-orange-300"
        aria-haspopup="listbox"
        aria-expanded={showTableDropdown}
      >
        <span className={tableNumber ? 'text-gray-800 font-medium' : 'text-gray-500'}>
          {tableNumber ? `Table ${tableNumber}` : 'Select your table number'}
        </span>
        <ChevronDown 
          size={20} 
          className={`text-gray-400 transition-transform duration-200 ${showTableDropdown ? 'rotate-180' : ''}`}
        />
      </button>
      {showTableDropdown && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {isLoadingTables ? (
            <div className="px-4 py-6 text-gray-500 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 animate-spin">
                <MapPin size={20} />
              </div>
              Loading tables...
            </div>
          ) : availableTables.length > 0 ? (
            availableTables.map((table) => (
              <button
                key={`${table.tableNumber}-${table.location || ''}`}
                type="button"
                onClick={() => {
                  setTableNumber(table.tableNumber);
                  setShowTableDropdown(false);
                }}
                className={`w-full px-4 py-4 text-left hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200 ${
                  table.tableNumber === tableNumber ? 'bg-orange-50 border-orange-200' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-gray-800">Table {table.tableNumber}</span>
                    {table.location && (
                      <span className="text-sm text-gray-500 ml-2">({table.location})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {table.capacity} seats
                    </span>
                    {table.tableNumber === tableNumber && (
                      <span className="text-orange-600 text-sm font-medium bg-orange-100 px-2 py-1 rounded-full">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-gray-500 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin size={20} />
              </div>
              No tables available
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const GuestForm = ({
  guestName,
  setGuestName,
  guestEmail,
  setGuestEmail,
  guestPhone,
  setGuestPhone,
  isCheckingEmail,
  emailExists,
  handleEmailChange,
  guestEmailInputRef
}) => (
  <div className="mb-8 p-6 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 animate-in slide-in-from-bottom-2 duration-500">
    <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800">
      <User size={20} className="text-blue-500" />
      Guest Information
    </h3>
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="guestName">
          <User size={16} />
          Full Name *
        </label>
        <input 
          id="guestName" 
          type="text" 
          value={guestName} 
          onChange={(e) => setGuestName(e.target.value)} 
          className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
          required 
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="guestEmail">
          <Mail size={16} />
          Email Address *
          {isCheckingEmail && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </label>
        <input 
          id="guestEmail" 
          type="email" 
          value={guestEmail} 
          onChange={handleEmailChange}
          className={`w-full mt-2 px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
            emailExists ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
          }`}
          required 
          autoComplete="email"
          ref={guestEmailInputRef}
        />
        {emailExists && (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <Info size={16} />
              <span className="text-sm font-medium">This email is already registered</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Please login to continue with your existing account or use a different email
            </p>
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="guestPhone">
          <Phone size={16} />
          Phone Number *
        </label>
        <input 
          id="guestPhone" 
          type="tel" 
          value={guestPhone} 
          onChange={(e) => setGuestPhone(e.target.value)} 
          maxLength={10} 
          className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
          required 
        />
      </div>
    </div>
  </div>
);

// --- Main Component ---

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { cartItems, removeItem, updateQuantity, calculateEffectivePrice } = useCart();
  const { restaurant } = useRestaurant();
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showTableDropdown, setShowTableDropdown] = useState(false);

  // State for user and guest details
  const [user, setUser] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [animateItems, setAnimateItems] = useState(false);

  // Email check states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  // Table loading state
  const [isLoadingTables, setIsLoadingTables] = useState(true);

  // Parse tables from restaurant data
  const [availableTables, setAvailableTables] = useState([]);

  // Ref for dropdown click outside handling
  const dropdownRef = useRef(null);

  // Ref for guest email input (for focus management)
  const guestEmailInputRef = useRef(null);

  // Check for authenticated user on component load with better error handling
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setUser(null);
          return;
        }
        if (!sessionData.session) {
          setUser(null);
          return;
        }
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          setUser(null);
          return;
        }
        if (isMounted) setUser(userData?.user || null);
      } catch (error) {
        setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  // Parse tables from restaurant data with better error handling
  useEffect(() => {
    setIsLoadingTables(true);
    if (restaurant?.tables) {
      try {
        const parsedTables = typeof restaurant.tables === 'string' 
          ? JSON.parse(restaurant.tables) 
          : restaurant.tables;
        setAvailableTables(Array.isArray(parsedTables) ? parsedTables : []);
      } catch (error) {
        setAvailableTables([]);
      }
    } else {
      setAvailableTables([]);
    }
    setIsLoadingTables(false);
  }, [restaurant]);

  // Auto-select table number from local storage
  useEffect(() => {
    try {
      const storedSelection = getStoredRestaurantSelection();
      if (storedSelection?.tableNumber && availableTables.length > 0) {
        const matchingTable = availableTables.find(table => 
          table.tableNumber === storedSelection.tableNumber
        );
        if (matchingTable) {
          setTableNumber(storedSelection.tableNumber);
        }
      }
    } catch (error) {
      // Optionally, show a user-friendly message or fallback
    }
  }, [availableTables]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTableDropdown(false);
      }
    };
    document.addEventListener(EVENTS.MOUSE_DOWN, handleClickOutside);
    return () => {
      document.removeEventListener(EVENTS.MOUSE_DOWN, handleClickOutside);
    };
  }, []);

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateItems(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Email check function (using RPC) with cancellation logic
  const latestEmailCheck = useRef(0);
  const checkEmailExists = async (email) => {
    if (!email || !email.trim()) {
      setEmailExists(false);
      return;
    }
    setIsCheckingEmail(true);
    const checkId = Date.now();
    latestEmailCheck.current = checkId;
    try {
      const result = await authService.checkEmailExistsRPC(email);
      if (latestEmailCheck.current !== checkId) return; // Ignore outdated checks
      setEmailExists(result.exists);
      if (result.exists) {
        setShowLoginToast(true);
        setFormError('');
      }
    } catch (error) {
      if (latestEmailCheck.current !== checkId) return;
      setEmailExists(false);
    } finally {
      if (latestEmailCheck.current === checkId) setIsCheckingEmail(false);
    }
  };

  // Debounced email check useEffect with cancellation
  useEffect(() => {
    if (!guestEmail || user) {
      setEmailExists(false);
      setIsCheckingEmail(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      checkEmailExists(guestEmail);
    }, 1000);
    return () => {
      clearTimeout(timeoutId);
      latestEmailCheck.current += 1; // Invalidate previous checks
    };
    // eslint-disable-next-line
  }, [guestEmail, user]);

  // Remove direct DOM manipulation for keyboard closing
  useEffect(() => {
    if (showLoginToast && guestEmailInputRef.current) {
      guestEmailInputRef.current.blur();
    }
  }, [showLoginToast]);

  // Email input change handler
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setGuestEmail(newEmail);
    setEmailExists(false);
    setShowLoginToast(false);
    setFormError('');
    if (!newEmail.trim()) {
      setIsCheckingEmail(false);
    }
  };

  // Get selected table details with null check
  const getSelectedTableDetails = () => {
    return availableTables.find(table => table.tableNumber === tableNumber) || null;
  };

  // Moved to useCallback to prevent stale calculations
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getDate()} ${getMonthName(date.getMonth())}, ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} ${date.getHours() >= 12 ? 'pm' : 'am'}`;
  };

  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Place order loading state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // handlePlaceOrder with better validation and loading
  const handlePlaceOrder = async () => {
    setFormError('');
    if (cartItems.length === 0) {
      setFormError('Your cart is empty. Please add items before proceeding.');
      return;
    }
    if (!tableNumber) {
      setFormError('Please select your table number.');
      return;
    }
    if (isCheckingEmail) {
      setFormError('Please wait while we check your email...');
      return;
    }
    if (!user && emailExists) {
      setFormError('This email is already registered. Please login to continue.');
      return;
    }
    if (!user) {
      if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
        setFormError('Please fill in your name, email, and phone number to continue.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) {
        setFormError('Please enter a valid email address.');
        return;
      }
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(guestPhone)) {
        setFormError('Please enter a valid 10-digit phone number.');
        return;
      }
    }
    setIsPlacingOrder(true);
    try {
      navigate(ROUTES.PAYMENT, { 
        state: { 
          tableNumber, 
          specialInstructions,
          guestDetails: !user ? {
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
          } : null
        } 
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-ping opacity-20"></div>
          </div>
          <p className="text-white text-lg font-medium">Loading your order...</p>
        </div>
      </div>
    );
  }

  // Show error if no restaurant
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Restaurant Not Found</h2>
          <p className="text-gray-400">Please scan a valid QR code to continue.</p>
        </div>
      </div>
    );
  }

  const selectedTableDetails = getSelectedTableDetails();

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="w-full px-6 py-8 relative flex justify-center">
          <button
            onClick={handleGoBack}
            className="absolute left-4 top-8 text-orange-500 hover:text-orange-400 transition-colors duration-200 p-2 rounded-full hover:bg-orange-500/10"
            aria-label="Go back"
          >
            <ChevronLeft size={30} />
          </button>
          <div className="text-center">
            <h1 className="text-white text-3xl font-bold mb-2">Confirm Order</h1>
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <CheckCircle size={16} />
              <span className="text-sm">Review & Proceed</span>
            </div>
          </div>
        </div>

        {/* Enhanced Main Content */}
        <div className="bg-gradient-to-br from-gray-50 to-white w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan overflow-y-auto shadow-2xl">
          <div className={`transition-all duration-700 ${animateItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Enhanced Header with Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">1</span>
                  </div>
                  <div className="w-12 h-1 bg-orange-500 rounded"></div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div className="w-12 h-1 bg-gray-300 rounded"></div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">3</span>
                  </div>
                </div>
              </div>
              <h2 className="justify-center text-center text-gray-800 text-3xl font-bold mb-2">
                Order Summary
              </h2>
              <p className="text-center text-gray-600 text-sm">Review your order before proceeding to payment</p>
            </div>

            {/* Table Selector */}
            <TableSelector
              availableTables={availableTables}
              tableNumber={tableNumber}
              setTableNumber={setTableNumber}
              showTableDropdown={showTableDropdown}
              setShowTableDropdown={setShowTableDropdown}
              dropdownRef={dropdownRef}
              isLoadingTables={isLoadingTables}
              selectedTableDetails={selectedTableDetails}
            />

            {/* Guest Information Form */}
            {!user && (
              <GuestForm
                guestName={guestName}
                setGuestName={setGuestName}
                guestEmail={guestEmail}
                setGuestEmail={setGuestEmail}
                guestPhone={guestPhone}
                setGuestPhone={setGuestPhone}
                isCheckingEmail={isCheckingEmail}
                emailExists={emailExists}
                handleEmailChange={handleEmailChange}
                guestEmailInputRef={guestEmailInputRef}
              />
            )}

            {/* Enhanced Special Instructions */}
            <div className="mb-8">
              <label className="block text-gray-800 mb-3 text-lg font-semibold" htmlFor="specialInstructions">
                Special Instructions (optional)
              </label>
              <textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="E.g. No onions, extra spicy, etc."
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                rows={3}
              />
            </div>
            
            {/* Animated error message */}
            <AnimatedError error={formError} />

            {/* Enhanced Empty Cart Message */}
            {cartItems.length === 0 && (
              <div className="my-4 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-yellow-800 mb-1">Your cart is empty</p>
                  <p className="text-sm text-yellow-700">Please add items to your cart before proceeding.</p>
                </div>
              </div>
            )}

            {/* Enhanced Cart Items */}
            <div className="border-t-2 border-gray-200 pt-6">
              {cartItems.map((item, index) => {
                const isWater = item.name && 
                  (item.name.toLowerCase().includes('water') || 
                   item.category?.toLowerCase() === 'water');
                const hasDiscount = item.discounttype && item.discountvalue;
                const originalPrice = Number(item.price).toFixed(2);
                const discountedPrice = item.effectivePrice !== undefined ? Number(item.effectivePrice).toFixed(2) : Number(calculateEffectivePrice(item)).toFixed(2);
                const originalTotal = (item.price * item.quantity).toFixed(2);
                const discountedTotal = (Number(discountedPrice) * item.quantity).toFixed(2);
                return (
                  <div 
                    key={`${item.id}-${item.category}-${index}`}
                    className={`mb-6 p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 ${animateItems ? 'animate-in slide-in-from-left-2' : ''}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start">
                      <div className="w-24 h-24 overflow-hidden rounded-2xl mr-4 shadow-md">
                        <img 
                          src={item.image || PLACEHOLDER_IMG} 
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" 
                          onError={(e) => {
                            if (e.target.src !== PLACEHOLDER_IMG) {
                              e.target.src = PLACEHOLDER_IMG;
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-800 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                          <Clock size={14} />
                          {item.addedAt ? formatDate(item.addedAt) : 'Now'}
                        </p>
                        {hasDiscount && (
                          <div className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded-full inline-block mb-2">
                            {item.discounttype === 'Percentage' && `${item.discountvalue}% off`}
                            {item.discounttype === 'Fixed' && `₹${item.discountvalue*item.quantity} off`}
                          </div>
                        )}
                        {isWater && (
                          <p className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded-full inline-block mb-2">
                            GST exempt
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-3">
                          <div className="flex items-center bg-gray-100 rounded-full p-1">
                            <button 
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(item.id, item.category, item.quantity - 1);
                                }
                              }}
                              className={`w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 hover:bg-gray-50 active:scale-95 ${
                                item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                              }`}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={16} className={`transition-colors duration-200 ${
                                item.quantity <= 1 ? 'text-gray-400' : 'text-gray-600'
                              }`} />
                            </button>
                            <span className="mx-4 font-semibold text-gray-800 transition-all duration-200 transform scale-100 hover:scale-110">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.category, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:scale-95"
                              aria-label="Increase quantity"
                            >
                              <Plus size={16} className="text-gray-600 transition-colors duration-200" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {hasDiscount ? (
                          <>
                            <p className="text-gray-400 text-sm line-through">₹{originalTotal}</p>
                            <p className="font-bold text-xl text-gray-800 transition-all duration-200 transform scale-100 hover:scale-105">₹{discountedTotal}</p>
                          </>
                        ) : (
                          <p className="font-bold text-xl text-gray-800 transition-all duration-200 transform scale-100 hover:scale-105">₹{originalTotal}</p>
                        )}
                        <button 
                          onClick={() => removeItem(item.id, item.category)}
                          className="mt-3 p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                          aria-label="Remove item"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Price Breakdown */}
            <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100 space-y-3">
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
          <div className="pb-32"></div>
        </div>

        {/* Floating Payment Button */}
        <div className="fixed bottom-0 left-0 right-0 px-6 py-4 z-50">
          <div className="max-w-[390px] md:max-w-4xl lg:max-w-6xl mx-auto">
            <button 
              onClick={handlePlaceOrder}
              disabled={
                cartItems.length === 0 ||
                isCheckingEmail ||
                (!user && emailExists) ||
                isPlacingOrder
              }
              className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                cartItems.length === 0 || isCheckingEmail || (!user && emailExists) || isPlacingOrder
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-600 text-white hover:bg-gray-700 shadow-lg hover:shadow-xl'
              }`}
              aria-busy={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4m0 12v4m8-8h-4M4 12H2" className="opacity-75" />
                  </svg>
                  Processing...
                </span>
              ) : cartItems.length === 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Cart is Empty
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  Proceed to Payment
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Login Toast Notification */}
        <EmailExistsPopup
          show={showLoginToast}
          email={guestEmail}
          onClose={() => setShowLoginToast(false)}
          onAccept={() => {
            setShowLoginToast(false);
            navigate(ROUTES.LOGIN, {
              state: {
                email: guestEmail,
                returnTo: ROUTES.ORDER_CONFIRMATION
              }
            });
          }}
          onReject={() => {
            setShowLoginToast(false);
            setEmailExists(false);
          }}
        />
      </div>
    </div>
  );
};

export default OrderConfirmation;