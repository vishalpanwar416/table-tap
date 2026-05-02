import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Edit3,
  Trash2,
  X,
  Filter,
  Calendar,
  BarChart3,
  Eye,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  RefreshCw,
  ShoppingCart,
  Utensils,
  ClipboardList,
  Mail
} from 'lucide-react';
import { useAuth } from '../../../shared/config/AuthContext';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';
import { getActivityLogs } from '../../../shared/api/activityLogService';
import { getRoleColor, getRoleDisplayName } from '../../api/admin/inventoryService';

const ActivityLogs = ({ setLoading, setErrorMsg, setSuccessMsg, searchTerm }) => {
  const { userRestaurantId } = useAdminRestaurant();
  const { user } = useAuth();

  const [activityLogs, setActivityLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    action_type: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (userRestaurantId) {
      loadActivityLogs(true);
    }
  }, [userRestaurantId]);

  const loadActivityLogs = async (reset = false) => {
    if (!userRestaurantId) return;

    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const { data, error: fetchError, count } = await getActivityLogs(userRestaurantId, currentPage, PAGE_SIZE);

      if (fetchError) throw new Error(fetchError);

      if (reset) {
        setActivityLogs(data || []);
      } else {
        setActivityLogs(prev => [...prev, ...(data || [])]);
      }

      setHasMore(data?.length === PAGE_SIZE);
      if (reset) setSuccess('Activity logs loaded');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to load logs: ' + error.message);
    } finally {
      if (reset) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const getTypeIcon = (type, className = "w-4 h-4") => {
    switch (type) {
      case 'inventory': return <Package className={`${className} text-blue-500`} />;
      case 'order': return <ShoppingCart className={`${className} text-orange-500`} />;
      case 'menu': return <Utensils className={`${className} text-green-500`} />;
      case 'email': return <Mail className={`${className} text-amber-500`} />;
      default: return <Activity className={`${className} text-gray-500`} />;
    }
  };

  const getActionIcon = (action, className = "w-3 h-3") => {
    if (action.includes('added')) return <Plus className={`${className} text-green-600`} />;
    if (action.includes('updated') || action.includes('edit') || action.includes('status')) return <Edit3 className={`${className} text-blue-600`} />;
    if (action.includes('deleted') || action.includes('rejected') || action.includes('cancelled')) return <Trash2 className={`${className} text-red-600`} />;
    if (action.includes('bill_sent') || action.includes('auto_email')) return <Mail className={`${className} text-amber-600`} />;
    return <Clock className={`${className} text-gray-600`} />;
  };

  const applyFilters = () => {
    let filtered = [...activityLogs];

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(l =>
        (l.target_name?.toLowerCase().includes(s)) ||
        (l.user_name?.toLowerCase().includes(s)) ||
        (l.description?.toLowerCase().includes(s))
      );
    }

    if (filters.action_type) {
      filtered = filtered.filter(l => l.action_type === filters.action_type);
    }

    if (filters.date_from) {
      filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(filters.date_from));
    }

    if (filters.date_to) {
      const end = new Date(filters.date_to);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(l => new Date(l.timestamp) <= end);
    }

    setFilteredLogs(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, activityLogs, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="hidden md:block">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Activity History</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Unified history of orders, menu, and inventory</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-all ${showFilters ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-100' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filters</span>
          </button>
          <button
            onClick={() => loadActivityLogs(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loadingMore ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Activity Type</label>
            <select
              value={filters.action_type}
              onChange={e => setFilters({ ...filters, action_type: e.target.value })}
              className="w-full bg-gray-50 border-transparent focus:border-amber-500 focus:ring-0 rounded-xl p-2.5 text-sm font-medium text-gray-700 transition-all"
            >
              <option value="">All Activities</option>
              <option value="order">📦 Orders</option>
              <option value="menu">🍴 Menu Items</option>
              <option value="inventory">📦 Inventory</option>
              <option value="email">📧 Email / Billing</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={e => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full bg-gray-50 border-transparent focus:border-amber-500 focus:ring-0 rounded-xl p-2.5 text-sm font-medium text-gray-700 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={e => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full bg-gray-50 border-transparent focus:border-amber-500 focus:ring-0 rounded-xl p-2.5 text-sm font-medium text-gray-700 transition-all"
            />
          </div>
        </div>
      )}

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <Clock className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-xl font-bold text-gray-500 tracking-tight">No activity found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search term</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap font-medium">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${log.action_type === 'order' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        log.action_type === 'menu' ? 'bg-green-50 text-green-600 border border-green-100' :
                          log.action_type === 'email' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                        {getTypeIcon(log.action_type)}
                        {log.action_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{log.target_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{log.target_id?.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200 uppercase">
                          {log.user_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{log.user_name}</div>
                          <span className={`text-[9px] uppercase font-bold px-1 rounded ${getRoleColor(log.user_role)}`}>
                            {log.user_role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                        <div className="p-1 rounded-lg bg-gray-100">
                          {getActionIcon(log.action_name)}
                        </div>
                        <span className="capitalize">{log.action_name.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <div className="flex flex-col gap-1.5">
                        <div className="font-medium text-gray-900 leading-snug">{log.description}</div>
                        {log.details && (
                          <div className="flex flex-wrap gap-2">
                            {log.action_type === 'inventory' && log.details.quantity_changed !== undefined && (
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${log.details.quantity_changed > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {log.details.quantity_changed > 0 ? 'Added' : 'Removed'} {Math.abs(log.details.quantity_changed)} {log.details.unit || ''}
                              </span>
                            )}
                            {log.action_type === 'order' && log.details.new_status && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-bold uppercase tracking-wider border border-gray-200">
                                {log.details.old_status ? `${log.details.old_status} → ` : ''}{log.details.new_status}
                              </span>
                            )}
                            {log.action_type === 'menu' && log.details.price && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[9px] font-bold tracking-wider border border-green-100">
                                Price: ₹{log.details.price}
                              </span>
                            )}
                            {log.action_type === 'email' && log.details.recipient_email && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-bold border border-amber-100">
                                <Mail className="w-2.5 h-2.5" />
                                <span>To: {log.details.recipient_email}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
            <Clock className="w-12 h-12 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-bold">No activity found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${log.action_type === 'order' ? 'bg-orange-50 text-orange-600' :
                    log.action_type === 'menu' ? 'bg-green-50 text-green-600' :
                      log.action_type === 'email' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                    }`}>
                    {getTypeIcon(log.action_type, "w-3.5 h-3.5")}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-900 leading-tight truncate max-w-[150px]">{log.target_name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${log.action_type === 'order' ? 'bg-orange-100 text-orange-700' :
                        log.action_type === 'menu' ? 'bg-green-100 text-green-700' :
                          log.action_type === 'email' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {log.action_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-lg p-2 mb-2 border border-gray-100/50">
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {getActionIcon(log.action_name, "w-3 h-3")}
                  {log.action_name.replace(/_/g, ' ')}
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                  {log.description}
                </p>

                {log.details && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {log.action_type === 'inventory' && log.details.quantity_changed !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${log.details.quantity_changed > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.details.quantity_changed > 0 ? '+' : ''}{log.details.quantity_changed} {log.details.unit || ''}
                      </span>
                    )}
                    {log.action_type === 'order' && log.details.new_status && (
                      <span className="px-1.5 py-0.5 bg-white text-amber-600 rounded-md text-[8px] font-bold uppercase tracking-wider border border-amber-100 shadow-sm">
                        → {log.details.new_status}
                      </span>
                    )}
                    {log.action_type === 'menu' && log.details.price && (
                      <span className="px-1.5 py-0.5 bg-white text-green-600 rounded-md text-[8px] font-bold tracking-wider border border-green-100 shadow-sm">
                        ₹{log.details.price}
                      </span>
                    )}
                    {log.action_type === 'email' && log.details.recipient_email && (
                      <span className="px-1.5 py-0.5 bg-white text-amber-600 rounded-md text-[8px] font-bold border border-amber-100 truncate max-w-full shadow-sm">
                        📧 {log.details.recipient_email}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-lg bg-amber-50 flex items-center justify-center text-[9px] font-black text-amber-600 border border-amber-100">
                    {log.user_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-800 leading-none">{log.user_name}</p>
                    <p className={`text-[7px] font-bold uppercase tracking-widest ${getRoleColor(log.user_role)} leading-none mt-0.5`}>
                      {log.user_role}
                    </p>
                  </div>
                </div>
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                  {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4 pb-8 md:pb-0">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loadingMore}
            className="w-full md:w-auto px-8 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loadingMore ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            ) : (
              <Plus className="w-4 h-4 text-amber-600" />
            )}
            <span>{loadingMore ? 'Loading History...' : 'View Older Activity'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;