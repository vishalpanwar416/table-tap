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
  Package
} from 'lucide-react';
import { useAuth } from '../../config/AuthContext';
import { useAdminRestaurant } from '../../context/AdminRestaurantContext';
import { 
  inventoryService,
  ACTIVITY_TYPES,
  getRoleColor,
  getRoleDisplayName
} from '../../api/inventoryService';

const InventoryActivityLogs = ({ setLoading, setErrorMsg, setSuccessMsg }) => {
  const { userRestaurantId } = useAdminRestaurant();
  
  const [activityLogs, setActivityLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    user_id: '',
    date_from: '',
    date_to: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (userRestaurantId) {
      loadActivityLogs();
    }
  }, [userRestaurantId]);

  const loadActivityLogs = async () => {
    if (!userRestaurantId) {
      setErrorMsg('No restaurant ID available');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await inventoryService.getActivityLogs(userRestaurantId);
      if (error) throw new Error(error);
      setActivityLogs(data);
    } catch (error) {
      setErrorMsg('Failed to load activity logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
        return 'bg-green-100 text-green-800';
      case ACTIVITY_TYPES.ITEM_UPDATED:
        return 'bg-blue-100 text-blue-800';
      case ACTIVITY_TYPES.STOCK_UPDATE:
        return 'bg-orange-100 text-orange-800';
      case ACTIVITY_TYPES.STOCK_TAKE_OUT:
        return 'bg-red-100 text-red-800';
      case ACTIVITY_TYPES.ITEM_DELETED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const filteredLogs = activityLogs.filter(log => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        log.item_name.toLowerCase().includes(searchTerm) ||
        log.user_name.toLowerCase().includes(searchTerm) ||
        log.notes.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  // Get role display name
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

  // Check if user has permission to view logs
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
            <Clock className="w-8 h-8 text-blue-500" />
            Inventory Activity Logs
          </h1>
          <p className="text-gray-600 mt-1">Track all inventory activities and changes</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={loadActivityLogs}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                placeholder="Filter by user"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by item name, user, or notes..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
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
              {activityLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No activity logs found</p>
                    <p className="text-sm">Activity logs will appear here when inventory changes are made.</p>
                  </td>
                </tr>
              ) : (
                activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionDisplayName(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`flex items-center gap-1 ${log.quantity_changed > 0 ? 'text-green-600' : log.quantity_changed < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {log.quantity_changed > 0 ? <TrendingUp className="w-3 h-3" /> : log.quantity_changed < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {log.quantity_changed > 0 ? '+' : ''}{log.quantity_changed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getRoleDisplayName(log.user_role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getReasonDisplayName(log.reason)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryActivityLogs; 