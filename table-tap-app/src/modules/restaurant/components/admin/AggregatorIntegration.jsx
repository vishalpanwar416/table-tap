import React from 'react';
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
    BarChart3
} from 'lucide-react';

const AggregatorIntegration = ({ restaurantId }) => {
    const [activePlatform, setActivePlatform] = React.useState('all');
    const [activeView, setActiveView] = React.useState('operations'); // operations, menu, performance
    const [notifEnabled, setNotifEnabled] = React.useState(true);
    const [surgePrepTime, setSurgePrepTime] = React.useState(0); // 0, 10, 20, 30 mins additional

    const [integrationStatus, setIntegrationStatus] = React.useState({
        swiggy: { status: 'online', ordersCount: 12, revenue: 4500, rating: 4.2, cancelRate: '1.2%' },
        zomato: { status: 'online', ordersCount: 8, revenue: 3200, rating: 4.5, cancelRate: '0.8%' }
    });

    const [menuItems, setMenuItems] = React.useState([
        { id: 1, name: 'Butter Chicken', category: 'Main Course', swiggy: true, zomato: true },
        { id: 2, name: 'Paneer Tikka', category: 'Starters', swiggy: true, zomato: true },
        { id: 3, name: 'Garlic Naan', category: 'Breads', swiggy: true, zomato: false },
        { id: 4, name: 'Dal Makhani', category: 'Main Course', swiggy: false, zomato: true },
        { id: 5, name: 'Mango Lassi', category: 'Drinks', swiggy: true, zomato: true },
    ]);

    const [recentOrders, setRecentOrders] = React.useState([
        {
            id: 'SW-1029',
            platform: 'Swiggy',
            items: [{ name: 'Butter Chicken', qty: 1 }, { name: 'Naan', qty: 2 }],
            total: 540,
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            status: 'preparing'
        },
        {
            id: 'ZO-4482',
            platform: 'Zomato',
            items: [{ name: 'Veg Pulao', qty: 1 }],
            total: 210,
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            status: 'delivered'
        },
        {
            id: 'SW-1105',
            platform: 'Swiggy',
            items: [{ name: 'Paneer Tikka', qty: 1 }],
            total: 320,
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            status: 'cancelled',
            reason: 'Out of stock'
        }
    ]);

    const toggleStatus = (platform) => {
        setIntegrationStatus(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                status: prev[platform].status === 'online' ? 'offline' : 'online'
            }
        }));
    };

    const toggleItemPlatform = (itemId, platform) => {
        setMenuItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, [platform]: !item[platform] } : item
        ));
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'preparing': return 'bg-blue-100 text-blue-700';
            case 'delivered': return 'bg-emerald-100 text-emerald-700';
            case 'cancelled': return 'bg-rose-100 text-rose-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
            {/* Mission Control Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-100 rotate-3">
                        <ShoppingBag size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aggregator Ops</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-slate-500 text-sm font-medium">Gateway: Active & Synced</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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
                                            onClick={() => setSurgePrepTime(mins)}
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
                                    * Updating surge time will immediately apply to both Swiggy and Zomato active orders.
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
                                    onClick={() => setNotifEnabled(!notifEnabled)}
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
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden group hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-100 group-hover:scale-110 transition-transform">
                                            <ShoppingBag size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-900 tracking-tight">Swiggy</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`w-2 h-2 rounded-full ${integrationStatus.swiggy.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                    {integrationStatus.swiggy.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleStatus('swiggy')}
                                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${integrationStatus.swiggy.status === 'online'
                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                            }`}
                                    >
                                        Go {integrationStatus.swiggy.status === 'online' ? 'Offline' : 'Online'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { label: 'Orders', value: integrationStatus.swiggy.ordersCount, sub: 'Active' },
                                        { label: 'Revenue', value: `₹${integrationStatus.swiggy.revenue}`, sub: "Today" },
                                        { label: 'Rating', value: `★ ${integrationStatus.swiggy.rating}`, sub: 'Platform' }
                                    ].map((stat, i) => (
                                        <div key={i} className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-lg font-black text-slate-900">{stat.value}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="px-8 py-5 bg-orange-50 text-orange-700 text-xs font-bold flex justify-between items-center">
                                <span>SWIGGY CONNECT ENGINE v2.4</span>
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-orange-300 rounded-full"></span>
                                    <span className="w-1 h-1 bg-orange-300 rounded-full"></span>
                                    <span className="w-1 h-1 bg-orange-300 rounded-full"></span>
                                </div>
                            </div>
                        </div>

                        {/* Zomato Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden group hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-100 group-hover:scale-110 transition-transform">
                                            <ShoppingBag size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-900 tracking-tight">Zomato</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`w-2 h-2 rounded-full ${integrationStatus.zomato.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                    {integrationStatus.zomato.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleStatus('zomato')}
                                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${integrationStatus.zomato.status === 'online'
                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                            }`}
                                    >
                                        Go {integrationStatus.zomato.status === 'online' ? 'Offline' : 'Online'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { label: 'Orders', value: integrationStatus.zomato.ordersCount, sub: 'Active' },
                                        { label: 'Revenue', value: `₹${integrationStatus.zomato.revenue}`, sub: "Today" },
                                        { label: 'Rating', value: `★ ${integrationStatus.zomato.rating}`, sub: 'Platform' }
                                    ].map((stat, i) => (
                                        <div key={i} className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-lg font-black text-slate-900">{stat.value}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="px-8 py-5 bg-rose-50 text-rose-700 text-xs font-bold flex justify-between items-center">
                                <span>ZOMATO CORE INTEGRATION ONLINE</span>
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-rose-300 rounded-full"></span>
                                    <span className="w-1 h-1 bg-rose-300 rounded-full"></span>
                                    <span className="w-1 h-1 bg-rose-300 rounded-full"></span>
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
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">Aggregator Unified Journal</p>
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
                            {recentOrders
                                .filter(o => activePlatform === 'all' || o.platform === activePlatform)
                                .map((order, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all group">
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
                                                    {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right hidden md:block border-r border-slate-100 pr-8">
                                                <p className="text-lg font-black text-slate-900">₹{order.total}</p>
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
                                ))}
                        </div>
                    </div>
                </>
            )}

            {activeView === 'menu' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                        <div>
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight">Cross-Platform Sync</h3>
                            <p className="text-slate-500 text-sm mt-1">Manage item visibility on Swiggy and Zomato instantly.</p>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                className="pl-12 pr-6 py-3 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 w-full sm:w-64 border-none transition-all"
                            />
                            <Utensils className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        </div>
                    </div>

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
                                {menuItems.map(item => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-6 px-4">
                                            <p className="font-bold text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">{item.category}</p>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <button
                                                onClick={() => toggleItemPlatform(item.id, 'swiggy')}
                                                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${item.swiggy
                                                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                    : 'bg-slate-50 text-slate-400 border border-slate-100 grayscale opacity-50'
                                                    }`}
                                            >
                                                {item.swiggy ? 'AVAILABLE' : 'DISABLED'}
                                            </button>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <button
                                                onClick={() => toggleItemPlatform(item.id, 'zomato')}
                                                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${item.zomato
                                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    : 'bg-slate-50 text-slate-400 border border-slate-100 grayscale opacity-50'
                                                    }`}
                                            >
                                                {item.zomato ? 'AVAILABLE' : 'DISABLED'}
                                            </button>
                                        </td>
                                        <td className="py-6 px-4 text-right">
                                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-4 py-2">
                                                Edit Mappings
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeView === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                        <h3 className="font-black text-xl text-slate-900 mb-8 border-b border-slate-50 pb-6">Operations Health</h3>
                        <div className="space-y-8">
                            {[
                                { label: 'Average Prep Time', swiggy: '18m', zomato: '15m', target: '12m' },
                                { label: 'Cancellation Rate', swiggy: '1.2%', zomato: '0.8%', target: '<1%' },
                                { label: 'Driver Wait Time', swiggy: '4m 10s', zomato: '3m 45s', target: '<5m' }
                            ].map((row, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{row.label}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Target: {row.target}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-4 py-2 bg-orange-50 rounded-xl text-center min-w-[80px]">
                                            <p className="text-sm font-black text-orange-600">{row.swiggy}</p>
                                            <p className="text-[8px] font-black text-orange-300 uppercase">Swiggy</p>
                                        </div>
                                        <div className="px-4 py-2 bg-rose-50 rounded-xl text-center min-w-[80px]">
                                            <p className="text-sm font-black text-rose-600">{row.zomato}</p>
                                            <p className="text-[8px] font-black text-rose-300 uppercase">Zomato</p>
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
                                Your Zomato revenue is currently leading by 12% this week. Consider running a weekend "Flash Promo" on Swiggy to balance your order velocity and maximize kitchen usage.
                            </p>
                            <div className="grid grid-cols-2 gap-6 pb-2">
                                <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Growth Index</p>
                                    <p className="text-2xl font-black">+14.2%</p>
                                </div>
                                <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Peak ROI</p>
                                    <p className="text-2xl font-black">2.4x</p>
                                </div>
                            </div>
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
