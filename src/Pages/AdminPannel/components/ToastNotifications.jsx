import React from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const ToastNotifications = ({ notifications, removeNotification }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 font-spartan">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center space-x-3 p-4 rounded-lg border shadow-lg max-w-sm ${getBgColor(notification.type)}`}
        >
          {getIcon(notification.type)}
          <div className="flex-1">
            <p className="font-medium text-gray-900 font-spartan">{notification.title}</p>
            {notification.message && (
              <p className="text-sm text-gray-600 font-spartan">{notification.message}</p>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotifications; 