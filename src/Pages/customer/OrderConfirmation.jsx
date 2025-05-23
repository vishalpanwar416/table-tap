import React, { useState } from 'react';
import { ChevronLeft, Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { cartItems, removeItem, updateQuantity, calculateDiscountedPrice } = useCart();
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showTableNumberModal, setShowTableNumberModal] = useState(false);

  const calculatePriceDetails = () => {
    let originalTotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    
    cartItems.forEach(item => {
      // Calculate original price total
      const originalItemTotal = item.price * item.quantity;
      originalTotal += originalItemTotal;
      
      // Calculate discount amount
      const effectivePrice = item.effectivePrice !== undefined ? 
        item.effectivePrice : 
        calculateDiscountedPrice(item);
      
      const itemDiscount = (item.price - effectivePrice) * item.quantity;
      discountAmount += itemDiscount;
      
      // Calculate subtotal after discount for tax calculation
      const itemSubtotal = effectivePrice * item.quantity;
      
      // Check if the item is water (exempt from GST)
      const isWater = item.name && 
        (item.name.toLowerCase().includes('water') || 
         item.category?.toLowerCase() === 'water');
         
      if (!isWater) {
        taxableAmount += itemSubtotal;
      }
    });
    
    // Calculate taxes (split into CGST and SGST equally, each at 2.5%)
    const cgst = taxableAmount * 0.025; // 2.5% CGST
    const sgst = taxableAmount * 0.025; // 2.5% SGST
    
    // Subtotal is original total minus discount
    const subtotalAfterDiscount = originalTotal - discountAmount;
    
    // Final total is subtotal plus taxes
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

  const handlePlaceOrder = () => {
    if (!tableNumber) {
      setShowTableNumberModal(true);
      return;
    }
    navigate('/payment', { state: { tableNumber, specialInstructions } });
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
          <h1 className="text-gray-100 text-3xl font-medium font-spartan">Confirm Order</h1>
        </div>

        {/* Main content */}
        <div className="bg-gray-200 w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan">
          <h2 className="justify-center text-center text-black text-3xl font-semibold mb-8">Order Summary</h2>

          {/* Table Number Input */}
          <div className="mb-8">
            <label className="block text-black mb-2 text-lg" htmlFor="tableNumber">
              Table Number
            </label>
            <input
              id="tableNumber"
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter your table number"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Special Instructions Input */}
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

          {/* Order Summary */}
          <div className="border-t border-gray-300 pt-6">
            {cartItems.map((item, index) => {
              // Check if the item is water
              const isWater = item.name && 
                (item.name.toLowerCase().includes('water') || 
                 item.category?.toLowerCase() === 'water');
              
              // Check if the item has a discount
              const hasDiscount = item.discounttype && item.discountvalue;
              const originalPrice = Number(item.price).toFixed(2);
              
              // Use effectivePrice if it exists, otherwise calculate it
              const discountedPrice = item.effectivePrice !== undefined ? 
                Number(item.effectivePrice).toFixed(2) : 
                Number(calculateDiscountedPrice(item)).toFixed(2);
              
              // Calculate price total considering quantity
              const originalTotal = (item.price * item.quantity).toFixed(2);
              const discountedTotal = (Number(discountedPrice) * item.quantity).toFixed(2);
              
              return (
                <div key={`${item.id}-${item.category}`} className="mb-4">
                  <div className="flex items-start mb-4">
                    {/* Item image */}
                    <div className="w-20 h-20 overflow-hidden rounded-lg mr-4">
                      <img 
                        src={item.image || `/api/placeholder/80/80`} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    {/* Item details */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.addedAt ? formatDate(item.addedAt) : 'Now'}
                      </p>
                      
                      {/* Display discounts if available */}
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
                    
                    {/* Price */}
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

          {/* Price Summary */}
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

          {/* Place Order Button */}
          <div className="mt-auto pt-6 flex justify-center">
            <button 
              onClick={handlePlaceOrder}
              className="bg-gray-600 text-white w-full py-3 rounded-full mt-8 font-medium text-lg hover:bg-gray-700 transition-colors"
            >
              Place Order
            </button>
          </div>
          
          {/* Bottom Spacing */}
          <div className="pb-20"></div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;