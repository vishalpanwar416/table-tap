import React, { useState } from 'react';
import { ArrowRight, Check, X, CheckCircle, User, MapPin, ChevronUp, ChevronDown, Clock, ShoppingBag } from 'lucide-react';

const ActiveOrders = ({
  orders,
  expandedOrderId,
  toggleOrderExpansion,
  updateOrderStatus,
  getStatusBadge,
  getStatusIcon,
  formatDate,
  setActiveTab
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header - Adaptive */}
      <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center gap-2">
          Active Orders
          <span className="bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full md:hidden">
            {orders.length}
          </span>
        </h3>
        <button
          onClick={() => setActiveTab('orders')}
          className="text-xs md:text-sm text-primary-500 hover:text-primary-600 flex items-center font-medium"
        >
          View all <span className="hidden md:inline">&nbsp;orders</span> <ArrowRight size={14} className="ml-1" />
        </button>
      </div>

      <div className="p-0 md:p-4">
        {orders.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">No active orders at the moment.</div>
        ) : (
          <>
            {/* Desktop View (Original detailed cards) */}
            <div className="hidden md:block space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
                    <div className="flex items-center">
                      <div className="mr-2">{getStatusIcon(order.status)}</div>
                      <div>
                        <p className="font-medium">#{order.order_number}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.created_at || new Date())}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(order.status || 'pending')}
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedOrderId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3 bg-white">
                    <div className="flex flex-wrap items-center justify-between mb-3">
                      <div className="flex items-center mb-2 md:mb-0">
                        <User size={14} className="text-gray-400 mr-1" />
                        <span className="text-sm font-medium">
                          {order.customer_name || order.customerName || 'Guest'}
                        </span>
                        {(order.table_number || order.tableNumber) && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            Table {order.table_number || order.tableNumber}
                          </span>
                        )}
                      </div>
                      {order.customer_email && (
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 24 24">
                            <path d="M4 4h16v16H4V4zm0 0l8 8 8-8" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{order.customer_email}</span>
                        </div>
                      )}
                      {order.customer_phone && (
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="mr-1">📞</span>
                          <span>{order.customer_phone}</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-center text-xs text-gray-500 mr-4">
                          <MapPin size={12} className="mr-1" />
                          <span className="truncate max-w-xs">{order.address}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <div className="mr-4">
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="font-semibold">₹{order.total?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                title="Accept Order"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'rejected')}
                                className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="Reject Order"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="px-4 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center transition-colors"
                            >
                              <CheckCircle size={16} className="mr-1" /> Ready
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Item thumbnails */}
                    <div className="flex mb-3 space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                      {(order.items || []).slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border border-gray-200">
                          <img
                            src={item.image || `/api/placeholder/48/48`}
                            alt={item.name || `Item ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {(order.items || []).length > 4 && (
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
                          +{(order.items || []).length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expandedOrderId === order.id && (
                    <div className="bg-gray-50 p-3 border-t border-gray-100">
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Order Items</h4>
                      <div className="space-y-3">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-10 h-10 rounded overflow-hidden mr-3 border border-gray-200 bg-white">
                              <img
                                src={item.image || `/api/placeholder/40/40`}
                                alt={item.name || `Item ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name || `Item ${idx + 1}`}</p>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{item.quantity || 1} × ₹{item.price?.toFixed(2) || '0.00'}</span>
                                <span>₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Price summary */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Subtotal</span>
                          <span>₹{(order.subtotal || order.total || 0).toFixed(2)}</span>
                        </div>
                        {(order.delivery_fee || order.deliveryFee) > 0 && (
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Delivery</span>
                            <span>₹{(order.delivery_fee || order.deliveryFee)?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-sm mt-1">
                          <span>Total</span>
                          <span>₹{order.total?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Customer Notes</div>
                          <p className="text-sm text-gray-600">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile View (Compact List) */}
            <div className="md:hidden divide-y divide-gray-100">
              {orders.map(order => (
                <div key={order.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">#{order.order_number || order.id?.slice(0, 6)}</span>
                        {getStatusBadge(order.status || 'pending')}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-[10px] text-gray-400 flex items-center">
                          <Clock size={10} className="mr-1" />
                          {formatDate(order.created_at || new Date())}
                        </div>
                        {(order.table_number || order.tableNumber) && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium border border-blue-100">
                            T-{order.table_number || order.tableNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-sm">₹{order.total?.toFixed(2) || '0.00'}</div>
                      <div className="text-[10px] text-gray-500">{order.items?.length || 0} items</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
                      {(order.items || []).slice(0, 3).map((item, idx) => (
                        <img
                          key={idx}
                          src={item.image || `/api/placeholder/32/32`}
                          alt={item.name}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover bg-gray-100"
                        />
                      ))}
                      {(order.items || []).length > 3 && (
                        <div className="items-center justify-center flex h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 text-[9px] font-bold text-gray-500">
                          +{(order.items || []).length - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'rejected')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 bg-white"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white shadow-sm"
                          >
                            Accept
                          </button>
                        </>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white shadow-sm flex items-center"
                        >
                          Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white shadow-sm flex items-center"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActiveOrders;
