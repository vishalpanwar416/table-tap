import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, Plus, Search, Edit3, Trash2, AlertTriangle,
  TrendingDown, TrendingUp, Calendar, Filter, Download,
  Upload, Eye, X, Save, RefreshCw, BarChart3, Clock,
  MapPin, Phone, Mail, Barcode, Settings, AlertCircle,
  CheckCircle, Info, IndianRupee, ShoppingCart, FileText,
  Printer, Sparkles, Zap, Target, Activity, Minus, Scan
} from 'lucide-react';
import { useAuth } from '../../../shared/config/AuthContext';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';
import {
  inventoryService,
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  STOCK_STATUS,
  getStockStatus,
  getStatusColor,
  getInventoryStats,
  getRoleColor,
  getRoleDisplayName
} from '../../api/admin/inventoryService';

// Helper component for stats cards
const StatsCard = ({ icon: Icon, value, label, colorClass, className = '' }) => (
  <div className={`bg-white p-2 md:p-4 rounded-lg shadow border hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center justify-between gap-2 md:gap-3">
      <div className="min-w-0">
        <p className="text-[10px] md:text-sm text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className={`text-base md:text-2xl font-bold truncate leading-tight ${colorClass}`}>{value}</p>
      </div>
      <Icon className="w-5 h-5 md:w-8 md:h-8 flex-shrink-0 opacity-70" />
    </div>
  </div>
);

const InventoryManagement = ({ setLoading, setErrorMsg, setSuccessMsg, searchTerm = '' }) => {
  const { user } = useAuth();
  const { userRestaurantId, userRole } = useAdminRestaurant();

  // State
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  // const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table');
  const [selectedItems, setSelectedItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    expiringSoon: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    current_stock: '',
    min_stock_level: '',
    max_stock_level: '',
    unit: '',
    cost_per_unit: '',
    supplier: '',
    supplier_contact: '',
    supplier_email: '',
    expiry_date: '',
    description: '',
    barcode: '',
    location: '',
    reorder_point: '',
    lead_time_days: ''
  });
  const [stockUpdateData, setStockUpdateData] = useState({
    newStockLevel: '',
    reason: '',
    notes: ''
  });
  const [reorderData, setReorderData] = useState({
    quantity: '',
    expectedDelivery: '',
    notes: ''
  });
  const [takeOutData, setTakeOutData] = useState({
    quantity: '',
    reason: '',
    notes: ''
  });
  const [activityLogs, setActivityLogs] = useState([]);

  // Memoized user data
  const currentUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.email || 'Unknown User',
      email: user.email,
      role: userRole || 'unknown'
    };
  }, [user, userRole]);

  // Load inventory data
  const loadInventoryData = useCallback(async () => {
    if (!userRestaurantId) {
      setErrorMsg('No restaurant assigned. Please contact an administrator.');
      setIsLoadingData(false);
      return;
    }
    try {
      setIsLoadingData(true);
      const { data, error } = await inventoryService.getAllItems(userRestaurantId);
      if (error) throw new Error(error);
      setInventoryItems(data || []);
      if (!data || data.length === 0) {
        setErrorMsg('No inventory items found. Add some items to get started.');
      }
    } catch (error) {
      setErrorMsg('Failed to load inventory data: ' + error.message);
    } finally {
      setIsLoadingData(false);
    }
  }, [userRestaurantId, setErrorMsg]);

  // Load activity logs
  const loadActivityLogs = useCallback(async () => {
    if (!userRestaurantId) return;
    try {
      const { data, error } = await inventoryService.getActivityLogs(userRestaurantId);
      if (error) throw new Error(error);
      setActivityLogs(data || []);
    } catch (error) {
      setErrorMsg('Failed to load activity logs: ' + error.message);
    }
  }, [userRestaurantId, setErrorMsg]);

  // Initialize data
  useEffect(() => {
    if (userRestaurantId) {
      loadInventoryData();
      loadActivityLogs();
    }
  }, [userRestaurantId, loadInventoryData, loadActivityLogs]);

  // Update stats when inventory changes
  useEffect(() => {
    setStats(getInventoryStats(inventoryItems));
  }, [inventoryItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    if (!inventoryItems || inventoryItems.length === 0) return [];
    return inventoryItems
      .filter(item => {
        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
        const matchesStatus = filterStatus === 'all' || getStockStatus(item) === filterStatus;
        if (!searchTerm) return matchesCategory && matchesStatus;
        const searchLower = searchTerm.toLowerCase().trim();
        return (
          (item.name?.toLowerCase().includes(searchLower) ||
            item.supplier?.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower) ||
            item.barcode?.toLowerCase().includes(searchLower)) &&
          matchesCategory &&
          matchesStatus
        );
      })
      .sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        if (sortBy === 'expiry_date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        return sortOrder === 'asc'
          ? aValue > bValue ? 1 : -1
          : aValue < bValue ? 1 : -1;
      });
  }, [inventoryItems, searchTerm, filterCategory, filterStatus, sortBy, sortOrder]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (activeModal === 'edit' && selectedItem) {
        // Update existing item
        const { data, error } = await inventoryService.updateItem(
          selectedItem.id,
          formData,
          userRestaurantId,
          currentUser
        );
        if (error) throw new Error(error);

        setInventoryItems(prev =>
          prev.map(item => item.id === selectedItem.id ? data : item)
        );
        setSuccessMsg('Inventory item updated successfully!');
      } else {
        // Add new item
        const { data, error } = await inventoryService.addItem(
          formData,
          userRestaurantId,
          currentUser
        );
        if (error) throw new Error(error);

        setInventoryItems(prev => [...prev, data]);
        setSuccessMsg('New inventory item added successfully!');
      }

      closeModal();
    } catch (error) {
      setErrorMsg('Failed to save inventory item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openModal = (modalType, item = null) => {
    setActiveModal(modalType);
    setSelectedItem(item); // Always set the selected item

    if (modalType === 'edit' && item) {
      setFormData({
        name: item.name,
        category: item.category,
        current_stock: item.current_stock.toString(),
        min_stock_level: item.min_stock_level.toString(),
        max_stock_level: item.max_stock_level.toString(),
        unit: item.unit,
        cost_per_unit: item.cost_per_unit.toString(),
        supplier: item.supplier,
        supplier_contact: item.supplier_contact || '',
        supplier_email: item.supplier_email || '',
        expiry_date: item.expiry_date,
        description: item.description || '',
        barcode: item.barcode || '',
        location: item.location || '',
        reorder_point: item.reorder_point?.toString() || '',
        lead_time_days: item.lead_time_days?.toString() || ''
      });
    } else if (modalType === 'stockUpdate' && item) {
      setStockUpdateData({
        newStockLevel: item.current_stock.toString(),
        reason: '',
        notes: ''
      });
    } else if (modalType === 'reorder' && item) {
      setReorderData({
        quantity: Math.max(1, item.max_stock_level - item.current_stock).toString(),
        expectedDelivery: '',
        notes: ''
      });
    } else if (modalType === 'takeOut') {
      setTakeOutData({ quantity: '', reason: '', notes: '' });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null); // <-- Always reset selectedItem
    setFormData({
      name: '',
      category: '',
      current_stock: '',
      min_stock_level: '',
      max_stock_level: '',
      unit: '',
      cost_per_unit: '',
      supplier: '',
      supplier_contact: '',
      supplier_email: '',
      expiry_date: '',
      description: '',
      barcode: '',
      location: '',
      reorder_point: '',
      lead_time_days: ''
    });
    setTakeOutData({ quantity: '', reason: '', notes: '' }); // <-- Reset takeOutData as well
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    try {
      setLoading(true);
      const { data, error } = await inventoryService.getItemByBarcode(barcode, userRestaurantId);

      if (error) throw new Error(error);

      if (data) {
        openModal('view', data);
      } else {
        setFormData(prev => ({ ...prev, barcode }));
        openModal('add');
        setSuccessMsg('Barcode scanned. Please complete the item details.');
      }
    } catch (error) {
      setErrorMsg('Barcode scan failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle stock update
  const handleStockUpdate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const { data, error } = await inventoryService.updateStock(
        selectedItem.id,
        parseFloat(stockUpdateData.newStockLevel),
        stockUpdateData.reason,
        stockUpdateData.notes,
        userRestaurantId,
        currentUser
      );

      if (error) throw new Error(error);

      setInventoryItems(prev =>
        prev.map(item => item.id === selectedItem.id ? data : item)
      );
      setSuccessMsg('Stock level updated successfully!');
      closeModal();
      setStockUpdateData({ newStockLevel: '', reason: '', notes: '' });
    } catch (error) {
      setErrorMsg('Failed to update stock level: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;

    try {
      setLoading(true);
      const { error } = await inventoryService.deleteItem(itemId, userRestaurantId, currentUser);
      if (error) throw new Error(error);

      setInventoryItems(prev => prev.filter(item => item.id !== itemId));
      setSuccessMsg('Inventory item deleted successfully!');
    } catch (error) {
      setErrorMsg('Failed to delete inventory item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk operations
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return;

    try {
      setLoading(true);
      await Promise.all(
        selectedItems.map(itemId =>
          inventoryService.deleteItem(itemId, userRestaurantId, currentUser)
        )
      );

      setInventoryItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      setSuccessMsg(`${selectedItems.length} items deleted successfully!`);
    } catch (error) {
      setErrorMsg('Failed to delete items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle item selection
  const handleItemSelect = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    setSelectedItems(prev =>
      prev.length === filteredItems.length
        ? []
        : filteredItems.map(item => item.id)
    );
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);
      const { data, error } = await inventoryService.exportInventory(userRestaurantId);
      if (error) throw new Error(error);

      // Simulate download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMsg('Inventory exported successfully!');
    } catch (error) {
      setErrorMsg('Failed to export inventory: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle import
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const { data, error } = await inventoryService.importInventory(file, userRestaurantId);
      if (error) throw new Error(error);

      setSuccessMsg(`Successfully imported ${data.imported} items!`);
      loadInventoryData(); // Reload data
    } catch (error) {
      setErrorMsg('Failed to import inventory: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle take out
  const handleTakeOut = async (e) => {
    e.preventDefault();

    // Add validation for selected item
    if (!selectedItem) {
      setErrorMsg('Please select an item to take out');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await inventoryService.takeOutStock(
        selectedItem.id,
        parseFloat(takeOutData.quantity),
        takeOutData.reason,
        takeOutData.notes,
        userRestaurantId,
        currentUser
      );

      if (error) throw new Error(error);

      setInventoryItems(prev =>
        prev.map(item => item.id === selectedItem.id ? data : item)
      );
      setSuccessMsg('Stock taken out successfully!');
      closeModal();
    } catch (error) {
      setErrorMsg('Failed to take out stock: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle reorder
  const handleReorder = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const { error } = await inventoryService.placeReorder(
        selectedItem.id,
        parseFloat(reorderData.quantity),
        reorderData.expectedDelivery,
        reorderData.notes,
        userRestaurantId,
        currentUser
      );

      if (error) throw new Error(error);

      setSuccessMsg(`Reorder request sent for ${reorderData.quantity} units of ${selectedItem.name}`);
      closeModal();
      setReorderData({ quantity: '', expectedDelivery: '', notes: '' });
    } catch (error) {
      setErrorMsg('Failed to process reorder: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userRestaurantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No restaurant selected or access denied.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">


        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar md:flex-wrap md:pb-0">
          <button
            onClick={() => openModal('add')}
            className="flex items-center gap-1.5 md:gap-2 bg-primary-500 text-white px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Add Item
          </button>

          <button
            onClick={() => openModal('takeOut')}
            className="flex items-center gap-1.5 md:gap-2 bg-primary-500 text-white px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Take Out
          </button>

          <button
            onClick={() => document.getElementById('import-file').click()}
            className="flex items-center gap-1.5 md:gap-2 bg-gray-500 text-white px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Import
          </button>

          <input
            id="import-file"
            type="file"
            accept=".csv,.xlsx"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 md:gap-2 bg-blue-500 text-white px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Export
          </button>

          <button
            onClick={loadInventoryData}
            disabled={isLoadingData}
            className="hidden md:flex items-center gap-1.5 md:gap-2 bg-green-500 text-white px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-70 whitespace-nowrap flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 md:gap-2 bg-red-500 text-white px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Delete ({selectedItems.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex overflow-x-auto pb-2 gap-2 md:gap-4 no-scrollbar snap-x md:grid md:grid-cols-2 lg:grid-cols-5 md:pb-0">
        <StatsCard className="min-w-[120px] flex-shrink-0 snap-start" icon={Package} value={stats.total} label="Total" colorClass="text-gray-900" />
        <StatsCard className="min-w-[120px] flex-shrink-0 snap-start" icon={TrendingDown} value={stats.lowStock} label="Low Stock" colorClass="text-yellow-600" />
        <StatsCard className="min-w-[120px] flex-shrink-0 snap-start" icon={AlertTriangle} value={stats.outOfStock} label="No Stock" colorClass="text-red-600" />
        <StatsCard className="min-w-[120px] flex-shrink-0 snap-start" icon={IndianRupee} value={`₹${stats.totalValue.toFixed(2)}`} label="Value" colorClass="text-green-600" />
        <StatsCard className="min-w-[120px] flex-shrink-0 snap-start" icon={Clock} value={stats.expiringSoon} label="Expiring" colorClass="text-primary-600" />
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-2 md:p-4 rounded-lg shadow border">
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-between">
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:gap-4 md:flex-1">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2 py-1.5 md:px-4 md:py-2 text-xs md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Cats</option>
              {INVENTORY_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2 py-1.5 md:px-4 md:py-2 text-xs md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value={STOCK_STATUS.IN_STOCK}>In Stock</option>
              <option value={STOCK_STATUS.LOW_STOCK}>Low</option>
              <option value={STOCK_STATUS.OUT_OF_STOCK}>Out</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-2 py-1.5 md:px-4 md:py-2 text-xs md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="name-asc">Name</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="current_stock-asc">Stock (L-H)</option>
              <option value="current_stock-desc">Stock (H-L)</option>
              <option value="expiry_date-asc">Expiry</option>
              <option value="cost_per_unit-desc">Cost</option>
              <option value="last_updated-desc">Updated</option>
            </select>
          </div>

          <div className="hidden md:flex gap-2 self-end md:self-auto ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 md:px-3 md:py-2 rounded-lg border transition-colors ${viewMode === 'table'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 md:px-3 md:py-2 rounded-lg border transition-colors ${viewMode === 'grid'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingData && (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Mobile Inventory View: Compact Cards */}
      {!isLoadingData && (
        <div className="md:hidden space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
              <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No items found</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = getStockStatus(item);
              const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
              const isExpiringSoon = daysUntilExpiry <= 15 && daysUntilExpiry > 0;

              return (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${status === STOCK_STATUS.LOW_STOCK ? 'bg-yellow-500' :
                      status === STOCK_STATUS.OUT_OF_STOCK ? 'bg-red-500' : 'bg-green-500'
                    }`} />

                  <div className="pl-2 flex justify-between items-start mb-2">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate text-sm">{item.name}</h4>
                        {item.barcode && <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">#{item.barcode}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.category}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900 text-sm">{item.current_stock} <span className="text-[10px] font-normal text-gray-500 uppercase">{item.unit}</span></div>
                    </div>
                  </div>

                  <div className="pl-2 flex items-center justify-between border-t border-gray-100 pt-2 mt-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-gray-700">₹{item.cost_per_unit}</span>
                      {isExpiringSoon && (
                        <span className="flex items-center gap-1 text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                          <AlertCircle size={10} /> {daysUntilExpiry}d
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => openModal('stockUpdate', item)} className="text-green-600 p-1 hover:bg-green-50 rounded" title="Update Stock"><Edit3 size={16} /></button>
                      <button onClick={() => openModal('edit', item)} className="text-gray-500 p-1 hover:bg-gray-100 rounded" title="Edit"><Settings size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 p-1 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Inventory Table View (Desktop Only) */}
      {!isLoadingData && viewMode === 'table' && (
        <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No inventory items found</p>
                      <p className="text-sm">Try adjusting your filters or add new items.</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStockStatus(item);
                    const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = daysUntilExpiry <= 15 && daysUntilExpiry > 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleItemSelect(item.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {item.name}
                            {item.barcode && (
                              <span className="text-xs text-gray-500">#{item.barcode}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.supplier}
                            {item.location && (
                              <span className="ml-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.location}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {item.current_stock} {item.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {item.min_stock_level} | Max: {item.max_stock_level}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ₹{(item.cost_per_unit || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </div>
                          {isExpiringSoon && (
                            <div className="text-xs text-primary-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {daysUntilExpiry}d
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openModal('view', item)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal('stockUpdate', item)}
                              className="text-green-600 hover:text-green-800"
                              title="Update Stock"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {(status === STOCK_STATUS.LOW_STOCK || status === STOCK_STATUS.OUT_OF_STOCK) && (
                              <button
                                onClick={() => openModal('reorder', item)}
                                className="text-primary-600 hover:text-primary-800"
                                title="Reorder"
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openModal('edit', item)}
                              className="text-primary-600 hover:text-primary-800"
                              title="Edit"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View (Desktop Only) */}
      {!isLoadingData && viewMode === 'grid' && (
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No inventory items found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or add new items.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = getStockStatus(item);
              const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
              const isExpiringSoon = daysUntilExpiry <= 15 && daysUntilExpiry > 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow border hover:shadow-md transition-shadow ${status === STOCK_STATUS.LOW_STOCK ? 'border-yellow-200' :
                    status === STOCK_STATUS.OUT_OF_STOCK ? 'border-red-200' : ''
                    }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                        {item.barcode && (
                          <p className="text-xs text-gray-500">#{item.barcode}</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Category</span>
                        <span className="text-xs font-medium text-gray-900">{item.category}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Stock</span>
                        <span className="text-xs font-medium text-gray-900">
                          {item.current_stock} {item.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Cost</span>
                        <span className="text-xs font-medium text-gray-900">
                          ₹{(item.cost_per_unit || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Expiry</span>
                        <span className="text-xs font-medium text-gray-900">
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status.replace('-', ' ')}
                        </span>
                        {isExpiringSoon && (
                          <span className="text-xs text-primary-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {daysUntilExpiry}d
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => openModal('view', item)}
                          className="flex-1 text-xs bg-blue-50 text-blue-600 py-1 rounded hover:bg-blue-100 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openModal('stockUpdate', item)}
                          className="flex-1 text-xs bg-green-50 text-green-600 py-1 rounded hover:bg-green-100 transition-colors"
                        >
                          Stock
                        </button>
                        <button
                          onClick={() => openModal('edit', item)}
                          className="flex-1 text-xs bg-primary-50 text-primary-600 py-1 rounded hover:bg-primary-100 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View Item Modal */}
      {activeModal === 'view' && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal('stockUpdate', selectedItem)}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  Update Stock
                </button>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                    <p className="text-sm text-gray-900">{selectedItem.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-sm text-gray-900">{selectedItem.category}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <p className="text-sm text-gray-900">{selectedItem.barcode || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-sm text-gray-900">{selectedItem.location || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Stock Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <p className="text-sm text-gray-900">
                      {selectedItem.current_stock} {selectedItem.unit}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Range</label>
                    <p className="text-sm text-gray-900">
                      Min: {selectedItem.min_stock_level} | Max: {selectedItem.max_stock_level}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                    <p className="text-sm text-gray-900">
                      {selectedItem.reorder_point || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time</label>
                    <p className="text-sm text-gray-900">
                      {selectedItem.lead_time_days ? `${selectedItem.lead_time_days} days` : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getStockStatus(selectedItem))}`}>
                      {getStockStatus(selectedItem).replace('-', ' ')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-sm text-gray-900">{selectedItem.last_updated}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Financial Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                    <p className="text-sm text-gray-900">
                      ₹{(selectedItem.cost_per_unit || 0).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedItem.expiry_date).toLocaleDateString()}
                      {(() => {
                        const daysUntilExpiry = Math.ceil((new Date(selectedItem.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <span className="ml-2 text-primary-600">
                            (Expires in {daysUntilExpiry} days)
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Supplier Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                    <p className="text-sm text-gray-900">{selectedItem.supplier}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                    <p className="text-sm text-gray-900">{selectedItem.supplier_contact || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{selectedItem.supplier_email || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h4>
                <div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {selectedItem.description || 'No description available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeModal === 'edit' ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Category</option>
                      {INVENTORY_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Optional barcode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Refrigerator A1"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Stock Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.current_stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, current_stock: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Unit</option>
                      {INVENTORY_UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Stock Level *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Stock Level *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.max_stock_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_stock_level: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Point
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.reorder_point}
                      onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Auto-reorder threshold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.lead_time_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, lead_time_days: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Days to receive order"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Financial Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost per Unit *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Supplier Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Contact
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_contact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Email
                    </label>
                    <input
                      type="email"
                      value={formData.supplier_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Email address"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Additional Information
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Optional description or notes about this item..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {activeModal === 'edit' ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {activeModal === 'stockUpdate' && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Update Stock Level</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleStockUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedItem.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedItem.current_stock} {selectedItem.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Stock Level *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={stockUpdateData.newStockLevel}
                  onChange={(e) => setStockUpdateData(prev => ({ ...prev, newStockLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Update
                </label>
                <select
                  value={stockUpdateData.reason}
                  onChange={(e) => setStockUpdateData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Reason</option>
                  <option value="received">Received from supplier</option>
                  <option value="used">Used in production</option>
                  <option value="waste">Waste/Loss</option>
                  <option value="adjustment">Stock adjustment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows="2"
                  value={stockUpdateData.notes}
                  onChange={(e) => setStockUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Optional notes about this stock update..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reorder Modal */}
      {activeModal === 'reorder' && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Place Reorder</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleReorder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedItem.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedItem.current_stock} {selectedItem.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedItem.supplier}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Order *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={reorderData.quantity}
                  onChange={(e) => setReorderData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={reorderData.expectedDelivery}
                  onChange={(e) => setReorderData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows="2"
                  value={reorderData.notes}
                  onChange={(e) => setReorderData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any special instructions or notes..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Take Out Modal */}
      {activeModal === 'takeOut' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Take Out from Inventory</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleTakeOut} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Item *
                </label>
                <select
                  required
                  value={selectedItem?.id || ''}
                  onChange={(e) => {
                    const itemId = e.target.value;
                    const item = inventoryItems.find(i => i.id.toString() === itemId);
                    setSelectedItem(item || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select an item to take out</option>
                  {inventoryItems
                    .filter(item => item.current_stock > 0)
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.current_stock} {item.unit}
                      </option>
                    ))
                  }
                </select>
              </div>

              {selectedItem && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedItem.current_stock} {selectedItem.unit}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity to Remove *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedItem.current_stock}
                      required
                      value={takeOutData.quantity}
                      onChange={(e) => setTakeOutData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={`Max: ${selectedItem.current_stock} ${selectedItem.unit}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Take Out *
                    </label>
                    <select
                      required
                      value={takeOutData.reason}
                      onChange={(e) => setTakeOutData(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Reason</option>
                      <option value="production">Used in production</option>
                      <option value="waste">Waste/Loss</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows="2"
                      value={takeOutData.notes}
                      onChange={(e) => setTakeOutData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Optional notes about this take out..."
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                  Take Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;