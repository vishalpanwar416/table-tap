import React, { useState, useEffect, useRef } from 'react';
import { useAdminRestaurant } from '../../../../shared/context/AdminRestaurantContext';
import StyledQRCode from './StyledQRCode';
import { supabase } from '../../../../shared/supabase';
import {
  Plus,
  Trash2,
  Download,
  Copy,
  QrCode,
  Table,
  Edit3,
  X,
  Settings,
  Save,
  Loader,
  Clock,
  Truck,
  CheckCircle,
  Check,
  Users,
  AlertCircle
} from 'lucide-react';

const QRManagement = ({ searchTerm, setLoading, setErrorMsg, setSuccessMsg }) => {
  const { restaurant, userRole, isAdmin, canEdit, refreshRestaurant } = useAdminRestaurant();
  const [tables, setTables] = useState([]);

  const [selectedTable, setSelectedTable] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tableOrders, setTableOrders] = useState({}); // Store orders for each table
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    location: '',
    capacity: 2,
    restaurantId: restaurant?.id || ''
  });

  // Status metadata for order status colors
  const STATUS_META = {
    pending: {
      label: "Pending",
      color: "yellow",
      icon: <Clock className="h-4 w-4 text-yellow-600" />,
      badge: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    preparing: {
      label: "Preparing",
      color: "purple",
      icon: <Truck className="h-4 w-4 text-purple-600" />,
      badge: "bg-purple-100 text-purple-800 border border-purple-200",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    ready: {
      label: "Ready",
      color: "green",
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      badge: "bg-green-100 text-green-800 border border-green-200",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    completed: {
      label: "Completed",
      color: "teal",
      icon: <Check className="h-4 w-4 text-teal-600" />,
      badge: "bg-teal-100 text-teal-800 border border-teal-200",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200"
    },
    rejected: {
      label: "Rejected",
      color: "red",
      icon: <X className="h-4 w-4 text-red-600" />,
      badge: "bg-red-100 text-red-800 border border-red-200",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
  };

  // Load tables from restaurant data on component mount
  useEffect(() => {
    if (restaurant?.tables) {
      try {
        const parsedTables = typeof restaurant.tables === 'string'
          ? JSON.parse(restaurant.tables)
          : restaurant.tables;
        setTables(Array.isArray(parsedTables) ? parsedTables : []);
      } catch (error) {
        setTables([]);
      }
    } else {
      setTables([]);
    }
  }, [restaurant]);

  // Fetch orders for all tables
  useEffect(() => {
    if (restaurant?.id && tables.length > 0) {
      fetchTableOrders();
    }
  }, [restaurant?.id, tables]);

  // Function to fetch orders for all tables
  const fetchTableOrders = async () => {
    try {
      const tableNumbers = tables.map(table => table.tableNumber);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .in('table_number', tableNumbers)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (error) {
        return;
      }

      // Group orders by table number
      const ordersByTable = {};
      orders.forEach(order => {
        const tableNum = order.table_number || order.tableNumber;
        if (tableNum) {
          if (!ordersByTable[tableNum]) {
            ordersByTable[tableNum] = [];
          }
          ordersByTable[tableNum].push(order);
        }
      });

      setTableOrders(ordersByTable);
    } catch (error) {
    }
  };

  // Get table status based on active orders
  const getTableStatus = (tableNumber) => {
    const tableOrdersList = tableOrders[tableNumber] || [];

    if (tableOrdersList.length === 0) {
      return {
        status: 'empty',
        label: 'Empty',
        color: 'gray',
        icon: <Table className="h-4 w-4 text-gray-600" />,
        badge: "bg-gray-100 text-gray-800 border border-gray-200",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        orderCount: 0
      };
    }

    // Get the most recent order status
    const latestOrder = tableOrdersList[0];
    const statusMeta = STATUS_META[latestOrder.status] || STATUS_META.pending;

    return {
      ...statusMeta,
      orderCount: tableOrdersList.length,
      latestOrder
    };
  };

  // Get table background color based on status
  const getTableBackgroundColor = (tableNumber) => {
    const status = getTableStatus(tableNumber);
    return status.bgColor;
  };

  // Get table border color based on status
  const getTableBorderColor = (tableNumber) => {
    const status = getTableStatus(tableNumber);
    return status.borderColor;
  };

  const resetForm = () => {
    setNewTable({
      tableNumber: '',
      location: '',
      capacity: 2,
      restaurantId: restaurant?.id || ''
    });
  };

  const generateQRUrl = (table) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?restaurant=${table.restaurantId}&table=${table.tableNumber}`;
  };

  const handleInputChange = (e) => {
    setNewTable({
      ...newTable,
      [e.target.name]: e.target.value
    });
  };

  // Save tables to database
  const saveTablesData = async (updatedTables) => {
    if (!canEdit()) {
      setErrorMsg('You do not have permission to edit tables');
      return false;
    }

    try {
      setSaving(true);
      setLoading(true);

      const { data, error } = await supabase
        .from('restaurants')
        .update({
          tables: JSON.stringify(updatedTables),
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurant.id)
        .select()
        .single();

      if (error) {
        setErrorMsg('Failed to save tables data');
        return false;
      }

      // Refresh the restaurant context to get updated data
      await refreshRestaurant();
      return true;

    } catch (err) {
      setErrorMsg('Failed to save tables data');
      return false;
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (!newTable.tableNumber.trim()) {
      setErrorMsg('Table number is required');
      return;
    }

    // Check if table number already exists
    const existingTable = tables.find(t => t.tableNumber === newTable.tableNumber.trim());
    if (existingTable && !editingTable) {
      setErrorMsg('Table number already exists');
      return;
    }

    const tableData = {
      id: editingTable ? editingTable.id : `table_${Date.now()}`,
      tableNumber: newTable.tableNumber.trim(),
      location: newTable.location.trim(),
      capacity: parseInt(newTable.capacity) || 2,
      restaurantId: restaurant?.id || newTable.restaurantId,
      createdAt: editingTable ? editingTable.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedTables;
    if (editingTable) {
      // Update existing table
      updatedTables = tables.map(table =>
        table.id === editingTable.id ? tableData : table
      );
    } else {
      // Add new table
      updatedTables = [...tables, tableData];
    }

    // Save to database
    const success = await saveTablesData(updatedTables);
    if (success) {
      setTables(updatedTables);
      setSuccessMsg(editingTable ? 'Table updated successfully' : 'Table added successfully');
      setEditingTable(null);
      resetForm();
      setShowAddForm(false);
    }
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setNewTable({
      tableNumber: table.tableNumber,
      location: table.location,
      capacity: table.capacity,
      restaurantId: table.restaurantId
    });
    setShowAddForm(true);
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }

    const updatedTables = tables.filter(table => table.id !== tableId);

    // Save to database
    const success = await saveTablesData(updatedTables);
    if (success) {
      setTables(updatedTables);
      setSuccessMsg('Table deleted successfully');
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccessMsg('QR URL copied to clipboard!');
    }).catch(() => {
      setErrorMsg('Failed to copy URL');
    });
  };

  const downloadQR = (table) => {
    const instance = qrInstancesRef.current[table.id];
    if (!instance) return;
    instance.download({
      name: `QR-Table-${table.tableNumber}`,
      extension: 'png',
    });
  };

  const filteredTables = tables.filter(table =>
    table.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (table.location && table.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show loading state if restaurant data is not loaded
  if (!restaurant) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={48} />
        <span className="ml-3 text-gray-600">Loading restaurant data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {/* Removed redundant title */}
          <p className="text-gray-600">Generate QR codes for restaurant tables</p>
          <p className="text-sm text-gray-500">Restaurant: {restaurant.name}</p>
        </div>
        {canEdit() && (
          <button
            onClick={() => {
              resetForm();
              setEditingTable(null);
              setShowAddForm(true);
            }}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader size={20} className="animate-spin" /> : <Plus size={20} />}
            Add Table
          </button>
        )}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((table) => {
          const tableStatus = getTableStatus(table.tableNumber);
          const bgColor = getTableBackgroundColor(table.tableNumber);
          const borderColor = getTableBorderColor(table.tableNumber);

          return (
            <div
              key={table.id}
              className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 hover:shadow-lg ${selectedTable?.id === table.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                } ${bgColor} ${borderColor}`}
            >
              <div className="p-4">
                {/* Table Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Table {table.tableNumber}
                    </h3>
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mt-1">
                      {tableStatus.icon}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tableStatus.badge}`}>
                        {tableStatus.label}
                      </span>
                      {tableStatus.orderCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Users size={12} />
                          {tableStatus.orderCount} order{tableStatus.orderCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {canEdit() && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTable(table)}
                        disabled={saving}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                        title="Edit table"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        disabled={saving}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                        title="Delete table"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Table Info */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Table size={16} />
                    <span>Capacity: {table.capacity} people</span>
                  </div>
                  {table.location && (
                    <div className="flex items-center gap-2">
                      <Settings size={16} />
                      <span>Location: {table.location}</span>
                    </div>
                  )}
                </div>

                {/* Active Orders Info */}
                {tableStatus.orderCount > 0 && tableStatus.latestOrder && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Latest Order</span>
                      <span className="text-xs text-gray-500">
                        #{tableStatus.latestOrder.id?.slice(0, 8) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {tableStatus.latestOrder.customer_name || 'Guest'}
                      </span>
                      <span className="font-medium">
                        ₹{tableStatus.latestOrder.total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                )}

                {/* QR Code Preview */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-2 rounded border">
                    <QRCodeSVG
                      id={`qr-${table.id}`}
                      value={generateQRUrl(table)}
                      size={120}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedTable(table)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <QrCode size={16} />
                    View Details
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(generateQRUrl(table))}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy size={16} />
                      Copy URL
                    </button>
                    <button
                      onClick={() => downloadQR(table)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <QrCode size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No tables found' : 'No tables added yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Add your first table to generate QR codes'
            }
          </p>
          {!searchTerm && canEdit() && (
            <button
              onClick={() => {
                resetForm();
                setEditingTable(null);
                setShowAddForm(true);
              }}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add Table
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Table Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    name="tableNumber"
                    value={newTable.tableNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1, A1, T01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="20"
                    value={newTable.capacity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={newTable.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., First Floor, Terrace, Near Window"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTable(null);
                    resetForm();
                  }}
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTable}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingTable ? 'Update Table' : 'Add Table'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Detail Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Table {selectedTable.tableNumber}
                  </h3>
                  {/* Status in modal */}
                  {(() => {
                    const tableStatus = getTableStatus(selectedTable.tableNumber);
                    return (
                      <div className="flex items-center gap-2 mt-1">
                        {tableStatus.icon}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tableStatus.badge}`}>
                          {tableStatus.label}
                        </span>
                        {tableStatus.orderCount > 0 && (
                          <span className="text-xs text-gray-600">
                            ({tableStatus.orderCount} active order{tableStatus.orderCount > 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="p-4 rounded-lg border bg-[#cffafe]/30 inline-block">
                  <StyledQRCode
                    id={`qr-detail-${selectedTable.id}`}
                    value={generateQRUrl(selectedTable)}
                    size={200}
                    onInstanceReady={(qr) => { qrInstancesRef.current[selectedTable.id] = qr; }}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">QR Code URL:</p>
                  <p className="text-xs text-gray-600 break-all">{generateQRUrl(selectedTable)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Capacity:</span>
                    <span className="ml-2 text-gray-600">{selectedTable.capacity} people</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{selectedTable.location || 'Not specified'}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Created: {new Date(selectedTable.createdAt).toLocaleString()}
                  {selectedTable.updatedAt && selectedTable.updatedAt !== selectedTable.createdAt && (
                    <span className="block">Updated: {new Date(selectedTable.updatedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(generateQRUrl(selectedTable))}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  Copy URL
                </button>
                <button
                  onClick={() => downloadQR(selectedTable)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRManagement;