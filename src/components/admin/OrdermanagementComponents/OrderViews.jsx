import React from 'react';
import {
  Check, X, Truck, CheckCircle, ChevronDown, ChevronRight,
  Clock, MapPin, Phone, AlertCircle, Printer, Info
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import OrderDetails from './OrderDetails';

const OrdersView = ({
  sortedOrders,
  viewType,
  expandedOrderId,
  toggleOrderExpansion,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dropdownOpenOrderId,
  setDropdownOpenOrderId,
  openConfirmModal,
  isLoading
}) => {
  const getStatusBadge = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      preparing: 'bg-purple-100 text-purple-800 border border-purple-200',
      ready: 'bg-green-100 text-green-800 border border-green-200',
      rejected: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-teal-100 text-teal-800 border border-teal-200',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status] || ''}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'ready': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <X className="h-5 w-5 text-red-500" />;
      case 'completed': return <Check className="h-5 w-5 text-teal-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const getNextStatusOptions = (status) => {
    const map = {
      pending: ['preparing', 'rejected'],
      preparing: ['ready'],
      ready: ['completed'],
    };
    return map[status] || [];
  };

  if (!sortedOrders.length) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Found</h3>
        {(searchTerm || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
            className="mt-4 px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className={viewType === 'tiles' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : ''}>
        {sortedOrders.map(order => (
          <div key={order.id} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow mb-4">
            <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <div>
                  <p className="font-medium">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            <div className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 overflow-hidden">
                    <img src={order.customerData?.profileImg || "/default-avatar.png"} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-medium">{order.customer_name || 'Guest'}</span>
                </div>
                {(order.table_number || order.tableNumber) && (
                  <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    Table {order.table_number || order.tableNumber}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="mb-2 text-sm text-gray-500">
                {order.customerPhone && <div className="flex items-center"><Phone size={14} className="mr-1" /> {order.customerPhone}</div>}
                {order.address && <div className="flex items-start"><MapPin size={14} className="mr-1 mt-1" /> <span>{order.address}</span></div>}
              </div>

              {/* Items Image Row */}
              <div className="flex space-x-2 mb-4 overflow-x-auto scrollbar-hide">
                {(order.items || []).slice(0, 4).map((item, idx) => (
                  <img
                    key={idx}
                    src={item.image || '/api/placeholder/64/64'}
                    alt={item.name || `Item ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded border border-gray-200"
                  />
                ))}
                {(order.items || []).length > 4 && (
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-100 text-gray-600 text-sm rounded">
                    +{(order.items || []).length - 4}
                  </div>
                )}
              </div>

              {/* Expandable Details */}
              <div className="mb-4 text-right">
                <button
                  onClick={() => toggleOrderExpansion(order.id)}
                  className="text-sm text-orange-500 hover:text-orange-600 flex items-center justify-end"
                >
                  {expandedOrderId === order.id ? <>Hide details <ChevronDown size={14} className="ml-1" /></> : <>View details <ChevronRight size={14} className="ml-1" /></>}
                </button>
                {expandedOrderId === order.id && <OrderDetails order={order} />}
              </div>

              {/* Actions and Total */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-semibold text-gray-800">₹{order.total?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => openConfirmModal(order, 'accept')} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200" title="Accept">
                        <Check size={16} />
                      </button>
                      <button onClick={() => openConfirmModal(order, 'rejected')} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200" title="Reject">
                        <X size={16} />
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => openConfirmModal(order, 'ready')} className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm flex items-center">
                      <CheckCircle size={14} className="mr-1" /> Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => openConfirmModal(order, 'complete')} className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm flex items-center">
                      <Check size={14} className="mr-1" /> Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersView;
