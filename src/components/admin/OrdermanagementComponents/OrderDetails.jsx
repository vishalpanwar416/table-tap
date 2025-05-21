// File: OrderDetails.jsx

import React from 'react';

const OrderDetails = ({ order }) => {
  if (!order) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-4 border border-gray-200">
      {/* Order Notes */}
      {order.notes && (
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Notes:</span> {order.notes}
        </div>
      )}

      {/* Payment Info */}
      <div className="text-sm text-gray-600">
        <span className="font-semibold">Payment:</span>{' '}
        {order.paymentStatus === 'paid' ? (
          <span className="text-green-600">Paid</span>
        ) : (
          <span className="text-yellow-600">Cash on Delivery</span>
        )}
      </div>

      {/* Order Items */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Order Items</h4>
        <div className="space-y-2">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="flex items-center text-sm">
              <div className="w-10 h-10 rounded overflow-hidden mr-2 border border-gray-200">
                <img
                  src={item.image || '/api/placeholder/40/40'}
                  alt={item.name || `Item ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name || `Item ${idx + 1}`}</p>
              </div>
              <div className="text-gray-500 ml-2">
                {item.quantity || 1} × ₹{item.price?.toFixed(2) || '0.00'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
