import React from 'react';
import { AlertTriangle } from 'lucide-react';

const OrderActions = ({ confirmModal, setConfirmModal, handleStatusUpdate, isLoading }) => {
  if (!confirmModal.show) return null;
  
  return (
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
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setConfirmModal({ show: false, type: null, order: null })}
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
              handleStatusUpdate(confirmModal.order.id, confirmModal.order.userId, statusMap[normalizedType]);
            }}
            className={`px-4 py-2 rounded text-white ${confirmModal.type === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderActions;