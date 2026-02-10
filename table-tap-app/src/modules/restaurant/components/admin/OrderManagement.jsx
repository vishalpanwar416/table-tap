import React, { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useCallback, startTransition } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, X, Truck, CheckCircle, ChevronDown, ChevronRight, User,
  Clock, Calendar, MapPin, Phone, Filter, AlertCircle,
  Printer, Download, AlertTriangle, ShoppingBag, Info, Grid, List, Package, Plus, Minus, RefreshCw, Mail, Send, MessageCircle, Copy, Search, Wifi, WifiOff
} from 'lucide-react';
import { useManagerNotifications } from '../../../shared/context/ManagerNotificationContext';
import { format } from 'date-fns';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';
import { useAuth } from '../../../shared/config/AuthContext';
import ReactDOMServer from "react-dom/server";
import PrintBill from "./PrintBill";
import PrintKOT from "./PrintKOT";
import { sendBillEmail } from '../../../shared/api/emailService';
import { sendWhatsAppBill, openWhatsAppBill } from '../../../shared/api/whatsappService';
import toast from 'react-hot-toast';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';

// Ref-based modal: opening it does not re-render OrderManagement (only this small tree re-renders).
const OnlineBillModal = forwardRef(function OnlineBillModal({ restaurant, triggeredBy }, ref) {
  const [state, setState] = useState({
    open: false,
    order: null,
    type: 'whatsapp',
    email: '',
    phone: ''
  });
  const [sendingBill, setSendingBill] = useState(false);

  useImperativeHandle(ref, () => ({
    open(order, type = 'whatsapp') {
      setState({
        open: true,
        order,
        type,
        email: order.customer_email || '',
        phone: (order.customer_phone || '').replace(/[^0-9]/g, '')
      });
    }
  }), []);

  const close = () => {
    setState({ open: false, order: null, type: 'whatsapp', email: '', phone: '' });
    setSendingBill(false);
  };

  const handleSend = async () => {
    const { order, type, email, phone } = state;
    if (!order || !restaurant) return;
    if (type === 'email') {
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
      setSendingBill(true);
      try {
        await sendBillEmail(order, restaurant, email, { triggeredBy: triggeredBy || undefined });
        toast.success(`Bill sent to ${email}`);
        close();
      } catch (error) {
        toast.error(error.message || 'Failed to send email');
      } finally {
        setSendingBill(false);
      }
    } else {
      if (!phone || phone.length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }
      try {
        const result = await sendWhatsAppBill(order, restaurant, phone);
        if (result.success) {
          toast.success('Bill sent via WhatsApp!');
        } else if (result.fallback && result.shareURL) {
          window.open(result.shareURL, '_blank');
          toast.success('Opening WhatsApp...');
        } else {
          openWhatsAppBill(order, restaurant, phone);
          toast.success('Opening WhatsApp...');
        }
        close();
      } catch (error) {
        try {
          openWhatsAppBill(order, restaurant, phone);
          toast.success('Opening WhatsApp...');
          close();
        } catch (fallbackError) {
          toast.error(error.message || 'Failed to send WhatsApp bill');
        }
      }
    }
  };

  if (!state.open || !state.order) return null;

  const { order, type, email, phone } = state;
  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[95vh] flex flex-col">
        <div className={`px-4 sm:px-6 py-4 flex-shrink-0 bg-gradient-to-r ${type === 'email' ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                {type === 'email' ? <Mail className="text-white" size={20} /> : <MessageCircle className="text-white" size={20} />}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white">Send Online Bill</h3>
                <p className={`${type === 'email' ? 'text-blue-100' : 'text-green-100'} text-sm truncate`}>Order #{order.id?.slice(0, 8)}</p>
              </div>
            </div>
            <button type="button" onClick={close} className="min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0 text-white/80 hover:text-white transition-colors touch-manipulation rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6 overflow-auto flex-1">
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button type="button" onClick={() => setState(s => ({ ...s, type: 'whatsapp' }))} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all ${type === 'whatsapp' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <MessageCircle size={18} /> WhatsApp
            </button>
            <button type="button" onClick={() => setState(s => ({ ...s, type: 'email' }))} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all ${type === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Mail size={18} /> Email
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600 text-sm">Customer</span>
              <span className="font-semibold text-gray-900">{order.customer_name || 'Guest'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-800 font-medium">Amount Due</span>
              <span className={`font-bold text-lg ${type === 'email' ? 'text-blue-600' : 'text-green-600'}`}>₹{order.total?.toFixed(2)}</span>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{type === 'email' ? 'Email Address' : 'WhatsApp Number'}</label>
            <div className="relative">
              {type === 'email' ? (
                <>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" value={email} onChange={(e) => setState(s => ({ ...s, email: e.target.value }))} placeholder="customer@email.com" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </>
              ) : (
                <>
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="tel" value={phone} onChange={(e) => setState(s => ({ ...s, phone: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="9876543210" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500" />
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={close} disabled={sendingBill} className="flex-1 min-h-[44px] px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleSend} disabled={sendingBill || (type === 'email' ? !email : !phone)} className={`flex-1 min-h-[44px] px-4 py-3 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${type === 'email' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}`}>
              {sendingBill ? <RefreshCw className="animate-spin" size={18} /> : (type === 'email' ? <Send size={18} /> : <MessageCircle size={18} />)}
              {sendingBill ? 'Sending...' : (type === 'email' ? 'Send Email' : 'Open WhatsApp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

import {
  fetchAllOrders,
  syncPendingActions,
  subscribeToAllOrderChanges,
  unsubscribeFromOrderChanges,
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
import { createOrder, calculateOrderTotals } from '../../../customer/api/paymentService';
import { getRestaurantFoodItems } from '../../../customer/api/foodService';
import { processFoodItems } from '../../../shared/utils/imageOptimization';
import { createNotification as createNotificationService } from '../../../shared/api/notificationService';

const STATUS_META = {
  pending: {
    label: "Pending",
    color: "yellow",
    icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />,
    badge: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  preparing: {
    label: "Preparing",
    color: "orange",
    icon: <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />,
    badge: "bg-orange-100 text-orange-800 border border-orange-200",
  },
  ready: {
    label: "Ready",
    color: "green",
    icon: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />,
    badge: "bg-green-100 text-green-800 border border-green-200",
  },
  completed: {
    label: "Completed",
    color: "teal",
    icon: <Check className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />,
    badge: "bg-teal-100 text-teal-800 border border-teal-200",
  },
  rejected: {
    label: "Rejected",
    color: "red",
    icon: <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />,
    badge: "bg-red-100 text-red-800 border border-red-200",
  },
};

// Ref-based confirm modal: opening/confirming does not re-render the order list (no flicker).
const ConfirmOrderModal = forwardRef(function ConfirmOrderModal({ onConfirm, onSuccess }, ref) {
  const [state, setState] = useState({
    show: false,
    type: null,
    order: null,
    rejectionReason: '',
    loading: false
  });

  useImperativeHandle(ref, () => ({
    open(order, type) {
      setState({
        show: true,
        type,
        order,
        rejectionReason: '',
        loading: false
      });
    }
  }), []);

  const close = () => setState({ show: false, type: null, order: null, rejectionReason: '', loading: false });

  const handleConfirm = async () => {
    const { order, type, rejectionReason } = state;
    if (!order || !onConfirm) return;
    const normalizedType = type?.toLowerCase();
    const statusMap = {
      accept: 'preparing',
      rejected: 'rejected',
      ready: 'ready',
      complete: 'completed'
    };
    const newStatus = statusMap[normalizedType];
    if (!newStatus) return;
    if (normalizedType === 'rejected' && !rejectionReason.trim()) return;

    setState(s => ({ ...s, loading: true }));
    try {
      await onConfirm(
        order.id,
        order.userId,
        newStatus,
        normalizedType === 'rejected' ? rejectionReason : undefined
      );
      onSuccess?.(order.id, newStatus);
      close();
    } catch (err) {
      console.error(err);
      setState(s => ({ ...s, loading: false }));
    }
  };

  if (!state.show || !state.order) return null;

  const { type, order, rejectionReason, loading } = state;
  const typeLabel = type === 'accept' ? 'Accept' : type === 'rejected' ? 'Reject' : type === 'ready' ? 'Mark Ready' : 'Complete';
  const actionLabel = type === 'accept' ? 'accept' : type === 'rejected' ? 'reject' : type === 'ready' ? 'mark as ready' : 'complete';

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-sm w-full">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-yellow-500 mr-2 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-800">
            Confirm {typeLabel} Order
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to {actionLabel} order <span className="font-semibold">{order.order_number || order.id?.slice(0, 8)}</span>?
        </p>
        {type === 'rejected' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection <span className="text-red-500">*</span></label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 min-h-[88px]"
              rows={3}
              value={rejectionReason}
              onChange={e => setState(s => ({ ...s, rejectionReason: e.target.value }))}
              placeholder="Enter reason for rejection"
              required
            />
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="min-h-[44px] px-4 py-3 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 touch-manipulation"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (type === 'rejected' && !rejectionReason.trim())}
            className={`min-h-[44px] px-4 py-3 rounded text-white touch-manipulation ${type === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
});

// Helper: Render action buttons for each order status
const actionBtnClass = 'flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-full touch-manipulation active:bg-gray-100 transition-colors duration-200 flex-shrink-0 shadow-sm border border-transparent';

const ActionButtons = ({
  order,
  isCard = false,
  confirmOrderModalRef,
  handlePrintKOT,
  handlePrintBill,
  onlineBillModalRef,
  restaurant,
  handleQuickAction
}) => {
  const [loadingAction, setLoadingAction] = useState(null);

  const wrapQuickAction = async (type) => {
    setLoadingAction(type);
    try {
      await handleQuickAction(order, type);
    } finally {
      setLoadingAction(null);
    }
  };

  if (order.status === 'pending') {
    return (
      <>
        <button
          disabled={!!loadingAction}
          onClick={(e) => { e.stopPropagation(); wrapQuickAction('accept'); }}
          className={`${actionBtnClass} bg-green-100 text-green-600 hover:bg-green-600 hover:text-white disabled:opacity-50`}
          title="Accept Order"
        >
          {loadingAction === 'accept' ? (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={18} />
          )}
        </button>
        <button
          disabled={!!loadingAction}
          onClick={(e) => { e.stopPropagation(); confirmOrderModalRef.current?.open(order, 'rejected'); }}
          className={`${actionBtnClass} bg-red-100 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50`}
          title="Reject Order"
        >
          <X size={18} />
        </button>
      </>
    );
  }
  if (order.status === 'preparing') {
    return (
      <>
        <button
          disabled={!!loadingAction}
          onClick={(e) => { e.stopPropagation(); handlePrintKOT(order); }}
          className={`${actionBtnClass} bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white`}
          title="Print KOT"
        >
          <Printer size={18} />
        </button>
        <button
          disabled={!!loadingAction}
          onClick={(e) => { e.stopPropagation(); wrapQuickAction('ready'); }}
          className="min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-600 hover:text-white flex items-center gap-2 transition-colors touch-manipulation flex-shrink-0 border border-transparent disabled:opacity-50"
          title="Mark as Ready"
        >
          {loadingAction === 'ready' ? (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle size={18} />
          )}
          <span className="hidden sm:inline">Ready</span>
        </button>
      </>
    );
  }
  if (order.status === 'ready') {
    return (
      <button
        disabled={!!loadingAction}
        onClick={(e) => { e.stopPropagation(); wrapQuickAction('complete'); }}
        className="min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors touch-manipulation flex-shrink-0 border border-transparent disabled:opacity-50"
        title="Complete"
      >
        {loadingAction === 'complete' ? (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Check size={18} />
        )}
        <span className="hidden sm:inline">Complete</span>
      </button>
    );
  }
  if (order.status === 'completed') {
    const onlineBillEnabled = (restaurant?.billing_features_enabled !== false && restaurant?.online_bill_enabled !== false);

    return (
      <>
        <button
          onClick={(e) => { e.stopPropagation(); handlePrintBill(order); }}
          className={`${actionBtnClass} bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white`}
          title="Print Bill"
        >
          <Printer size={18} />
        </button>

        {onlineBillEnabled && (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onlineBillModalRef.current?.open(order, 'whatsapp'); }}
              className={`${actionBtnClass} bg-green-100 text-green-600 hover:bg-green-600 hover:text-white`}
              title="WhatsApp Bill"
            >
              <MessageCircle size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onlineBillModalRef.current?.open(order, 'email'); }}
              className={`${actionBtnClass} bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white`}
              title="Email Bill"
            >
              <Mail size={18} />
            </button>
          </div>
        )}
      </>
    );
  }
  return null;
};


const OrderManagement = ({ restaurantId, updateOrderStatus, searchTerm: propSearchTerm }) => {
  const { notifications, markAllAsRead } = useManagerNotifications();
  const { restaurant, userRole } = useAdminRestaurant();
  const { user } = useAuth();
  const triggeredBy = user && userRole ? { user_id: user.id, user_name: user.user_metadata?.full_name || user.email, user_role: userRole } : null;
  const [viewType, setViewType] = useState('tiles');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const confirmOrderModalRef = useRef(null);
  const [dropdownOpenOrderId, setDropdownOpenOrderId] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [subscriptionStatus, setSubscriptionStatus] = useState('disconnected');
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [itemProcessing, setItemProcessing] = useState(null); // Track fast actions (orderId)
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState({}); // key: id, value: {id, name, price, image, category, quantity}
  const [coTableNumber, setCoTableNumber] = useState('');
  const [coCustomerName, setCoCustomerName] = useState('');
  const [coCustomerEmail, setCoCustomerEmail] = useState('');
  const [coCustomerPhone, setCoCustomerPhone] = useState('');
  const [coSpecialInstructions, setCoSpecialInstructions] = useState('');
  const [coDiscountPercentage, setCoDiscountPercentage] = useState(0);
  const [coDiscountType, setCoDiscountType] = useState('percentage'); // 'percentage' or 'flat'
  const [coDiscountFlat, setCoDiscountFlat] = useState(0);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  const isOnline = useOnlineStatus();

  const onlineBillModalRef = useRef(null);
  // Legacy: keep for HMR/cache compatibility (modal is now ref-based; this is unused)
  const showOnlineBillModal = false;
  const [coStep, setCoStep] = useState(1); // 1: Select Items, 2: Customer Info

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

  // Deep-link: Auto-expand and scroll to order if orderId is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdToHighlight = urlParams.get('orderId');

    if (orderIdToHighlight && orders.length > 0) {
      setExpandedOrderId(orderIdToHighlight);

      // Clear the param from URL to avoid repeated scrolling but keep it in history if needed
      // Actually, let's just scroll once.
      setTimeout(() => {
        const element = document.getElementById(`order-card-${orderIdToHighlight}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-orange-500', 'ring-offset-2');
          setTimeout(() => element.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-2'), 3000);
        }
      }, 500);
    }
  }, [orders.length, window.location.search]);

  // Load menu items when opening create order modal
  useEffect(() => {
    const fetchMenu = async () => {
      if (!showCreateOrderModal || !restaurantId) return;
      try {
        setMenuLoading(true);
        setMenuError('');
        const items = await getRestaurantFoodItems(restaurantId);
        setMenuItems(processFoodItems(items || []));
      } catch (err) {
        setMenuError('Failed to load menu items');
        console.error('Failed to load menu items:', err);
      } finally {
        setMenuLoading(false);
      }
    };
    fetchMenu();
  }, [showCreateOrderModal, restaurantId]);

  // Refetch orders when coming back online
  useEffect(() => {
    if (isOnline) {
      console.log('Online detected, refreshing orders...');
      fetchOrders();
      // Also retry sync just in case App.js missed it or for redundancy
      syncPendingActions();
    }
  }, [isOnline]);

  // Reset step to 1 whenever modal is opened
  useEffect(() => {
    if (showCreateOrderModal) setCoStep(1);
  }, [showCreateOrderModal]);

  // Parse tables from restaurant data
  useEffect(() => {
    if (restaurant?.tables) {
      try {
        const parsedTables = typeof restaurant.tables === 'string'
          ? JSON.parse(restaurant.tables)
          : restaurant.tables;
        setAvailableTables(Array.isArray(parsedTables) ? parsedTables : []);
      } catch (error) {
        console.error('Error parsing restaurant tables:', error);
        setAvailableTables([]);
      }
    } else {
      setAvailableTables([]);
    }
  }, [restaurant?.tables]);

  // Derived filtered menu
  const filteredMenuItems = useMemo(() => {
    let list = menuItems;
    if (itemCategoryFilter !== 'all') {
      if (itemCategoryFilter === 'Offers') {
        list = list.filter(m => (m.discounted_price || m.discountedPrice) && Number(m.discounted_price || m.discountedPrice) < Number(m.price));
      } else {
        list = list.filter(m => (m.category || '') === itemCategoryFilter);
      }
    }
    if (!itemSearch.trim()) return list;
    const q = itemSearch.toLowerCase();
    return list.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q)
    );
  }, [menuItems, itemSearch, itemCategoryFilter]);

  // Fixed categories according to application design
  const MENU_CATEGORIES = ['Snacks', 'Main Course', 'Beverages', 'Dessert', 'Offers'];

  // Unique categories from items + fixed ones
  const menuCategories = useMemo(() => {
    return MENU_CATEGORIES;
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length };

    // Regular categories
    menuItems.forEach(m => {
      if (m.category) {
        counts[m.category] = (counts[m.category] || 0) + 1;
      }
    });

    // Special logic for 'Offers' count
    counts['Offers'] = menuItems.filter(m =>
      (m.discounted_price || m.discountedPrice) &&
      Number(m.discounted_price || m.discountedPrice) < Number(m.price)
    ).length;

    return counts;
  }, [menuItems]);



  // Filtered tables list for dropdown search
  const filteredTables = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return availableTables;
    return availableTables.filter(t =>
      String(t.tableNumber).toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q) ||
      String(t.capacity || '').toLowerCase().includes(q)
    );
  }, [availableTables, tableSearch]);

  // Selected items array and totals
  const selectedItemsArray = useMemo(() => Object.values(selectedItems), [selectedItems]);
  const selectedOrderTotals = useMemo(() => {
    if (!selectedItemsArray.length) return { subtotal: 0, discountAmount: 0, subtotalAfterDiscount: 0, cgst: 0, sgst: 0, finalTotal: 0 };
    const items = selectedItemsArray.map(si => ({
      price: si.originalPrice || si.price,
      effectivePrice: si.price,
      quantity: si.quantity,
      name: si.name,
      category: si.category
    }));

    // Calculate discount based on type
    const discountValue = coDiscountType === 'percentage'
      ? Number(coDiscountPercentage) || 0
      : Number(coDiscountFlat) || 0;

    return calculateOrderTotals(items, discountValue, coDiscountType);
  }, [selectedItemsArray, coDiscountPercentage, coDiscountFlat, coDiscountType]);

  const addItem = (item) => {
    setSelectedItems(prev => {
      const existing = prev[item.id];
      const qty = existing ? existing.quantity + 1 : 1;
      const discounted = item.discounted_price ?? item.discountedPrice;
      const hasOffer = discounted && Number(discounted) > 0 && Number(discounted) < Number(item.price);
      return {
        ...prev,
        [item.id]: {
          id: item.id,
          name: item.name,
          price: hasOffer ? Number(discounted) : Number(item.price),
          image: item.image,
          category: item.category,
          quantity: qty,
          ...(hasOffer ? { originalPrice: Number(item.price) } : {})

        }
      };
    });
  };

  const decrementItem = (id) => {
    setSelectedItems(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      const qty = existing.quantity - 1;
      const copy = { ...prev };
      if (qty <= 0) {
        delete copy[id];
      } else {
        copy[id] = { ...existing, quantity: qty };
      }
      return copy;
    });
  };

  const removeItem = (id) => {
    setSelectedItems(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Removed item note support

  const resetCreateOrder = () => {
    setSelectedItems({});
    setCoTableNumber('');
    setCoCustomerName('');
    setCoCustomerEmail('');
    setCoCustomerPhone('');
    setCoSpecialInstructions('');
    setCoDiscountPercentage(0);
    setCoDiscountType('percentage');
    setCoDiscountFlat(0);
    setItemSearch('');
  };

  const handleCreateOrderSubmit = async () => {
    try {
      if (!restaurantId) return alert('No restaurant selected');
      if (!selectedItemsArray.length) return alert('Please add at least one item');
      if (!coTableNumber) return alert('Please enter table number');
      setCreatingOrder(true);
      const itemsPayload = selectedItemsArray.map(si => ({
        id: si.id,
        quantity: si.quantity,
        price: si.price,
        name: si.name,
        category: si.category,
        image: si.image
      }));

      const payload = {
        restaurantId,
        userId: null,
        isAdmin: true,
        customerName: coCustomerName || 'Walk-in Customer',
        customerEmail: coCustomerEmail || 'guest@example.com',
        customerPhone: coCustomerPhone,
        tableNumber: coTableNumber,
        items: itemsPayload,
        paymentMethod: 'direct',
        paymentStatus: 'pending',
        status: 'preparing',
        tracking: {
          confirmed: { status: true, timestamp: new Date().toISOString() },
          preparing: { status: true, timestamp: new Date().toISOString() },
          ready: { status: false, timestamp: null },
          completed: { status: false, timestamp: null }
        },
        specialInstructions: coSpecialInstructions,
        discountPercentage: coDiscountType === 'percentage' ? Number(coDiscountPercentage) || 0 : 0,
        discountFlat: coDiscountType === 'flat' ? Number(coDiscountFlat) || 0 : 0,
        discountType: coDiscountType,
      };

      const created = await createOrder(payload);
      // Optimistic update handled by real-time subscription mostly, 
      // but we add it here for immediate feedback. The INSERT handler will check for duplicates.
      if (created) {
        setOrders(prev => {
          const exists = prev.some(o => o.id === created.id);
          if (exists) return prev;
          return [created, ...prev];
        });
        setShowCreateOrderModal(false);
        resetCreateOrder();
        toast.success('Order created successfully');
      }
    } catch (err) {
      console.error('Create order (admin) failed:', err);
      alert(`Failed to create order: ${err.message || err}`);
    } finally {
      setCreatingOrder(false);
    }
  };

  // Enhanced real-time subscription
  useEffect(() => {
    if (!restaurantId) {
      console.warn('No restaurantId available for real-time subscription');
      return;
    }

    console.log('Setting up real-time subscription for restaurant:', restaurantId);

    const channel = subscribeToAllOrderChanges(restaurantId, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      startTransition(() => {
        setOrders((prevOrders) => {
          let updatedOrders = [...prevOrders];

          if (eventType === 'INSERT') {
            const exists = updatedOrders.some(order => order.id === newRecord.id);
            if (!exists) {
              updatedOrders = [newRecord, ...updatedOrders];
            }
          } else if (eventType === 'UPDATE') {
            updatedOrders = updatedOrders.map(order =>
              order.id === newRecord.id ? { ...order, ...newRecord } : order
            );
          } else if (eventType === 'DELETE') {
            updatedOrders = updatedOrders.filter(order => order.id !== oldRecord.id);
          }

          return updatedOrders;
        });
      });
    });

    // Set subscription status
    if (channel) {
      setSubscriptionStatus('connected');
    }

    return () => {
      if (channel) {
        unsubscribeFromOrderChanges(channel);
        setSubscriptionStatus('disconnected');
      }
    };
  }, [restaurantId]);

  // Optimistic update: apply new status to list immediately so UI doesn't flicker waiting for realtime
  const applyOptimisticStatus = useCallback((orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  }, []);

  // Handle order status updates (called by ConfirmOrderModal; onSuccess runs before close for optimistic UI)
  const handleStatusUpdate = async (orderId, userId, newStatus, cancelReason) => {
    let updatedOrder;
    if (typeof updateOrderStatus === 'function') {
      updatedOrder = await updateOrderStatus(orderId, newStatus, cancelReason);
    } else {
      updatedOrder = await updateOrderStatusService(orderId, newStatus, cancelReason);
    }
    const notificationMessages = {
      preparing: 'Order is being prepared',
      ready: 'Order is ready for serving',
      rejected: 'Order was rejected',
      completed: 'Order has been completed'
    };

    try {
      await createNotificationService({
        order_id: orderId,
        type: `order_${newStatus}`,
        user_id: userId,
        message: `Order #${orderId.slice(0, 8)} ${notificationMessages[newStatus] || `status updated to ${newStatus}`}`,
        restaurant_id: restaurantId,
        is_admin_notification: false // This is for the customer
      });
    } catch (notifErr) {
      console.warn('Failed to create notification:', notifErr);
    }

    return updatedOrder;
  };

  // Fast action handler (bypasses modal for Accept, Ready, Complete)
  const handleQuickAction = async (order, type) => {
    const statusMap = {
      accept: 'preparing',
      ready: 'ready',
      complete: 'completed'
    };
    const newStatus = statusMap[type];
    if (!newStatus) return;

    // 1. Optimistic Update
    applyOptimisticStatus(order.id, newStatus);
    setItemProcessing(order.id);

    try {
      // 2. Perform Update
      await handleStatusUpdate(order.id, order.userId || order.user_id, newStatus);
      toast.success(
        type === 'accept' ? 'Order accepted' :
          type === 'ready' ? 'Order marked as ready' : 'Order completed'
      );
    } catch (error) {
      // 3. Rollback on failure
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
      toast.error('Failed to update order. Please try again.');
      console.error('Quick action failed:', error);
    } finally {
      setItemProcessing(null);
    }
  };

  // Helper: Render status dashboard card (explicit Tailwind classes for status colors)
  const StatusCard = ({ status }) => (
    <div
      className={`relative group flex flex-col sm:flex-row items-center sm:justify-between w-full sm:w-auto p-1.5 sm:p-3 rounded-lg bg-white shadow-sm border border-gray-200 sm:border-l-4 cursor-pointer hover:shadow-md transition-all ${STATUS_META[status].cardBorder} ${statusFilter === status ? STATUS_META[status].cardRing : ''}`}
      onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
    >
      <div className="flex flex-col items-center sm:items-start w-full">
        <p className="text-[9px] sm:text-xs text-gray-500 uppercase font-bold sm:font-medium truncate w-full text-center sm:text-left leading-tight sm:mb-1 tracking-tight">{STATUS_META[status].label}</p>
        <p className="text-sm sm:text-2xl font-bold text-gray-900 leading-none sm:leading-normal mt-0.5 sm:mt-0">{statusCounts[status]}</p>
      </div>
      <div className="hidden sm:flex flex-col items-end">
        <div className={`p-1.5 sm:p-2 rounded-full ${STATUS_META[status].iconBg}`}>
          {STATUS_META[status].icon}
        </div>
        {/* Download button for this status */}
        <button
          onClick={e => {
            e.stopPropagation();
            handleDownloadByStatus(status);
          }}
          className="hidden sm:inline-flex mt-1 p-1 rounded bg-orange-100 hover:bg-orange-200"
          title={`Download ${STATUS_META[status].label} Orders`}
        >
          <Download className="w-4 h-4 text-orange-500" />
        </button>
      </div>
    </div>
  );

  // Helper: Render status badge
  const getStatusBadge = (status) => (
    <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${STATUS_META[status]?.badge || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
      {STATUS_META[status]?.label || 'Unknown'}
    </span>
  );



  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const isTodayDate = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterdayDate = date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === yesterday.getDate();
    if (isTodayDate) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterdayDate) {
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

  // Filter and sort orders
  const sortedOrders = useMemo(() => {
    let result = orders;

    // 1. Period Filter
    if (periodFilter !== 'all') {
      result = getOrdersByPeriod(result, periodFilter);
    }

    // 2. Status & Search Filter
    result = filterOrders(result, { statusFilter, searchQuery: searchTerm });

    // 3. Sort
    return sortOrders(result, sortBy, sortDirection);
  }, [orders, periodFilter, statusFilter, searchTerm, sortBy, sortDirection]);

  // Get counts by status for dashboard
  const statusCounts = useMemo(() => getStatusCounts(orders), [orders]);

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

  // Download handler - lazy loads XLSX
  const handleDownload = async (period) => {
    const XLSX = await import('xlsx');
    const { data, sheetName } = handleOrderDownload(orders, period);
    if (!data || data.length === 0) return; // Prevent empty downloads
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `OrderDetails-${sheetName.replace(/\s+/g, '')}.xlsx`);
    setShowDownloadMenu(false);
  };

  // Download by status - lazy loads XLSX
  const handleDownloadByStatus = async (status) => {
    const XLSX = await import('xlsx');
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
            <div className="w-10 h-10 rounded-full ring-2 ring-orange-200 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center overflow-hidden">
              <img
                src={item.image || `/api/placeholder/40/40`}
                alt={item.name || `Item ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={e => { e.target.onerror = null; e.target.src = '/api/placeholder/40/40'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name || `Item ${idx + 1}`}</p>
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

  return (
    <div className="space-y-5">
      {/* Offline Mode Indicator */}
      {!isOnline && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4 rounded-r shadow-sm animate-pulse">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <WifiOff className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                You are currently offline. Actions will be queued and synced when connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 ${overviewOpen ? 'px-3 sm:px-6 py-4' : 'px-3 sm:px-6 py-1 -my-2 sm:py-2 sm:-my-1'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Package className="h-5 w-5 mr-2 text-orange-500" />
              Order Status Overview
            </h3>
            {overviewOpen && (
              <p className="text-sm text-gray-600 mt-1">Real-time tracking of all orders</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOverviewOpen((prev) => !prev)}
            className="p-1.5 sm:p-2 rounded-md hover:bg-orange-100 text-orange-600"
            aria-expanded={overviewOpen}
            aria-controls="order-status-overview"
            title={overviewOpen ? 'Collapse overview' : 'Expand overview'}
          >
            <ChevronDown className={`h-5 w-5 transform transition-transform duration-200 ${overviewOpen ? 'rotate-180' : 'rotate-0'}`} />
          </button>
        </div>
        {overviewOpen && (
          <div id="order-status-overview" className="grid grid-cols-6 gap-1.5 mt-2 sm:mt-0 sm:grid sm:grid-cols-3 md:grid-cols-6 sm:gap-4 px-0.5 sm:px-0">
            {['pending', 'preparing', 'ready', 'completed', 'rejected'].map(status => (
              <StatusCard key={status} status={status} />
            ))}
            {/* Download Button as a Card */}
            <div className="relative group flex flex-col sm:flex-row items-center justify-center sm:justify-between w-full sm:w-auto p-1.5 sm:p-3 rounded-lg bg-white shadow-sm border border-gray-200 sm:border-l-4 border-orange-400 cursor-pointer hover:shadow-md transition-all">

              {/* Mobile Content (Compact) */}
              <div
                className="flex flex-col items-center justify-center w-full h-full sm:hidden"
                onClick={() => setShowDownloadMenu((prev) => !prev)}
              >
                <p className="text-[9px] text-gray-500 uppercase font-bold truncate w-full text-center leading-tight tracking-tight">Export</p>
                <Download className="h-3.5 w-3.5 text-orange-500 mt-1" />
              </div>

              {/* Desktop Content (Original) */}
              <div className="hidden sm:flex items-center justify-between w-full">
                <p className="text-xs text-gray-500 uppercase font-medium">Download</p>
                <button
                  onClick={() => setShowDownloadMenu((prev) => !prev)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors cursor-pointer touch-manipulation"
                  title="Download Orders as Excel"
                >
                  <Download className="h-5 w-5 text-orange-500" />
                </button>
              </div>

              <div className="relative w-full mt-0 sm:mt-2">
                {showDownloadMenu && (
                  <div className="absolute top-full right-0 sm:left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] sm:min-w-48">
                    <div
                      className="min-h-[40px] sm:min-h-[44px] flex items-center px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 touch-manipulation text-xs sm:text-sm"
                      onClick={() => handleDownload('daily')}
                    >
                      Download Daily Orders
                    </div>
                    <div
                      className="min-h-[40px] sm:min-h-[44px] flex items-center px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 touch-manipulation text-xs sm:text-sm"
                      onClick={() => handleDownload('weekly')}
                    >
                      Download Weekly Orders
                    </div>
                    <div
                      className="min-h-[40px] sm:min-h-[44px] flex items-center px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 touch-manipulation text-xs sm:text-sm"
                      onClick={() => handleDownload('monthly')}
                    >
                      Download Monthly Orders
                    </div>
                    <div
                      className="min-h-[40px] sm:min-h-[44px] flex items-center px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 touch-manipulation text-xs sm:text-sm"
                      onClick={() => handleDownload('filtered')}
                    >
                      Download Filtered Orders
                    </div>
                    <div
                      className="min-h-[40px] sm:min-h-[44px] flex items-center px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer touch-manipulation text-xs sm:text-sm"
                      onClick={() => handleDownload('all')}
                    >
                      Download All (3 Sheets)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar: stacked on mobile/tablet, single row on desktop; touch-friendly */}
      < div className="px-3 sm:px-6 py-3 sm:py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white" >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div className="flex items-center gap-2 w-full overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap flex-1">
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setViewType('tiles')}
                className={`flex items-center min-h-[42px] px-3 py-2 rounded-lg text-sm transition-all duration-200 ${viewType === 'tiles'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-orange-600 active:bg-gray-200'
                  }`}
                aria-pressed={viewType === 'tiles'}
              >
                <Grid size={16} className="mr-1.5 w-3.5 h-3.5" />
                Tiles
              </button>
              <button
                onClick={() => setViewType('table')}
                className={`flex items-center min-h-[42px] px-3 py-2 rounded-lg text-sm transition-all duration-200 ${viewType === 'table'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-orange-600 active:bg-gray-200'
                  }`}
                aria-pressed={viewType === 'table'}
              >
                <List size={16} className="mr-1.5 w-3.5 h-3.5" />
                Table
              </button>
            </div>

            {/* All Status filter */}
            {/* Combined Compact Filters */}
            <div className="flex flex-shrink-0 items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
              <div className="relative border-r border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 pl-3 pr-7 py-1 text-xs font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none outline-none min-w-[70px]"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Prep</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Done</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative bg-white hover:bg-gray-50 transition-colors">
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => {
                    const [newSortBy, newSortDirection] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortDirection(newSortDirection);
                  }}
                  className="h-9 pl-3 pr-7 py-1 text-xs font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none outline-none min-w-[80px]"
                >
                  <option value="created_at-desc">Newest</option>
                  <option value="created_at-asc">Oldest</option>
                  <option value="total-desc">High Amt</option>
                  <option value="total-asc">Low Amt</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Period selector */}
            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2 sm:ml-auto">
              {(['daily', 'weekly', 'monthly', 'all']).map((key, i) => {
                const labels = { daily: 'Today', weekly: 'Week', monthly: 'Month', all: 'All' };
                const styles = {
                  daily: 'bg-blue-500 text-white',
                  weekly: 'bg-green-500 text-white',
                  monthly: 'bg-orange-500 text-white',
                  all: 'bg-gray-500 text-white',
                };
                const inactive = {
                  daily: 'bg-blue-50 text-blue-600',
                  weekly: 'bg-green-50 text-green-600',
                  monthly: 'bg-orange-50 text-orange-600',
                  all: 'bg-gray-50 text-gray-600',
                };
                return (
                  <button
                    key={key}
                    className={`flex-shrink-0 px-3 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors touch-manipulation active:opacity-90 whitespace-nowrap font-medium ${periodFilter === key ? styles[key] : inactive[key] + ' hover:opacity-90'}`}
                    onClick={() => setPeriodFilter(key)}
                  >
                    {labels[key]}
                  </button>
                );
              })}
            </div>

          </div>

          <div className="w-full sm:w-auto sm:ml-2">
            <button
              onClick={() => setShowCreateOrderModal(true)}
              className="flex items-center justify-center w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-600 active:from-green-800 transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0 touch-manipulation"
              title="Create Order"
            >
              <Plus size={20} className="mr-1.5 w-4 h-4" />
              <span className="text-sm font-semibold">Create Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="px-3 sm:px-6 py-4 overflow-x-hidden">

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
            {sortedOrders.map((order) => (
              <React.Fragment key={order.id}>
                {/* Mobile Compact Card */}
                <div
                  id={`order-card-${order.id}`}
                  className="block sm:hidden mb-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden status-card-mobile h-fit"
                >
                  <div
                    className="p-2.5 flex items-start gap-3 active:bg-gray-50 transition-colors"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <div className={`w-2 h-10 rounded-full ${STATUS_META[order.status]?.bg || 'bg-gray-200'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-900 text-sm">#{order.order_number || order.id.slice(0, 8)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                        <Clock size={12} />
                        <span>{format(new Date(order.created_at), 'h:mm a')}</span>
                        <span>•</span>
                        <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {order.table_number ? `T-${order.table_number}` : 'Takeaway'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 truncate max-w-[120px]">{order.customer_name || 'Guest'}</span>
                        <span className="font-bold text-gray-900">₹{Math.round(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions for Pending Orders (Mobile Only) */}
                  {order.status === 'pending' && (
                    <div className="flex gap-2 px-2.5 pb-2.5">
                      <button
                        disabled={itemProcessing === order.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(order, 'accept');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg font-bold text-xs active:bg-green-100 transition-colors border border-green-100 shadow-sm disabled:opacity-50"
                      >
                        {itemProcessing === order.id ? (
                          <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Accept
                      </button>
                      <button
                        disabled={itemProcessing === order.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmOrderModalRef.current?.open(order, 'rejected');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-700 rounded-lg font-bold text-xs active:bg-red-100 transition-colors border border-red-100 shadow-sm disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Expanded Section */}
                  {expandedOrderId === order.id && (
                    <div className="bg-gray-50/50 border-t border-gray-100 px-3 py-2 animate-in slide-in-from-top-1 duration-200">
                      {/* Customer Info Row */}
                      {(order.customer_email || order.customer_phone) && (
                        <div className="flex gap-3 mb-3 text-xs text-gray-500 pb-2 border-b border-gray-100/50">
                          {order.customer_phone && <span className="flex items-center gap-1"><Phone size={10} /> {order.customer_phone}</span>}
                          {order.customer_email && <span className="flex items-center gap-1 truncate"><Mail size={10} /> {order.customer_email}</span>}
                        </div>
                      )}

                      {/* Items List */}
                      <div className="space-y-1.5 mb-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs items-start">
                            <div className="flex gap-2 leading-tight">
                              <span className="font-semibold text-gray-900 min-w-[20px]">{item.quantity}x</span>
                              <span className="text-gray-700 line-clamp-1">{item.name}</span>
                            </div>
                            <span className="text-gray-500 font-medium">₹{Math.round(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <ActionButtons
                          order={order}
                          isCard={true}
                          confirmOrderModalRef={confirmOrderModalRef}
                          handlePrintKOT={handlePrintKOT}
                          handlePrintBill={handlePrintBill}
                          onlineBillModalRef={onlineBillModalRef}
                          restaurant={restaurant}
                          handleQuickAction={handleQuickAction}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop Card (Original) */}
                <div
                  id={`order-card-${order.id}`}
                  className={`
                      hidden sm:block group relative rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-150 ease-out overflow-hidden
                      ${order.status === 'pending'
                      ? 'bg-yellow-50'
                      : order.status === 'preparing'
                        ? 'bg-orange-50'
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
                  style={{ minHeight: 'min(340px, 50vh)' }}
                >
                  {/* Status Ribbon */}
                  <div
                    className={`
                        absolute top-0 right-0 px-3 py-1.5 sm:px-4 sm:py-1 text-xs font-bold tracking-wide rounded-bl-2xl shadow-md z-10
                        ${order.status === 'pending'
                        ? 'bg-yellow-200 text-yellow-900'
                        : order.status === 'preparing'
                          ? 'bg-orange-200 text-orange-900'
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
                  <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-lg sm:text-xl font-extrabold text-gray-900 flex flex-wrap items-center gap-2">
                          <span className="truncate">#{order.order_number || order.id.slice(0, 8)}</span>
                          <span className="text-xs font-semibold text-gray-400 shrink-0">{formatDate(order.created_at)}</span>
                        </div>
                        {order.table_number && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Table {order.table_number}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-full p-2.5 sm:p-2 bg-gray-100 hover:bg-orange-100 active:bg-orange-200 transition touch-manipulation"
                        title={expandedOrderId === order.id ? "Hide details" : "View details"}
                        aria-expanded={expandedOrderId === order.id}
                      >
                        {expandedOrderId === order.id ? <ChevronDown size={20} className="sm:w-[18px] sm:h-[18px]" /> : <ChevronRight size={20} className="sm:w-[18px] sm:h-[18px]" />}
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 pt-3 sm:pt-4 pb-2">
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
                  <div className="px-4 sm:px-5 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        {(order.items || []).slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex-shrink-0 relative">
                            <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                              <img
                                src={item.image || `/api/placeholder/56/56`}
                                alt={item.name || `Item ${idx + 1}`}
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
                  <div className="flex flex-wrap justify-between items-center gap-3 pt-3 sm:pt-4 pb-3 px-4 sm:px-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white shadow-inner rounded-b-xl">
                    <div>
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-bold text-base sm:text-lg text-gray-800">₹{order.total?.toFixed(2) || '0.00'}</div>
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
                    <div className="flex flex-wrap gap-2 min-h-[44px] sm:min-h-0 items-center">
                      <ActionButtons
                        order={order}
                        isCard={true}
                        confirmOrderModalRef={confirmOrderModalRef}
                        handlePrintKOT={handlePrintKOT}
                        handlePrintBill={handlePrintBill}
                        onlineBillModalRef={onlineBillModalRef}
                        restaurant={restaurant}
                        handleQuickAction={handleQuickAction}
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-lg border border-gray-200" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[640px] divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider sm:whitespace-nowrap hidden sm:table-cell">Order ID</th>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 w-3/12 sm:w-auto text-left font-medium text-gray-500 uppercase tracking-wider sm:whitespace-nowrap">
                    <span className="sm:hidden">Table</span>
                    <span className="hidden sm:inline">Customer</span>
                  </th>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 w-3/12 sm:w-auto text-left font-medium text-gray-500 uppercase tracking-wider sm:whitespace-nowrap hidden sm:table-cell">Items</th>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 w-2/12 sm:w-auto text-left font-medium text-gray-500 uppercase tracking-wider sm:whitespace-nowrap">Total</th>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 w-3/12 sm:w-auto text-left font-medium text-gray-500 uppercase tracking-wider sm:whitespace-nowrap">Status</th>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 w-2/12 sm:w-auto text-left font-medium text-gray-500 uppercase tracking-wider sm:whitespace-nowrap hidden sm:table-cell">Date</th>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 w-4/12 sm:w-auto text-left font-medium text-gray-500 uppercase tracking-wider sm:whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrders.map((order) => {
                  const nextStatusOptions = getNextStatusOptions(order.status);
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 sm:px-6 sm:py-4 sm:whitespace-nowrap font-medium text-gray-900 hidden sm:table-cell">
                          {order.order_number || order.id.slice(0, 8)}
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 sm:whitespace-nowrap text-gray-500 w-3/12 sm:w-auto">
                          {/* Mobile: show Table number; Desktop: show Customer (+table badge) */}
                          <span className="sm:hidden text-gray-700 font-medium">
                            {(order.table_number || order.tableNumber) ? `Table ${order.table_number || order.tableNumber}` : '-'}
                          </span>
                          {/* Mobile Compact Card */}
                          <div className="block sm:hidden mb-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden status-card-mobile h-fit">
                            <div
                              className="p-3 flex items-start gap-3 active:bg-gray-50 transition-colors"
                              onClick={() => toggleOrderExpansion(order.id)}
                            >
                              <div className="flex-shrink-0 pt-0.5">
                                <div className={`w-2 h-10 rounded-full ${STATUS_META[order.status]?.bg || 'bg-gray-200'}`}></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-gray-900 text-sm">#{order.order_number || order.id.slice(0, 8)}</span>
                                  {getStatusBadge(order.status)}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                                  <Clock size={12} />
                                  <span>{format(new Date(order.created_at), 'h:mm a')}</span>
                                  <span>•</span>
                                  <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {order.table_number ? `T-${order.table_number}` : 'Takeaway'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600 truncate max-w-[120px]">{order.customer_name || 'Guest'}</span>
                                  <span className="font-bold text-gray-900">₹{Math.round(order.total)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions for Pending Orders (Mobile Only) */}
                            {order.status === 'pending' && (
                              <div className="flex gap-2 px-3 pb-3">
                                <button
                                  disabled={itemProcessing === order.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAction(order, 'accept');
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg font-bold text-xs active:bg-green-100 transition-colors border border-green-100 shadow-sm disabled:opacity-50"
                                >
                                  {itemProcessing === order.id ? (
                                    <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                  Accept
                                </button>
                                <button
                                  disabled={itemProcessing === order.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmOrderModalRef.current?.open(order, 'rejected');
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-700 rounded-lg font-bold text-xs active:bg-red-100 transition-colors border border-red-100 shadow-sm disabled:opacity-50"
                                >
                                  <X size={14} /> Reject
                                </button>
                              </div>
                            )}

                            {/* Expanded Section */}
                            {expandedOrderId === order.id && (
                              <div className="bg-gray-50/50 border-t border-gray-100 px-3 py-2 animate-in slide-in-from-top-1 duration-200">
                                {/* Customer Info Row */}
                                {(order.customer_email || order.customer_phone) && (
                                  <div className="flex gap-3 mb-3 text-xs text-gray-500 pb-2 border-b border-gray-100/50">
                                    {order.customer_phone && <span className="flex items-center gap-1"><Phone size={10} /> {order.customer_phone}</span>}
                                    {order.customer_email && <span className="flex items-center gap-1 truncate"><Mail size={10} /> {order.customer_email}</span>}
                                  </div>
                                )}

                                {/* Items List */}
                                <div className="space-y-1.5 mb-3">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs items-start">
                                      <div className="flex gap-2 leading-tight">
                                        <span className="font-semibold text-gray-900 min-w-[20px]">{item.quantity}x</span>
                                        <span className="text-gray-700 line-clamp-1">{item.name}</span>
                                      </div>
                                      <span className="text-gray-500 font-medium">₹{Math.round(item.price * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                  <ActionButtons
                                    order={order}
                                    isCard={true}
                                    confirmOrderModalRef={confirmOrderModalRef}
                                    handlePrintKOT={handlePrintKOT}
                                    handlePrintBill={handlePrintBill}
                                    onlineBillModalRef={onlineBillModalRef}
                                    restaurant={restaurant}
                                    handleQuickAction={handleQuickAction}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="hidden sm:inline">
                            {order.customer_name || 'Guest'}
                            {(order.table_number || order.tableNumber) && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                Table {order.table_number || order.tableNumber}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 hidden sm:table-cell sm:whitespace-nowrap w-3/12 sm:w-auto">
                          <div className="flex items-center">
                            <div className="flex space-x-1">
                              {(order.items || []).slice(0, 3).map((item, idx) => (
                                <div key={idx} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-gray-200">
                                  <img
                                    src={item.image || `/api/placeholder/32/32`}
                                    alt={item.name || `Item ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {(order.items || []).length > 3 && (
                                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 text-[10px] sm:text-xs font-medium text-gray-600">
                                  +{(order.items || []).length - 3}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="ml-2 text-[11px] sm:text-xs text-orange-500 hover:text-orange-600 hidden sm:inline-flex"
                            >
                              {expandedOrderId === order.id ? (
                                <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px]" />
                              ) : (
                                <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px]" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 sm:whitespace-nowrap text-gray-500 w-2/12 sm:w-auto">
                          ₹{order.total?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 sm:whitespace-nowrap w-3/12 sm:w-auto">
                          <div className="text-[10px] sm:text-xs leading-tight">
                            {getStatusBadge(order.status || 'pending')}
                          </div>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 sm:whitespace-nowrap text-gray-500 hidden sm:table-cell w-2/12 sm:w-auto">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-2 py-3 sm:px-6 sm:py-4 sm:whitespace-nowrap font-medium w-4/12 sm:w-auto">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Mobile expand button - touch-friendly */}
                            <button
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="inline-flex sm:hidden min-h-[44px] min-w-[44px] items-center justify-center p-2 rounded-lg text-orange-600 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 touch-manipulation"
                              title={expandedOrderId === order.id ? 'Collapse' : 'Expand'}
                              aria-expanded={expandedOrderId === order.id}
                            >
                              {expandedOrderId === order.id ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronRight size={18} />
                              )}
                            </button>
                            <ActionButtons
                              order={order}
                              confirmOrderModalRef={confirmOrderModalRef}
                              handlePrintKOT={handlePrintKOT}
                              handlePrintBill={handlePrintBill}
                              onlineBillModalRef={onlineBillModalRef}
                              restaurant={restaurant}
                              handleQuickAction={handleQuickAction}
                            />
                          </div>
                        </td>
                      </tr>
                      {/* Expanded row */}
                      {expandedOrderId === order.id && (
                        <tr>
                          <td colSpan="7" className="px-3 sm:px-6 py-3 bg-gray-50">
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
                                  ) : order.payment_method?.toLowerCase() === 'upi' ? (
                                    <span className="text-blue-600">UPI</span>
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

      {/* Create Order Modal - full-screen on mobile/tablet, centered on desktop */}
      {
        showCreateOrderModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 safe-area-inset">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
              onClick={() => { setShowCreateOrderModal(false); resetCreateOrder(); }}
              aria-hidden
            />
            <div className="relative bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-6xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col mx-auto">
              {/* Premium Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 bg-orange-50 rounded-xl shadow-inner shadow-orange-200/50">
                    <ShoppingBag size={20} className="text-orange-600 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Create Order</h3>
                    <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      <p className="text-gray-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">{coStep === 1 ? 'Step 1: Selection' : 'Step 2: Checkout'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="hidden md:flex items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100/50">
                    <button onClick={() => setCoStep(1)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${coStep === 1 ? 'bg-white shadow-xl shadow-orange-500/10 text-orange-600' : 'text-gray-400 font-bold hover:text-gray-600'}`}>Items</button>
                    <button disabled={selectedItemsArray.length === 0} onClick={() => setCoStep(2)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${coStep === 2 ? 'bg-white shadow-xl shadow-orange-500/10 text-orange-600' : 'text-gray-400 font-bold hover:text-gray-600 disabled:opacity-30'}`}>Details</button>
                  </div>
                  <button className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100" onClick={() => { setShowCreateOrderModal(false); resetCreateOrder(); }}><X size={18} className="sm:w-5 sm:h-5" /></button>
                </div>
              </div>

              {/* Progress */}
              <div className="h-1 bg-gray-100 flex-shrink-0">
                <div className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 transition-all duration-700 ease-out" style={{ width: `${(coStep / 2) * 100}%` }} />
              </div>

              <div className="flex-1 overflow-auto bg-gray-50/30">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-6 p-3 sm:p-6 h-full">

                  {/* Left: Menu Selection (Visible in Step 1) */}
                  {coStep === 1 && (
                    <div className="lg:col-span-3 flex flex-col min-h-0 sm:h-[68vh] animate-in slide-in-from-left-4 duration-500">
                      <div className="flex flex-col mb-4 sticky top-0 z-10 bg-transparent">
                        <div className="relative flex-1 group mb-3">
                          <input value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} placeholder="Search food..." className="w-full bg-white border border-gray-100 shadow-sm rounded-xl px-3 py-2.5 pl-9 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-bold placeholder:text-gray-300 text-xs sm:text-sm sm:px-4 sm:py-3 sm:pl-10" />
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors sm:left-3.5 sm:w-4.5 sm:h-4.5" />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                          <button
                            onClick={() => setItemCategoryFilter('all')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${itemCategoryFilter === 'all' ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/20' : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200 hover:text-orange-500'}`}
                          >
                            All <span className={`px-1 rounded-md text-[8px] ${itemCategoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>{categoryCounts.all}</span>
                          </button>
                          {menuCategories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setItemCategoryFilter(cat)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${itemCategoryFilter === cat ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/20' : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200 hover:text-orange-500'}`}
                            >
                              {cat} <span className={`px-1 rounded-md text-[8px] ${itemCategoryFilter === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>{categoryCounts[cat]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 overflow-auto no-scrollbar pr-2">
                        {menuLoading ? (
                          <div className="flex flex-col items-center justify-center py-20"><div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div></div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                            {filteredMenuItems.map(mi => (
                              <div key={mi.id} className="group bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2 transition-all hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-900/5 cursor-pointer h-full" onClick={() => addItem(mi)}>
                                <div className="relative h-20 sm:h-28 w-full flex-shrink-0">
                                  {mi.image ? (
                                    <img src={mi.image} alt={mi.name} className="h-full w-full rounded-xl object-cover" />
                                  ) : (
                                    <div className="h-full w-full rounded-xl bg-orange-50 flex items-center justify-center"><ShoppingBag size={20} className="text-orange-200" /></div>
                                  )}
                                  {((mi.discounted_price ?? mi.discountedPrice) && Number(mi.discounted_price ?? mi.discountedPrice) < Number(mi.price)) && (
                                    <div className="absolute top-2 left-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase tracking-tight">
                                      {mi.discounttype === 'Percentage' ? `${mi.discountvalue}% OFF` : `₹${Number(mi.price) - Number(mi.discounted_price ?? mi.discountedPrice)} OFF`}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div className="mb-2">
                                    <h4 className="font-black text-gray-900 truncate group-hover:text-orange-600 transition-colors uppercase text-[11px] leading-tight tracking-tight">{mi.name}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">{mi.category}</span>
                                      {mi.tags && Array.isArray(mi.tags) && mi.tags.slice(0, 2).map(tag => {
                                        const tagLower = tag.toLowerCase();
                                        const isVeg = tagLower === 'veg' || tagLower.includes('vegetarian');
                                        const isNonVeg = tagLower === 'non-veg' || tagLower.includes('chicken') || tagLower.includes('meat');
                                        return (
                                          <span key={tag} className={`text-[7px] font-black uppercase tracking-tighter px-1 rounded ${isVeg ? 'bg-green-50 text-green-600' : isNonVeg ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-500/70'}`}>
                                            {tag}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-auto">
                                    <span className="font-black text-sm text-gray-900">₹{Number(mi.discounted_price || mi.price).toFixed(0)}</span>
                                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-0.5 rounded-lg">
                                      <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); decrementItem(mi.id); }}><Minus size={12} /></button>
                                      <span className="w-4 text-center text-[10px] font-black">{selectedItems[mi.id]?.quantity || 0}</span>
                                      <button className="w-6 h-6 bg-white shadow-sm border border-gray-100 flex items-center justify-center text-orange-600 hover:bg-orange-600 hover:text-white transition-all rounded-md" onClick={(e) => { e.stopPropagation(); addItem(mi); }}><Plus size={12} /></button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Right Column: Customer Details (Visible in Step 2) */}
                  <div className={`${coStep === 2 ? 'lg:col-span-3' : 'hidden'} flex flex-col min-h-0 sm:h-[68vh]`}>

                    {/* STEP 2 ONLY: CUSTOMER INFO TOP */}
                    {coStep === 2 && (
                      <div className="bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 mb-3 sm:mb-4 shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3 mb-4 sm:mb-6">
                          <div className="p-2 bg-orange-100 rounded-lg"><User size={16} className="text-orange-600 sm:w-4.5 sm:h-4.5" /></div>
                          <h4 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">Customer & Table</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                          <div className="relative">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-2 ml-1">Table No.</label>
                            <button onClick={() => setShowTableDropdown(!showTableDropdown)} className="w-full flex justify-between items-center px-4 py-2.5 sm:py-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-white hover:border-orange-500/50 transition-all group shadow-inner">
                              <span className={`font-black text-xs sm:text-sm ${coTableNumber ? 'text-gray-900' : 'text-gray-300'}`}>{coTableNumber ? `Table ${coTableNumber}` : 'Assign Table'}</span>
                              <ChevronDown size={14} className={`text-gray-300 transition-transform sm:w-4 sm:h-4 ${showTableDropdown ? 'rotate-180 text-orange-500' : ''}`} />
                            </button>
                            {showTableDropdown && (
                              <div className="absolute z-[120] top-full mt-2 w-full bg-white border border-gray-100 rounded-[1.75rem] shadow-2xl p-2 animate-in fade-in zoom-in-95 overflow-hidden">
                                <div className="p-2 border-b border-gray-50 mb-1"><input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Find table..." className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold" /></div>
                                <div className="max-h-52 overflow-auto no-scrollbar">
                                  {filteredTables.map(t => (
                                    <button key={`t-${t.tableNumber}`} onClick={() => { setCoTableNumber(t.tableNumber); setShowTableDropdown(false); }} className={`w-full flex justify-between items-center px-4 py-3 rounded-xl mb-1 transition-all ${coTableNumber === t.tableNumber ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'hover:bg-orange-50 text-gray-700'}`}>
                                      <span className="font-black text-sm uppercase">Table {t.tableNumber}</span>
                                      <span className="text-[10px] font-bold opacity-70">{t.capacity} Seats</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-2 ml-1">Guest Name</label>
                            <input value={coCustomerName} onChange={(e) => setCoCustomerName(e.target.value)} placeholder="Optional" className="w-full px-4 py-2.5 sm:py-3 bg-gray-50/50 border border-gray-100 rounded-xl font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all shadow-inner text-xs sm:text-sm" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-2 ml-1">Guest Email</label>
                            <input value={coCustomerEmail} onChange={(e) => setCoCustomerEmail(e.target.value)} placeholder="Optional" className="w-full px-4 py-2.5 sm:py-3 bg-gray-50/50 border border-gray-100 rounded-xl font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all shadow-inner text-xs sm:text-sm" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-2 ml-1">Contact No.</label>
                            <input value={coCustomerPhone} onChange={(e) => setCoCustomerPhone(e.target.value.replace(/\D/g, ''))} placeholder="Optional" className="w-full px-4 py-2.5 sm:py-3 bg-gray-50/50 border border-gray-100 rounded-xl font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all shadow-inner text-xs sm:text-sm" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-2 ml-1">Discount</label>
                            <div className="flex gap-2">
                              <select value={coDiscountType} onChange={(e) => setCoDiscountType(e.target.value)} className="bg-gray-50/50 border border-gray-100 rounded-xl px-2 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black text-orange-600 shadow-inner appearance-none cursor-pointer">
                                <option value="percentage">%</option>
                                <option value="flat">₹</option>
                              </select>
                              <input value={coDiscountType === 'percentage' ? coDiscountPercentage : coDiscountFlat} onChange={(e) => coDiscountType === 'percentage' ? setCoDiscountPercentage(e.target.value) : setCoDiscountFlat(e.target.value)} placeholder="0" className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-50/50 border border-gray-100 rounded-xl font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all shadow-inner text-xs sm:text-sm" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-4">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-2 ml-1">Special Instructions</label>
                          <textarea value={coSpecialInstructions} onChange={(e) => setCoSpecialInstructions(e.target.value)} placeholder="e.g. Less oil..." className="w-full px-4 py-2.5 sm:py-3 bg-gray-50/50 border border-gray-100 rounded-xl font-bold text-gray-800 transition-all focus:bg-white shadow-inner resize-none min-h-[44px] text-xs sm:text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Block - Sticky on desktop */}
                  <div className="lg:col-span-1 flex flex-col min-h-0 sm:h-[68vh]">
                    <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-xl shadow-gray-200/30">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg"><Package size={16} className="text-gray-400 sm:w-4.5 sm:h-4.5" /></div>
                          <h4 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">Order Summary</h4>
                        </div>
                        {selectedItemsArray.length > 0 && <button onClick={() => setSelectedItems({})} className="text-[10px] font-black text-gray-300 hover:text-red-500 uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-red-50 transition-all">Clear</button>}
                      </div>

                      <div className="flex-1 overflow-auto no-scrollbar space-y-4 mb-8 pr-2">
                        {selectedItemsArray.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full opacity-20 py-20 text-center"><ShoppingBag size={80} strokeWidth={1} /><p className="mt-4 font-black uppercase tracking-widest text-[10px]">Your cart is empty.<br />Select some food items!</p></div>
                        ) : (
                          <div className="space-y-4">
                            {selectedItemsArray.map(si => (
                              <div key={`order-item-${si.id}`} className="group relative bg-gray-50/50 border border-transparent rounded-[1.25rem] sm:rounded-[1.75rem] p-3 sm:p-5 flex justify-between items-center transition-all hover:bg-white hover:border-orange-100 hover:shadow-xl hover:shadow-orange-900/5">
                                <div className="min-w-0 pr-2 sm:pr-4">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="bg-orange-600 text-white font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[8px] sm:text-[10px]">x{si.quantity}</span>
                                    <span className="font-black text-gray-900 truncate uppercase text-xs sm:text-sm">{si.name}</span>
                                  </div>
                                  <span className="text-[8px] font-black text-gray-300 uppercase mt-1 sm:mt-2 block tracking-widest ml-10 sm:ml-12">{si.category}</span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-black text-gray-900 text-sm mb-1">₹{(Number(si.price) * si.quantity).toFixed(0)}</div>
                                  <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <button onClick={() => decrementItem(si.id)} className="w-6 h-6 bg-red-50 text-red-500 rounded-md flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Minus size={10} /></button>
                                    <button onClick={() => addItem(si)} className="w-6 h-6 bg-orange-600 text-white rounded-md flex items-center justify-center hover:shadow-lg shadow-orange-500/20 transition-all"><Plus size={10} /></button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Total Card */}
                      <div className="bg-gray-900 rounded-[1.25rem] sm:rounded-[1.75rem] p-3.5 sm:p-6 text-white shadow-2xl border border-white/5">
                        <div className="flex flex-col w-full">
                          {/* Top Metrics Row: Grid on mobile, stacked on desktop */}
                          <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-white/10 md:flex md:flex-col md:gap-1 md:border-0 md:pb-0 md:mb-4">
                            <div className="flex flex-col md:flex-row md:justify-between">
                              <span className="text-[7px] md:text-[10px] font-black text-white/30 uppercase tracking-widest">Subtotal</span>
                              <span className="font-black text-[10px] md:text-sm text-white">₹{selectedOrderTotals.subtotal.toFixed(0)}</span>
                            </div>
                            <div className="flex flex-col md:flex-row md:justify-between">
                              <span className="text-[7px] md:text-[10px] font-black text-green-400/50 uppercase tracking-widest">Saving</span>
                              <span className="font-black text-[10px] md:text-sm text-green-400">-₹{selectedOrderTotals.discountAmount.toFixed(0)}</span>
                            </div>
                            <div className="flex flex-col md:flex-row md:justify-between">
                              <span className="text-[7px] md:text-[10px] font-black text-white/30 uppercase tracking-widest">Tax (5%)</span>
                              <span className="font-black text-[10px] md:text-sm text-white">₹{(selectedOrderTotals.cgst + selectedOrderTotals.sgst).toFixed(0)}</span>
                            </div>
                          </div>

                          {/* Bottom Row: Total & Action */}
                          <div className="flex items-center justify-between gap-3 md:flex-col md:items-stretch md:gap-4 md:border-t md:border-white/10 md:pt-4">
                            <div className="flex flex-col min-w-max">
                              <span className="text-[7px] md:text-[10px] font-black text-orange-500 uppercase tracking-widest">Total Amount</span>
                              <span className="font-black text-xl md:text-3xl text-white tracking-tighter leading-none">₹{selectedOrderTotals.finalTotal.toFixed(0)}</span>
                            </div>

                            <div className="flex-1 md:w-full">
                              {coStep === 1 ? (
                                <button disabled={selectedItemsArray.length === 0} onClick={() => setCoStep(2)} className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 text-white font-black py-3 sm:py-4 rounded-xl transition-all shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 uppercase text-[9px] sm:text-[10px] tracking-[0.1em] active:scale-95 group">Next <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></button>
                              ) : (
                                <div className="flex gap-2">
                                  <button onClick={() => setCoStep(1)} className="px-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl text-white/50 font-black uppercase text-[8px] sm:text-[9px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center"><ChevronLeft size={14} className="sm:hidden" /><span className="hidden sm:inline">Back</span></button>
                                  <button disabled={creatingOrder || !coTableNumber} onClick={handleCreateOrderSubmit} className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 text-white font-black py-3 sm:py-4 rounded-xl shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 uppercase text-[9px] sm:text-[10px] tracking-[0.1em] active:scale-95 whitespace-nowrap">{creatingOrder ? 'Wait...' : 'Place Order'}</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      <ConfirmOrderModal ref={confirmOrderModalRef} onConfirm={handleStatusUpdate} onSuccess={applyOptimisticStatus} />
      <OnlineBillModal ref={onlineBillModalRef} restaurant={restaurant} triggeredBy={triggeredBy} />
    </div>
  );
};

export default OrderManagement;

