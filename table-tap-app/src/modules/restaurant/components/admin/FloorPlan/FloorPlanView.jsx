
import React, { useState, useEffect, useRef } from 'react';
import { useAdminRestaurant } from '../../../../shared/context/AdminRestaurantContext';
import { supabase } from '../../../../shared/supabase';
import {
    Printer,
    Eye,
    Loader,
    RefreshCw,
    LayoutGrid,
    X,
    ExternalLink,
    Minus,
    Plus
} from 'lucide-react';
import PrintBill from '../PrintBill';

const FloorPlanView = ({ searchTerm, onViewOrders, onCreateOrder }) => {
    const { restaurant, updateRestaurant } = useAdminRestaurant();
    const [tables, setTables] = useState([]);
    const [tableOrders, setTableOrders] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [orderToPrint, setOrderToPrint] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const printRef = useRef(null);

    // Table box size: 'compact' | 'medium' | 'large' — default compact to fit more tables
    const [tableBoxSize, setTableBoxSize] = useState(() => {
        try {
            const saved = localStorage.getItem('floor_plan_table_box_size');
            if (['compact', 'medium', 'large'].includes(saved)) return saved;
        } catch (_) { }
        return 'compact';
    });

    const TABLE_SIZE_CONFIG = {
        compact: {
            gridClass: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2',
            boxClass: 'p-2',
            numberClass: 'text-base',
            metaClass: 'text-[10px]'
        },
        medium: {
            gridClass: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4',
            boxClass: 'p-3',
            numberClass: 'text-lg',
            metaClass: 'text-xs'
        },
        large: {
            gridClass: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
            boxClass: 'p-4',
            numberClass: 'text-xl',
            metaClass: 'text-sm'
        }
    };

    const sizeConfig = TABLE_SIZE_CONFIG[tableBoxSize] || TABLE_SIZE_CONFIG.medium;

    const handleTableSizeChange = (direction) => {
        const order = ['compact', 'medium', 'large'];
        const idx = order.indexOf(tableBoxSize);
        let next = direction === 'up' ? idx + 1 : idx - 1;
        if (next < 0) next = 0;
        if (next >= order.length) next = order.length - 1;
        const nextSize = order[next];
        setTableBoxSize(nextSize);
        try {
            localStorage.setItem('floor_plan_table_box_size', nextSize);
        } catch (_) { }
    };

    // Status definitions mapping to the visual style requested
    const STATUS_CONFIG = {
        empty: {
            label: "Blank Table",
            color: "bg-gray-50 border-gray-200 text-gray-500",
            legendColor: "bg-gray-300",
            shortLabel: "Empty"
        },
        occupied: {
            label: "Running Table",
            color: "bg-blue-100 border-blue-300 text-blue-800",
            legendColor: "bg-blue-400",
            shortLabel: "Running"
        },
        kot_running: {
            label: "Running KOT",
            color: "bg-yellow-100 border-yellow-300 text-yellow-800",
            legendColor: "bg-yellow-400",
            shortLabel: "KOT"
        },
        bill_printed: {
            label: "Printed Table",
            color: "bg-green-100 border-green-300 text-green-800",
            legendColor: "bg-green-400",
            shortLabel: "Printed"
        },
        paid: {
            label: "Paid Table",
            color: "bg-orange-100 border-orange-300 text-orange-800",
            legendColor: "bg-orange-400",
            shortLabel: "Paid"
        },
        reserved: {
            label: "Reserved",
            color: "bg-orange-100 border-orange-300 text-orange-800",
            legendColor: "bg-orange-400",
            shortLabel: "Reserved"
        },
        cleaning: {
            label: "Cleaning",
            color: "bg-red-50 border-red-200 text-red-600",
            legendColor: "bg-red-400",
            shortLabel: "Cleaning"
        }
    };

    useEffect(() => {
        if (restaurant?.tables) {
            try {
                const parsedTables = typeof restaurant.tables === 'string'
                    ? JSON.parse(restaurant.tables)
                    : restaurant.tables;
                setTables(Array.isArray(parsedTables) ? parsedTables : []);
            } catch (error) {
                console.error("Error parsing tables:", error);
                setTables([]);
            }
        }
    }, [restaurant]);

    const fetchOrders = async (showRefreshing = false) => {
        if (!restaurant?.id) return;
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .neq('status', 'cancelled')
                .neq('status', 'rejected')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const ordersMap = {};
            (orders || []).forEach(order => {
                const tableNum = order.table_number;
                if (tableNum) {
                    if (!ordersMap[tableNum]) ordersMap[tableNum] = [];
                    ordersMap[tableNum].push(order);
                }
            });
            setTableOrders(ordersMap);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        let subscription;
        if (restaurant?.id) {
            subscription = supabase
                .channel('floor-plan-orders')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurant.id}`
                }, () => fetchOrders())
                .subscribe();
        }

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [restaurant?.id]);

    // Determine status based on orders (with bill_printed = completed but payment pending)
    const getTableStatus = (table) => {
        // 1. Manual overrides
        if (table.manualStatus && table.manualStatus !== 'auto') {
            return table.manualStatus;
        }

        const tableNum = table.tableNumber;
        const orders = tableOrders[tableNum] || [];
        if (orders.length === 0) return 'empty';

        const hasPending = orders.some(o => o.status === 'pending');
        const hasPreparing = orders.some(o => o.status === 'preparing');
        const hasReady = orders.some(o => o.status === 'ready');
        const hasCompleted = orders.some(o => o.status === 'completed');

        if (hasPending || hasPreparing) return 'kot_running';
        if (hasReady) return 'occupied';
        if (hasCompleted) {
            const completedOrders = orders.filter(o => o.status === 'completed');
            const allPaid = completedOrders.every(o => o.payment_status === 'completed');
            return allPaid ? 'paid' : 'bill_printed';
        }
        return 'occupied';
    };

    const handleUpdateTableStatus = async (newStatus) => {
        if (!selectedTable?.table || !restaurant) return;

        setUpdatingStatus(true);
        try {
            const updatedTables = tables.map(t => {
                if (t.id === selectedTable.table.id) {
                    // If 'auto', we delete manualStatus or set undefined
                    const updatedT = { ...t };
                    if (newStatus === 'auto') {
                        delete updatedT.manualStatus;
                    } else {
                        updatedT.manualStatus = newStatus;
                    }
                    return updatedT;
                }
                return t;
            });

            // Optimistic update
            const updatedSelectedTable = updatedTables.find(t => t.id === selectedTable.table.id);
            if (updatedSelectedTable) {
                setSelectedTable(prev => ({ ...prev, table: updatedSelectedTable }));
            }
            setTables(updatedTables);

            await updateRestaurant({
                tables: JSON.stringify(updatedTables)
            });
        } catch (error) {
            console.error("Failed to update table status:", error);
            // Revert would be nice here but keeping it simple for now
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Group tables by location
    const groupedTables = tables.reduce((acc, table) => {
        const loc = table.location || 'General Area';
        if (!acc[loc]) acc[loc] = [];
        acc[loc].push(table);
        return acc;
    }, {});

    // Filter based on search
    const filteredLocations = Object.keys(groupedTables).reduce((acc, loc) => {
        const filteredInLoc = groupedTables[loc].filter(t =>
            t.tableNumber.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
            loc.toLowerCase().includes((searchTerm || '').toLowerCase())
        );
        if (filteredInLoc.length > 0) acc[loc] = filteredInLoc;
        return acc;
    }, {});

    // Status counts for summary bar
    const statusCounts = tables.reduce((acc, t) => {
        const status = getTableStatus(t);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const handlePrintBill = (order) => {
        setOrderToPrint(order);
        setTimeout(() => {
            if (printRef.current) {
                const printContent = printRef.current.innerHTML;
                const win = window.open('', '_blank');
                win.document.write(`
                  <html><head><title>Bill - Order ${order.order_number || order.id?.slice(0, 8)}</title></head>
                  <body>${printContent}</body></html>
                `);
                win.document.close();
                win.focus();
                win.print();
                win.close();
            }
            setOrderToPrint(null);
        }, 100);
    };

    if (loading && tables.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[320px] gap-4">
                <Loader className="animate-spin text-orange-500" size={40} />
                <p className="text-gray-500 text-sm">Loading floor plan…</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm min-h-[calc(100vh-140px)]">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 text-sm">

                {/* Stats & Legend - Scrollable on mobile */}
                <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <div className="flex items-center gap-4 min-w-max">
                        <span className="text-gray-900 font-semibold whitespace-nowrap">
                            {tables.length} {tables.length === 1 ? 'Table' : 'Tables'}
                        </span>
                        <div className="h-4 w-px bg-gray-300 hidden md:block" />

                        <div className="flex items-center gap-3">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                const count = statusCounts[key] || 0;
                                return (
                                    <span key={key} className="flex items-center gap-1.5 text-gray-600 whitespace-nowrap text-xs md:text-sm">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.legendColor}`} />
                                        <span>{config.label} <span className="text-gray-400 font-medium ml-0.5">({count})</span></span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Actions: Size + Refresh */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <span className="hidden sm:inline">Size:</span>
                        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-1">
                            <button
                                type="button"
                                onClick={() => handleTableSizeChange('down')}
                                disabled={tableBoxSize === 'compact'}
                                className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-1 min-w-[3rem] text-center capitalize">{tableBoxSize}</span>
                            <button
                                type="button"
                                onClick={() => handleTableSizeChange('up')}
                                disabled={tableBoxSize === 'large'}
                                className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fetchOrders(true);
                        }}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white shadow-sm hover:bg-orange-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Floor plan by location */}
            <div className="space-y-8">
                {Object.entries(filteredLocations).map(([location, locTables]) => (
                    <div key={location}>
                        <h3 className="text-sm md:text-base font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                            {location}
                        </h3>

                        <div className={`grid ${sizeConfig.gridClass}`}>
                            {locTables.map(table => {
                                const statusKey = getTableStatus(table);
                                const style = STATUS_CONFIG[statusKey];
                                const orders = tableOrders[table.tableNumber] || [];
                                const orderCount = orders.length;

                                return (
                                    <div
                                        key={table.id}
                                        onClick={() => setSelectedTable({ table, orders })}
                                        className={`
                                            relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center ${sizeConfig.boxClass}
                                            transition-all duration-200 active:scale-95 hover:shadow-md cursor-pointer
                                            ${style.color}
                                            ${statusKey === 'empty' ? 'border-dashed' : 'border-solid shadow-sm'}
                                        `}
                                    >
                                        {/* Status Badge - Top Right */}
                                        {orderCount > 0 && (
                                            <span className={`absolute top-2 right-2 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-white text-orange-600 text-[10px] font-bold shadow-sm z-10`}>
                                                {orderCount}
                                            </span>
                                        )}

                                        <div className="flex flex-col items-center justify-center text-center w-full h-full">
                                            <span className={`${sizeConfig.numberClass} font-bold leading-none mb-1`}>
                                                {table.tableNumber}
                                            </span>

                                            {table.capacity && (
                                                <span className={`${sizeConfig.metaClass} text-current opacity-70`}>
                                                    {table.capacity} <span className="hidden sm:inline">seats</span><span className="sm:hidden">p</span>
                                                </span>
                                            )}

                                            <span className={`mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/50 backdrop-blur-sm`}>
                                                {style.shortLabel}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {Object.keys(filteredLocations).length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <LayoutGrid className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">No tables found</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Try adjusting your search filters or check your connection.
                        </p>
                    </div>
                )}
            </div>

            {/* Table orders modal - Centered & Responsive */}
            {selectedTable && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTable(null)}>
                    <div
                        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    Table {selectedTable.table.tableNumber}
                                    {selectedTable.orders.length > 0 && (
                                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                                            {selectedTable.orders.length} orders
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {selectedTable.table.location || 'General Area'} • {selectedTable.table.capacity || '-'} Seats
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTable(null)}
                                className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-3">
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                                    Table Status
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        onClick={() => handleUpdateTableStatus('auto')}
                                        disabled={updatingStatus}
                                        className={`px-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${(!selectedTable.table.manualStatus || selectedTable.table.manualStatus === 'auto')
                                            ? 'bg-gray-800 text-white border-gray-800'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        Auto
                                    </button>
                                    <button
                                        onClick={() => handleUpdateTableStatus('reserved')}
                                        disabled={updatingStatus}
                                        className={`px-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${selectedTable.table.manualStatus === 'reserved'
                                            ? 'bg-orange-600 text-white border-orange-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        Reserved
                                    </button>
                                    <button
                                        onClick={() => handleUpdateTableStatus('cleaning')}
                                        disabled={updatingStatus}
                                        className={`px-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${selectedTable.table.manualStatus === 'cleaning'
                                            ? 'bg-red-600 text-white border-red-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        Cleaning
                                    </button>
                                    <button
                                        onClick={() => handleUpdateTableStatus('empty')}
                                        disabled={updatingStatus}
                                        className={`px-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${selectedTable.table.manualStatus === 'empty'
                                            ? 'bg-green-600 text-white border-green-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        Free
                                    </button>
                                </div>
                            </div>
                            {selectedTable.orders.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                                        <Eye className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium">This table is currently empty</p>
                                    <p className="text-xs text-gray-400 mt-1">No active orders placed yet.</p>
                                </div>
                            ) : (
                                selectedTable.orders.map(order => (
                                    <div
                                        key={order.id}
                                        className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col gap-2"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">
                                                        #{order.order_number || order.id?.slice(0, 6)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }
                                                    `}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">₹{order.total?.toFixed(2)}</p>
                                                <p className="text-xs text-gray-500">Total</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => handlePrintBill(order)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                Print Bill
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {(onViewOrders || onCreateOrder) && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex flex-col sm:flex-row gap-3">
                                {onCreateOrder && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const tblNum = selectedTable.table.tableNumber;
                                            setSelectedTable(null);
                                            onCreateOrder(tblNum);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-bold text-sm shadow-md hover:bg-green-700 active:scale-95 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create Order
                                    </button>
                                )}
                                {onViewOrders && selectedTable.orders.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTable(null);
                                            onViewOrders();
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-md hover:bg-orange-700 active:scale-95 transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Manage Orders
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Print Component (Hidden) */}
            <div className="hidden">
                {orderToPrint && restaurant && (
                    <div ref={printRef}>
                        <PrintBill order={orderToPrint} restaurant={restaurant} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloorPlanView;
