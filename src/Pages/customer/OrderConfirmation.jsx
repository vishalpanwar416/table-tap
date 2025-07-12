import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Trash2, Minus, Plus, ChevronDown } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useRestaurant } from '../Restaurantselection/RestaurantContext';
import { getStoredRestaurantSelection } from '../../utils/restaurantCheck';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { cartItems, removeItem, updateQuantity, calculateEffectivePrice } = useCart();
  const { restaurant } = useRestaurant();
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  
  // --- NEW: State for user and guest details ---
  const [user, setUser] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW: Parse tables from restaurant data ---
  const [availableTables, setAvailableTables] = useState([]);
  
  // --- FIXED: Ref for dropdown click outside handling ---
  const dropdownRef = useRef(null);

  // --- FIXED: Check for authenticated user on component load with error handling ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
        }
        
        setUser(data?.user || null);
      } catch (error) {
        console.error('Error in fetchUser:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  // --- FIXED: Parse tables from restaurant data with better error handling ---
  useEffect(() => {
    if (restaurant?.tables) {
      try {
        const parsedTables = typeof restaurant.tables === 'string' 
          ? JSON.parse(restaurant.tables) 
          : restaurant.tables;
        setAvailableTables(Array.isArray(parsedTables) ? parsedTables : []);
      } catch (error) {
        console.error('Error parsing tables:', error);
        setAvailableTables([]);
      }
    } else {
      setAvailableTables([]);
    }
  }, [restaurant]);

  // --- FIXED: Auto-select table number from local storage ---
  useEffect(() => {
    const storedSelection = getStoredRestaurantSelection();
    if (storedSelection?.tableNumber && availableTables.length > 0) {
      // Check if the stored table number exists in available tables
      const matchingTable = availableTables.find(table => 
        table.tableNumber === storedSelection.tableNumber
      );
      
      if (matchingTable) {
        setTableNumber(storedSelection.tableNumber);
      }
    }
  }, [availableTables]);

  // --- FIXED: Handle click outside dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTableDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- FIXED: Handle table selection ---
  const handleTableSelect = (table) => {
    setTableNumber(table.tableNumber);
    setShowTableDropdown(false);
  };

  // --- FIXED: Get selected table details with null check ---
  const getSelectedTableDetails = () => {
    return availableTables.find(table => table.tableNumber === tableNumber) || null;
  };

  // --- FIXED: Moved to useCallback to prevent stale calculations ---
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

  // --- FIXED: handlePlaceOrder with better validation ---
  const handlePlaceOrder = () => {
    setFormError(''); // Clear previous errors
    
    // --- FIXED: Check if cart is empty ---
    if (cartItems.length === 0) {
      setFormError('Your cart is empty. Please add items before proceeding.');
      return;
    }
    
    if (!tableNumber) {
      setFormError('Please select your table number.');
      return;
    }

    // If user is a guest, validate guest fields
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

    // Navigate with all required state
    navigate('/payment', { 
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
  };

  // --- FIXED: Show loading state ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // --- FIXED: Show error if no restaurant ---
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Restaurant not found</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        <div className="w-full px-6 py-8 relative flex justify-center">
          <button
            onClick={handleGoBack}
            className="absolute left-4 top-8 text-orange-500"
          >
            <ChevronLeft size={30} />
          </button>
          <h1 className="text-gray-100 text-3xl font-medium font-spartan">Confirm Order</h1>
        </div>

        <div className="bg-gray-200 w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan overflow-y-auto">
          <h2 className="justify-center text-center text-black text-3xl font-semibold mb-8">Order Summary</h2>

          {/* --- FIXED: Table selection dropdown with click outside handling --- */}
          <div className="mb-8">
            <label className="block text-black mb-2 text-lg" htmlFor="tableNumber">
              Table Number
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowTableDropdown(!showTableDropdown)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-left flex justify-between items-center"
              >
                <span className={tableNumber ? 'text-black' : 'text-gray-500'}>
                  {tableNumber ? `Table ${tableNumber}` : 'Select your table number'}
                </span>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform ${showTableDropdown ? 'rotate-180' : ''}`}
                />
              </button>
              
              {showTableDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => handleTableSelect(table)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0 flex justify-between items-center ${
                          table.tableNumber === tableNumber ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div>
                          <span className="font-medium">Table {table.tableNumber}</span>
                          {table.location && (
                            <span className="text-sm text-gray-500 ml-2">({table.location})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {table.capacity} seats
                          </span>
                          {table.tableNumber === tableNumber && (
                            <span className="text-blue-600 text-sm font-medium">✓ Selected</span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No tables available
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Show selected table details */}
            {tableNumber && getSelectedTableDetails() && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">Table {tableNumber}</div>
                  {getSelectedTableDetails()?.location && (
                    <div>Location: {getSelectedTableDetails().location}</div>
                  )}
                  <div>Capacity: {getSelectedTableDetails()?.capacity} people</div>
                </div>
              </div>
            )}

            {/* Show message if table was auto-selected from local storage */}
            {tableNumber && (() => {
              const storedSelection = getStoredRestaurantSelection();
              return storedSelection?.tableNumber === tableNumber;
            })() && (
              <div className="mt-3 flex items-center gap-3 bg-gradient-to-r from-green-100 to-green-50 border border-green-200 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-200">
                  <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-green-800 font-semibold text-sm">Auto-selected from your QR code</div>
                  <div className="text-green-700 text-xs">We detected your table from the QR code you scanned for a seamless experience.</div>
                </div>
              </div>
            )}
          </div>

          {/* --- FIXED: Guest information form with better validation --- */}
          {!user && (
            <div className="mb-8 p-4 border rounded-lg bg-white">
                <h3 className="font-bold text-lg mb-4">Guest Information</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="guestName">Full Name *</label>
                        <input 
                          id="guestName" 
                          type="text" 
                          value={guestName} 
                          onChange={(e) => setGuestName(e.target.value)} 
                          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl" 
                          required 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium" htmlFor="guestEmail">Email Address *</label>
                        <input 
                          id="guestEmail" 
                          type="email" 
                          value={guestEmail} 
                          onChange={(e) => setGuestEmail(e.target.value)} 
                          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl" 
                          required 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium" htmlFor="guestPhone">Phone Number *</label>
                        <input 
                          id="guestPhone" 
                          type="tel" 
                          value={guestPhone} 
                          onChange={(e) => setGuestPhone(e.target.value)} 
                          maxLength={10} 
                          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl" 
                          required 
                        />
                    </div>
                </div>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-black mb-2 text-lg" htmlFor="specialInstructions">
              Special Instructions (optional)
            </label>
            <textarea
              id="specialInstructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="E.g. No onions, extra spicy, etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
            />
          </div>
          
          {/* Form Error Display */}
          {formError && (
              <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {formError}
              </div>
          )}

          {/* --- FIXED: Show message if cart is empty --- */}
          {cartItems.length === 0 && (
            <div className="my-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              <div className="text-center">
                <p className="font-medium">Your cart is empty</p>
                <p className="text-sm">Please add items to your cart before proceeding.</p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-300 pt-6">
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
                <div key={`${item.id}-${item.category}`} className="mb-4">
                  <div className="flex items-start mb-4">
                    <div className="w-20 h-20 overflow-hidden rounded-lg mr-4">
                      <img 
                        src={item.image || `/api/placeholder/80/80`} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.src = '/api/placeholder/80/80';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.addedAt ? formatDate(item.addedAt) : 'Now'}
                      </p>
                      
                      {hasDiscount && (
                        <div className="text-green-600 text-sm">
                          {item.discounttype === 'Percentage' && `${item.discountvalue}% off`}
                          {item.discounttype === 'Fixed' && `₹${item.discountvalue*item.quantity} off`}
                        </div>
                      )}
                      
                      {isWater && (
                        <p className="text-green-600 text-sm">GST exempt</p>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          <button 
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(item.id, item.category, item.quantity - 1);
                              }
                            }}
                            className="text-gray-700"
                          >
                            <div className="border border-gray-400 rounded-full w-6 h-6 flex items-center justify-center">
                              <Minus size={16} />
                            </div>
                          </button>
                          <span className="mx-3">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.category, item.quantity + 1)}
                            className="text-gray-700"
                          >
                            <div className="border border-gray-400 rounded-full w-6 h-6 flex items-center justify-center">
                              <Plus size={16} />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {hasDiscount ? (
                        <>
                          <p className="text-gray-600 text-sm line-through">₹{originalTotal}</p>
                          <p className="font-bold">₹{discountedTotal}</p>
                        </>
                      ) : (
                        <p className="font-bold">₹{originalTotal}</p>
                      )}
                      <button 
                        onClick={() => removeItem(item.id, item.category)}
                        className="text-red-500 mt-8"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {index < cartItems.length - 1 && (
                    <div className="border-t border-gray-200 my-4"></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Total</span>
              <span>₹{originalTotal.toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-600">Discount</span>
                <span className="text-green-600">- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotalAfterDiscount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">CGST (2.5%)</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">SGST (2.5%)</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
            
            <div className="border-t border-gray-300 my-4"></div>
            
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-auto pt-6 flex justify-center">
            <button 
              onClick={handlePlaceOrder}
              disabled={cartItems.length === 0}
              className={`w-full py-3 rounded-full mt-8 font-medium text-lg transition-colors ${
                cartItems.length === 0 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {cartItems.length === 0 ? 'Cart is Empty' : 'Proceed to Payment'}
            </button>
          </div>
          
          <div className="pb-20"></div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;