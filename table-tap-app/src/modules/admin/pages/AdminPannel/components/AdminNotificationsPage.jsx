import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellOff,
  X,
  Check,
  CheckCheck,
  MessageSquare,
  CreditCard,
  Building2,
  ClipboardList,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Calendar,
  IndianRupee,
  UserPlus,
  Users,
  UserCheck,
  Power,
  PowerOff,
  Brain,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  XCircle,
  CheckCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  Clock,
  ArrowUpDown,
  Loader2,
  Inbox,
  MailCheck,
  MailX
} from 'lucide-react';
import { useAdminNotifications, NOTIFICATION_TYPES } from '../../../context/AdminNotificationContext';

const AdminNotificationsPage = ({ onTabChange, searchTerm }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    clearOldNotifications
  } = useAdminNotifications();

  // State for filters and sorting
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, read, unread
  const [sortBy, setSortBy] = useState('date'); // date, type
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notification type categories for grouping in filter
  const notificationCategories = {
    'Inquiries': [
      { type: NOTIFICATION_TYPES.NEW_INQUIRY, label: 'New Inquiry' },
      { type: NOTIFICATION_TYPES.INQUIRY_CONVERTED, label: 'Lead Converted' }
    ],
    'Registrations': [
      { type: NOTIFICATION_TYPES.NEW_REGISTRATION, label: 'New Registration' },
      { type: NOTIFICATION_TYPES.REGISTRATION_APPROVED, label: 'Approved' },
      { type: NOTIFICATION_TYPES.REGISTRATION_REJECTED, label: 'Rejected' }
    ],
    'Subscriptions': [
      { type: NOTIFICATION_TYPES.NEW_SUBSCRIPTION, label: 'New Subscription' },
      { type: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED, label: 'Renewed' },
      { type: NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED, label: 'Cancelled' },
      { type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED, label: 'Expired' },
      { type: NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED, label: 'Upgraded' },
      { type: NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED, label: 'Downgraded' }
    ],
    'Restaurants': [
      { type: NOTIFICATION_TYPES.NEW_RESTAURANT, label: 'New Restaurant' },
      { type: NOTIFICATION_TYPES.RESTAURANT_ACTIVATED, label: 'Activated' },
      { type: NOTIFICATION_TYPES.RESTAURANT_DEACTIVATED, label: 'Deactivated' }
    ],
    'Staff': [
      { type: NOTIFICATION_TYPES.NEW_STAFF, label: 'New Staff' },
      { type: NOTIFICATION_TYPES.STAFF_CONNECTED, label: 'Staff Connected' }
    ],
    'Features': [
      { type: NOTIFICATION_TYPES.AI_ENABLED, label: 'AI Enabled' },
      { type: NOTIFICATION_TYPES.AI_DISABLED, label: 'AI Disabled' },
      { type: NOTIFICATION_TYPES.AGGREGATORS_ENABLED, label: 'Aggregators Enabled' },
      { type: NOTIFICATION_TYPES.AGGREGATORS_DISABLED, label: 'Aggregators Disabled' }
    ],
    'Payments': [
      { type: NOTIFICATION_TYPES.PAYMENT_RECEIVED, label: 'Payment Received' },
      { type: NOTIFICATION_TYPES.PAYMENT_FAILED, label: 'Payment Failed' }
    ],
    'Emails': [
      { type: NOTIFICATION_TYPES.EMAIL_SENT, label: 'Email Sent' },
      { type: NOTIFICATION_TYPES.EMAIL_FAILED, label: 'Email Failed' }
    ]
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_INQUIRY:
        return <MessageSquare className="w-5 h-5 text-pink-500" />;
      case NOTIFICATION_TYPES.INQUIRY_CONVERTED:
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case NOTIFICATION_TYPES.NEW_REGISTRATION:
        return <ClipboardList className="w-5 h-5 text-amber-500" />;
      case NOTIFICATION_TYPES.REGISTRATION_APPROVED:
        return <Check className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.REGISTRATION_REJECTED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case NOTIFICATION_TYPES.NEW_SUBSCRIPTION:
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED:
        return <X className="w-5 h-5 text-red-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING:
        return <Calendar className="w-5 h-5 text-amber-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED:
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED:
        return <TrendingDown className="w-5 h-5 text-gray-500" />;
      case NOTIFICATION_TYPES.NEW_RESTAURANT:
        return <Building2 className="w-5 h-5 text-purple-500" />;
      case NOTIFICATION_TYPES.RESTAURANT_ACTIVATED:
        return <Power className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.RESTAURANT_DEACTIVATED:
        return <PowerOff className="w-5 h-5 text-gray-500" />;
      case NOTIFICATION_TYPES.NEW_STAFF:
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case NOTIFICATION_TYPES.STAFF_CONNECTED:
        return <UserCheck className="w-5 h-5 text-teal-500" />;
      case NOTIFICATION_TYPES.AI_ENABLED:
        return <Brain className="w-5 h-5 text-indigo-500" />;
      case NOTIFICATION_TYPES.AI_DISABLED:
        return <Brain className="w-5 h-5 text-gray-400" />;
      case NOTIFICATION_TYPES.AGGREGATORS_ENABLED:
        return <ShoppingBag className="w-5 h-5 text-orange-500" />;
      case NOTIFICATION_TYPES.AGGREGATORS_DISABLED:
        return <ShoppingBag className="w-5 h-5 text-gray-400" />;
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        return <IndianRupee className="w-5 h-5 text-emerald-500" />;
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        return <IndianRupee className="w-5 h-5 text-red-500" />;
      case NOTIFICATION_TYPES.EMAIL_SENT:
        return <MailCheck className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.EMAIL_FAILED:
        return <MailX className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get background color for notification type
  const getNotificationBg = (type, read) => {
    if (read) return 'bg-white hover:bg-gray-50';

    switch (type) {
      case NOTIFICATION_TYPES.NEW_INQUIRY:
        return 'bg-pink-50 hover:bg-pink-100';
      case NOTIFICATION_TYPES.INQUIRY_CONVERTED:
        return 'bg-emerald-50 hover:bg-emerald-100';
      case NOTIFICATION_TYPES.NEW_REGISTRATION:
        return 'bg-amber-50 hover:bg-amber-100';
      case NOTIFICATION_TYPES.REGISTRATION_APPROVED:
        return 'bg-green-50 hover:bg-green-100';
      case NOTIFICATION_TYPES.REGISTRATION_REJECTED:
        return 'bg-red-50 hover:bg-red-100';
      case NOTIFICATION_TYPES.NEW_SUBSCRIPTION:
        return 'bg-green-50 hover:bg-green-100';
      case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
        return 'bg-blue-50 hover:bg-blue-100';
      case NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED:
        return 'bg-red-50 hover:bg-red-100';
      case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
        return 'bg-orange-50 hover:bg-orange-100';
      case NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED:
        return 'bg-purple-50 hover:bg-purple-100';
      case NOTIFICATION_TYPES.NEW_RESTAURANT:
        return 'bg-purple-50 hover:bg-purple-100';
      case NOTIFICATION_TYPES.RESTAURANT_ACTIVATED:
        return 'bg-green-50 hover:bg-green-100';
      case NOTIFICATION_TYPES.NEW_STAFF:
        return 'bg-blue-50 hover:bg-blue-100';
      case NOTIFICATION_TYPES.STAFF_CONNECTED:
        return 'bg-teal-50 hover:bg-teal-100';
      case NOTIFICATION_TYPES.AI_ENABLED:
        return 'bg-indigo-50 hover:bg-indigo-100';
      case NOTIFICATION_TYPES.AGGREGATORS_ENABLED:
        return 'bg-orange-50 hover:bg-orange-100';
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        return 'bg-emerald-50 hover:bg-emerald-100';
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        return 'bg-red-50 hover:bg-red-100';
      case NOTIFICATION_TYPES.EMAIL_SENT:
        return 'bg-green-50 hover:bg-green-100';
      case NOTIFICATION_TYPES.EMAIL_FAILED:
        return 'bg-red-50 hover:bg-red-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  // Get type label
  const getTypeLabel = (type) => {
    for (const category of Object.values(notificationCategories)) {
      const found = category.find(item => item.type === type);
      if (found) return found.label;
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
  };

  // Get category for type
  const getCategoryForType = (type) => {
    for (const [category, types] of Object.entries(notificationCategories)) {
      if (types.some(item => item.type === type)) return category;
    }
    return 'Other';
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Format full date
  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(search) ||
        n.message?.toLowerCase().includes(search) ||
        getTypeLabel(n.type).toLowerCase().includes(search)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Status filter
    if (statusFilter === 'read') {
      filtered = filtered.filter(n => n.read);
    } else if (statusFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (sortBy === 'type') {
        const typeA = getTypeLabel(a.type);
        const typeB = getTypeLabel(b.type);
        return sortOrder === 'desc'
          ? typeB.localeCompare(typeA)
          : typeA.localeCompare(typeB);
      }
      return 0;
    });

    return filtered;
  }, [notifications, searchTerm, typeFilter, statusFilter, sortBy, sortOrder]);

  // Handle notification click - navigate to relevant section
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (onTabChange) {
      switch (notification.type) {
        case NOTIFICATION_TYPES.NEW_INQUIRY:
        case NOTIFICATION_TYPES.INQUIRY_CONVERTED:
          onTabChange('inquiries');
          break;
        case NOTIFICATION_TYPES.NEW_REGISTRATION:
        case NOTIFICATION_TYPES.REGISTRATION_APPROVED:
        case NOTIFICATION_TYPES.REGISTRATION_REJECTED:
          onTabChange('registrations');
          break;
        case NOTIFICATION_TYPES.NEW_SUBSCRIPTION:
        case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
        case NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED:
        case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
        case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING:
        case NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED:
        case NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED:
        case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        case NOTIFICATION_TYPES.PAYMENT_FAILED:
          onTabChange('subscriptions');
          break;
        case NOTIFICATION_TYPES.NEW_RESTAURANT:
        case NOTIFICATION_TYPES.RESTAURANT_ACTIVATED:
        case NOTIFICATION_TYPES.RESTAURANT_DEACTIVATED:
        case NOTIFICATION_TYPES.AI_ENABLED:
        case NOTIFICATION_TYPES.AI_DISABLED:
        case NOTIFICATION_TYPES.AGGREGATORS_ENABLED:
        case NOTIFICATION_TYPES.AGGREGATORS_DISABLED:
          onTabChange('restaurants');
          break;
        case NOTIFICATION_TYPES.NEW_STAFF:
        case NOTIFICATION_TYPES.STAFF_CONNECTED:
          onTabChange('staff');
          break;
        case NOTIFICATION_TYPES.EMAIL_SENT:
        case NOTIFICATION_TYPES.EMAIL_FAILED:
          onTabChange('activity');
          break;
        default:
          break;
      }
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  // Handle mark selected as read
  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(id => markAsRead(id));
    setSelectedNotifications([]);
  };

  // Toggle sort order
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    return {
      total: notifications.length,
      unread: unreadCount,
      today: notifications.filter(n => new Date(n.created_at) >= today).length,
      thisWeek: notifications.filter(n => new Date(n.created_at) >= thisWeek).length
    };
  }, [notifications, unreadCount]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Actions Only */}
      <div className="mb-6 flex justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={clearOldNotifications}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-medium"
            title="Clear notifications older than 30 days"
          >
            <Trash2 className="w-4 h-4" />
            Clear old
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards - Compact on Mobile */}
      <div className="grid grid-cols-4 gap-1 md:gap-3 mt-4 md:mt-6 pb-2 md:pb-0">
        <div className="bg-white rounded-lg border border-gray-200 p-1.5 md:p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-1 md:p-2 bg-blue-100 rounded-lg mb-1">
            <Inbox className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm md:text-2xl font-bold text-gray-900 leading-none">{stats.total}</p>
            <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1 truncate w-full">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-1.5 md:p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-1 md:p-2 bg-red-100 rounded-lg mb-1">
            <Bell className="w-3.5 h-3.5 md:w-5 md:h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm md:text-2xl font-bold text-gray-900 leading-none">{stats.unread}</p>
            <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1 truncate w-full">Unread</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-1.5 md:p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-1 md:p-2 bg-green-100 rounded-lg mb-1">
            <Clock className="w-3.5 h-3.5 md:w-5 md:h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm md:text-2xl font-bold text-gray-900 leading-none">{stats.today}</p>
            <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1 truncate w-full">Today</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-1.5 md:p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="p-1 md:p-2 bg-purple-100 rounded-lg mb-1">
            <Calendar className="w-3.5 h-3.5 md:w-5 md:h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm md:text-2xl font-bold text-gray-900 leading-none">{stats.thisWeek}</p>
            <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1 truncate w-full">Week</p>
          </div>
        </div>
      </div>


      {/* Filters & Search */}
      <div className="md:bg-white md:rounded-2xl md:border md:border-gray-200 md:shadow-sm mb-4 md:mb-6">
        <div className="md:p-4 md:border-b md:border-gray-100">
          <div className="flex items-center justify-between gap-1 pb-1">


            {/* Type Filter */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="flex items-center justify-center gap-2 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-lg md:rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="hidden md:inline">{typeFilter === 'all' ? 'All Types' : getTypeLabel(typeFilter)}</span>
                </div>
                <ChevronDown className="hidden md:block w-4 h-4 text-gray-400 transition-transform" />
              </button>

              {showTypeDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={() => { setTypeFilter('all'); setShowTypeDropdown(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${typeFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                      All Types
                    </button>
                  </div>
                  {Object.entries(notificationCategories).map(([category, types]) => (
                    <div key={category} className="border-t border-gray-100">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        {category}
                      </div>
                      <div className="p-2">
                        {types.map(({ type, label }) => (
                          <button
                            key={type}
                            onClick={() => { setTypeFilter(type); setShowTypeDropdown(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${typeFilter === type ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                          >
                            {getNotificationIcon(type)}
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex flex-1 rounded-lg border border-gray-200 overflow-hidden shrink-0">
              {[
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`flex-1 px-1 py-1.5 md:px-4 md:py-2.5 text-[10px] md:text-sm font-medium transition-colors whitespace-nowrap text-center ${statusFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleSort('date')}
                className={`flex items-center justify-center gap-1.5 w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2.5 rounded-lg md:rounded-xl border text-xs md:text-sm font-medium transition-all whitespace-nowrap ${sortBy === 'date'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Clock className="w-4 h-4" />
                <span className="hidden md:inline">Date</span>
                {sortBy === 'date' && (
                  sortOrder === 'desc' ? <SortDesc className="w-3 h-3 absolute md:static top-0.5 right-0.5" /> : <SortAsc className="w-3 h-3 absolute md:static top-0.5 right-0.5" />
                )}
              </button>
              <button
                onClick={() => toggleSort('type')}
                className={`flex items-center justify-center gap-1.5 w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2.5 rounded-lg md:rounded-xl border text-xs md:text-sm font-medium transition-all whitespace-nowrap ${sortBy === 'type'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden md:inline">Type</span>
                {sortBy === 'type' && (
                  sortOrder === 'desc' ? <SortDesc className="w-3 h-3 absolute md:static top-0.5 right-0.5" /> : <SortAsc className="w-3 h-3 absolute md:static top-0.5 right-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkSelectedAsRead}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Mark as read
              </button>
              <button
                onClick={() => setSelectedNotifications([])}
                className="px-3 py-1.5 rounded-lg bg-white text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Select all</span>
            </label>
            <span>
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <BellOff className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">No notifications found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'You\'re all caught up!'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 transition-all cursor-pointer border-b border-gray-50 last:border-0 ${getNotificationBg(notification.type, notification.read)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Checkbox - Compact */}
                <div className="pt-0.5 md:pt-1">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedNotifications(prev =>
                        prev.includes(notification.id)
                          ? prev.filter(id => id !== notification.id)
                          : [...prev, notification.id]
                      );
                    }}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Icon - Smaller on Mobile */}
                <div className={`flex-shrink-0 p-2 md:p-2.5 rounded-xl ${notification.read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                  {React.cloneElement(getNotificationIcon(notification.type), {
                    className: "w-4 h-4 md:w-5 md:h-5 " + getNotificationIcon(notification.type).props.className.split(' ').filter(c => !c.startsWith('w-') && !c.startsWith('h-')).join(' ')
                  })}
                </div>

                {/* Content - Compact Typography */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm md:text-base font-semibold leading-tight mb-0.5 ${notification.read ? 'text-gray-600' : 'text-gray-900'} truncate`}>
                        {notification.title}
                      </h4>
                      <p className={`text-xs md:text-sm leading-relaxed ${notification.read ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="flex-shrink-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500 mt-1.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 mt-1.5 md:mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap ${notification.read ? 'bg-gray-100 text-gray-500' : 'bg-white/80 text-gray-600 border border-gray-100'
                      }`}>
                      {getCategoryForType(notification.type)}
                    </span>
                    <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap flex items-center gap-1" title={formatFullDate(notification.created_at)}>
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-0.5 md:gap-1">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Mark as read"
                    >
                      <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Click outside handler for dropdown */}
      {
        showTypeDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTypeDropdown(false)}
          />
        )
      }
    </div >
  );
};

export default AdminNotificationsPage;
