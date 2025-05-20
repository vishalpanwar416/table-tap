import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const OrderSummary = ({ items }) => {
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  return (
    <div className="mb-6">
      <h3 className="font-medium mb-3">Order Items</h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={`${item.id}-${item.category}`} className="flex justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <p>{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderSummary;