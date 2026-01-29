
import React, { useState, useEffect } from 'react';
import { useAdminRestaurant } from '../../../../shared/context/AdminRestaurantContext';
import { supabase } from '../../../../shared/supabase';
import {
    Printer,
    Eye,
    Loader,
    RefreshCw
} from 'lucide-react';

const FloorPlanView = ({ searchTerm }) => {
    const { restaurant } = useAdminRestaurant();
    const [tables, setTables] = useState([]);
    const [tableOrders, setTableOrders] = useState({});
    const [loading, setLoading] = useState(true);

    // Status definitions mapping to the visual style requested
    const STATUS_CONFIG = {
        empty: {
            label: "Blank Table",
            color: "bg-gray-50 border-gray-200 text-gray-400",
            legendColor: "bg-gray-200"
        },
        occupied: {
            label: "Running Table",
            color: "bg-blue-100 border-blue-300 text-blue-800",
            legendColor: "bg-blue-300"
        },
        kot_running: {
            label: "Running KOT",
            color: "bg-yellow-100 border-yellow-300 text-yellow-800",
            legendColor: "bg-yellow-300"
        },
        bill_printed: {
            label: "Printed Table",
            color: "bg-green-100 border-green-300 text-green-800",
            legendColor: "bg-green-300"
        },
        paid: {
            label: "Paid Table",
            color: "bg-orange-100 border-orange-300 text-orange-800",
            legendColor: "bg-orange-300"
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

    useEffect(() => {
        let subscription;

        const fetchOrders = async () => {
            if (!restaurant?.id) return;

            try {
                setLoading(true);
                // Fetch active orders
                const { data: orders, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .neq('status', 'cancelled')
                    .neq('status', 'rejected')
                    // We include completed for "Paid" status visualization until they are archived/cleared
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Group by table
                const ordersMap = {};
                orders.forEach(order => {
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
            }
        };

        fetchOrders();

        // Subscribe to changes
        if (restaurant?.id) {
            subscription = supabase
                .channel('floor-plan-orders')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurant.id}`
                }, () => {
                    fetchOrders();
                })
                .subscribe();
        }

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [restaurant?.id]);

    // Determine status based on orders
    const getTableStatus = (tableNum) => {
        const orders = tableOrders[tableNum] || [];
        if (orders.length === 0) return 'empty';

        // Check various states
        const hasPending = orders.some(o => o.status === 'pending');
        const hasPreparing = orders.some(o => o.status === 'preparing');
        const hasReady = orders.some(o => o.status === 'ready');
        const hasCompleted = orders.some(o => o.status === 'completed'); // Assumed as Paid/Completed

        // Logic mapping
        if (hasPending || hasPreparing) return 'kot_running';
        if (hasReady) return 'occupied'; // Ready to serve -> Running
        if (hasCompleted) return 'paid';

        return 'occupied'; // Default fallback
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

        if (filteredInLoc.length > 0) {
            acc[loc] = filteredInLoc;
        }
        return acc;
    }, {});

    if (loading && tables.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin text-orange-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow min-h-[calc(100vh-140px)]">
            {/* Header with Logo and Legend */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-100 gap-4">


                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${config.legendColor}`}></div>
                            <span className="text-sm text-gray-600">{config.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floor Plan Display */}
            <div className="space-y-8">
                {Object.entries(filteredLocations).map(([location, locTables]) => (
                    <div key={location}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                            {location}
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {locTables.map(table => {
                                const statusKey = getTableStatus(table.tableNumber);
                                const style = STATUS_CONFIG[statusKey];

                                return (
                                    <div
                                        key={table.id}
                                        className={`
                      relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all duration-200 hover:shadow-md cursor-pointer group
                      ${style.color}
                      ${statusKey === 'empty' ? 'border-dashed' : 'border-solid shadow-sm'}
                    `}
                                    >
                                        <span className="text-xl font-bold mb-2">
                                            {table.tableNumber}
                                        </span>

                                        {/* Action Icons (visible on hover or if active) */}
                                        <div className={`flex gap-2 mt-auto opacity-0 group-hover:opacity-100 transition-opacity ${statusKey !== 'empty' ? 'opacity-100' : ''}`}>
                                            {statusKey !== 'empty' && (
                                                <div className="bg-white p-1 rounded-full shadow cursor-pointer hover:bg-gray-50 text-gray-700">
                                                    <Printer size={14} />
                                                </div>
                                            )}
                                            <div className="bg-white p-1 rounded-full shadow cursor-pointer hover:bg-gray-50 text-gray-700">
                                                <Eye size={14} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {Object.keys(filteredLocations).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No tables found. Check your search or add tables in QR Management.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloorPlanView;
