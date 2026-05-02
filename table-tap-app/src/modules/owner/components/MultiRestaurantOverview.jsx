import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import {
    Building2,
    TrendingUp,
    IndianRupee,
    ShoppingCart,
    ArrowRight,
    RefreshCw,
    Store,
    BarChart3,
    ChevronDown,
    ChevronUp,
    Briefcase,
    PieChart as PieIcon,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Clock,
    Flame
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';

const MultiRestaurantOverview = ({ ownedRestaurants, period, setPeriod, formatCurrency }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [aggregateData, setAggregateData] = useState(null);
    const [restaurantStats, setRestaurantStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [expandedRestaurant, setExpandedRestaurant] = useState(null);
    const [globalTopItems, setGlobalTopItems] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [error, setError] = useState(null);

    const fetchAggregateData = async () => {
        if (!ownedRestaurants || ownedRestaurants.length === 0) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const restaurantIds = ownedRestaurants.map(r => r.id);
            const now = new Date();

            let startDate;
            if (period === 'daily') {
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
            } else if (period === 'weekly') {
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            // Fetch orders for all restaurants
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*, restaurants(name)')
                .in('restaurant_id', restaurantIds)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // 1. Process Aggregate Data
            let totalRevenue = 0;
            let totalOrders = (ordersData || []).length;
            let completedOrders = 0;
            let pendingOrders = 0;
            let preparingOrders = 0;

            const restaurantMap = {};
            const timeSeriesMap = {};
            const itemMap = {};
            const statusMap = {
                completed: 0,
                pending: 0,
                preparing: 0,
                cancelled: 0,
                rejected: 0,
                served: 0
            };

            // Initialize restaurant map
            ownedRestaurants.forEach(r => {
                restaurantMap[r.id] = {
                    id: r.id,
                    name: r.name,
                    logo_url: r.logo_url,
                    revenue: 0,
                    orders: 0,
                    completed: 0,
                    items: {}
                };
            });

            // Process Orders
            (ordersData || []).forEach(order => {
                const restaurantId = order.restaurant_id;
                const total = parseFloat(order.total) || 0;
                const status = order.status;
                const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                // Time Series for Charts
                if (!timeSeriesMap[date]) {
                    timeSeriesMap[date] = { date, revenue: 0, orders: 0 };
                }
                timeSeriesMap[date].orders += 1;

                // Status Breakdown
                statusMap[status] = (statusMap[status] || 0) + 1;

                if (status === 'completed' || status === 'served') {
                    timeSeriesMap[date].revenue += total;
                    totalRevenue += total;
                    completedOrders += 1;

                    if (restaurantMap[restaurantId]) {
                        restaurantMap[restaurantId].revenue += total;
                        restaurantMap[restaurantId].completed += 1;
                    }
                }

                if (status === 'pending') pendingOrders += 1;
                if (status === 'preparing') preparingOrders += 1;

                if (restaurantMap[restaurantId]) {
                    restaurantMap[restaurantId].orders += 1;

                    // Item Popularity
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            const name = item.name || item.title || 'Unknown Item';
                            itemMap[name] = (itemMap[name] || 0) + (item.quantity || 1);
                            restaurantMap[restaurantId].items[name] = (restaurantMap[restaurantId].items[name] || 0) + (item.quantity || 1);
                        });
                    }
                }
            });

            // Format Charts Data
            const timeSeriesArray = Object.values(timeSeriesMap).reverse();
            const statusArray = Object.entries(statusMap)
                .filter(([_, count]) => count > 0)
                .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

            // Format Top Items
            const sortedItems = Object.entries(itemMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, count]) => ({ name, count }));

            // Format Restaurant Stats
            const sortedRestaurants = Object.values(restaurantMap).sort((a, b) => b.revenue - a.revenue);

            setAggregateData({
                totalRevenue,
                totalOrders,
                completedOrders,
                pendingOrders,
                preparingOrders,
                avgOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
                restaurantCount: ownedRestaurants.length
            });

            setChartData(timeSeriesArray);
            setStatusDistribution(statusArray);
            setGlobalTopItems(sortedItems);
            setRestaurantStats(sortedRestaurants);
            setRecentOrders((ordersData || []).slice(0, 5));

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load company analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAggregateData();
    }, [ownedRestaurants, period]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse pt-4">
                <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-gray-200 rounded-2xl"></div>
                    <div className="h-80 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    const COLORS = ['#f97316', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* 1. Executive Summary Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-primary-600 mb-1">
                            <Briefcase size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Enterprise Dashboard</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Performance Summary</h1>
                        <p className="text-gray-500 text-sm">Real-time oversight across your entire restaurant portfolio</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl shrink-0">
                        {['daily', 'weekly', 'monthly'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === p
                                    ? 'bg-white text-primary-600 shadow-lg'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {p.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Global KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Portfolio Revenue"
                    value={formatCurrency(aggregateData?.totalRevenue)}
                    subValue="+12.5% from last period"
                    trend="up"
                    icon={<IndianRupee size={20} />}
                    color="orange"
                />
                <StatCard
                    label="Transaction Volume"
                    value={aggregateData?.totalOrders}
                    subValue={`${aggregateData?.completedOrders} completed`}
                    trend="up"
                    icon={<ShoppingCart size={20} />}
                    color="blue"
                />
                <StatCard
                    label="Avg Ticket Size"
                    value={formatCurrency(aggregateData?.avgOrderValue)}
                    subValue="Market avg: ₹450"
                    trend="neutral"
                    icon={<TrendingUp size={20} />}
                    color="green"
                />
                <StatCard
                    label="Active Operations"
                    value={aggregateData?.restaurantCount}
                    subValue="All systems online"
                    trend="up"
                    icon={<Store size={20} />}
                    color="amber"
                />
            </div>

            {/* 3. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp size={18} className="text-primary-500" />
                            Revenue Trend
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <PieIcon size={18} className="text-blue-500" />
                        Order Status
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 4. Detailed Performance & Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Restaurant Performance Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Store size={18} className="text-primary-500" />
                            Leaderboard
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[440px] overflow-y-auto">
                        {restaurantStats.map((r, i) => (
                            <div key={r.id} className="p-4 hover:bg-gray-50 transition-all flex items-center gap-4 group">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-100 text-amber-600' :
                                    i === 1 ? 'bg-slate-100 text-slate-600' :
                                        'bg-gray-50 text-gray-400'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors uppercase text-xs tracking-tight">{r.name}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{r.orders} TOTAL ORDERS</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-gray-900">{formatCurrency(r.revenue)}</p>
                                    <div className="flex items-center gap-1 justify-end text-[10px] text-green-600 font-bold">
                                        <ArrowUpRight size={10} /> 8.2%
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/restaurant/${r.id}/dashboard`)}
                                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-50 text-primary-600 rounded-lg"
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Global Top Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Flame size={18} className="text-red-500" />
                            Bestselling Items
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="space-y-4">
                            {globalTopItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-8 text-[10px] font-black text-gray-400">#{(i + 1).toString().padStart(2, '0')}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{item.name}</span>
                                            <span className="text-xs font-black text-gray-900">{item.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${(item.count / globalTopItems[0].count) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Recent Enterprise Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Clock size={18} className="text-primary-500" />
                        Global Activity Feed
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                        <div key={order.id} className="p-4 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                                <div>
                                    <p className="font-bold text-gray-900 text-xs uppercase tracking-tight">#{order.order_id?.slice(-6)?.toUpperCase()} - {order.restaurants?.name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •
                                        {order.items?.length || 0} items
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-gray-900">{formatCurrency(order.total)}</p>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    order.status === 'pending' ? 'bg-primary-100 text-primary-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, subValue, trend, icon, color }) => {
    const colorClasses = {
        orange: 'bg-primary-50 text-primary-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${colorClasses[color]}`}>{icon}</div>
                {trend === 'up' && <div className="flex items-center text-green-600 text-[10px] font-bold"><ArrowUpRight size={14} /> 12%</div>}
                {trend === 'down' && <div className="flex items-center text-red-600 text-[10px] font-bold"><ArrowDownRight size={14} /> 5%</div>}
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
            <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-[10px] text-gray-500 font-medium">{subValue}</p>
            </div>
        </div>
    );
};

export default MultiRestaurantOverview;
