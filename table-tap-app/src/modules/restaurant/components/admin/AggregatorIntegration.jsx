import React, { useState, useEffect, useCallback } from 'react';
import {
    ShoppingBag,
    ExternalLink,
    Clock,
    CheckCircle,
    X,
    AlertCircle,
    MoreVertical,
    ArrowUpRight,
    Wifi,
    WifiOff,
    Bell,
    BellOff,
    TrendingUp,
    History,
    Info,
    Zap,
    Utensils,
    BarChart3,
    RefreshCw,
    Loader2,
    LinkIcon,
    Link2Off
} from 'lucide-react';
import {
    getAggregatorStatus,
    getAggregatorOrders,
    getAggregatorStats,
    getMenuItemsWithAggregatorStatus,
    toggleMenuItemPlatform,
    togglePlatformStatus,
    getPlatformStatus,
    getAggregatorPerformance,
    subscribeToAggregatorOrders,
    updateSurgePrepTime,
    getSurgePrepTime,
    updateNotificationSettings,
    getNotificationSettings
} from '../../api/aggregatorService';

const AggregatorIntegration = ({ restaurantId, restaurant }) => {
    const [activePlatform, setActivePlatform] = useState('all');
    const [activeView, setActiveView] = useState('operations'); // operations, menu, performance
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [surgePrepTime, setSurgePrepTime] = useState(0); // 0, 10, 20, 30 mins additional
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [menuSearch, setMenuSearch] = useState('');

    const [integrationStatus, setIntegrationStatus] = useState({
        swiggy: { status: 'offline', ordersCount: 0, revenue: 0, rating: 4.2, cancelRate: '0%', connected: false },
        zomato: { status: 'offline', ordersCount: 0, revenue: 0, rating: 4.5, cancelRate: '0%', connected: false }
    });

    const [menuItems, setMenuItems] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [performance, setPerformance] = useState(null);

    // Load initial data
    const loadData = useCallback(async (showRefreshing = false) => {
        if (!restaurantId) return;
        
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Fetch all data in parallel
            const [statusData, statsData, ordersData, menuData, perfData] = await Promise.all([
                getAggregatorStatus(restaurantId),
                getAggregatorStats(restaurantId),
                getAggregatorOrders(restaurantId, 'all', 20),
                getMenuItemsWithAggregatorStatus(restaurantId),
                getAggregatorPerformance(restaurantId)
            ]);

            // Get platform status from localStorage
            const platformStatus = getPlatformStatus(restaurantId);

            // Update integration status with real data
            setIntegrationStatus({
                swiggy: {
                    status: statusData.swiggy.hasApiKey ? platformStatus.swiggy : 'offline',
                    ordersCount: statsData.swiggy.ordersCount,
                    revenue: statsData.swiggy.revenue,
                    rating: statsData.swiggy.rating,
                    cancelRate: statsData.swiggy.cancelRate,
                    connected: statusData.swiggy.connected
                },
                zomato: {
                    status: statusData.zomato.hasApiKey ? platformStatus.zomato : 'offline',
                    ordersCount: statsData.zomato.ordersCount,
                    revenue: statsData.zomato.revenue,
                    rating: statsData.zomato.rating,
                    cancelRate: statsData.zomato.cancelRate,
                    connected: statusData.zomato.connected
                }
            });

            setRecentOrders(ordersData);
            setMenuItems(menuData);
            setPerformance(perfData);

            // Load saved settings
            setSurgePrepTime(getSurgePrepTime(restaurantId));
            setNotifEnabled(getNotificationSettings(restaurantId));

        } catch (err) {
            console.error('Error loading aggregator data:', err);
            setError('Failed to load aggregator data. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [restaurantId]);

    // Initial data load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!restaurantId) return;

        const unsubscribe = subscribeToAggregatorOrders(restaurantId, (payload) => {
            // Refresh orders when new order comes in
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                loadData(true);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [restaurantId, loadData]);

    const toggleStatus = (platform) => {
        if (!integrationStatus[platform].connected) {
            // Can't toggle if not connected
            return;
        }
        
        const updated = togglePlatformStatus(restaurantId, platform);
        setIntegrationStatus(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                status: updated[platform]
            }
        }));
    };

    const toggleItemPlatform = async (itemId, platform) => {
        try {
            await toggleMenuItemPlatform(itemId, platform);
            setMenuItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, [platform]: !item[platform] } : item
            ));
        } catch (err) {
            console.error('Error toggling menu item:', err);
        }
    };

    const handleSurgePrepTimeChange = (mins) => {
        setSurgePrepTime(mins);
        updateSurgePrepTime(restaurantId, mins);
    };

    const handleNotifToggle = () => {
        const newValue = !notifEnabled;
        setNotifEnabled(newValue);
        updateNotificationSettings(restaurantId, newValue);
    };

    const filteredMenuItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(menuSearch.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'preparing': return 'bg-blue-100 text-blue-700';
            case 'delivered': return 'bg-emerald-100 text-emerald-700';
            case 'cancelled': return 'bg-rose-100 text-rose-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading aggregator data...</p>
            </div>
        );
    }

    // Determine gateway status
    const isAnyConnected = integrationStatus.swiggy.connected || integrationStatus.zomato.connected;
    const isAnyOnline = integrationStatus.swiggy.status === 'online' || integrationStatus.zomato.status === 'online';

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-red-500" size={20} />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Connection Warning if no API keys */}
            {!isAnyConnected && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-amber-500 mt-0.5" size={20} />
                    <div>
                        <p className="text-amber-800 font-semibold">No Aggregator Connected</p>
                        <p className="text-amber-700 text-sm mt-1">
                            Add your Swiggy or Zomato API keys in Restaurant Information to enable aggregator integration.
                        </p>
                    </div>
                </div>
            )}

            {/* Mission Control Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-100 rotate-3">
                        <ShoppingBag size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aggregator Ops</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {isAnyConnected ? (
                                <>
                                    <span className={`flex h-2 w-2 rounded-full ${isAnyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                    <p className="text-slate-500 text-sm font-medium">
                                        Gateway: {isAnyOnline ? 'Active & Synced' : 'Connected but Offline'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <span className="flex h-2 w-2 rounded-full bg-slate-300"></span>
                                    <p className="text-slate-500 text-sm font-medium">Gateway: Not Connected</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Refresh Button */}
                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        {[
                            { id: 'operations', label: 'Operations', icon: <Wifi size={14} /> },
                            { id: 'menu', label: 'Menu Sync', icon: <Utensils size={14} /> },
                            { id: 'performance', label: 'Performance', icon: <TrendingUp size={14} /> }
                        ].map(view => (
                            <button
                                key={view.id}
                                onClick={() => setActiveView(view.id)}
                                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${activeView === view.id
                                    ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {view.icon}
                                {view.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeView === 'operations' && (
                <>
                    {/* Live Surge & Notification Control */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                                    <Clock className="text-indigo-600" size={20} />
                                    Smart Surge Prep Time
                                </h3>
                                <div className="flex flex-wrap items-center gap-4">
                                    {[0, 10, 20, 30].map(mins => (
                                        <button
                                            key={mins}
                                            onClick={() => handleSurgePrepTimeChange(mins)}
                                            className={`flex-1 min-w-[100px] py-4 rounded-2xl border-2 transition-all font-bold text-sm ${surgePrepTime === mins
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 -translate-y-1'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-100'
                                                }`}
                                        >
                                            {mins === 0 ? 'Normal' : `+${mins} Mins`}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-4 text-xs text-slate-400 font-medium italic">
                                    * Surge time affects estimated prep time shown to aggregator platforms.
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap size={120} className="text-indigo-600" strokeWidth={1} />
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                    <Bell size={24} className="text-indigo-400" />
                                </div>
                                <button
                                    onClick={handleNotifToggle}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${notifEnabled ? 'bg-indigo-500' : 'bg-white/20'
                                        }`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notifEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                            <div>
                                <h4 className="font-bold text-xl mt-4">Order Alerts</h4>
                                <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                    Flash dashboard and play sound for new aggregator orders.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Platform Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Swiggy Card */}
                        <div className={`bg-white rounded-[2.5rem] border overflow-hidden group hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500 ${!integrationStatus.swiggy.connected ? 'border-slate-200 opacity-75' : 'border-slate-200'}`}>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform ${integrationStatus.swiggy.connected ? 'bg-orange-500 shadow-orange-100' : 'bg-slate-400 shadow-slate-100'}`}>
                                            <ShoppingBag size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-900 tracking-tight">Swiggy</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {integrationStatus.swiggy.connected ? (
                                                    <>
                                                        <span className={`w-2 h-2 rounded-full ${integrationStatus.swiggy.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                            {integrationStatus.swiggy.status}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link2Off size={12} className="text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            Not Connected
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {integrationStatus.swiggy.connected ? (
                                        <button
                                            onClick={() => toggleStatus('swiggy')}
                                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${integrationStatus.swiggy.status === 'online'
                                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                }`}
                                        >
                                            Go {integrationStatus.swiggy.status === 'online' ? 'Offline' : 'Online'}
                                        </button>
                                    ) : (
                                        <span className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500">
                                            Add API Key
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { label: 'Orders', value: integrationStatus.swiggy.ordersCount, sub: 'Today' },
                                        { label: 'Revenue', value: `₹${integrationStatus.swiggy.revenue.toLocaleString()}`, sub: "Today" },
                                        { label: 'Rating', value: `★ ${integrationStatus.swiggy.rating}`, sub: 'Platform' }
                                    ].map((stat, i) => (
                                        <div key={i} className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-lg font-black text-slate-900">{stat.value}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={`px-8 py-5 text-xs font-bold flex justify-between items-center ${integrationStatus.swiggy.connected ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                                <span className="flex items-center gap-2">
                                    {integrationStatus.swiggy.connected ? <LinkIcon size={12} /> : <Link2Off size={12} />}
                                    {integrationStatus.swiggy.connected ? 'SWIGGY CONNECTED' : 'SWIGGY NOT CONFIGURED'}
                                </span>
                                <div className="flex gap-1">
                                    <span className={`w-1 h-1 rounded-full ${integrationStatus.swiggy.connected ? 'bg-orange-300' : 'bg-slate-300'}`}></span>
                                    <span className={`w-1 h-1 rounded-full ${integrationStatus.swiggy.connected ? 'bg-orange-300' : 'bg-slate-300'}`}></span>
                                    <span className={`w-1 h-1 rounded-full ${integrationStatus.swiggy.connected ? 'bg-orange-300' : 'bg-slate-300'}`}></span>
                                </div>
                            </div>
                        </div>

                        {/* Zomato Card */}
                        <div className={`bg-white rounded-[2.5rem] border overflow-hidden group hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500 ${!integrationStatus.zomato.connected ? 'border-slate-200 opacity-75' : 'border-slate-200'}`}>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform ${integrationStatus.zomato.connected ? 'bg-rose-600 shadow-rose-100' : 'bg-slate-400 shadow-slate-100'}`}>
                                            <ShoppingBag size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-900 tracking-tight">Zomato</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {integrationStatus.zomato.connected ? (
                                                    <>
                                                        <span className={`w-2 h-2 rounded-full ${integrationStatus.zomato.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                            {integrationStatus.zomato.status}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link2Off size={12} className="text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            Not Connected
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {integrationStatus.zomato.connected ? (
                                        <button
                                            onClick={() => toggleStatus('zomato')}
                                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${integrationStatus.zomato.status === 'online'
                                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                }`}
                                        >
                                            Go {integrationStatus.zomato.status === 'online' ? 'Offline' : 'Online'}
                                        </button>
                                    ) : (
                                        <span className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500">
                                            Add API Key
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { label: 'Orders', value: integrationStatus.zomato.ordersCount, sub: 'Today' },
                                        { label: 'Revenue', value: `₹${integrationStatus.zomato.revenue.toLocaleString()}`, sub: "Today" },
                                        { label: 'Rating', value: `★ ${integrationStatus.zomato.rating}`, sub: 'Platform' }
                                    ].map((stat, i) => (
                                        <div key={i} className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-lg font-black text-slate-900">{stat.value}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={`px-8 py-5 text-xs font-bold flex justify-between items-center ${integrationStatus.zomato.connected ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'}`}>
                                <span className="flex items-center gap-2">
                                    {integrationStatus.zomato.connected ? <LinkIcon size={12} /> : <Link2Off size={12} />}
                                    {integrationStatus.zomato.connected ? 'ZOMATO CONNECTED' : 'ZOMATO NOT CONFIGURED'}
                                </span>
                                <div className="flex gap-1">
                                    <span className={`w-1 h-1 rounded-full ${integrationStatus.zomato.connected ? 'bg-rose-300' : 'bg-slate-300'}`}></span>
                                    <span className={`w-1 h-1 rounded-full ${integrationStatus.zomato.connected ? 'bg-rose-300' : 'bg-slate-300'}`}></span>
                                    <span className={`w-1 h-1 rounded-full ${integrationStatus.zomato.connected ? 'bg-rose-300' : 'bg-slate-300'}`}></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Journal */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <History size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900">Live Order Feed</h3>
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">
                                        {recentOrders.length > 0 ? `${recentOrders.length} Recent Orders` : 'Aggregator Unified Journal'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                {['all', 'Swiggy', 'Zomato'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setActivePlatform(p)}
                                        className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activePlatform === p
                                            ? 'bg-white text-slate-900 shadow-sm transform scale-105'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag size={32} className="text-slate-400" />
                                    </div>
                                    <h4 className="font-bold text-slate-700 mb-2">No Orders Yet</h4>
                                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                                        {isAnyConnected 
                                            ? 'Orders from connected aggregator platforms will appear here in real-time.'
                                            : 'Connect your Swiggy or Zomato accounts to start receiving orders.'}
                                    </p>
                                </div>
                            ) : (
                                recentOrders
                                    .filter(o => activePlatform === 'all' || o.platform === activePlatform)
                                    .map((order, idx) => (
                                        <div key={order.orderId || idx} className="flex items-center justify-between p-6 border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${order.platform === 'Swiggy' ? 'bg-orange-500 shadow-orange-100' : 'bg-rose-600 shadow-rose-100'
                                                    }`}>
                                                    {order.platform[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-black text-slate-900 text-lg tracking-tight">{order.id}</span>
                                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest ${getStatusStyle(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500 mt-1">
                                                        {order.items && order.items.length > 0 
                                                            ? order.items.map(i => `${i.qty}x ${i.name}`).join(', ')
                                                            : 'Order items'}
                                                    </p>
                                                    {order.customerName && (
                                                        <p className="text-xs text-slate-400 mt-0.5">{order.customerName}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="text-right hidden md:block border-r border-slate-100 pr-8">
                                                    <p className="text-lg font-black text-slate-900">₹{order.total.toLocaleString()}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5 justify-end">
                                                        <Clock size={12} className="text-slate-300" />
                                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {activeView === 'menu' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                        <div>
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight">Cross-Platform Sync</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                {menuItems.length > 0 
                                    ? `Manage ${menuItems.length} items across Swiggy and Zomato.`
                                    : 'Manage item visibility on Swiggy and Zomato instantly.'}
                            </p>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={menuSearch}
                                onChange={(e) => setMenuSearch(e.target.value)}
                                className="pl-12 pr-6 py-3 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 w-full sm:w-64 border-none transition-all"
                            />
                            <Utensils className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        </div>
                    </div>

                    {menuItems.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Utensils size={32} className="text-slate-400" />
                            </div>
                            <h4 className="font-bold text-slate-700 mb-2">No Menu Items</h4>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">
                                Add menu items in Menu Management to sync them with aggregator platforms.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-slate-100">
                                        <th className="pb-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Item Details</th>
                                        <th className="pb-5 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Swiggy Status</th>
                                        <th className="pb-5 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Zomato Status</th>
                                        <th className="pb-5 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredMenuItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-500">
                                                No items match your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMenuItems.map(item => (
                                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-6 px-4">
                                                    <p className="font-bold text-slate-900">{item.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium mt-0.5">{item.category}</p>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <button
                                                        onClick={() => toggleItemPlatform(item.id, 'swiggy')}
                                                        disabled={!integrationStatus.swiggy.connected}
                                                        className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${!integrationStatus.swiggy.connected
                                                            ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                                                            : item.swiggy
                                                                ? 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100'
                                                                : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {!integrationStatus.swiggy.connected ? 'N/A' : item.swiggy ? 'AVAILABLE' : 'DISABLED'}
                                                    </button>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <button
                                                        onClick={() => toggleItemPlatform(item.id, 'zomato')}
                                                        disabled={!integrationStatus.zomato.connected}
                                                        className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${!integrationStatus.zomato.connected
                                                            ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                                                            : item.zomato
                                                                ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                                                                : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {!integrationStatus.zomato.connected ? 'N/A' : item.zomato ? 'AVAILABLE' : 'DISABLED'}
                                                    </button>
                                                </td>
                                                <td className="py-6 px-4 text-right">
                                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-4 py-2">
                                                        Edit Mappings
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeView === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                        <h3 className="font-black text-xl text-slate-900 mb-8 border-b border-slate-50 pb-6">Weekly Performance</h3>
                        <div className="space-y-8">
                            {[
                                { 
                                    label: 'Total Orders', 
                                    swiggy: performance?.swiggy?.totalOrders || 0, 
                                    zomato: performance?.zomato?.totalOrders || 0, 
                                    target: 'Last 7 days' 
                                },
                                { 
                                    label: 'Total Revenue', 
                                    swiggy: `₹${(performance?.swiggy?.totalRevenue || 0).toLocaleString()}`, 
                                    zomato: `₹${(performance?.zomato?.totalRevenue || 0).toLocaleString()}`, 
                                    target: 'Last 7 days' 
                                },
                                { 
                                    label: 'Avg Order Value', 
                                    swiggy: `₹${performance?.swiggy?.avgOrderValue || 0}`, 
                                    zomato: `₹${performance?.zomato?.avgOrderValue || 0}`, 
                                    target: 'Per order' 
                                },
                                { 
                                    label: 'Cancellation Rate', 
                                    swiggy: performance?.swiggy?.cancelRate || '0%', 
                                    zomato: performance?.zomato?.cancelRate || '0%', 
                                    target: 'Target: <2%' 
                                },
                                { 
                                    label: 'Completion Rate', 
                                    swiggy: performance?.swiggy?.completionRate || '0%', 
                                    zomato: performance?.zomato?.completionRate || '0%', 
                                    target: 'Target: >95%' 
                                }
                            ].map((row, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{row.label}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{row.target}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className={`px-4 py-2 rounded-xl text-center min-w-[80px] ${integrationStatus.swiggy.connected ? 'bg-orange-50' : 'bg-slate-50'}`}>
                                            <p className={`text-sm font-black ${integrationStatus.swiggy.connected ? 'text-orange-600' : 'text-slate-400'}`}>
                                                {integrationStatus.swiggy.connected ? row.swiggy : 'N/A'}
                                            </p>
                                            <p className={`text-[8px] font-black uppercase ${integrationStatus.swiggy.connected ? 'text-orange-300' : 'text-slate-300'}`}>Swiggy</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-center min-w-[80px] ${integrationStatus.zomato.connected ? 'bg-rose-50' : 'bg-slate-50'}`}>
                                            <p className={`text-sm font-black ${integrationStatus.zomato.connected ? 'text-rose-600' : 'text-slate-400'}`}>
                                                {integrationStatus.zomato.connected ? row.zomato : 'N/A'}
                                            </p>
                                            <p className={`text-[8px] font-black uppercase ${integrationStatus.zomato.connected ? 'text-rose-300' : 'text-slate-300'}`}>Zomato</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-4">Strategic Insight</h3>
                            <p className="text-indigo-100/70 text-sm leading-relaxed mb-10 max-w-sm">
                                {isAnyConnected ? (
                                    performance?.swiggy?.totalRevenue > performance?.zomato?.totalRevenue
                                        ? 'Swiggy is your top performer this week. Consider exclusive deals on Zomato to balance order distribution.'
                                        : performance?.zomato?.totalRevenue > performance?.swiggy?.totalRevenue
                                            ? 'Zomato is leading in revenue. Run targeted promotions on Swiggy to capture more market share.'
                                            : 'Both platforms are performing similarly. Focus on improving prep times to increase order capacity.'
                                ) : (
                                    'Connect your Swiggy and Zomato accounts to get personalized insights and performance analytics.'
                                )}
                            </p>
                            <div className="grid grid-cols-2 gap-6 pb-2">
                                <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Weekly Growth</p>
                                    <p className="text-2xl font-black">{performance?.weeklyGrowth || 'N/A'}</p>
                                </div>
                                <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Combined Revenue</p>
                                    <p className="text-2xl font-black">
                                        ₹{((performance?.swiggy?.totalRevenue || 0) + (performance?.zomato?.totalRevenue || 0)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {performance?.peakHours && (
                                <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Peak Hours</p>
                                    <p className="text-sm font-medium text-white/80">{performance.peakHours}</p>
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-20 -right-20 opacity-20">
                            <BarChart3 size={240} className="text-white" strokeWidth={1} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AggregatorIntegration;
