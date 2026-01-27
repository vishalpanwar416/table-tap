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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../shared/config/AuthContext';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';
import { 
  inventoryService,
  ACTIVITY_TYPES,
  getRoleColor,
  getRoleDisplayName
} from '../../api/admin/inventoryService';

const InventoryActivityLogs = ({ setLoading, setErrorMsg, setSuccessMsg, searchTerm }) => {
  const { userRestaurantId, userRole } = useAdminRestaurant();
  const { user } = useAuth();
  
  const [activityLogs, setActivityLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50; // or whatever you prefer
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (userRestaurantId) {
      loadActivityLogs(true); // reset logs
    }
  }, [userRestaurantId]);

  const loadActivityLogs = async (reset = false) => {
    if (!userRestaurantId) {
      setError('No restaurant ID available');
      return;
    }

    try {
      if (reset) {
        setLoading(true); // global loading for initial load
      } else {
        setLoadingMore(true); // local loading for paging
      }
      setError(null);
      // Add pagination support to your service (see below)
      const { data, error } = await inventoryService.getActivityLogs(userRestaurantId, page, PAGE_SIZE);
      if (error) throw new Error(error);

      if (reset) {
        setActivityLogs(data);
      } else {
        setActivityLogs(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
      setSuccess('Activity logs loaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to load activity logs: ' + error.message);
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Fetch inventory items on mount or when restaurant changes
  useEffect(() => {
    if (userRestaurantId) {
      inventoryService.getAllItems(userRestaurantId).then(({ data }) => {
        setInventoryItems(data || []);
      });
    }
  }, [userRestaurantId]);

  const getActionIcon = (action) => {
    switch (action) {
      case ACTIVITY_TYPES.ITEM_ADDED:
        return <Plus className="w-4 h-4 text-green-600" />;
      case ACTIVITY_TYPES.ITEM_UPDATED:
        return <Edit3 className="w-4 h-4 text-blue-600" />;
      case ACTIVITY_TYPES.STOCK_UPDATE:
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case ACTIVITY_TYPES.STOCK_TAKE_OUT:
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case ACTIVITY_TYPES.ITEM_DELETED:
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case ACTIVITY_TYPES.ITEM_ADDED:
        return 'bg-green-100 text-green-800 border-green-200';
      case ACTIVITY_TYPES.ITEM_UPDATED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ACTIVITY_TYPES.STOCK_UPDATE:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ACTIVITY_TYPES.STOCK_TAKE_OUT:
        return 'bg-red-100 text-red-800 border-red-200';
      case ACTIVITY_TYPES.ITEM_DELETED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionDisplayName = (action) => {
    switch (action) {
      case ACTIVITY_TYPES.ITEM_ADDED:
        return 'Item Added';
      case ACTIVITY_TYPES.ITEM_UPDATED:
        return 'Item Updated';
      case ACTIVITY_TYPES.STOCK_UPDATE:
        return 'Stock Update';
      case ACTIVITY_TYPES.STOCK_TAKE_OUT:
        return 'Stock Take Out';
      case ACTIVITY_TYPES.ITEM_DELETED:
        return 'Item Deleted';
      default:
        return action.replace('_', ' ').toUpperCase();
    }
  };

  const getReasonDisplayName = (reason) => {
    switch (reason) {
      case 'initial_stock':
        return 'Initial Stock';
      case 'stock_adjustment':
        return 'Stock Adjustment';
      case 'food_preparation':
        return 'Food Preparation';
      case 'damaged_goods':
        return 'Damaged Goods';
      case 'theft':
        return 'Theft';
      case 'expiry':
        return 'Expiry';
      case 'supplier_return':
        return 'Supplier Return';
      case 'audit':
        return 'Audit';
      default:
        return reason ? reason.replace('_', ' ').toUpperCase() : '-';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const applyFilters = () => {
    let filtered = [...activityLogs];

    // Use searchTerm from props
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (getItemName(log.item_id).toLowerCase().includes(searchTermLower)) ||
        (log.user_name && log.user_name.toLowerCase().includes(searchTermLower)) ||
        (log.notes && log.notes.toLowerCase().includes(searchTermLower))
      );
    }

    // Action filter
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // User filter
    if (filters.user_id) {
      filtered = filtered.filter(log => 
        log.user_id.toString().includes(filters.user_id) ||
        (log.user_name && log.user_name.toLowerCase().includes(filters.user_id.toLowerCase()))
      );
    }

    // Date range filter
    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999); // Include entire end day
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }

    setFilteredLogs(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, activityLogs, searchTerm]);

  useEffect(() => {
    if (page === 1) {
      loadActivityLogs(true); // reset logs
    } else {
      loadActivityLogs();
    }
    // eslint-disable-next-line
  }, [page, userRestaurantId]);

  const clearFilters = () => {
    setFilters({
      action: '',
      user_id: '',
      date_from: '',
      date_to: '',
    });
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Super Admin';
      case 'manager':
        return 'Restaurant Manager';
      case 'captain':
        return 'Restaurant Captain';
      case 'staff':
        return 'Staff Member';
      default:
        return role || 'Unknown Role';
    }
  };

  // Helper to get item name by id
  const getItemName = (itemId) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item ? item.name : 'Unknown Item';
  };

  if (!userRestaurantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No restaurant selected or access denied.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            Inventory Activity Logs
          </h1>
          <p className="text-gray-600 mt-1">Track all inventory activities and changes</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={loadActivityLogs}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value={ACTIVITY_TYPES.ITEM_ADDED}>Item Added</option>
                <option value={ACTIVITY_TYPES.ITEM_UPDATED}>Item Updated</option>
                <option value={ACTIVITY_TYPES.STOCK_UPDATE}>Stock Update</option>
                <option value={ACTIVITY_TYPES.STOCK_TAKE_OUT}>Stock Take Out</option>
                <option value={ACTIVITY_TYPES.ITEM_DELETED}>Item Deleted</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <input
                type="text"
                value={filters.user_id}
                onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
                placeholder="Filter by user ID or name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{activityLogs.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Filtered Activities</p>
              <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
            </div>
            <Filter className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Your Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {activityLogs.filter(log => log.user_id === user?.id).length}
              </p>
            </div>
            <User className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No activity logs found</p>
                    <p className="text-sm">Activity logs will appear here when inventory changes are made.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getItemName(log.item_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                          {getActionDisplayName(log.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`flex items-center gap-1 ${log.quantity_changed > 0 ? 'text-green-600' : log.quantity_changed < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {log.quantity_changed > 0 ? <TrendingUp className="w-3 h-3" /> : log.quantity_changed < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {log.quantity_changed > 0 ? '+' : ''}{log.quantity_changed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {log.user_name}
                        {log.user_id === user?.id && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(log.user_role)}`}>
                        {getRoleDisplayName(log.user_role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getReasonDisplayName(log.reason)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="line-clamp-2">
                        {log.notes || '-'}
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
        <div className="flex justify-center my-4">
          <button
            onClick={() => {
              setPage(prev => prev + 1);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default InventoryActivityLogs;