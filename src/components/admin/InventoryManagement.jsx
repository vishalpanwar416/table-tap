import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Upload,
  Eye,
  X,
  Save,
  RefreshCw
} from 'lucide-react';

const InventoryManagement = ({ setLoading, setErrorMsg, setSuccessMsg }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    current_stock: '',
    min_stock_level: '',
    max_stock_level: '',
    unit: '',
    cost_per_unit: '',
    supplier: '',
    expiry_date: '',
    description: ''
  });

  // Categories for inventory items
  const categories = [
    'Vegetables',
    'Meat & Poultry',
    'Seafood',
    'Dairy',
    'Grains & Cereals',
    'Spices & Seasonings',
    'Beverages',
    'Frozen Foods',
    'Canned Goods',
    'Other'
  ];

  const units = ['kg', 'lbs', 'pieces', 'liters', 'gallons', 'boxes', 'bags', 'bottles'];

  // Mock data for demonstration
  useEffect(() => {
    const mockInventory = [
      {
        id: 1,
        name: 'Fresh Tomatoes',
        category: 'Vegetables',
        current_stock: 15,
        min_stock_level: 10,
        max_stock_level: 50,
        unit: 'kg',
        cost_per_unit: 3.50,
        supplier: 'Fresh Farm Co.',
        expiry_date: '2024-12-30',
        last_updated: '2024-12-20',
        description: 'Organic Roma tomatoes for pizza sauce'
      },
      {
        id: 2,
        name: 'Ground Beef',
        category: 'Meat & Poultry',
        current_stock: 5,
        min_stock_level: 8,
        max_stock_level: 25,
        unit: 'kg',
        cost_per_unit: 12.99,
        supplier: 'Premium Meats Ltd.',
        expiry_date: '2024-12-25',
        last_updated: '2024-12-19',
        description: '80/20 ground beef for burgers'
      },
      {
        id: 3,
        name: 'Mozzarella Cheese',
        category: 'Dairy',
        current_stock: 20,
        min_stock_level: 15,
        max_stock_level: 40,
        unit: 'kg',
        cost_per_unit: 8.75,
        supplier: 'Dairy Fresh Inc.',
        expiry_date: '2024-12-28',
        last_updated: '2024-12-21',
        description: 'Part-skim mozzarella for pizzas'
      },
      {
        id: 4,
        name: 'Olive Oil',
        category: 'Other',
        current_stock: 2,
        min_stock_level: 5,
        max_stock_level: 15,
        unit: 'bottles',
        cost_per_unit: 15.99,
        supplier: 'Mediterranean Imports',
        expiry_date: '2025-06-15',
        last_updated: '2024-12-18',
        description: 'Extra virgin olive oil for cooking'
      }
    ];
    setInventoryItems(mockInventory);
  }, []);

  // Get stock status
  const getStockStatus = (item) => {
    if (item.current_stock <= 0) return 'out-of-stock';
    if (item.current_stock <= item.min_stock_level) return 'low-stock';
    if (item.current_stock >= item.max_stock_level) return 'overstock';
    return 'in-stock';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'out-of-stock': return 'text-red-600 bg-red-100';
      case 'low-stock': return 'text-yellow-600 bg-yellow-100';
      case 'overstock': return 'text-blue-600 bg-blue-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  // Filter and sort items
  const filteredItems = inventoryItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || getStockStatus(item) === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get dashboard stats
  const stats = {
    total: inventoryItems.length,
    lowStock: inventoryItems.filter(item => getStockStatus(item) === 'low-stock').length,
    outOfStock: inventoryItems.filter(item => getStockStatus(item) === 'out-of-stock').length,
    totalValue: inventoryItems.reduce((sum, item) => sum + (item.current_stock * item.cost_per_unit), 0)
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (showEditModal && selectedItem) {
        // Update existing item
        setInventoryItems(prev => 
          prev.map(item => 
            item.id === selectedItem.id 
              ? { ...item, ...formData, last_updated: new Date().toISOString().split('T')[0] }
              : item
          )
        );
        setSuccessMsg('Inventory item updated successfully!');
      } else {
        // Add new item
        const newItem = {
          id: Date.now(),
          ...formData,
          current_stock: parseFloat(formData.current_stock),
          min_stock_level: parseFloat(formData.min_stock_level),
          max_stock_level: parseFloat(formData.max_stock_level),
          cost_per_unit: parseFloat(formData.cost_per_unit),
          last_updated: new Date().toISOString().split('T')[0]
        };
        setInventoryItems(prev => [...prev, newItem]);
        setSuccessMsg('New inventory item added successfully!');
      }
      
      handleCloseModal();
    } catch (error) {
      setErrorMsg('Failed to save inventory item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    
    try {
      setLoading(true);
      setInventoryItems(prev => prev.filter(item => item.id !== itemId));
      setSuccessMsg('Inventory item deleted successfully!');
    } catch (error) {
      setErrorMsg('Failed to delete inventory item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      category: '',
      current_stock: '',
      min_stock_level: '',
      max_stock_level: '',
      unit: '',
      cost_per_unit: '',
      supplier: '',
      expiry_date: '',
      description: ''
    });
  };

  // Handle edit
  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      current_stock: item.current_stock.toString(),
      min_stock_level: item.min_stock_level.toString(),
      max_stock_level: item.max_stock_level.toString(),
      unit: item.unit,
      cost_per_unit: item.cost_per_unit.toString(),
      supplier: item.supplier,
      expiry_date: item.expiry_date,
      description: item.description || ''
    });
    setShowEditModal(true);
  };

  // Handle view
  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-orange-500" />
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">Track and manage your restaurant inventory</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          <button className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">${stats.totalValue.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items or suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="overstock">Overstock</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="current_stock-asc">Stock Low-High</option>
            <option value="current_stock-desc">Stock High-Low</option>
            <option value="expiry_date-asc">Expiry Soon</option>
            <option value="cost_per_unit-desc">Cost High-Low</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
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
                    <p className="text-sm">Try adjusting your filters or add new items to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">Updated: {item.last_updated}</div>
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
                        ${item.cost_per_unit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(item)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-orange-600 hover:text-orange-800"
                            title="Edit Item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Item"
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

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {showEditModal ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.current_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
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
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    value={formData.max_stock_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_stock_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost per Unit *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Optional description or notes about this item..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {showEditModal ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                    <p className="text-sm text-gray-900">
                      ${selectedItem.cost_per_unit.toFixed(2)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <p className="text-sm text-gray-900">{selectedItem.supplier}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedItem.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getStockStatus(selectedItem))}`}>
                      {getStockStatus(selectedItem).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedItem.description || 'No description available'}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      );
    };
    
    export default InventoryManagement;