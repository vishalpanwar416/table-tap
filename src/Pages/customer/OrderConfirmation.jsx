import React, { useState, useEffect } from 'react'; // Added useEffect
import { ChevronLeft, Trash2, Minus, Plus, ChevronDown } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase'; // Import supabase to check for user
import { useRestaurant } from '../Restaurantselection/RestaurantContext'; // Import restaurant context
import { getStoredRestaurantSelection } from '../../utils/restaurantCheck'; // Import to get stored table number

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { cartItems, removeItem, updateQuantity, calculateEffectivePrice } = useCart();
  const { restaurant } = useRestaurant(); // Get restaurant data including tables
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  
  // --- NEW: State for user and guest details ---
  const [user, setUser] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [formError, setFormError] = useState('');

  // --- NEW: Parse tables from restaurant data ---
  const [availableTables, setAvailableTables] = useState([]);

  // --- NEW: Check for authenticated user on component load ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  // --- NEW: Parse tables from restaurant data ---
  useEffect(() => {
    if (restaurant?.tables) {
      try {
        const parsedTables = typeof restaurant.tables === 'string' 
          ? JSON.parse(restaurant.tables) 
          : restaurant.tables;
        setAvailableTables(Array.isArray(parsedTables) ? parsedTables : []);
      } catch (error) {
        console.error('Error parsing tables JSON:', error);
        setAvailableTables([]);
      }
    } else {
      setAvailableTables([]);
    }
  }, [restaurant]);

  // --- NEW: Auto-select table number from local storage ---
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

  // --- NEW: Handle table selection ---
  const handleTableSelect = (table) => {
    setTableNumber(table.tableNumber);
    setShowTableDropdown(false);
  };

  // --- NEW: Get selected table details ---
  const getSelectedTableDetails = () => {
    return availableTables.find(table => table.tableNumber === tableNumber);
  };

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

  // --- UPDATED: handlePlaceOrder with validation for guests ---
  const handlePlaceOrder = () => {
    setFormError(''); // Clear previous errors
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

          {/* --- UPDATED: Table selection dropdown with auto-selection --- */}
          <div className="mb-8">
            <label className="block text-black mb-2 text-lg" htmlFor="tableNumber">
              Table Number
            </label>
            <div className="relative">
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
                  {getSelectedTableDetails().location && (
                    <div>Location: {getSelectedTableDetails().location}</div>
                  )}
                  <div>Capacity: {getSelectedTableDetails().capacity} people</div>
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

          {/* --- NEW: Guest information form, only shown if user is not logged in --- */}
          {!user && (
            <div className="mb-8 p-4 border rounded-lg bg-white">
                <h3 className="font-bold text-lg mb-4">Guest Information</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="guestName">Full Name</label>
                        <input id="guestName" type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium" htmlFor="guestEmail">Email Address</label>
                        <input id="guestEmail" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium" htmlFor="guestPhone">Phone Number</label>
                        <input id="guestPhone" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} maxLength={10} className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl" required />
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
              className="bg-gray-600 text-white w-full py-3 rounded-full mt-8 font-medium text-lg hover:bg-gray-700 transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
          
          <div className="pb-20"></div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;