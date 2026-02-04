
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

const FloorPlanView = ({ searchTerm, onViewOrders }) => {
    const { restaurant } = useAdminRestaurant();
    const [tables, setTables] = useState([]);
    const [tableOrders, setTableOrders] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [orderToPrint, setOrderToPrint] = useState(null);
    const printRef = useRef(null);

    // Table box size: 'compact' | 'medium' | 'large' — default compact to fit more tables
    const [tableBoxSize, setTableBoxSize] = useState(() => {
        try {
            const saved = localStorage.getItem('floor_plan_table_box_size');
            if (['compact', 'medium', 'large'].includes(saved)) return saved;
        } catch (_) {}
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
        } catch (_) {}
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
    const getTableStatus = (tableNum) => {
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
        const status = getTableStatus(t.tableNumber);
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
            {/* Single-line bar: left = tables + legend; right = size + Refresh */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-6 pb-4 border-b border-gray-200 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-gray-600 whitespace-nowrap">
                        {tables.length} table{tables.length !== 1 ? 's' : ''} · Live status
                    </span>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const count = statusCounts[key] || 0;
                        return (
                            <span key={key} className="flex items-center gap-1.5 text-gray-600 whitespace-nowrap">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${config.legendColor}`} />
                                <span>{config.label}: {count}</span>
                            </span>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-0.5 rounded-lg border border-blue-200 bg-blue-50 p-1">
                        <button
                            type="button"
                            onClick={() => handleTableSizeChange('down')}
                            disabled={tableBoxSize === 'compact'}
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Smaller tables"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTableSizeChange('up')}
                            disabled={tableBoxSize === 'large'}
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Larger tables"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fetchOrders(true);
                        }}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500 text-white border border-orange-500 hover:bg-orange-600 hover:border-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        title="Refresh"
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
                        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-1 h-5 bg-orange-500 rounded-full" />
                            {location}
                        </h3>

                        <div className={`grid ${sizeConfig.gridClass}`}>
                            {locTables.map(table => {
                                const statusKey = getTableStatus(table.tableNumber);
                                const style = STATUS_CONFIG[statusKey];
                                const orders = tableOrders[table.tableNumber] || [];
                                const orderCount = orders.length;

                                return (
                                    <div
                                        key={table.id}
                                        onClick={() => setSelectedTable({ table, orders })}
                                        className={`
                                            relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center ${sizeConfig.boxClass}
                                            transition-all duration-200 hover:shadow-md cursor-pointer group
                                            ${style.color}
                                            ${statusKey === 'empty' ? 'border-dashed' : 'border-solid shadow-sm'}
                                        `}
                                    >
                                        {orderCount > 0 && (
                                            <span className={`absolute top-1 right-1 min-w-[18px] h-4 px-1 flex items-center justify-center rounded-full bg-white/90 ${sizeConfig.metaClass} font-semibold text-gray-700 shadow-sm`}>
                                                {orderCount}
                                            </span>
                                        )}
                                        <span className={`${sizeConfig.numberClass} font-bold`}>
                                            {table.tableNumber}
                                        </span>
                                        {table.capacity && (
                                            <span className={`${sizeConfig.metaClass} text-gray-500 mt-0.5`}>
                                                {table.capacity} seats
                                            </span>
                                        )}
                                        <span className={`${sizeConfig.metaClass} font-medium mt-1 opacity-90 ${statusKey === 'empty' ? 'text-gray-400' : ''}`}>
                                            {style.shortLabel}
                                        </span>
                                        <div className="flex gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {statusKey !== 'empty' && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTable({ table, orders });
                                                    }}
                                                    className="p-1.5 rounded-lg bg-white/80 shadow hover:bg-white text-gray-700"
                                                    title="View orders"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {Object.keys(filteredLocations).length === 0 && (
                    <div className="text-center py-16 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No tables match your search</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Try a different search or add tables in QR Management.
                        </p>
                    </div>
                )}
            </div>

            {/* Table orders modal */}
            {selectedTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedTable(null)}>
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Table {selectedTable.table.tableNumber}
                                {selectedTable.table.location && (
                                    <span className="text-gray-500 font-normal"> · {selectedTable.table.location}</span>
                                )}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedTable(null)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {selectedTable.orders.length === 0 ? (
                                <p className="text-gray-500 text-sm">No active orders for this table.</p>
                            ) : (
                                selectedTable.orders.map(order => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                #{order.order_number || order.id?.slice(0, 8)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {order.status} · ₹{order.total?.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handlePrintBill(order)}
                                                className="p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200"
                                                title="Print bill"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {onViewOrders && selectedTable.orders.length > 0 && (
                            <div className="p-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTable(null);
                                        onViewOrders();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open in Orders
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hidden print area */}
            {orderToPrint && restaurant && (
                <div ref={printRef} className="hidden">
                    <PrintBill order={orderToPrint} restaurant={restaurant} />
                </div>
            )}
        </div>
    );
};

export default FloorPlanView;
