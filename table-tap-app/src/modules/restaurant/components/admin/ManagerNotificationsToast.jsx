import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Trash2, Clock, ChevronRight } from 'lucide-react';
import { useManagerNotifications } from '../../../shared/context/ManagerNotificationContext';
import { formatDistanceToNow } from 'date-fns';

const ManagerNotificationsToast = ({ buttonClassName = "text-gray-500 hover:bg-gray-100 hover:text-gray-700", onSelectTab }) => {
  // Use context safely
  const context = useManagerNotifications();
  const notifications = context?.notifications || [];
  const unreadCount = context?.unreadCount || 0;
  const markAllAsRead = context?.markAllAsRead || (() => { });
  const markAsRead = context?.markAsRead || (() => { });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await markAsRead(notification.id);
      }

      // Deep link navigation
      const orderId = notification.order_id || notification.metadata?.order_id;
      if (orderId && onSelectTab) {
        // Navigate to orders tab
        onSelectTab('orders');
        // Store the order ID in URL for OrderManagement to pick up
        const url = new URL(window.location.href);
        url.searchParams.set('orderId', orderId);
        window.history.replaceState({}, '', url.toString());
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Group notifications by date (Today, Yesterday, Older)
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = 'Older';
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    }

    if (!acc[key]) acc[key] = [];
    acc[key].push(notification);
    return acc;
  }, {});

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${buttonClassName} ${isOpen ? 'bg-orange-50 text-orange-600 ring-2 ring-orange-100' : ''}`}
        title="Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-pulse-subtle' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white transform translate-x-1/4 -translate-y-1/4 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-20 left-4 right-4 w-auto sm:absolute sm:top-full sm:right-0 sm:left-auto sm:w-96 sm:mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-xl sticky top-0 z-10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    markAllAsRead();
                  }}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded-md transition-colors mr-1"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Bell className="w-8 h-8 text-orange-300" />
                </div>
                <h4 className="text-gray-900 font-semibold mb-1">All caught up!</h4>
                <p className="text-gray-500 text-sm max-w-[200px]">You don't have any new notifications at the moment.</p>
              </div>
            ) : (
              <div className="pb-2">
                {['Today', 'Yesterday', 'Older'].map(group => {
                  const groupItems = groupedNotifications[group];
                  if (!groupItems || groupItems.length === 0) return null;

                  return (
                    <div key={group}>
                      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-4 py-1.5 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider z-0">
                        {group}
                      </div>
                      <div className="divide-y divide-gray-50">
                        {groupItems.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`group relative p-4 transition-all duration-200 cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-orange-50/30' : ''
                              }`}
                          >
                            <div className="flex items-start gap-3.5">
                              {/* Icon */}
                              <div className="flex-shrink-0 mt-1 relative">
                                {notification.type === 'order' ? (
                                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shadow-sm group-hover:bg-orange-200 transition-colors">
                                    <AlertCircle className="w-4 h-4" />
                                  </div>
                                ) : notification.type === 'success' ? (
                                  <div className="p-2 bg-green-100 text-green-600 rounded-xl shadow-sm group-hover:bg-green-200 transition-colors">
                                    <Check className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm group-hover:bg-blue-200 transition-colors">
                                    <Bell className="w-4 h-4" />
                                  </div>
                                )}
                                {!notification.read && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <p className={`text-sm leading-tight ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0 pt-0.5 font-medium">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }).replace('about ', '')}
                                  </span>
                                </div>

                                <p className={`text-sm mt-1 leading-relaxed ${!notification.read ? 'text-gray-800' : 'text-gray-500'}`}>
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
            <button
              className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors px-2 py-1.5 rounded hover:bg-gray-200/50 flex items-center gap-1.5"
              onClick={() => {/* Add functionality later */ }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
            <button
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors px-2 py-1.5 rounded hover:bg-orange-50 flex items-center gap-1.5"
              onClick={() => {/* Navigate to full notifications page if exists */ setIsOpen(false); }}
            >
              <span>View History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerNotificationsToast;