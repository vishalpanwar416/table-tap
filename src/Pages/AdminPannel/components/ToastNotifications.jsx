import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastNotifications = ({ 
  showError, 
  showSuccess, 
  error, 
  success, 
  onCloseError, 
  onCloseSuccess 
}) => {
  if (!showError && !showSuccess) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 font-spartan">
      {/* Error Toast */}
      {showError && error && (
        <div className="flex items-center space-x-3 p-4 rounded-lg border shadow-lg max-w-sm bg-red-50 border-red-200 animate-in slide-in-from-right duration-300">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900 font-spartan">Error</p>
            <p className="text-sm text-gray-600 font-spartan">{error}</p>
          </div>
          <button
            onClick={onCloseError}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && success && (
        <div className="flex items-center space-x-3 p-4 rounded-lg border shadow-lg max-w-sm bg-green-50 border-green-200 animate-in slide-in-from-right duration-300">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900 font-spartan">Success</p>
            <p className="text-sm text-gray-600 font-spartan">{success}</p>
          </div>
          <button
            onClick={onCloseSuccess}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ToastNotifications; 