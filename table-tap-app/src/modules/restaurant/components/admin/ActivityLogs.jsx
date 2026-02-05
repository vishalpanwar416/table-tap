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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'inventory': return <Package className="w-4 h-4 text-blue-500" />;
      case 'order': return <ShoppingCart className="w-4 h-4 text-orange-500" />;
      case 'menu': return <Utensils className="w-4 h-4 text-green-500" />;
      case 'email': return <Mail className="w-4 h-4 text-indigo-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('added')) return <Plus className="w-3 h-3 text-green-600" />;
    if (action.includes('updated') || action.includes('edit') || action.includes('status')) return <Edit3 className="w-3 h-3 text-blue-600" />;
    if (action.includes('deleted') || action.includes('rejected') || action.includes('cancelled')) return <Trash2 className="w-3 h-3 text-red-600" />;
    if (action.includes('bill_sent') || action.includes('auto_email')) return <Mail className="w-3 h-3 text-indigo-600" />;
    return <Clock className="w-3 h-3 text-gray-600" />;
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
        <div>
          <p className="text-gray-600 mt-1">Unified history of orders, menu updates, and inventory changes</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-indigo-500 text-white' : 'bg-white hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button
            onClick={() => loadActivityLogs(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm border grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
            <select
              value={filters.action_type}
              onChange={e => setFilters({ ...filters, action_type: e.target.value })}
              className="w-full border rounded-lg p-2"
            >
              <option value="">All Types</option>
              <option value="order">Orders</option>
              <option value="menu">Menu Items</option>
              <option value="inventory">Inventory</option>
              <option value="email">Email / Billing</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From Date</label>
            <input type="date" value={filters.date_from} onChange={e => setFilters({ ...filters, date_from: e.target.value })} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To Date</label>
            <input type="date" value={filters.date_to} onChange={e => setFilters({ ...filters, date_to: e.target.value })} className="w-full border rounded-lg p-2" />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <Clock className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">No activity logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${log.action_type === 'order' ? 'bg-orange-50 text-orange-700' :
                        log.action_type === 'menu' ? 'bg-green-50 text-green-700' :
                          log.action_type === 'email' ? 'bg-indigo-50 text-indigo-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                        {getTypeIcon(log.action_type)}
                        {log.action_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{log.target_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{log.target_id?.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${getRoleColor(log.user_role)}`}>
                          {log.user_role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        {getActionIcon(log.action_name)}
                        <span className="capitalize">{log.action_name.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-gray-900 line-clamp-1">{log.description}</div>
                        {log.details && (
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {log.action_type === 'inventory' && log.details.quantity_changed !== undefined && (
                              <span className={`px-1.5 py-0.5 rounded font-bold ${log.details.quantity_changed > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {log.details.quantity_changed > 0 ? '+' : ''}{log.details.quantity_changed} {log.details.unit || ''}
                              </span>
                            )}
                            {log.action_type === 'order' && log.details.new_status && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold uppercase">
                                {log.details.old_status ? `${log.details.old_status} → ` : ''}{log.details.new_status}
                              </span>
                            )}
                            {log.action_type === 'menu' && log.details.price && (
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-bold">
                                ₹{log.details.price} ({log.details.category})
                              </span>
                            )}
                            {log.action_type === 'email' && log.details.recipient_email && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold">
                                → {log.details.recipient_email}
                              </span>
                            )}
                            {log.action_type === 'email' && log.details.email_kind && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold capitalize">
                                {log.details.email_kind}
                              </span>
                            )}
                            {log.details.reason && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded italic">
                                "{log.details.reason}"
                              </span>
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

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loadingMore}
            className="px-6 py-2 bg-white border rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;