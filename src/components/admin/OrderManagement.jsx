import React, { useState, useEffect } from 'react';
import { 
  Check, X, Truck, CheckCircle, ChevronDown, ChevronRight, User, 
  Clock, Calendar, MapPin, Phone, Filter, Search, AlertCircle,
  Printer, Download, RefreshCw, AlertTriangle, ShoppingBag, Info, Grid, List, Package
} from 'lucide-react';
import { useManagerNotifications } from '../../context/ManagerNotificationContext';
import { format, isToday, isYesterday } from 'date-fns';
import { useRestaurant } from '../../Pages/Restaurantselection/RestaurantContext';
import ReactDOMServer from "react-dom/server";
import PrintBill from "./PrintBill";
import PrintKOT from "./PrintKOT";
import * as XLSX from 'xlsx';
import {
  fetchAllOrders,
  subscribeToAllOrderChanges,
  unsubscribeFromOrderChanges, // <-- add this import
  updateOrderStatus as updateOrderStatusService,
  getOrdersByPeriod,
  formatOrdersForExcel,
  addTotalRow,
  getOrderSubtotal,
  getStatusCounts,
  STATUS_ORDER,
  handleOrderDownload,
  getNextStatusOptions,
  filterOrders,
  sortOrders,
} from '../../api/admin/orderService';

const STATUS_META = {
  pending: {
    label: "Pending",
    color: "yellow",
    icon: <Clock className="h-5 w-5 text-yellow-600" />,
    badge: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  preparing: {
    label: "Preparing",
    color: "purple",
    icon: <Truck className="h-5 w-5 text-purple-600" />,
    badge: "bg-purple-100 text-purple-800 border border-purple-200",
  },
  ready: {
    label: "Ready",
    color: "green",
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    badge: "bg-green-100 text-green-800 border border-green-200",
  },
  completed: {
    label: "Completed",
    color: "teal",
    icon: <Check className="h-5 w-5 text-teal-600" />,
    badge: "bg-teal-100 text-teal-800 border border-teal-200",
  },
  rejected: {
    label: "Rejected",
    color: "red",
    icon: <X className="h-5 w-5 text-red-600" />,
    badge: "bg-red-100 text-red-800 border border-red-200",
  },
};

const OrderManagement = ({ restaurantId, updateOrderStatus, searchTerm: propSearchTerm }) => {
  const { notifications, markAllAsRead } = useManagerNotifications();
  const { restaurant } = useRestaurant();
  const [viewType, setViewType] = useState('tiles');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, order: null });
  const [dropdownOpenOrderId, setDropdownOpenOrderId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  
  // Use the prop if provided, otherwise fallback to local state (for safety)
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : '';
  
  // Move fetchOrders outside useEffect so it can be reused
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const data = await fetchAllOrders(restaurantId);
      setOrders(data);
      setOrdersError('');
    } catch (error) {
      setOrdersError('Failed to load orders: ' + (error.message || error));
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  useEffect(() => {
    const channel = subscribeToAllOrderChanges(restaurantId, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      setOrders((prevOrders) => {
        if (eventType === 'INSERT') return [newRecord, ...prevOrders];
        if (eventType === 'UPDATE') return prevOrders.map(order => 
          order.id === newRecord.id ? newRecord : order
        );
        if (eventType === 'DELETE') return prevOrders.filter(order => order.id !== oldRecord.id);
        return prevOrders;
      });
    });

    return () => {
      unsubscribeFromOrderChanges(channel);
    };
  }, [restaurantId]);
  
  // Handle order status updates with confirmation
  const handleStatusUpdate = async (orderId, userId, newStatus, cancelReason) => {
    setIsLoading(true);
    setConfirmModal({ show: false, type: null, order: null });
    try {
      const updatedOrder = await updateOrderStatusService(orderId, newStatus, cancelReason);
      
      // Create appropriate notification
      const notificationMessages = {
        preparing: 'Order is being prepared',
        ready: 'Order is ready for serving',
        rejected: 'Order was rejected',
        completed: 'Order has been completed'
      };
      
      await notifications.createNotification({
        orderId,
        type: `order_${newStatus}`,
        userId,
        message: `Order #${orderId.slice(0,8)} ${notificationMessages[newStatus] || `status updated to ${newStatus}`}`
      });
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsLoading(false);
      setRejectionReason('');
    }
  };
  
  // Open confirmation modal
  const openConfirmModal = (order, type) => {
    setConfirmModal({ show: true, type, order });
  };
  
  // Helper: Render status dashboard card
  const StatusCard = ({ status }) => (
    <div
      className={`p-3 rounded-lg bg-white shadow-sm border-l-4 border-${STATUS_META[status].color}-400 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === status ? `ring-2 ring-${STATUS_META[status].color}-400` : ''}`}
      onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">{STATUS_META[status].label}</p>
          <p className="text-2xl font-bold text-gray-800">{statusCounts[status]}</p>
        </div>
        <div className={`flex flex-col items-end`}>
          <div className={`p-2 rounded-full bg-${STATUS_META[status].color}-100`}>
            {STATUS_META[status].icon}
          </div>
          {/* Download button for this status */}
          <button
            onClick={e => {
              e.stopPropagation();
              handleDownloadByStatus(status);
            }}
            className="mt-2 p-1 rounded bg-orange-100 hover:bg-orange-200"
            title={`Download ${STATUS_META[status].label} Orders`}
          >
            <Download className="w-4 h-4 text-orange-500" />
          </button>
        </div>
      </div>
    </div>
  );

  // Helper: Render status badge
  const getStatusBadge = (status) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_META[status]?.badge || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
      {STATUS_META[status]?.label || 'Unknown'}
    </span>
  );

  // Helper: Render action buttons for each order status
  const ActionButtons = ({ order }) => {
    if (order.status === 'pending') {
      return (
        <>
          <button onClick={() => openConfirmModal(order, 'accept')} className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200" title="Accept Order" disabled={isLoading}><Check size={16} /></button>
          <button onClick={() => openConfirmModal(order, 'rejected')} className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200" title="Reject Order" disabled={isLoading}><X size={16} /></button>
        </>
      );
    }
    if (order.status === 'preparing') {
      return (
        <>
          <button onClick={() => handlePrintKOT(order)} className="p-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200" title="Print KOT"><Printer size={16} /></button>
          <button onClick={() => openConfirmModal(order, 'ready')} className="px-4 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center transition-colors" disabled={isLoading} title="Mark as Ready"><CheckCircle size={16} className="mr-1" /> Ready</button>
        </>
      );
    }
    if (order.status === 'ready') {
      return (
        <button onClick={() => openConfirmModal(order, 'complete')} className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center transition-colors" disabled={isLoading} title="Complete"><Check size={16} className="mr-1" /> Complete</button>
      );
    }
    if (order.status === 'completed') {
      return (
        <button onClick={() => handlePrintBill(order)} className="p-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200" title="Print Bill"><Printer size={16} /></button>
      );
    }
    return null;
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
  let periodFilteredOrders = orders;
  if (periodFilter !== 'all') {
    periodFilteredOrders = getOrdersByPeriod(orders, periodFilter);
  }
  const filteredOrders = filterOrders(periodFilteredOrders, { statusFilter, searchQuery: searchQuery || searchTerm });
  
  // Sort orders
  const sortedOrders = sortOrders(filteredOrders, sortBy, sortDirection);
  
  // Get counts by status for dashboard
  const statusCounts = getStatusCounts(orders);
  
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
  
  const handlePrintKOT = (order) => {
    const printWindow = window.open("", "", "width=600,height=600");
    const html = ReactDOMServer.renderToString(<PrintKOT order={order} />);
    printWindow.document.write(`
      <html>
        <head>
          <title>KOT - Order ${order.order_number || order.id.slice(0, 8)}</title>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();

    // Use onload to ensure content is rendered before printing
    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();

      // Use onafterprint to close the window after printing (works in Chrome)
      printWindow.onafterprint = function () {
        printWindow.close();
      };
    };

    // Fallback: If onload doesn't fire (rare), let the user close the window manually
  };
  
  const handlePrintBill = (order) => {
    const printWindow = window.open("", "", "width=700,height=800");
    const html = ReactDOMServer.renderToString(
      <PrintBill order={order} restaurant={restaurant} />
    );
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - Order ${order.order_number || order.id.slice(0, 8)}</title>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();

    // Use onload to ensure content is rendered before printing
    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();

      // Use onafterprint to close the window after printing (works in Chrome)
      printWindow.onafterprint = function () {
        printWindow.close();
      };
    };

    // Fallback: If onload doesn't fire (rare), let the user close the window manually
  };
  
  // Download handler
  const handleDownload = (period) => {
    const { data, sheetName } = handleOrderDownload(orders, period);
    if (!data || data.length === 0) return; // Prevent empty downloads
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `OrderDetails-${sheetName.replace(/\s+/g, '')}.xlsx`);
    setShowDownloadMenu(false);
  };
  
  // 1. Add a new helper to download by status
  const handleDownloadByStatus = (status) => {
    const { data, sheetName } = handleOrderDownload(orders, null, status);
    if (!data || data.length === 0) return; // Prevent empty downloads
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `OrderDetails-${sheetName.replace(/\s+/g, '')}.xlsx`);
  };
  
  // Modernized OrderItemsList
  const OrderItemsList = ({ items }) => (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Order Items</h4>
      <div className="divide-y divide-gray-200">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center py-2">
            <div className="w-10 h-10 rounded overflow-hidden mr-3 border border-gray-200 bg-white flex-shrink-0">
              <img
                src={item.image || `/api/placeholder/40/40`}
                alt={item.name || `Item ${idx+1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name || `Item ${idx+1}`}</p>
              <div className="flex text-xs text-gray-500 space-x-2">
                <span>Qty: {item.quantity || 1}</span>
                <span>Price: ₹{item.price?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700 ml-2">
              ₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-2 pt-2 border-t border-gray-200 text-sm font-semibold">
        Total: ₹{items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0).toFixed(2)}
      </div>
    </div>
  );

  const handleRefresh = () => {
    fetchOrders();
  };
  
  return (
    <div className="space-y-5">

<div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Package className="h-5 w-5 mr-2 text-orange-500" />
            Order Status Overview
          </h3>
          <p className="text-sm text-gray-600 mt-1">Real-time tracking of all orders</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {['pending', 'preparing', 'ready', 'completed', 'rejected'].map(status => (
            <StatusCard key={status} status={status} />
          ))}
          {/* Download Button as a Card */}
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white shadow-sm border-l-4 border-orange-400">
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-gray-500 uppercase font-medium">Download</p>
              <div className="p-2 rounded-full bg-orange-100">
                <Download className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="relative w-full mt-2">
          <button
            onClick={() => setShowDownloadMenu((prev) => !prev)}
                className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            title="Download Orders as Excel"
          >
            Download Orders
          </button>
          {showDownloadMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => handleDownload('daily')}
              >
                Download Daily Orders
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => handleDownload('weekly')}
              >
                Download Weekly Orders
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => handleDownload('monthly')}
              >
                Download Monthly Orders
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => handleDownload('filtered')}
              >
                Download Filtered Orders
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleDownload('all')}
              >
                Download All (3 Sheets)
              </div>
            </div>
          )}
        </div>
      </div>
          </div>
        </div>
        
      {/* Enhanced Header Section */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              Order Management 
              {isLoading && (
                <RefreshCw size={20} className="ml-3 text-orange-500 animate-spin" />
              )}
            </h2>
          </div>
            
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Enhanced Search Bar */}
            <div className="relative flex-1 lg:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            {/* Enhanced View Switcher */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewType('tiles')}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewType === 'tiles' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-600 hover:text-orange-600'
                }`}
                >
                <Grid size={16} className="mr-2" />
                  Tiles
                </button>
                <button
                  onClick={() => setViewType('table')}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewType === 'table' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-600 hover:text-orange-600'
                }`}
                >
                <List size={16} className="mr-2" />
                  Table
                </button>
              </div>
            
            {/* Enhanced Refresh Button */}
              <button
              onClick={handleRefresh}
              disabled={ordersLoading}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
              <RefreshCw size={16} className={`mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
          </div>
        </div>
        
        {/* Enhanced Filters Row */}
        <div className="flex flex-wrap gap-4 mt-6">
          {/* Status Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={16} className="text-gray-400" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white min-w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </div>
                
          {/* Sort Options */}
          <div className="relative">
                  <select
                    value={`${sortBy}-${sortDirection}`}
                    onChange={(e) => {
                      const [newSortBy, newSortDirection] = e.target.value.split('-');
                      setSortBy(newSortBy);
                      setSortDirection(newSortDirection);
                    }}
              className="pr-8 py-2 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white min-w-48"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="total-desc">Highest Amount</option>
                    <option value="total-asc">Lowest Amount</option>
                    <option value="status-asc">Status: Pending → Completed</option>
                    <option value="status-desc">Status: Completed → Pending</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </div>
          
          {/* Quick Filter Buttons */}
          <div className="flex gap-2 ml-auto">
            <button
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                periodFilter === 'daily' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              onClick={() => setPeriodFilter('daily')}
            >
              Today
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                periodFilter === 'weekly' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              onClick={() => setPeriodFilter('weekly')}
            >
              This Week
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                periodFilter === 'monthly' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              onClick={() => setPeriodFilter('monthly')}
            >
              This Month
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                periodFilter === 'all' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setPeriodFilter('all')}
            >
              All
            </button>
            </div>
          </div>
        </div>
        
        {/* Content area */}
        <div className="p-6">
          {ordersLoading && (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          )}
          {ordersError && (
            <div className="text-center py-8 text-red-500">{ordersError}</div>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedOrders.map((order) => (
                <div
                  key={order.id}
                  className={`
                    group relative rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden
                    ${
                      order.status === 'pending'
                        ? 'bg-yellow-50'
                        : order.status === 'preparing'
                        ? 'bg-purple-50'
                        : order.status === 'ready'
                        ? 'bg-green-50'
                        : order.status === 'completed'
                        ? 'bg-teal-50'
                        : order.status === 'rejected'
                        ? 'bg-red-50'
                        : 'bg-gray-50'
                    }
                    ${order.status === 'pending' ? 'ring-2 ring-yellow-100' : ''}
                  `}
                  style={{ minHeight: 340 }}
                >
                  {/* Status Ribbon */}
                  <div
                    className={`
                      absolute top-0 right-0 px-4 py-1 text-xs font-bold tracking-wide rounded-bl-2xl shadow-md z-10
                      ${
                        order.status === 'pending'
                          ? 'bg-yellow-200 text-yellow-900'
                          : order.status === 'preparing'
                          ? 'bg-purple-200 text-purple-900'
                          : order.status === 'ready'
                          ? 'bg-green-200 text-green-900'
                          : order.status === 'completed'
                          ? 'bg-teal-200 text-teal-900'
                          : order.status === 'rejected'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-gray-200 text-gray-900'
                      }
                    `}
                  >
                    {STATUS_META[order.status]?.label}
                  </div>

                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                          #{order.order_number || order.id.slice(0, 8)}
                          <span className="ml-2 text-xs font-semibold text-gray-400">{formatDate(order.created_at)}</span>
                        </div>
                        {order.table_number && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Table {order.table_number}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="rounded-full p-2 bg-gray-100 hover:bg-orange-100 transition"
                        title={expandedOrderId === order.id ? "Hide details" : "View details"}
                      >
                        {expandedOrderId === order.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-4 px-5 pt-4 pb-2">
                    <div className="h-12 w-12 rounded-full ring-2 ring-orange-200 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={order.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.customer_name || 'Guest')}&background=f59e42&color=fff`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={e => { e.target.onerror = null; e.target.src = '/api/placeholder/40/40'; }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{order.customer_name || 'Guest'}</div>
                      {order.customer_phone && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone size={12} /> {order.customer_phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="px-5 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        {(order.items || []).slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex-shrink-0 relative group">
                            <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 transition-transform duration-200 group-hover:scale-105">
                              <img
                                src={item.image || `/api/placeholder/56/56`}
                                alt={item.name || `Item ${idx+1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shadow-xs border border-gray-200">
                              {item.quantity || 1}
                            </div>
                          </div>
                        ))}
                        {(order.items || []).length > 4 && (
                          <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                            +{(order.items || []).length - 4}
                          </div>
                        )}
                        <span className="ml-auto text-xs text-gray-400">{(order.items || []).length} items</span>
                      </div>
                    </div>
                    {expandedOrderId === order.id && (
                      <OrderItemsList items={order.items || []} />
                    )}
                  </div>

                  {/* Payment and Total */}
                  <div className="flex justify-between items-center pt-4 pb-3 px-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white shadow-inner rounded-b-xl">
                    <div>
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-bold text-lg text-gray-800">₹{order.total?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Payment</div>
                      <div className="font-medium text-xs">
                        {order.payment_method === 'razorpay' && order.payment_status === 'completed' ? (
                          <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">Paid Online</span>
                        ) : order.payment_method?.toLowerCase() === 'upi' ? (
                          <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">UPI</span>
                        ) : order.payment_method === 'cod' ? (
                          <span className="inline-block px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Cash</span>
                        ) : order.payment_status === 'pending' ? (
                          <span className="inline-block px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">Pending</span>
                        ) : order.payment_status === 'failed' ? (
                          <span className="inline-block px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">Failed</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                            {order.payment_method ? order.payment_method.toUpperCase() : 'Unknown'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ActionButtons order={order} />
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
                  {sortedOrders.map((order) => {
                    const nextStatusOptions = getNextStatusOptions(order.status);
                    return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.order_number || order.id.slice(0, 8)}
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
                            <ActionButtons order={order} />
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
                                {order.special_instructions && (
                                  <div className="mb-2 text-sm text-gray-600">
                                    <span className="font-medium">Special Instructions: </span>{order.special_instructions}
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
                  );
                })}
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
              Are you sure you want to {confirmModal.type === 'accept' ? 'accept' : confirmModal.type === 'rejected' ? 'reject' : confirmModal.type === 'ready' ? 'mark as ready' : 'complete'} order <span className="font-semibold">{confirmModal.order.order_number || confirmModal.order.id.slice(0,8)}</span>?
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