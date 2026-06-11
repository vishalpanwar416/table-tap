import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Printer, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getRestaurantFoodItems } from '../../../customer/api/foodService';
import { calculateOrderTotals } from '../../../customer/api/paymentService';
import {
  getOrderKots,
  staffAppendKot,
  updateLiveOrderItems,
} from '../../api/admin/liveOrderStaffService';

const LiveOrderManageModal = ({ order, restaurant, onClose, onOrderUpdated, onPrintKot }) => {
  const [tabItems, setTabItems] = useState([]);
  const [kots, setKots] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [newKotItems, setNewKotItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingTab, setSavingTab] = useState(false);
  const [sendingKot, setSendingKot] = useState(false);

  const loadData = useCallback(async () => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const [kotRows, food] = await Promise.all([
        getOrderKots(order.id),
        restaurant?.id ? getRestaurantFoodItems(restaurant.id) : Promise.resolve([]),
      ]);
      setKots(kotRows);
      setTabItems((order.items || []).map((item) => ({ ...item })));
      setMenuItems(food || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load live order');
    } finally {
      setLoading(false);
    }
  }, [order, restaurant?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (order?.items) {
      setTabItems(order.items.map((item) => ({ ...item })));
    }
  }, [order?.id, order?.updated_at, order?.kot_count, order?.total]);

  const tabTotals = useMemo(() => calculateOrderTotals(tabItems), [tabItems]);

  const newKotList = useMemo(
    () => Object.values(newKotItems).filter((item) => item.quantity > 0),
    [newKotItems],
  );

  const filteredMenu = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return menuItems.slice(0, 40);
    return menuItems
      .filter(
        (item) => item.name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [menuItems, menuSearch]);

  const updateTabQty = (index, delta) => {
    setTabItems((prev) =>
      prev
        .map((item, idx) =>
          idx === index ? { ...item, quantity: Math.max(0, (item.quantity || 0) + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const addMenuToKot = (food) => {
    setNewKotItems((prev) => {
      const existing = prev[food.id];
      if (existing) {
        return {
          ...prev,
          [food.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [food.id]: {
          id: food.id,
          food_item_id: food.id,
          name: food.name,
          price: food.price,
          category: food.category,
          image: food.image,
          quantity: 1,
        },
      };
    });
  };

  const updateNewKotQty = (id, delta) => {
    setNewKotItems((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const nextQty = item.quantity + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: { ...item, quantity: nextQty } };
    });
  };

  const handleUpdateTab = async () => {
    if (!tabItems.length) {
      toast.error('Add at least one item to the tab');
      return;
    }
    setSavingTab(true);
    try {
      const updated = await updateLiveOrderItems(order.id, tabItems);
      onOrderUpdated?.(updated);
      toast.success('Live order tab updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update tab');
    } finally {
      setSavingTab(false);
    }
  };

  const handleSendKot = async () => {
    if (!newKotList.length) {
      toast.error('Add items before sending a KOT');
      return;
    }
    setSendingKot(true);
    try {
      const updated = await staffAppendKot(order.id, restaurant.id, newKotList);
      setNewKotItems({});
      onOrderUpdated?.(updated);
      await loadData();
      toast.success(`KOT #${updated.kot_count} sent to kitchen`);
    } catch (err) {
      toast.error(err.message || 'Failed to send KOT');
    } finally {
      setSendingKot(false);
    }
  };

  if (!order) return null;

  const content = (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-green-50">
          <div>
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Live Order</p>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Table {order.table_number} · {order.order_number}
            </h2>
            <p className="text-sm text-gray-500">
              {order.kot_count || 0} KOTs · ₹{Number(order.total || 0).toFixed(2)} unpaid
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-green-100 text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-gray-400">
            Loading live order...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Running tab</h3>
                <button
                  type="button"
                  onClick={loadData}
                  className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-800"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
              <div className="border rounded-xl divide-y">
                {tabItems.map((item, index) => (
                  <div
                    key={`${item.food_item_id || item.id}-${index}`}
                    className="flex items-center justify-between px-3 py-2.5 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">₹{Number(item.price).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateTabQty(index, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateTabQty(index, 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {!tabItems.length && (
                  <p className="px-3 py-6 text-center text-sm text-gray-400">No items on tab</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-600">
                  Tab total: <strong>₹{tabTotals.finalTotal.toFixed(2)}</strong>
                </p>
                <button
                  type="button"
                  onClick={handleUpdateTab}
                  disabled={savingTab || !tabItems.length}
                  className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {savingTab ? 'Saving...' : 'Update tab'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Use Update tab to remove items or fix quantities already on the bill.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-3">Send new KOT</h3>
              <div className="relative mb-3">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search menu to add items..."
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto mb-3">
                {filteredMenu.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => addMenuToKot(food)}
                    className="flex items-center justify-between px-3 py-2 border rounded-lg text-left hover:bg-green-50 hover:border-green-200"
                  >
                    <span className="text-sm font-medium truncate">{food.name}</span>
                    <span className="text-xs text-gray-500 ml-2">₹{food.price}</span>
                  </button>
                ))}
              </div>
              {newKotList.length > 0 && (
                <div className="border rounded-xl divide-y mb-3">
                  {newKotList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 gap-2"
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateNewKotQty(item.id, -1)}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateNewKotQty(item.id, 1)}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleSendKot}
                disabled={sendingKot || !newKotList.length}
                className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {sendingKot ? 'Sending...' : `Send KOT #${(order.kot_count || 0) + 1}`}
              </button>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-3">KOT history</h3>
              {kots.length === 0 ? (
                <p className="text-sm text-gray-400">No KOTs yet</p>
              ) : (
                <div className="space-y-2">
                  {kots.map((kot) => (
                    <div
                      key={kot.id}
                      className="flex items-center justify-between px-3 py-2.5 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-sm">KOT #{kot.kot_number}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(kot.created_at), 'MMM d, h:mm a')} · ₹
                          {Number(kot.subtotal).toFixed(2)} · {(kot.items || []).length} items
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPrintKot?.(order, kot)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg"
                      >
                        <Printer size={14} /> Print
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default LiveOrderManageModal;
