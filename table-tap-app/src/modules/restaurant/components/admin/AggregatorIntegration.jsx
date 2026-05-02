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
    Link2Off,
    Volume2
} from 'lucide-react';
import toast from 'react-hot-toast';
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

            // Load saved settings from DB (with local fallback via service)
            setSurgePrepTime(getSurgePrepTime(restaurantId, statusData.surge_prep_time));
            setNotifEnabled(getNotificationSettings(restaurantId, statusData.notifications_enabled));

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

    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
        } catch (err) {
            console.error('Error playing sound:', err);
        }
    }, []);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!restaurantId) return;

        const unsubscribe = subscribeToAggregatorOrders(restaurantId, (payload) => {
            // Refresh orders when new order comes in
            if (payload.eventType === 'INSERT') {
                if (notifEnabled) {
                    playNotificationSound();
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 border-orange-500`}>
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${payload.new.platform === 'Swiggy' ? 'bg-orange-500' : 'bg-rose-600'}`}>
                                            <ShoppingBag size={20} />
                                        </div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                            New {payload.new.platform} Order!
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-gray-500">
                                            Order ID: {payload.new.id} • ₹{payload.new.total}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-l border-gray-100">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        setActiveView('operations');
                                    }}
                                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black text-orange-600 hover:text-orange-700 focus:outline-none"
                                >
                                    VIEW
                                </button>
                            </div>
                        </div>
                    ), { duration: 5000, position: 'top-right' });
                }
                loadData(true);
            } else if (payload.eventType === 'UPDATE') {
                loadData(true);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [restaurantId, loadData, notifEnabled, playNotificationSound]);

    const toggleStatus = async (platform) => {
        if (!integrationStatus[platform].connected) {
            // Can't toggle if not connected
            return;
        }

        try {
            const updated = await togglePlatformStatus(restaurantId, platform);
            setIntegrationStatus(prev => ({
                ...prev,
                [platform]: {
                    ...prev[platform],
                    status: updated[platform]
                }
            }));
            toast.success(`${platform} is now ${updated[platform]}`);
        } catch (err) {
            toast.error(`Failed to toggle ${platform} status`);
        }
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

    const handleSurgePrepTimeChange = async (mins) => {
        try {
            setSurgePrepTime(mins);
            const success = await updateSurgePrepTime(restaurantId, mins);
            if (success) {
                toast.success(`Prep time set to +${mins} mins`);
            }
        } catch (err) {
            toast.error('Failed to update prep time');
        }
    };

    const handleNotifToggle = async () => {
        try {
            const newValue = !notifEnabled;
            setNotifEnabled(newValue);
            const success = await updateNotificationSettings(restaurantId, newValue);
            if (success) {
                toast.success(newValue ? 'Notifications enabled' : 'Notifications silenced');
            }
        } catch (err) {
            toast.error('Failed to update notification settings');
        }
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
                <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading aggregator data...</p>
            </div>
        );
    }

    // Determine gateway status
    const isAnyConnected = integrationStatus.swiggy.connected || integrationStatus.zomato.connected;
    const isAnyOnline = integrationStatus.swiggy.status === 'online' || integrationStatus.zomato.status === 'online';

    return (
        <div className="flex flex-col gap-4 pt-0 px-4 pb-4 md:pt-0 md:px-6 md:pb-6 animate-in fade-in duration-500 max-w-7xl mx-auto w-full overflow-x-hidden">
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
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-2.5 flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="text-amber-500" size={16} />
                    </div>
                    <div>
                        <p className="text-amber-900 text-[11px] md:text-xs font-black uppercase tracking-wider">No Aggregator Connected</p>
                        <p className="text-amber-700 text-[10px] md:text-sm font-medium">
                            Add Swiggy or Zomato API keys in Restaurant Information to enable integration.
                        </p>
                    </div>
                </div>
            )}

            {/* Mission Control Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-100 rotate-3">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Aggregator Ops</h1>
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

                    <div className="flex bg-slate-100 p-1 rounded-xl md:rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
                        {[
                            { id: 'operations', label: 'Operations', icon: <Wifi size={14} /> },
                            { id: 'menu', label: 'Menu Sync', icon: <Utensils size={14} /> },
                            { id: 'performance', label: 'Performance', icon: <TrendingUp size={14} /> }
                        ].map(view => (
                            <button
                                key={view.id}
                                onClick={() => setActiveView(view.id)}
                                className={`flex items-center gap-2 px-3 md:px-5 py-1.5 md:py-2 text-[10px] md:text-xs font-black md:font-bold rounded-lg md:rounded-xl transition-all flex-shrink-0 ${activeView === view.id
                                    ? 'bg-white text-slate-900 shadow-sm transform scale-[1.02]'
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

            {
                activeView === 'operations' && (
                    <>
                        {/* Live Surge & Notification Control */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-sm relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                                        <Clock className="text-orange-600" size={16} />
                                        Smart Surge Prep Time
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                                        {[0, 10, 20, 30].map(mins => (
                                            <button
                                                key={mins}
                                                onClick={() => handleSurgePrepTimeChange(mins)}
                                                className={`py-2 md:py-3 rounded-xl border-2 transition-all font-black text-[10px] md:text-xs uppercase tracking-tighter ${surgePrepTime === mins
                                                    ? 'bg-orange-600 border-orange-600 text-white shadow-lg'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-orange-100'
                                                    }`}
                                            >
                                                {mins === 0 ? 'Normal' : `+${mins}m`}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                        * Affects estimated delivery time on apps.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-3xl p-4 md:p-6 text-white flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Bell size={18} className="text-orange-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm uppercase tracking-tight">Order Alerts</h4>
                                            <p className="text-slate-400 text-[10px] font-bold">Sound & Visual Feedback</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleNotifToggle}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifEnabled ? 'bg-orange-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Platform Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Swiggy Card */}
                            <div className={`bg-white rounded-3xl border overflow-hidden group hover:shadow-xl transition-all duration-500 ${!integrationStatus.swiggy.connected ? 'border-slate-200 opacity-85' : 'border-slate-200'}`}>
                                <div className="p-4 md:p-5">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${integrationStatus.swiggy.connected ? 'bg-orange-500' : 'bg-slate-400'}`}>
                                                <ShoppingBag size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 tracking-tight">Swiggy</h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {integrationStatus.swiggy.connected ? (
                                                        <>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${integrationStatus.swiggy.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                {integrationStatus.swiggy.status}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link2Off size={10} className="text-slate-400" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${integrationStatus.swiggy.status === 'online'
                                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                Go {integrationStatus.swiggy.status === 'online' ? 'Offline' : 'Online'}
                                            </button>
                                        ) : (
                                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-500 uppercase tracking-tighter">
                                                Add API Key
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Orders', value: integrationStatus.swiggy.ordersCount, sub: 'Today' },
                                            { label: 'Revenue', value: `₹${integrationStatus.swiggy.revenue.toLocaleString()}`, sub: "Today" },
                                            { label: 'Rating', value: `★ ${integrationStatus.swiggy.rating}`, sub: 'Platform' }
                                        ].map((stat, i) => (
                                            <div key={i} className="text-center p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                                                <p className="text-sm font-black text-slate-900">{stat.value}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{stat.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`px-5 py-3 text-[10px] font-black flex justify-between items-center ${integrationStatus.swiggy.connected ? 'bg-orange-50/50 text-orange-700' : 'bg-slate-50/50 text-slate-500'}`}>
                                    <span className="flex items-center gap-2 tracking-widest uppercase">
                                        {integrationStatus.swiggy.connected ? 'ACTIVE' : 'NOT CONFIGURED'}
                                    </span>
                                    <div className="flex gap-1">
                                        <span className={`w-1 h-1 rounded-full ${integrationStatus.swiggy.connected ? 'bg-orange-300' : 'bg-slate-300'}`}></span>
                                        <span className={`w-1 h-1 rounded-full ${integrationStatus.swiggy.connected ? 'bg-orange-300' : 'bg-slate-300'}`}></span>
                                        <span className={`w-1 h-1 rounded-full ${integrationStatus.swiggy.connected ? 'bg-orange-300' : 'bg-slate-300'}`}></span>
                                    </div>
                                </div>
                            </div>

                            {/* Zomato Card */}
                            <div className={`bg-white rounded-3xl border overflow-hidden group hover:shadow-xl transition-all duration-500 ${!integrationStatus.zomato.connected ? 'border-slate-200 opacity-85' : 'border-slate-200'}`}>
                                <div className="p-4 md:p-5">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${integrationStatus.zomato.connected ? 'bg-rose-600' : 'bg-slate-400'}`}>
                                                <ShoppingBag size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 tracking-tight">Zomato</h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {integrationStatus.zomato.connected ? (
                                                        <>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${integrationStatus.zomato.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                {integrationStatus.zomato.status}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link2Off size={10} className="text-slate-400" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${integrationStatus.zomato.status === 'online'
                                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                Go {integrationStatus.zomato.status === 'online' ? 'Offline' : 'Online'}
                                            </button>
                                        ) : (
                                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-500 uppercase tracking-tighter">
                                                Add API Key
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Orders', value: integrationStatus.zomato.ordersCount, sub: 'Today' },
                                            { label: 'Revenue', value: `₹${integrationStatus.zomato.revenue.toLocaleString()}`, sub: "Today" },
                                            { label: 'Rating', value: `★ ${integrationStatus.zomato.rating}`, sub: 'Platform' }
                                        ].map((stat, i) => (
                                            <div key={i} className="text-center p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                                                <p className="text-sm font-black text-slate-900">{stat.value}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{stat.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`px-5 py-3 text-[10px] font-black flex justify-between items-center ${integrationStatus.zomato.connected ? 'bg-rose-50/50 text-rose-700' : 'bg-slate-50/50 text-slate-500'}`}>
                                    <span className="flex items-center gap-2 tracking-widest uppercase">
                                        {integrationStatus.zomato.connected ? 'ACTIVE' : 'NOT CONFIGURED'}
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
                        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                                        <History size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">Live Order Feed</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            {recentOrders.length > 0 ? `${recentOrders.length} Recent Orders` : 'Aggregator Unified Journal'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                    {['all', 'Swiggy', 'Zomato'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setActivePlatform(p)}
                                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activePlatform === p
                                                ? 'bg-white text-slate-900 shadow-sm'
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
                                            <div key={order.orderId || idx} className="flex items-center justify-between p-3 md:p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md ${order.platform === 'Swiggy' ? 'bg-orange-500 shadow-orange-100' : 'bg-rose-600 shadow-rose-100'
                                                        }`}>
                                                        {order.platform[0]}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 text-base tracking-tight">{order.id}</span>
                                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${getStatusStyle(order.status)}`}>
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
                                                    <button className="p-3 text-slate-400 hover:text-amber-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                                                        <MoreVertical size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </>
                )
            }

            {
                activeView === 'menu' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="font-black text-xl text-slate-900 tracking-tight">Cross-Platform Sync</h3>
                                <p className="text-slate-500 text-xs font-medium">
                                    {menuItems.length > 0
                                        ? `Manage ${menuItems.length} items across platforms.`
                                        : 'Manage visibility across aggregators instantly.'}
                                </p>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={menuSearch}
                                    onChange={(e) => setMenuSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-100 w-full sm:w-64 border-none transition-all"
                                />
                                <Utensils className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
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
                                                        <button className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline px-4 py-2">
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
                )
            }

            {
                activeView === 'performance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-sm">
                            <h3 className="font-black text-lg text-slate-900 mb-6 border-b border-slate-50 pb-4">Weekly Performance</h3>
                            <div className="space-y-6">
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

                        <div className="bg-gradient-to-br from-slate-900 to-orange-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black mb-3 text-orange-400 uppercase tracking-tight">Strategic Insight</h3>
                                <p className="text-orange-100/70 text-xs leading-relaxed mb-6 max-w-sm font-medium">
                                    {isAnyConnected ? (
                                        performance?.swiggy?.totalRevenue > performance?.zomato?.totalRevenue
                                            ? 'Swiggy is leading. Scale Zomato promos to balance.'
                                            : 'Focus on prep times to increase overall capacity.'
                                    ) : (
                                        'Connect aggregators for personalized insights.'
                                    )}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10">
                                        <p className="text-[9px] font-bold text-orange-300 uppercase tracking-widest mb-1">Growth</p>
                                        <p className="text-xl font-black">{performance?.weeklyGrowth || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10">
                                        <p className="text-[9px] font-bold text-orange-300 uppercase tracking-widest mb-1">Revenue</p>
                                        <p className="text-xl font-black">
                                            ₹{((performance?.swiggy?.totalRevenue || 0) + (performance?.zomato?.totalRevenue || 0)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 opacity-10">
                                <BarChart3 size={180} className="text-white" strokeWidth={1} />
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default AggregatorIntegration;
