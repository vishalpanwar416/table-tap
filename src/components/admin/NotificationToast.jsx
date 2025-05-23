import React, { useState, useEffect } from 'react';

const NotificationToast = ({ 
  show, 
  message, 
  type = 'info', 
  onClose, 
  autoClose = true,
  duration = 5000,
  title = null
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800 shadow-green-100',
    error: 'bg-red-50 border-red-200 text-red-800 shadow-red-100',
    info: 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 shadow-yellow-100',
    order: 'bg-orange-50 border-orange-200 text-orange-800 shadow-orange-100'
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
    order: '🔔'
  };

  const animationClass = isVisible 
    ? 'translate-x-0 opacity-100' 
    : 'translate-x-full opacity-0';

  return (
    <div className={`fixed top-4 right-4 z-50 ${typeStyles[type]} px-4 py-3 rounded-lg border-2 shadow-lg flex items-start min-w-80 max-w-md transform transition-all duration-300 ease-in-out ${animationClass}`}>
      <span className="text-xl mr-3 flex-shrink-0 mt-0.5">{typeIcons[type]}</span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm mb-1">{title}</p>
        )}
        <p className={title ? "text-sm" : "font-medium"}>{message}</p>
      </div>
      {onClose && (
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
          className="ml-4 text-lg hover:opacity-70 focus:outline-none transition-opacity flex-shrink-0"
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default NotificationToast;