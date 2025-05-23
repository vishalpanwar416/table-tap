import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, ChefHat, Calendar, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

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

const OrderCard = ({ order, onClick }) => {
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
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border mx-auto max-w-full ${expanded ? 'border-orange-200' : 'border-gray-100'}`}
    >
      <div className={`p-4 ${expanded ? 'pb-3' : ''}`}>
        {/* Order Header - Always visible */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center">
              <span className="mr-1">Order</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
                #{order.order_number || (order.id && order.id.slice(0, 8))}
              </span>
            </h3>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Calendar size={12} className="mr-1" />
              <span>{formatDate(order.created_at || new Date())}</span>
            </div>
          </div>
          
          <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
            <div className="mr-1.5">
              {statusIcons[order.status]}
            </div>
            {statusLabels[order.status]}
          </div>
        </div>
        
        {/* Compact Item Summary - Always visible */}
        <div className="flex items-center justify-between py-2 border-t border-b border-gray-100">
          <div className="flex items-center py-1">
            <div className="bg-gray-50 rounded-full px-2 py-1 text-xs font-medium text-gray-600">
              {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
            </div>
          </div>
          
          <div className="flex items-center font-medium text-gray-900">
            <span>₹{order.total?.toFixed(2) || '0.00'}</span>
          </div>
          
          <button 
            onClick={handleViewDetails}
            className={`flex items-center text-sm font-medium rounded-lg px-2 py-1 ${expanded ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'} transition-colors`}
          >
            {expanded ? 'Hide' : 'View'} 
            {expanded ? <ChevronUp size={14} className="ml-0.5" /> : <ChevronDown size={14} className="ml-0.5" />}
          </button>
        </div>
        
        {/* Expanded Content */}
        {expanded && (
          <div className="mt-3 pt-1 overflow-hidden transition-all duration-300 ease-in-out">
            {/* Order Items */}
            <div className="mb-3">
              <h4 className="text-xs uppercase font-medium text-gray-500 mb-2 tracking-wider">Order Items</h4>
              <div className="space-y-2">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex items-center rounded-lg px-3 py-2 border border-gray-100 hover:bg-gray-50 transition-colors">
                    {item.image && (
                      <div className="w-10 h-10 rounded-md overflow-hidden mr-3 flex-shrink-0 border border-gray-200">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'; // Hide image on error
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
                          x{item.quantity}
                        </span>
                      )}
                      {item.variant && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Additional Order Details */}
            <div className="mt-2 space-y-2">
              {order.tableNumber && (
                <div className="bg-blue-50 text-blue-700 rounded-lg p-2 text-sm flex items-center justify-center">
                  <span className="font-medium">Table {order.tableNumber}</span>
                </div>
              )}
              
              {order.specialInstructions && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200">
                  <span className="font-medium text-xs uppercase text-gray-500 block mb-1">Special Instructions</span>
                  <p className="text-gray-700">{order.specialInstructions}</p>
                </div>
              )}
              
              {/* Payment details */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="font-medium text-xs uppercase text-gray-500 block mb-1">Payment Summary</span>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {order.discount !== undefined && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-gray-900">-₹{order.discount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {order.deliveryFee && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-900">₹{order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">₹{order.gst?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
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