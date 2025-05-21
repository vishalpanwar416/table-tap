import React, { useState, useEffect } from 'react';
import { 
  Check, X, Truck, CheckCircle, ChevronDown, ChevronRight, User, 
  Clock, Calendar, MapPin, Phone, Filter, Search, AlertCircle,
  Printer, Download, RefreshCw, AlertTriangle, ShoppingBag, Info
} from 'lucide-react';
import { useAdminNotifications } from '../../context/AdminNotificationContext';
import { format, isToday, isYesterday } from 'date-fns';

const OrderManagement = ({ orders, updateOrderStatus, searchTerm: propSearchTerm }) => {
  const { createNotification } = useAdminNotifications();
  const [viewType, setViewType] = useState('tiles');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, order: null });
  const [dropdownOpenOrderId, setDropdownOpenOrderId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Use the prop if provided, otherwise fallback to local state (for safety)
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : '';
  
  // Handle order status updates with confirmation
  const handleStatusUpdate = async (orderId, userId, newStatus, cancelReason) => {
    setIsLoading(true);
    setConfirmModal({ show: false, type: null, order: null });
    try {
      await updateOrderStatus(orderId, newStatus, cancelReason);
      
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
      console.error(`Error updating order to ${newStatus}:`, error);
    } finally {
      setIsLoading(false);
      setRejectionReason('');
    }
  };
  
  // Open confirmation modal
  const openConfirmModal = (order, type) => {
    setConfirmModal({ show: true, type, order });
  };
  
  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      preparing: 'bg-purple-100 text-purple-800 border border-purple-200',
      ready: 'bg-green-100 text-green-800 border border-green-200',
      rejected: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-teal-100 text-teal-800 border border-teal-200',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status] || 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <Check className="h-5 w-5 text-teal-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };
  
  const toggleOrderExpansion = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };
  
  // Filter orders
  const filteredOrders = orders.filter(order => {
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
        (order.customer_phone && order.customer_phone.toLowerCase().includes(searchLower)) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchLower)) ||
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
  
  // Get next status options based on current status
  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      pending: ['preparing', 'rejected'],
      preparing: ['ready', 'rejected'],
      ready: ['completed'],
      // No further actions for rejected or completed
    };
    
    return statusFlow[currentStatus] || [];
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
    
    orders.forEach(order => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
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
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div 
            className={`p-3 rounded-lg bg-white shadow-sm border-l-4 border-yellow-400 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'pending' ? 'ring-2 ring-yellow-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.pending}</p>
              </div>
              <div className="p-2 rounded-full bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div 
            className={`p-3 rounded-lg bg-white shadow-sm border-l-4 border-purple-400 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'preparing' ? 'ring-2 ring-purple-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'preparing' ? 'all' : 'preparing')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Preparing</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.preparing}</p>
              </div>
              <div className="p-2 rounded-full bg-purple-100">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div 
            className={`p-3 rounded-lg bg-white shadow-sm border-l-4 border-green-400 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'ready' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Ready</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.ready}</p>
              </div>
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div 
            className={`p-3 rounded-lg bg-white shadow-sm border-l-4 border-teal-400 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'completed' ? 'ring-2 ring-teal-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Completed</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.completed}</p>
              </div>
              <div className="p-2 rounded-full bg-teal-100">
                <Check className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </div>
          
          <div 
            className={`p-3 rounded-lg bg-white shadow-sm border-l-4 border-red-400 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'rejected' ? 'ring-2 ring-red-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">rejected</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.rejected}</p>
              </div>
              <div className="p-2 rounded-full bg-red-100">
                <X className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            Order Management 
            {isLoading && (
              <RefreshCw size={18} className="ml-2 text-orange-500 animate-spin" />
            )}
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto justify-center items-center">
            {/* View Switcher */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewType('tiles')}
                className={`px-3 py-1 rounded-lg border ${viewType === 'tiles' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200'} transition`}
              >
                Tiles
              </button>
              <button
                onClick={() => setViewType('table')}
                className={`px-3 py-1 rounded-lg border ${viewType === 'table' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200'} transition`}
              >
                Table
              </button>
            </div>
            {/* Refresh Button (replaces Search) */}
            <button
              onClick={() => {
                // Call your refresh logic here, e.g., refetch orders
                if (typeof window !== "undefined") window.location.reload(); // or use a prop/callback
              }}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </button>
            {/* Filters */}
            <div className="flex gap-2 justify-center items-center w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
              
              {/* Sort options */}
              <div className="relative flex justify-center w-full">
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => {
                    const [newSortBy, newSortDirection] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortDirection(newSortDirection);
                  }}
                  className="pr-8 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent mx-auto"
                  style={{ minWidth: 160, textAlign: 'center' }}
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="total-desc">Highest Amount</option>
                  <option value="total-asc">Lowest Amount</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="p-6">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Found</h3>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                onClick={() => {
                  setStatusFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : viewType === 'tiles' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedOrders.map((order) => (
              <div key={order.id} className="border rounded-lg hover:shadow-md transition-shadow">
                {/* Order header */}
                <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div>{getStatusBadge(order.status || 'pending')}</div>
                </div>
                
                {/* Order content */}
                <div className="p-4">
                  {/* Customer info */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center mr-2">
                          <img
                            src={
                              order.profile?.avatar_url ||
                              "data:image/svg+xml;utf8,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='40' height='40' rx='20' fill='%23f3f4f6'/><circle cx='20' cy='16' r='7' fill='%23f59e42'/><ellipse cx='20' cy='29' rx='11' ry='6' fill='%23f59e42' fill-opacity='0.5'/><circle cx='20' cy='16' r='4' fill='white'/></svg>"
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium">{order.customer_name || 'Guest'}</span>
                      </div>
                      
                      {(order.table_number || order.tableNumber) && (
                        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                          Table {order.table_number || order.tableNumber}
                        </div>
                      )}
                    </div>
                    
                    {order.customer_phone && (
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Phone size={14} className="mr-1" />
                        <span>{order.customer_phone}</span>
                      </div>
                    )}
                    
                    {order.customer_email && (
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M4 4h16v16H4V4zm0 0l8 8 8-8" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{order.customer_email}</span>
                      </div>
                    )}
                    
                    {order.address && (
                      <div className="flex items-start text-sm text-gray-500">
                        <MapPin size={14} className="mr-1 mt-1 flex-shrink-0" />
                        <span className="line-clamp-2">{order.address}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Order items preview */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-500 font-medium">
                        {(order.items || []).length} {(order.items || []).length === 1 ? 'ITEM' : 'ITEMS'}
                      </p>
                      <button 
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="text-xs text-orange-500 hover:text-orange-600 flex items-center"
                      >
                        {expandedOrderId === order.id ? (
                          <>Hide details <ChevronDown size={14} className="ml-1" /></>
                        ) : (
                          <>View details <ChevronRight size={14} className="ml-1" /></>
                        )}
                      </button>
                    </div>
                    
                    {/* Order items images */}
                    <div className="flex mb-3 space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                      {(order.items || []).slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                          <img 
                            src={item.image || `/api/placeholder/64/64`} 
                            alt={item.name || `Item ${idx+1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {(order.items || []).length > 4 && (
                        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 text-sm font-medium">
                          +{(order.items || []).length - 4}
                        </div>
                      )}
                    </div>
                    
                    {/* Expanded order items details */}
                    {expandedOrderId === order.id && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Order items</h4>
                        <div className="space-y-3">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center">
                              <div className="w-10 h-10 rounded overflow-hidden mr-3 border border-gray-200 bg-white">
                                <img 
                                  src={item.image || `/api/placeholder/40/40`} 
                                  alt={item.name || `Item ${idx+1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.name || `Item ${idx+1}`}</p>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>{item.quantity || 1} × ₹{item.price?.toFixed(2) || '0.00'}</span>
                                  <span>₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Price summary */}
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Subtotal</span>
                            <span>₹{(order.subtotal || order.total || 0).toFixed(2)}</span>
                          </div>
                          {order.deliveryFee > 0 && (
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Delivery</span>
                              <span>₹{order.deliveryFee?.toFixed(2) || '0.00'}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium text-sm mt-2">
                            <span>Total</span>
                            <span>₹{order.total?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                        
                        {order.notes && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm text-gray-700">
                            <div className="flex items-start">
                              <Info size={14} className="text-yellow-500 mr-1 mt-0.5" />
                              <div>
                                <span className="font-medium block text-xs mb-0.5">Notes:</span>
                                <p className="text-xs">{order.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-end space-x-2">
                          <button 
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center px-2 py-1 rounded hover:bg-gray-100"
                            title="Print Order"
                          >
                            <Printer size={14} className="mr-1" /> Print
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Total Amount</div>
                      <div className="font-semibold">₹{order.total?.toFixed(2) || '0.00'}</div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openConfirmModal(order, 'accept')}
                            className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                            title="Accept Order"
                            disabled={isLoading}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => openConfirmModal(order, 'rejected')}
                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title="Reject Order"
                            disabled={isLoading}
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => openConfirmModal(order, 'ready')}
                          className="px-4 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center transition-colors"
                          disabled={isLoading}
                        >
                          <CheckCircle size={16} className="mr-1" /> Mark Ready
                        </button>
                      )}
                      
                      {order.status === 'ready' && (
                        <button
                          onClick={() => openConfirmModal(order, 'complete')}
                          className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center transition-colors"
                          disabled={isLoading}
                        >
                          <Check size={16} className="mr-1" /> Complete
                        </button>
                      )}
                      
                      {/* Status update dropdown for additional options */}
                      {getNextStatusOptions(order.status).length > 0 && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setDropdownOpenOrderId(
                                dropdownOpenOrderId === order.id ? null : order.id
                              )
                            }
                            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            disabled={isLoading}
                            type="button"
                          >
                            <ChevronDown size={16} />
                          </button>
                          {dropdownOpenOrderId === order.id && (
                            <div className="absolute right-0 mt-1 z-50 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 min-w-48">
                              {getNextStatusOptions(order.status).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    openConfirmModal(order, status);
                                    setDropdownOpenOrderId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                                  type="button"
                                >
                                  {getStatusIcon(status)}
                                  <span className="ml-2">
                                    Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer_name || 'Guest'}
                        {(order.table_number || order.tableNumber) && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            Table {order.table_number || order.tableNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex space-x-1">
                            {(order.items || []).slice(0, 3).map((item, idx) => (
                              <div key={idx} className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                                <img 
                                  src={item.image || `/api/placeholder/32/32`}
                                  alt={item.name || `Item ${idx+1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {(order.items || []).length > 3 && (
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                +{(order.items || []).length - 3}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="ml-2 text-xs text-orange-500 hover:text-orange-600"
                          >
                            {expandedOrderId === order.id ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{order.total?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status || 'pending')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openConfirmModal(order, 'accept')}
                                className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                                title="Accept Order"
                                disabled={isLoading}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => openConfirmModal(order, 'rejected')}
                                className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                                title="Reject Order"
                                disabled={isLoading}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => openConfirmModal(order, 'ready')}
                              className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                              title="Mark as Ready"
                              disabled={isLoading}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => openConfirmModal(order, 'complete')}
                              className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                              title="Complete"
                              disabled={isLoading}
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {/* Dropdown for additional status options */}
                          {getNextStatusOptions(order.status).length > 0 && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setDropdownOpenOrderId(
                                    dropdownOpenOrderId === order.id ? null : order.id
                                  )
                                }
                                className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                disabled={isLoading}
                              >
                                <ChevronDown size={16} />
                              </button>
                              {dropdownOpenOrderId === order.id && (
                                <div className="absolute right-0 mt-1 z-50 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 min-w-48">
                                  {getNextStatusOptions(order.status).map((status) => (
                                    <button
                                      key={status}
                                      onClick={() => {
                                        openConfirmModal(order, status);
                                        setDropdownOpenOrderId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                                    >
                                      {getStatusIcon(status)}
                                      <span className="ml-2">
                                        Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row */}
                    {expandedOrderId === order.id && (
                      <tr>
                        <td colSpan="7" className="px-6 py-3 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Order details */}
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Order Details</h4>
                              {order.address && (
                                <div className="flex items-start mb-2">
                                  <MapPin size={14} className="text-gray-400 mr-2 mt-0.5" />
                                  <span className="text-sm text-gray-600">{order.address}</span>
                                </div>
                              )}
                              {order.notes && (
                                <div className="mb-2 text-sm text-gray-600">
                                  <span className="font-medium">Notes: </span>{order.notes}
                                </div>
                              )}
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Payment: </span>
                                {order.payment_method === 'razorpay' && order.payment_status === 'completed' ? (
                                  <span className="text-green-600">Paid Online</span>
                                ) : order.payment_method === 'cod' ? (
                                  <span className="text-yellow-600">Cash on Delivery</span>
                                ) : order.payment_status === 'pending' ? (
                                  <span className="text-orange-600">Pending Payment</span>
                                ) : order.payment_status === 'failed' ? (
                                  <span className="text-red-600">Payment Failed</span>
                                ) : (
                                  <span className="text-gray-600 capitalize">{order.payment_method || 'Unknown'}</span>
                                )}
                              </div>
                            </div>
                            {/* Order items */}
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Order Items</h4>
                              <div className="space-y-2">
                                {(order.items || []).map((item, idx) => (
                                  <div key={idx} className="flex items-center text-sm">
                                    <div className="w-8 h-8 rounded overflow-hidden mr-2 border border-gray-200">
                                      <img 
                                        src={item.image || `/api/placeholder/32/32`} 
                                        alt={item.name || `Item ${idx+1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{item.name || `Item ${idx+1}`}</p>
                                    </div>
                                    <div className="text-gray-500 ml-2">
                                      {item.quantity || 1} × ₹{item.price?.toFixed(2) || '0.00'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Confirm {confirmModal.type === 'accept' ? 'Accept' : confirmModal.type === 'rejected' ? 'Reject' : confirmModal.type === 'ready' ? 'Mark Ready' : 'Complete'} Order
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {confirmModal.type === 'accept' ? 'accept' : confirmModal.type === 'rejected' ? 'reject' : confirmModal.type === 'ready' ? 'mark as ready' : 'complete'} order <span className="font-semibold">#{confirmModal.order.id.slice(0,8)}</span>?
            </p>
            {confirmModal.type === 'rejected' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border border-gray-300 rounded p-2"
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  required
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, type: null, order: null });
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const normalizedType = confirmModal.type?.toLowerCase();
                  const statusMap = {
                    accept: 'preparing',
                    rejected: 'rejected',
                    ready: 'ready',
                    complete: 'completed'
                  };
                  handleStatusUpdate(
                    confirmModal.order.id,
                    confirmModal.order.userId,
                    statusMap[normalizedType],
                    normalizedType === 'rejected' ? rejectionReason : undefined
                  );
                }}
                className={`px-4 py-2 rounded text-white ${confirmModal.type === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                disabled={isLoading || (confirmModal.type === 'rejected' && !rejectionReason.trim())}
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;