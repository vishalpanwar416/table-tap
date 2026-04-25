import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, ChefHat, Calendar, ChevronDown, ChevronUp, DollarSign, IndianRupee, CreditCard, Wallet, Landmark } from 'lucide-react';

const statusIcons = {
  pending: <Clock className="w-4 h-4 text-yellow-500" />,
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />,
  accepted: <ChefHat className="w-4 h-4 text-blue-500" />,
  preparing: <ChefHat className="w-4 h-4 text-purple-500" />,
  ready: <CheckCircle className="w-4 h-4 text-green-500" />
};

const statusLabels = {
  pending: 'Pending',
  completed: 'Completed',
  rejected: 'Rejected',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  ready: 'bg-green-100 text-green-800 border-green-200'
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

const OrderCard = ({ order, onClick, restaurantName }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!order) return null;
  
  const handleCardClick = (e) => {
    // Toggle expanded state
    setExpanded(!expanded);
    
    // Also call the parent onClick if provided
    if (onClick) onClick(e);
  };
  
  const handleViewDetails = (e) => {
    e.stopPropagation(); // Prevent triggering the card click
    setExpanded(!expanded);
  };
  
  
  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border mx-auto max-w-full ${expanded ? 'border-orange-300' : 'border-gray-100'} cursor-pointer`}
      style={{ fontSize: '0.95rem' }}
    >
      <div className={`p-3 ${expanded ? 'pb-2' : ''}`}>
        {/* Order Header - Always visible */}
        <div className="flex justify-between items-center mb-1">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center text-sm">
              <span className="mr-1">Order</span>
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                #{order.order_number || (order.id && order.id.slice(0, 8))}
              </span>
            </h3>
            {restaurantName && (
              <div className="text-xs text-gray-500 mt-0.5 font-medium truncate max-w-[120px]">
                {restaurantName}
              </div>
            )}
            <div className="flex items-center text-xs text-gray-400 mt-0.5">
              <Calendar size={11} className="mr-1" />
              <span>{formatDate(order.created_at || new Date())}</span>
            </div>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
            <div className="mr-1">
              {statusIcons[order.status]}
            </div>
            {statusLabels[order.status]}
          </div>
        </div>
        
        {/* Compact Item Summary - Always visible */}
        <div className="flex items-center justify-between py-1 border-t border-b border-gray-100">
          <div className="flex items-center py-0.5">
            <div className="bg-gray-50 rounded-full px-2 py-0.5 text-xs font-medium text-gray-600">
              {(order.items || []).length} item{(order.items || []).length !== 1 && 's'}
            </div>
          </div>
          <div className="flex items-center font-semibold text-gray-900 text-sm">
            <span>₹{order.total?.toFixed(2) || '0.00'}</span>
          </div>
          <button 
            onClick={handleViewDetails}
            className={`flex items-center text-xs font-medium rounded px-2 py-0.5 ${expanded ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'} transition-colors`}
            tabIndex={0}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        
        {/* Expanded Content */}
        {expanded && (
          <div className="mt-2 pt-1 overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 rounded-lg">
            {/* Order Items */}
            <div className="mb-2">
              <h4 className="text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Order Items</h4>
              <div className="divide-y divide-gray-100">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex items-center px-2 py-2">
                    {item.image && (
                      <div className="w-8 h-8 rounded-md overflow-hidden mr-2 flex-shrink-0 border border-gray-200">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-800 truncate">{item.name}</span>
                      <span className="ml-2 text-[10px] bg-gray-100 px-1 py-0.5 rounded-full text-gray-600">
                        x{item.quantity}
                      </span>
                      {item.variant && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.variant}</p>
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-900">
                      ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Additional Order Details */}
            <div className="mt-1 space-y-2">
              {order.tableNumber && (
                <div className="bg-blue-50 text-blue-700 rounded-lg p-1.5 text-xs flex items-center justify-center">
                  <span className="font-medium">Table {order.tableNumber}</span>
                </div>
              )}
              
              {order.specialInstructions && (
                <div className="bg-gray-50 rounded-lg p-2 text-xs border border-gray-200">
                  <span className="font-medium text-[10px] uppercase text-gray-500 block mb-1">Special Instructions</span>
                  <p className="text-gray-700">{order.specialInstructions}</p>
                </div>
              )}
              
              {/* Payment details */}
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <span className="font-medium text-[10px] uppercase text-gray-500 block mb-1">Payment Summary</span>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {order.discount !== undefined && (
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-gray-900">-₹{order.discount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {order.deliveryFee && (
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-900">₹{order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">₹{order.gst?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-xs mb-1 items-center">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="flex items-center gap-1">
                    {order.payment_method === 'upi_at_restaurant' && (
                      <span className="inline-flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <Landmark size={13} className="mr-1" />
                        <span>UPI at Restaurant</span>
                      </span>
                    )}
                    {order.payment_method === 'razorpay' && (
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <CreditCard size={13} className="mr-1" />
                        <span>Online Payment</span>
                      </span>
                    )}
                    {order.payment_method === 'cash' && (
                      <span className="inline-flex items-center bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <Wallet size={13} className="mr-1" />
                        <span>Pay at Restaurant</span>
                      </span>
                    )}
                    {/* Fallback for unknown methods */}
                    {!['upi_at_restaurant', 'razorpay', 'cash'].includes(order.payment_method) && (
                      <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <CreditCard size={13} className="mr-1" />
                        <span>{order.payment_method?.toUpperCase() || 'UNKNOWN'}</span>
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-medium ${
                    order.payment_status === 'completed'
                      ? 'text-green-600'
                      : order.payment_status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-gray-900'
                  }`}>
                    {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'Unknown'}
                  </span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-gray-900">₹{order.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;