import React, { useState, useEffect, useRef } from 'react';
import { useAdminRestaurant } from '../../../../shared/context/AdminRestaurantContext';
import StyledQRCode from './StyledQRCode';
import QRTableCard from './QRTableCard';
import { supabase } from '../../../../shared/supabase';
import { getSystemSetting } from '../../../../admin/pages/AdminPannel/admin_service';
import BulkQRLayout from './BulkQRLayout';
import html2canvas from 'html2canvas';
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
  AlertCircle,
  Grid
} from 'lucide-react';

const QRManagement = ({ searchTerm, setLoading, setErrorMsg, setSuccessMsg }) => {
  const { restaurant, userRole, isAdmin, canEdit, refreshRestaurant } = useAdminRestaurant();
  const [tables, setTables] = useState([]);
  const qrInstancesRef = useRef({}); // Store QR instances for download

  const handleQRInstanceReady = React.useCallback((tableId, qr) => {
    qrInstancesRef.current[tableId] = qr;
  }, []);

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
  const [platformBranding, setPlatformBranding] = useState(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        let logoSetting = await getSystemSetting('system_logo');

        // Auto-parse if it's a JSON string
        if (typeof logoSetting === 'string' && logoSetting.trim().startsWith('{')) {
          try {
            logoSetting = JSON.parse(logoSetting);
          } catch (e) {
            console.error('Failed to parse system_logo JSON', e);
          }
        }

        const url = logoSetting?.url || (typeof logoSetting === 'string' ? logoSetting : null);
        setPlatformBranding(url);
      } catch (err) {
        console.error('Error fetching branding:', err);
      }
    };
    fetchBranding();
  }, []);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    startNumber: 1,
    count: 5,
    capacity: 4,
    location: 'Main Hall'
  });

  // Automatically update suggested start number
  useEffect(() => {
    if (tables.length > 0) {
      // Try to find the highest numeric table number
      const numbers = tables
        .map(t => parseInt(t.tableNumber))
        .filter(n => !isNaN(n));
      const max = numbers.length > 0 ? Math.max(...numbers) : tables.length;
      setBulkConfig(prev => ({ ...prev, startNumber: max + 1 }));
    } else {
      setBulkConfig(prev => ({ ...prev, startNumber: 1 }));
    }
  }, [tables.length]);

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
      color: "orange",
      icon: <Truck className="h-4 w-4 text-orange-600" />,
      badge: "bg-orange-100 text-orange-800 border border-orange-200",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
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

  // Normalize table objects so each has restaurantId for QR URLs
  const normalizeTables = (rawTables, restaurantId) => {
    if (!Array.isArray(rawTables)) return [];
    return rawTables.map((t) => ({
      ...t,
      restaurantId: t.restaurantId || t.restaurant_id || restaurantId
    }));
  };

  // Load tables: prefer explicit fetch so we always have latest; fallback to restaurant.tables
  useEffect(() => {
    if (!restaurant?.id) {
      setTables([]);
      return;
    }

    let mounted = true;

    const loadTables = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('tables')
          .eq('id', restaurant.id)
          .maybeSingle();

        if (!mounted) return;
        if (error) {
          setTables([]);
          return;
        }

        let raw = [];
        if (data?.tables != null) {
          try {
            raw = typeof data.tables === 'string' ? JSON.parse(data.tables) : data.tables;
          } catch (_) {
            raw = [];
          }
        }
        if (!Array.isArray(raw)) raw = [];
        setTables(normalizeTables(raw, restaurant.id));
      } catch (_) {
        if (mounted) setTables([]);
      }
    };

    loadTables();
    return () => { mounted = false; };
  }, [restaurant?.id]);

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

  const generateQRUrl = React.useCallback((table) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?restaurant=${table.restaurantId}&table=${table.tableNumber}`;
  }, []);

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

  const handleBulkGenerate = async () => {
    const { startNumber, count, capacity, location } = bulkConfig;

    if (count <= 0) {
      setErrorMsg('Number of tables must be greater than 0');
      return;
    }

    const nextStart = parseInt(startNumber) || 1;

    const newBatch = Array.from({ length: count }).map((_, index) => {
      const tableNum = nextStart + index;
      return {
        id: `table_${Date.now()}_${tableNum}_${index}`,
        tableNumber: `${tableNum}`,
        location: location || 'Main Hall',
        capacity: parseInt(capacity) || 4,
        restaurantId: restaurant.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const updatedTables = [...tables, ...newBatch];
    const success = await saveTablesData(updatedTables);
    if (success) {
      setTables(updatedTables);
      setSuccessMsg(`Generated ${newBatch.length} new tables successfully!`);
      setShowBulkModal(false);
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

  const handleDownloadCard = async () => {
    if (!selectedTable) return;
    setIsDownloading(true);

    try {
      // Find the hidden card element
      const cardElement = document.getElementById('hidden-qr-card-download');
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Wait a moment for fonts/images
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardElement, {
        scale: 2, // High resolution
        backgroundColor: null,
        logging: false,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `QR-Table-${selectedTable.tableNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setSuccessMsg('QR Card downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      setErrorMsg('Failed to download QR card');
    } finally {
      setIsDownloading(false);
    }
  };


  const handleBulkPrint = () => {
    setIsPreparingPrint(true);
    // Timeout handled by BulkQRLayout logic or manual timeout here
    setTimeout(() => {
      window.print();
      setIsPreparingPrint(false);
    }, 2000); // Wait 2s for canvases to render
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
        <div />
        {canEdit() && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleBulkPrint}
              disabled={saving || tables.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white text-slate-700 font-bold px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50 text-xs sm:text-sm"
            >
              <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="whitespace-nowrap">Bulk Print</span>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 font-bold px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all disabled:opacity-50 text-xs sm:text-sm"
            >
              <Grid size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="whitespace-nowrap">Bulk Create</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingTable(null);
                setShowAddForm(true);
              }}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 text-white font-bold px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 text-xs sm:text-sm"
            >
              {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} className="sm:w-[20px] sm:h-[20px]" />}
              <span className="whitespace-nowrap">Add Table</span>
            </button>
          </div>
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
              className={`bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 group relative overflow-hidden ${selectedTable?.id === table.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                } ${bgColor} ${borderColor}`}
            >
              <div className="p-4">
                {/* Table Header & QR Preview */}
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Table {table.tableNumber}
                    </h3>
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mt-1">
                      {tableStatus.icon}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${tableStatus.badge}`}>
                        {tableStatus.label}
                      </span>
                    </div>
                    {tableStatus.orderCount > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <Users size={12} className="text-blue-500" />
                        {tableStatus.orderCount} active session{tableStatus.orderCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                    <StyledQRCode
                      id={`qr-mini-${table.id}`}
                      value={generateQRUrl(table)}
                      size={64}
                    />
                  </div>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {canEdit() && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditTable(table); }}
                        disabled={saving}
                        className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-blue-600 rounded-lg shadow-sm border border-slate-100 transition-all"
                        title="Edit table"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}
                        disabled={saving}
                        className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-red-600 rounded-lg shadow-sm border border-slate-100 transition-all"
                        title="Delete table"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
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

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedTable(table)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <QrCode size={16} />
                    View Details
                  </button>
                  <button
                    onClick={() => copyToClipboard(generateQRUrl(table))}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy size={16} />
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTables.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm col-span-full">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <QrCode size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">
            {searchTerm ? 'No tables found' : 'Ready to launch?'}
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm font-medium">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Add your tables to generate unique QR codes for contactless ordering.'
            }
          </p>
          {!searchTerm && canEdit() && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  resetForm();
                  setEditingTable(null);
                  setShowAddForm(true);
                }}
                disabled={saving}
                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                Add Table
              </button>
              <button
                onClick={handleBulkGenerate}
                disabled={saving}
                className="w-full sm:w-auto bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Bulk Generate (5)
              </button>
            </div>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl sm:rounded-[48px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[96vh] sm:max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3 sm:px-6 sm:py-4 flex justify-between items-center border-b border-slate-50 bg-white z-10 sticky top-0">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Premium Card Preview</h3>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Premium Card Preview */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-50 flex items-center justify-center">
              <QRTableCard
                table={selectedTable}
                restaurant={restaurant}
                generateQRUrl={generateQRUrl}
                platformBranding={platformBranding}
                className="scale-[0.85] sm:scale-95 origin-center"
              />
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-6 bg-white border-t border-slate-100 grid grid-cols-2 gap-2 sm:gap-4">
              <button
                onClick={() => copyToClipboard(generateQRUrl(selectedTable))}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-slate-100 transition-all text-xs border border-slate-100"
              >
                <div className="p-1 px-1.5 bg-white rounded-lg shadow-sm border border-slate-200 hidden sm:block">
                  <Copy size={16} />
                </div>
                Copy Link
              </button>
              <button
                onClick={handleDownloadCard}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 bg-[#0f172a] text-white font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 text-xs uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDownloading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                {isDownloading ? 'Saving...' : 'Download Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Card for High-Res Download */}
      {selectedTable && (
        <div className="fixed top-0 left-[-9999px] invisible">
          <div id="hidden-qr-card-download" className="bg-white p-0 rounded-[60px] overflow-hidden">
            <QRTableCard
              table={selectedTable}
              restaurant={restaurant}
              platformBranding={platformBranding}
              generateQRUrl={generateQRUrl}
              className="shadow-none" // Remove shadow for clean cutout
            />
          </div>
        </div>
      )}
      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Bulk Generation</h3>
                  <p className="text-sm text-slate-500 font-medium">Create multiple tables at once</p>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                      Start Number
                    </label>
                    <input
                      type="number"
                      value={bulkConfig.startNumber}
                      onChange={(e) => setBulkConfig(prev => ({ ...prev, startNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                      Total Tables
                    </label>
                    <input
                      type="number"
                      value={bulkConfig.count}
                      onChange={(e) => setBulkConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                    Default Capacity
                  </label>
                  <div className="flex items-center gap-3">
                    {[2, 4, 6, 8].map(cap => (
                      <button
                        key={cap}
                        onClick={() => setBulkConfig(prev => ({ ...prev, capacity: cap }))}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${bulkConfig.capacity === cap
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                          }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                    Location Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Main Hall, Terrace"
                    value={bulkConfig.location}
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleBulkGenerate}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                  Generate {bulkConfig.count} Tables
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  Tables {bulkConfig.startNumber} to {parseInt(bulkConfig.startNumber) + (bulkConfig.count - 1)} will be created
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Layout */}
      <BulkQRLayout
        tables={tables}
        restaurant={restaurant}
        platformBranding={platformBranding}
        generateQRUrl={generateQRUrl}
        isPrinting={isPreparingPrint}
      />
    </div>
  );
};

export default QRManagement;