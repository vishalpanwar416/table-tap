import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminNotifications } from '../../../context/AdminNotificationContext';

import StatusDashboard from './StatusDashboard';
import FilterAndSearch from './FilterAndSearch';
import OrdersView from './OrderViews';
import OrderActions from './OrderActions';

const OrderManagementMain = ({ orders: initialOrders, updateOrderStatus }) => {
  const { createNotification } = useAdminNotifications();
  
  // State management
  const [viewType, setViewType] = useState('tiles');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, order: null });
  const [dropdownOpenOrderId, setDropdownOpenOrderId] = useState(null);
  
  // Handle order status updates with confirmation
  const handleStatusUpdate = async (orderId, userId, newStatus) => {
    setIsLoading(true);
    // Close the modal immediately
    setConfirmModal({ show: false, type: null, order: null });
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // Create appropriate notification
      const notificationMessages = {
        preparing: 'Order is being prepared',
        ready: 'Order is ready for serving',
        rejected: 'Order was rejected',
        completed: 'Order has been completed'
      };
      
      await createNotification({
        orderId,
        type: `order_${newStatus}`,
        userId,
        message: `Order #${orderId.slice(0,8)} ${notificationMessages[newStatus] || `status updated to ${newStatus}`}`
      });
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open confirmation modal
  const openConfirmModal = (order, type) => {
    setConfirmModal({ show: true, type, order });
  };
  
  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };
  
  // Get counts by status for dashboard
  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      rejected: 0
    };
    
    initialOrders.forEach(order => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });
    
    return counts;
  };
  
  // Filter orders
  const filteredOrders = initialOrders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (order.id && order.id.toLowerCase().includes(searchLower)) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(searchLower)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchLower)) ||
        (order.table_number && order.table_number.toString().includes(searchLower)) ||
        (order.items && order.items.some(item => item.name && item.name.toLowerCase().includes(searchLower)))
      );
    }
    
    return true;
  });
  
  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'created_at') {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    if (sortBy === 'total') {
      const totalA = a.total || 0;
      const totalB = b.total || 0;
      return sortDirection === 'asc' ? totalA - totalB : totalB - totalA;
    }
    
    return 0;
  });
  
  const statusCounts = getStatusCounts();
  
  // Handle dropdown closing when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      // Close dropdown if click is outside any dropdown
      if (!e.target.closest('.relative')) {
        setDropdownOpenOrderId(null);
      }
    };
    if (dropdownOpenOrderId !== null) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [dropdownOpenOrderId]);
  
  return (
    <div className="bg-white rounded-xl shadow">
      {/* Status Dashboard */}
      <StatusDashboard 
        statusCounts={statusCounts} 
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter} 
      />
      
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            Order Management 
            {isLoading && (
              <RefreshCw size={18} className="ml-2 text-orange-500 animate-spin" />
            )}
          </h2>
          
          {/* Search and Filters */}
          <FilterAndSearch 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            viewType={viewType}
            setViewType={setViewType}
          />
        </div>
      </div>
      
      {/* Content area */}
      <OrdersView 
        sortedOrders={sortedOrders}
        viewType={viewType}
        expandedOrderId={expandedOrderId}
        toggleOrderExpansion={toggleOrderExpansion}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dropdownOpenOrderId={dropdownOpenOrderId}
        setDropdownOpenOrderId={setDropdownOpenOrderId}
        openConfirmModal={openConfirmModal}
        isLoading={isLoading}
      />
      
      {/* Confirmation Modal */}
      <OrderActions 
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        handleStatusUpdate={handleStatusUpdate}
        isLoading={isLoading}
      />
    </div>
  );
};

export default OrderManagementMain;