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
    markAsUnread,
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

  // Get category colors
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Inquiries': return 'bg-pink-100 text-pink-700';
      case 'Registrations': return 'bg-amber-100 text-amber-700';
      case 'Subscriptions': return 'bg-emerald-100 text-emerald-700';
      case 'Restaurants': return 'bg-indigo-100 text-indigo-700';
      case 'Staff': return 'bg-teal-100 text-teal-700';
      case 'Features': return 'bg-blue-100 text-blue-700';
      case 'Payments': return 'bg-emerald-100 text-emerald-700';
      case 'Emails': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
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
    <div className="w-full h-full md:p-6 lg:max-w-[1600px] mx-auto">
      {/* Stats Cards */}
      {/* Stats Cards - Compact on Mobile */}
      <div className="grid grid-cols-4 gap-1 md:gap-3 px-1 md:px-0 mt-1 md:mt-2 pb-2 md:pb-0">
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


      {/* Filters, Sort & Actions - Single Line on Desktop */}
      <div className="bg-white border-y md:border md:rounded-xl border-gray-200 md:shadow-sm mb-2 md:mb-3 mt-2 md:mt-4 overflow-x-auto no-scrollbar">
        <div className="p-2 md:p-3 md:border-b md:border-gray-100 min-w-max">
          <div className="flex items-center gap-2 sm:gap-3">


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

            {/* Clear Old - Mobile Only */}
            <button
              onClick={clearOldNotifications}
              className="md:hidden flex items-center justify-center shrink-0 w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
              title="Clear old"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Sort */}
            <div className="flex items-center gap-2 shrink-0 border-l border-gray-200 pl-2 sm:pl-3">
              <button
                onClick={() => toggleSort('date')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs md:text-sm font-medium transition-all whitespace-nowrap ${sortBy === 'date'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Clock className="w-4 h-4" />
                <span className="inline">Date</span>
                {sortBy === 'date' && (
                  sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => toggleSort('type')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs md:text-sm font-medium transition-all whitespace-nowrap ${sortBy === 'type'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="inline">Type</span>
                {sortBy === 'type' && (
                  sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Actions (Refresh, Mark Read, Clear) */}
            <div className="flex items-center gap-2 shrink-0 border-l border-gray-200 pl-2 sm:pl-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-xs md:text-sm font-medium whitespace-nowrap"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={clearOldNotifications}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-xs md:text-sm font-medium whitespace-nowrap"
                title="Clear notifications older than 30 days"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Clear old</span>
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
        <div className="px-2 py-2 md:px-3 md:py-2.5 border-b border-gray-100 flex items-center justify-between text-xs md:text-sm text-gray-500">
          <div className="flex items-center gap-3 md:gap-4">
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
                className={`group flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-2.5 md:py-3 md:px-3 transition-all cursor-pointer border-b border-gray-100 last:border-0 ${notification.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Checkbox & Icon */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex-shrink-0">
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
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className={`flex-shrink-0 p-2 rounded-xl border ${notification.read ? 'bg-gray-50 border-gray-100' : 'bg-white border-blue-100 shadow-sm'}`}>
                    {React.cloneElement(getNotificationIcon(notification.type), {
                      className: "w-4 h-4 " + getNotificationIcon(notification.type).props.className.split(' ').filter(c => !c.startsWith('w-') && !c.startsWith('h-')).join(' ')
                    })}
                  </div>

                  {/* Mobile-only tags & status */}
                  <div className="flex-1 md:hidden flex items-center justify-between min-w-0 pr-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${getCategoryColor(getCategoryForType(notification.type))
                      }`}>
                      {getCategoryForType(notification.type)}
                    </span>
                    {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 pl-10 md:pl-0">
                  {/* Desktop-only tags */}
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${getCategoryColor(getCategoryForType(notification.type))
                      }`}>
                      {getCategoryForType(notification.type)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
                    <h4 className={`text-sm md:text-[15px] font-semibold truncate ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h4>
                    <span className="hidden md:inline text-gray-300 mx-1">•</span>
                    <p className={`text-xs md:text-[13px] truncate ${notification.read ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                      {notification.message}
                    </p>
                  </div>
                </div>

                {/* Right Actions & Date */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pl-10 md:pl-0 mt-2 md:mt-0">
                  <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1.5" title={formatFullDate(notification.created_at)}>
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimeAgo(notification.created_at)}
                  </span>

                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        notification.read ? markAsUnread(notification.id) : markAsRead(notification.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${notification.read
                        ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        }`}
                      title={notification.read ? "Mark as unread" : "Mark as read"}
                    >
                      {notification.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-1" />
                  </div>
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
