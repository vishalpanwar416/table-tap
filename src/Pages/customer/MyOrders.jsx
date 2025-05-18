import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import OrderCard from '../../components/customer/OrderCard';

const statusComponents = {
  pending: {
    icon: (
      <div className="w-24 h-24 rounded-full bg-yellow-50 flex items-center justify-center">
        <svg className="w-12 h-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
    ),
    message: 'No orders waiting for acceptance',
    description: 'Your orders will appear here once you place them'
  },
  preparing: {
    icon: (
      <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center">
        <svg className="w-12 h-12 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v4M12 22v-4M4 12H2M6.314 6.314L4.9 4.9M17.686 6.314L19.1 4.9M6.314 17.69L4.9 19.1M17.686 17.69L19.1 19.1M20 12h2M12 6a6 6 0 0 1 6 6 6 6 0 0 1-6 6 6 6 0 0 1-6-6 6 6 0 0 1 6-6z"/>
        </svg>
      </div>
    ),
    message: 'No orders in preparation',
    description: 'Orders being prepared will appear here'
  },
  completed: {
    icon: (
      <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
        <svg className="w-12 h-12 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
    ),
    message: 'No completed orders yet',
    description: 'Your order history will be displayed here'
  }
};

const MyOrders = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();
  const { userOrders, fetchUserOrders, loading, error } = useOrders();
  
  useEffect(() => {
    const fetchData = async () => {
      await fetchUserOrders();
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchUserOrders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-black to-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
          <p className="text-white mt-4 text-lg">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-black to-gray-900">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-600 text-xl font-semibold mb-2">Error Loading Orders</h3>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => fetchUserOrders()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const filteredOrders = userOrders.filter(order => {
    switch(activeTab) {
      case 'pending': return order.status === 'pending';
      case 'preparing': return order.status === 'preparing';
      case 'completed': return ['completed', 'rejected','ready'].includes(order.status);
      default: return false;
    }
  });

  const EmptyState = ({ tab }) => {
    const { icon, message, description } = statusComponents[tab];
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {icon}
        <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-800 mt-6 mb-2">
          {message}
        </h2>
        <p className="text-gray-500 text-center max-w-xs">
          {description}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-6">
          <button 
            className="absolute left-0 text-orange-500 hover:text-orange-600 transition-colors"
            onClick={() => navigate('/home')}
          >
            <ArrowLeft size={28} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              My Orders
            </h1>
            <p className="text-gray-400 text-sm mt-1">Track and manage your food orders</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex justify-center py-4 px-4 border-b border-gray-100">
            <div className="inline-flex gap-2 overflow-x-auto scrollbar-hide bg-gray-50 rounded-full p-1">
              <button 
                className={`px-5 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
                  activeTab === 'pending' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-100'
                }`}
                onClick={() => handleTabChange('pending')}
              >
                Waiting Acceptance
              </button>
              <button 
                className={`px-5 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
                  activeTab === 'preparing' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-100'
                }`}
                onClick={() => handleTabChange('preparing')}
              >
                In Preparation
              </button>
              <button 
                className={`px-5 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
                  activeTab === 'completed' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-100'
                }`}
                onClick={() => handleTabChange('completed')}
              >
                Order History
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="p-4 md:p-6 bg-gray-50 min-h-[60vh]">
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <OrderCard 
                    key={order.id}
                    order={order}
                    onClick={() => navigate(`/order-tracking/${order.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState tab={activeTab} />
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="mt-8 bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center mb-4">
            <ShoppingBag size={24} className="text-orange-500 mr-3" />
            <h2 className="text-xl font-semibold">Order Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">
                {userOrders.filter(order => order.status === 'pending').length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 mb-1">Preparing</p>
              <p className="text-2xl font-bold text-purple-500">
                {userOrders.filter(order => order.status === 'preparing').length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-500">
                {userOrders.filter(order => ['completed', 'rejected'].includes(order.status)).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;