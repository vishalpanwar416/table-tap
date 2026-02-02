import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Activity,
  RefreshCw,
  ChevronRight,
  Zap,
  Calendar,
  IndianRupee,
  ShoppingBag,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Award,
  Target,
  Percent,
  ClipboardList,
  UserPlus,
  TrendingUp as Trending,
  Briefcase,
  ChefHat,
  Utensils
} from 'lucide-react';
import { supabase } from '../../../../shared/supabase';
import { getSubscriptionStats, getUpcomingRenewals, getSubscriptionPlans } from '../../../api/subscriptionService';

const AdminDashboard = ({ restaurants, staff, currentUser, onTabChange }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    restaurants: { total: 0, active: 0, inactive: 0, withAI: 0, withAggregators: 0 },
    staff: { total: 0, connected: 0, pending: 0, managers: 0, captains: 0 },
    subscriptions: { total: 0, active: 0, expired: 0, cancelled: 0, gracePeriod: 0 },
    revenue: { total: 0, monthly: 0, growth: 0, lastMonth: 0 },
    plans: { starter: 0, professional: 0, enterprise: 0 }
  });
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [inquiryStats, setInquiryStats] = useState({ total: 0, pending: 0, contacted: 0, converted: 0 });
  const [registrationStats, setRegistrationStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get greeting based on time
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [currentTime]);

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [restaurants, staff]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate restaurant stats from props
      const restaurantStats = {
        total: restaurants?.length || 0,
        active: restaurants?.filter(r => r.is_active).length || 0,
        inactive: restaurants?.filter(r => !r.is_active).length || 0,
        withAI: restaurants?.filter(r => r.ai_enabled).length || 0,
        withAggregators: restaurants?.filter(r => r.aggregators_enabled).length || 0
      };

      // Calculate staff stats from props
      const staffStats = {
        total: staff?.length || 0,
        connected: staff?.filter(s => s.connected).length || 0,
        pending: staff?.filter(s => !s.connected).length || 0,
        managers: staff?.filter(s => s.role === 'manager').length || 0,
        captains: staff?.filter(s => s.role === 'captain').length || 0,
        chefs: staff?.filter(s => s.role === 'chef').length || 0,
        waiters: staff?.filter(s => s.role === 'waiter').length || 0
      };

      // Get subscription stats from API
      const { data: subStats } = await getSubscriptionStats();

      // Get upcoming renewals
      const { data: renewals } = await getUpcomingRenewals(7);
      setUpcomingRenewals(renewals || []);

      // Get inquiry stats
      const { data: inquiries } = await supabase
        .from('landing_inquiries')
        .select('status');

      if (inquiries) {
        setInquiryStats({
          total: inquiries.length,
          pending: inquiries.filter(i => i.status === 'pending' || i.status === 'new').length,
          contacted: inquiries.filter(i => i.status === 'contacted').length,
          converted: inquiries.filter(i => i.status === 'converted').length
        });
      }

      // Get registration stats
      const { data: registrations } = await supabase
        .from('restaurant_registrations')
        .select('status');

      if (registrations) {
        setRegistrationStats({
          total: registrations.length,
          pending: registrations.filter(r => r.status === 'pending').length,
          approved: registrations.filter(r => r.status === 'approved').length,
          rejected: registrations.filter(r => r.status === 'rejected').length
        });
      }

      // Get recent activity (subscription history)
      const { data: history } = await supabase
        .from('subscription_history')
        .select(`
          *,
          restaurant:restaurants (name)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentActivity(history || []);

      // Calculate revenue growth (comparing this month vs last month)
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data: thisMonthRevenue } = await supabase
        .from('subscription_history')
        .select('amount_paid')
        .gte('created_at', thisMonthStart.toISOString())
        .in('action', ['created', 'renewed', 'upgraded']);

      const { data: lastMonthRevenue } = await supabase
        .from('subscription_history')
        .select('amount_paid')
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .in('action', ['created', 'renewed', 'upgraded']);

      const thisMonthTotal = thisMonthRevenue?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
      const lastMonthTotal = lastMonthRevenue?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
      const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;

      // Set all stats
      setStats({
        restaurants: restaurantStats,
        staff: staffStats,
        subscriptions: {
          total: subStats?.totalSubscriptions || 0,
          active: subStats?.activeSubscriptions || 0,
          expired: subStats?.expiredSubscriptions || 0,
          cancelled: subStats?.cancelledSubscriptions || 0,
          gracePeriod: subStats?.gracePeriodSubscriptions || 0
        },
        revenue: {
          total: subStats?.totalRevenue || 0,
          monthly: subStats?.monthlyRecurringRevenue || 0,
          growth: growth,
          thisMonth: thisMonthTotal,
          lastMonth: lastMonthTotal
        },
        plans: subStats?.planCounts || { starter: 0, professional: 0, enterprise: 0 }
      });

      // Get top restaurants (those with most orders or longest subscription)
      const sortedRestaurants = [...(restaurants || [])].filter(r => r.is_active).slice(0, 5);
      setTopRestaurants(sortedRestaurants);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    const iconProps = { size: 14 };
    switch (action) {
      case 'created': return <CheckCircle className="text-green-500" {...iconProps} />;
      case 'cancelled': return <XCircle className="text-red-500" {...iconProps} />;
      case 'renewed': return <RefreshCw className="text-blue-500" {...iconProps} />;
      case 'upgraded': return <TrendingUp className="text-purple-500" {...iconProps} />;
      case 'reactivated': return <Zap className="text-amber-500" {...iconProps} />;
      default: return <Activity className="text-gray-500" {...iconProps} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'renewed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'upgraded': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'reactivated': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Calculate health score
  const healthScore = useMemo(() => {
    if (stats.restaurants.total === 0) return 0;
    const activeRate = stats.restaurants.active / stats.restaurants.total;
    const connectedRate = stats.staff.total > 0 ? stats.staff.connected / stats.staff.total : 0;
    const subRate = stats.subscriptions.total > 0 ? stats.subscriptions.active / stats.subscriptions.total : 0;
    return Math.round(((activeRate + connectedRate + subRate) / 3) * 100);
  }, [stats]);

  // Donut chart data
  const planTotal = (stats.plans.starter || 0) + (stats.plans.professional || 0) + (stats.plans.enterprise || 0);
  const planData = [
    { name: 'Starter', value: stats.plans.starter || 0, color: '#3B82F6' },
    { name: 'Professional', value: stats.plans.professional || 0, color: '#8B5CF6' },
    { name: 'Enterprise', value: stats.plans.enterprise || 0, color: '#F59E0B' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
          <p className="text-sm text-gray-400">Fetching analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header - Compact */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-indigo-200 mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-yellow-300" />
              <span className="text-indigo-100 font-bold uppercase text-[10px] tracking-widest">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              {greeting},
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-100">
                {currentUser?.full_name?.split(' ')[0] || 'Admin'}
              </span>
            </h1>
            <p className="text-indigo-100 text-sm opacity-90">Here's your comprehensive platform overview.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="group flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50 text-xs font-semibold"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              <span>Refresh</span>
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-indigo-950/30 backdrop-blur-md rounded-xl border border-white/10">
              <div className={`w-2 h-2 rounded-full ${healthScore >= 70 ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}></div>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] uppercase font-bold text-indigo-300">Health</span>
                <span className="text-xs font-bold">{healthScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        {[
          { id: 'staff', label: 'Add Staff Member', icon: UserPlus, color: 'text-blue-600', hoverBg: 'hover:bg-blue-50', hoverBorder: 'hover:border-blue-200' },
          { id: 'registrations', label: 'Pending Registrations', icon: ClipboardList, color: 'text-amber-600', hoverBg: 'hover:bg-amber-50', hoverBorder: 'hover:border-amber-200', count: registrationStats.pending },
          { id: 'subscriptions', label: 'Manage Subscriptions', icon: CreditCard, color: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50', hoverBorder: 'hover:border-emerald-200' }
        ].map((action) => (
          <button
            key={action.id}
            onClick={() => onTabChange?.(action.id)}
            className={`group flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 ${action.hoverBg} ${action.hoverBorder} hover:shadow-lg transition-all hover:scale-105 duration-200`}
          >
            <div className={`p-2 rounded-xl bg-gray-50 group-hover:bg-white transition-colors`}>
              <action.icon size={18} className={action.color} />
            </div>
            <span>{action.label}</span>
            {action.count > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md shadow-red-500/20 animate-pulse ml-1">
                {action.count}
              </span>
            )}
            <ChevronRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-gray-300" />
          </button>
        ))}
      </div>

      {/* Main Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-4">
        {/* Total Restaurants - Wide Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl transition-all md:col-span-6 xl:col-span-5 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="text-white" size={24} />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">{stats.restaurants.total}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Restaurants</p>
              </div>
            </div>
            <button
              onClick={() => onTabChange?.('restaurants')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold uppercase hover:bg-purple-100 transition-all"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-green-50 rounded-xl p-2 text-center">
              <p className="text-base font-black text-green-600">{stats.restaurants.active}</p>
              <p className="text-[9px] font-bold text-green-700/60 uppercase">Active</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2 text-center">
              <p className="text-base font-black text-red-500">{stats.restaurants.inactive}</p>
              <p className="text-[9px] font-bold text-red-700/60 uppercase">Inactive</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-2 text-center">
              <p className="text-base font-black text-blue-600">{stats.plans.starter || 0}</p>
              <p className="text-[9px] font-bold text-blue-700/60 uppercase">Starter</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-2 text-center">
              <p className="text-base font-black text-purple-600">{stats.plans.professional || 0}</p>
              <p className="text-[9px] font-bold text-purple-700/60 uppercase">Pro</p>
            </div>
          </div>

          {/* Enterprise & Progress */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-gray-500">Enterprise:</span>
                <span className="font-bold text-gray-900">{stats.plans.enterprise || 0}</span>
              </span>
            </div>
            <button
              onClick={() => onTabChange?.('restaurants')}
              className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 group/btn"
            >
              View All <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Total Staff */}
        <div
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group md:col-span-2 xl:col-span-2 flex flex-col justify-between"
          onClick={() => onTabChange?.('staff')}
        >
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                <Users className="text-white" size={20} />
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{stats.staff.total}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Staff Members</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.staff.total > 0 ? (stats.staff.connected / stats.staff.total * 100) : 0}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-blue-600 whitespace-nowrap">{stats.staff.connected} linked</span>
          </div>
        </div>

        {/* Subscriptions */}
        <div
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group md:col-span-2 xl:col-span-2 flex flex-col justify-between"
          onClick={() => onTabChange?.('subscriptions')}
        >
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <CreditCard className="text-white" size={20} />
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{stats.subscriptions.total}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Subscriptions</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-medium">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-bold">{stats.subscriptions.active}</span>
              <span className="hidden sm:inline">active</span>
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-amber-200 transition-all group md:col-span-2 xl:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                <IndianRupee className="text-white" size={20} />
              </div>
              <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${stats.revenue.growth >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                }`}>
                {stats.revenue.growth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {Math.abs(stats.revenue.growth).toFixed(1)}%
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(stats.revenue.total)}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Total Revenue</p>
          </div>
          <div className="mt-4 pt-3 border-t border-dashed border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
            <span>MRR: <span className="font-black text-gray-900">{formatCurrency(stats.revenue.monthly)}</span></span>
          </div>
        </div>
      </div>


      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Plan Distribution - Visual Donut */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Plan Distribution</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{planTotal} total</span>
          </div>

          {/* Visual Donut Chart */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                {planTotal > 0 && (() => {
                  const circumference = 2 * Math.PI * 40;
                  let accumulatedPercentage = 0;
                  return planData.map((plan) => {
                    const percentage = (plan.value / planTotal) * 100;
                    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                    const offset = accumulatedPercentage;
                    accumulatedPercentage += percentage;
                    return (
                      <circle
                        key={plan.name}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={plan.color}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={(-offset / 100) * circumference}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-900">{stats.subscriptions.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {planData.map((plan) => (
              <div key={plan.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                  <span className="text-sm text-gray-600">{plan.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{plan.value}</span>
                  <span className="text-xs text-gray-400">
                    ({planTotal > 0 ? ((plan.value / planTotal) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Adoption & Health */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>

          {/* Health Score */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Health Score</span>
              <span className={`text-lg font-bold ${healthScore >= 70 ? 'text-green-600' : healthScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>{healthScore}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${healthScore >= 70 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  healthScore >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                    'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-indigo-500" />
                <span className="text-sm text-gray-600">AI Enabled</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats.restaurants.withAI}/{stats.restaurants.active}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-orange-500" />
                <span className="text-sm text-gray-600">Aggregators</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats.restaurants.withAggregators}/{stats.restaurants.active}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                <span className="text-sm text-gray-600">Staff Connected</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats.staff.connected}/{stats.staff.total}</span>
            </div>
          </div>
        </div>

        {/* Leads & Registrations */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads & Registrations</h3>

          {/* Registrations */}
          <div
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 mb-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => onTabChange?.('registrations')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-amber-600" />
                <span className="font-medium text-gray-900">Registrations</span>
              </div>
              {registrationStats.pending > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {registrationStats.pending} pending
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{registrationStats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{registrationStats.approved}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-600">{registrationStats.rejected}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </div>
          </div>

          {/* Inquiries */}
          <div
            className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => onTabChange?.('inquiries')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-pink-600" />
                <span className="font-medium text-gray-900">Lead Inquiries</span>
              </div>
              <span className="text-xs text-gray-500">{inquiryStats.total} total</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-600">{inquiryStats.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{inquiryStats.contacted}</p>
                  <p className="text-xs text-gray-500">Contacted</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{inquiryStats.converted}</p>
                  <p className="text-xs text-gray-500">Converted</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">
                  {inquiryStats.total > 0 ? ((inquiryStats.converted / inquiryStats.total) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-gray-500">Conv. Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Renewals & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-amber-500" />
              Upcoming Renewals
            </h3>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              Next 7 days
            </span>
          </div>

          {upcomingRenewals.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No renewals due in the next 7 days</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingRenewals.slice(0, 5).map((renewal) => (
                <div
                  key={renewal.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-sm ${renewal.daysUntilExpiry <= 2
                    ? 'bg-red-50 border-red-100'
                    : 'bg-gray-50 border-gray-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${renewal.daysUntilExpiry <= 2 ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                      <Clock size={18} className={renewal.daysUntilExpiry <= 2 ? 'text-red-600' : 'text-amber-600'} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{renewal.restaurant?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{renewal.plan_name}</p>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${renewal.daysUntilExpiry <= 2
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                    }`}>
                    {renewal.daysUntilExpiry}d
                  </div>
                </div>
              ))}
              {upcomingRenewals.length > 5 && (
                <button
                  onClick={() => onTabChange?.('subscriptions')}
                  className="w-full mt-2 py-2.5 text-sm text-purple-600 hover:bg-purple-50 rounded-xl transition-colors flex items-center justify-center gap-1 font-medium"
                >
                  View all {upcomingRenewals.length} renewals
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Activity size={20} className="text-blue-500" /></div>
              Recent Activity
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Live Updates
            </span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-400 border border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
              <Activity size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">No activity yet</p>
              <p className="text-sm">Recent subscription changes will appear here</p>
            </div>
          ) : (
            <div className="relative space-y-0 pl-4 before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:to-transparent before:rounded-full">
              {recentActivity.map((activity, idx) => (
                <div key={activity.id} className="relative pl-6 pb-6 last:pb-0 group">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-1.5 -translate-x-[5px] w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${activity.action === 'created' ? 'bg-green-500' :
                    activity.action === 'renewed' ? 'bg-blue-500' :
                      activity.action === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                    } group-hover:scale-125 transition-transform duration-300`}></div>

                  <div className="flex items-start justify-between gap-4 p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-xl flex items-center justify-center shadow-sm ${getActionColor(activity.action)}`}>
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                          {activity.restaurant?.name || 'Unknown Restaurant'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <span className="capitalize font-medium text-gray-700">{activity.action}</span>
                          {activity.new_plan && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span>{activity.new_plan}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {activity.amount_paid > 0 && (
                        <p className="text-sm font-black text-emerald-600 font-mono">+{formatCurrency(activity.amount_paid)}</p>
                      )}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Distribution */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <Briefcase size={24} className="mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-gray-900">{stats.staff.managers}</p>
            <p className="text-xs text-gray-600">Managers</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <ClipboardList size={24} className="mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-gray-900">{stats.staff.captains}</p>
            <p className="text-xs text-gray-600">Captains</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <ChefHat size={24} className="mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold text-gray-900">{stats.staff.chefs || 0}</p>
            <p className="text-xs text-gray-600">Chefs</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <Utensils size={24} className="mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-gray-900">{stats.staff.waiters || 0}</p>
            <p className="text-xs text-gray-600">Waiters</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <UserPlus size={24} className="mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold text-gray-900">{stats.staff.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target size={18} className="text-purple-400" />
              <span className="text-gray-400 text-sm">Active Rate</span>
            </div>
            <p className="text-3xl font-bold">{stats.restaurants.total > 0 ? ((stats.restaurants.active / stats.restaurants.total) * 100).toFixed(0) : 0}%</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trending size={18} className="text-green-400" />
              <span className="text-gray-400 text-sm">This Month</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(stats.revenue.thisMonth || 0)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Percent size={18} className="text-blue-400" />
              <span className="text-gray-400 text-sm">Conversion</span>
            </div>
            <p className="text-3xl font-bold">
              {inquiryStats.total > 0 ? ((inquiryStats.converted / inquiryStats.total) * 100).toFixed(0) : 0}%
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award size={18} className="text-amber-400" />
              <span className="text-gray-400 text-sm">Health Score</span>
            </div>
            <p className="text-3xl font-bold">{healthScore}%</p>
          </div>
        </div>
      </div>
    </div >
  );
};

export default AdminDashboard;
