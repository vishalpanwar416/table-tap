import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
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
  MailCheck,
  MailX
} from 'lucide-react';
import { useAdminNotifications, NOTIFICATION_TYPES } from '../../../context/AdminNotificationContext';

const AdminNotificationBell = ({ onTabChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useAdminNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      // Inquiry notifications
      case NOTIFICATION_TYPES.NEW_INQUIRY:
        return <MessageSquare className="w-4 h-4 text-pink-500" />;
      case NOTIFICATION_TYPES.INQUIRY_CONVERTED:
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;

      // Registration notifications
      case NOTIFICATION_TYPES.NEW_REGISTRATION:
        return <ClipboardList className="w-4 h-4 text-amber-500" />;
      case NOTIFICATION_TYPES.REGISTRATION_APPROVED:
        return <Check className="w-4 h-4 text-green-500" />;
      case NOTIFICATION_TYPES.REGISTRATION_REJECTED:
        return <XCircle className="w-4 h-4 text-red-500" />;

      // Subscription notifications
      case NOTIFICATION_TYPES.NEW_SUBSCRIPTION:
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED:
        return <X className="w-4 h-4 text-red-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING:
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED:
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED:
        return <TrendingDown className="w-4 h-4 text-gray-500" />;

      // Restaurant notifications
      case NOTIFICATION_TYPES.NEW_RESTAURANT:
        return <Building2 className="w-4 h-4 text-purple-500" />;
      case NOTIFICATION_TYPES.RESTAURANT_ACTIVATED:
        return <Power className="w-4 h-4 text-green-500" />;
      case NOTIFICATION_TYPES.RESTAURANT_DEACTIVATED:
        return <PowerOff className="w-4 h-4 text-gray-500" />;

      // Staff notifications
      case NOTIFICATION_TYPES.NEW_STAFF:
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case NOTIFICATION_TYPES.STAFF_CONNECTED:
        return <UserCheck className="w-4 h-4 text-teal-500" />;

      // Feature notifications
      case NOTIFICATION_TYPES.AI_ENABLED:
        return <Brain className="w-4 h-4 text-indigo-500" />;
      case NOTIFICATION_TYPES.AI_DISABLED:
        return <Brain className="w-4 h-4 text-gray-400" />;
      case NOTIFICATION_TYPES.AGGREGATORS_ENABLED:
        return <ShoppingBag className="w-4 h-4 text-orange-500" />;
      case NOTIFICATION_TYPES.AGGREGATORS_DISABLED:
        return <ShoppingBag className="w-4 h-4 text-gray-400" />;

      // Payment notifications
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        return <IndianRupee className="w-4 h-4 text-emerald-500" />;
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        return <IndianRupee className="w-4 h-4 text-red-500" />;

      // Email notifications
      case NOTIFICATION_TYPES.EMAIL_SENT:
        return <MailCheck className="w-4 h-4 text-green-500" />;
      case NOTIFICATION_TYPES.EMAIL_FAILED:
        return <MailX className="w-4 h-4 text-red-500" />;

      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      // Inquiry
      case NOTIFICATION_TYPES.NEW_INQUIRY:
        return 'bg-pink-50 border-pink-200';
      case NOTIFICATION_TYPES.INQUIRY_CONVERTED:
        return 'bg-emerald-50 border-emerald-200';

      // Registration
      case NOTIFICATION_TYPES.NEW_REGISTRATION:
        return 'bg-amber-50 border-amber-200';
      case NOTIFICATION_TYPES.REGISTRATION_APPROVED:
        return 'bg-green-50 border-green-200';
      case NOTIFICATION_TYPES.REGISTRATION_REJECTED:
        return 'bg-red-50 border-red-200';

      // Subscription
      case NOTIFICATION_TYPES.NEW_SUBSCRIPTION:
        return 'bg-green-50 border-green-200';
      case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
        return 'bg-blue-50 border-blue-200';
      case NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED:
        return 'bg-red-50 border-red-200';
      case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
        return 'bg-orange-50 border-orange-200';
      case NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED:
        return 'bg-purple-50 border-purple-200';
      case NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED:
        return 'bg-gray-50 border-gray-200';

      // Restaurant
      case NOTIFICATION_TYPES.NEW_RESTAURANT:
        return 'bg-purple-50 border-purple-200';
      case NOTIFICATION_TYPES.RESTAURANT_ACTIVATED:
        return 'bg-green-50 border-green-200';
      case NOTIFICATION_TYPES.RESTAURANT_DEACTIVATED:
        return 'bg-gray-100 border-gray-200';

      // Staff
      case NOTIFICATION_TYPES.NEW_STAFF:
        return 'bg-blue-50 border-blue-200';
      case NOTIFICATION_TYPES.STAFF_CONNECTED:
        return 'bg-teal-50 border-teal-200';

      // Features
      case NOTIFICATION_TYPES.AI_ENABLED:
        return 'bg-indigo-50 border-indigo-200';
      case NOTIFICATION_TYPES.AI_DISABLED:
        return 'bg-gray-50 border-gray-200';
      case NOTIFICATION_TYPES.AGGREGATORS_ENABLED:
        return 'bg-orange-50 border-orange-200';
      case NOTIFICATION_TYPES.AGGREGATORS_DISABLED:
        return 'bg-gray-50 border-gray-200';

      // Payment
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        return 'bg-emerald-50 border-emerald-200';
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        return 'bg-red-50 border-red-200';

      // Email
      case NOTIFICATION_TYPES.EMAIL_SENT:
        return 'bg-green-50 border-green-200';
      case NOTIFICATION_TYPES.EMAIL_FAILED:
        return 'bg-red-50 border-red-200';

      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    // Navigate to relevant tab based on notification type
    if (onTabChange) {
      switch (notification.type) {
        // Inquiry notifications -> Inquiries tab
        case NOTIFICATION_TYPES.NEW_INQUIRY:
        case NOTIFICATION_TYPES.INQUIRY_CONVERTED:
          onTabChange('inquiries');
          break;

        // Registration notifications -> Registrations tab
        case NOTIFICATION_TYPES.NEW_REGISTRATION:
        case NOTIFICATION_TYPES.REGISTRATION_APPROVED:
        case NOTIFICATION_TYPES.REGISTRATION_REJECTED:
          onTabChange('registrations');
          break;

        // Subscription/Payment notifications -> Subscriptions tab
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

        // Restaurant/Feature notifications -> Restaurants tab
        case NOTIFICATION_TYPES.NEW_RESTAURANT:
        case NOTIFICATION_TYPES.RESTAURANT_ACTIVATED:
        case NOTIFICATION_TYPES.RESTAURANT_DEACTIVATED:
        case NOTIFICATION_TYPES.AI_ENABLED:
        case NOTIFICATION_TYPES.AI_DISABLED:
        case NOTIFICATION_TYPES.AGGREGATORS_ENABLED:
        case NOTIFICATION_TYPES.AGGREGATORS_DISABLED:
          onTabChange('restaurants');
          break;

        // Staff notifications -> Staff tab
        case NOTIFICATION_TYPES.NEW_STAFF:
        case NOTIFICATION_TYPES.STAFF_CONNECTED:
          onTabChange('staff');
          break;

        // Email notifications -> Activity Logs tab
        case NOTIFICATION_TYPES.EMAIL_SENT:
        case NOTIFICATION_TYPES.EMAIL_FAILED:
          onTabChange('activity');
          break;

        default:
          break;
      }
    }

    setIsOpen(false);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm group"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-bold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshNotifications}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm">You'll see updates here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 50).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-xl border ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold text-gray-900 truncate ${!notification.read ? 'text-blue-900' : ''
                            }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => {
                if (onTabChange) {
                  onTabChange('notifications');
                }
                setIsOpen(false);
              }}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              View All Notifications
              <ChevronRight className="w-4 h-4" />
            </button>
            {notifications.length > 0 && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Showing {Math.min(50, notifications.length)} of {notifications.length} notifications
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
