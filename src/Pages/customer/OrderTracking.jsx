import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderDetails, currentOrder, loading, error } = useOrders();
  const [statusPercentage, setStatusPercentage] = useState(0);

  useEffect(() => {
    if (id) {
      getOrderDetails(id);
    }
  }, [id, getOrderDetails]);

  useEffect(() => {
    if (currentOrder) {
      // Update progress bar based on status
      switch (currentOrder.status) {
        case 'pending':
          setStatusPercentage(25);
          break;
        case 'accepted':
          setStatusPercentage(50);
          break;
        case 'preparing':
          setStatusPercentage(75);
          break;
        case 'completed':
          setStatusPercentage(100);
          break;
        case 'rejected':
          setStatusPercentage(0);
          break;
        default:
          setStatusPercentage(0);
      }
    }
  }, [currentOrder]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'accepted':
        return <Truck className="w-6 h-6 text-blue-500" />;
      case 'preparing':
        return <Truck className="w-6 h-6 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const statusMessages = {
    pending: "Your order is waiting to be accepted by the restaurant.",
    accepted: "Good news! Your order has been accepted.",
    preparing: "Your food is being prepared right now.",
    completed: "Your order is ready! Please collect from the restaurant.",
    rejected: "We're sorry, your order couldn't be fulfilled at this time."
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-300 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/my-orders')}
          className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
        >
          Go back to orders
        </button>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <p className="text-gray-300 mb-6">We couldn't find the order you're looking for.</p>
        <button 
          onClick={() => navigate('/my-orders')}
          className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
        >
          Go back to orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="p-6 flex items-center justify-center relative">
        <button 
          onClick={() => navigate('/my-orders')}
          className="absolute left-4 text-orange-500"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Order Tracking</h1>
      </div>

      {/* Main content */}
      <div className="bg-white text-black rounded-t-3xl p-6 flex-1 min-h-[calc(100vh-100px)]">
        {/* Order info */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Order #{currentOrder.id.slice(0, 8)}</h2>
              <p className="text-gray-600 text-sm">
                Placed on {formatDate(currentOrder.created_at)}
              </p>
            </div>
            <div className="flex items-center">
              {getStatusIcon(currentOrder.status)}
              <span className="ml-2 capitalize font-medium">
                {currentOrder.status}
              </span>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="mb-8">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-orange-200 text-orange-600">
                  Order Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-orange-600">
                  {statusPercentage}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-200">
              <div 
                style={{ width: `${statusPercentage}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500 transition-all duration-500"
              ></div>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-3">
            {statusMessages[currentOrder.status] || "Tracking your order..."}
          </p>
        </div>

        {/* Order details */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-4 text-lg">Order Details</h3>
          
          {/* Items */}
          <div className="divide-y divide-gray-200">
            {currentOrder.items && currentOrder.items.map((item, index) => (
              <div key={index} className="py-3 flex justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          
          {/* Pricing */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{(currentOrder.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">GST (5%)</span>
              <span>₹{(currentOrder.gst || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>₹{(currentOrder.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery/Table info */}
        {currentOrder.tableNumber && (
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-2">Table Information</h3>
            <p>Table Number: {currentOrder.tableNumber}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => navigate('/my-orders')}
            className="bg-gray-200 text-black font-bold py-3 px-8 rounded-full hover:bg-gray-300 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;