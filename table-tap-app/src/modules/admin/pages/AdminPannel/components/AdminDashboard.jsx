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
  PieChart,
  Activity,
  RefreshCw,
  ChevronRight,
  Zap,
  Crown,
  Star,
  Calendar,
  IndianRupee,
  ShoppingBag,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Settings,
  Bell,
  Sparkles,
  Award,
  Target,
  Percent,
  ClipboardList,
  UserPlus,
  Store,
  TrendingUp as Trending,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../../../shared/supabase';
import { getSubscriptionStats, getUpcomingRenewals, getSubscriptionPlans } from '../../../api/subscriptionService';

const AdminDashboard = ({ restaurants, staff, onTabChange }) => {
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={20} className="text-yellow-300" />
              <span className="text-purple-200 text-sm">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{greeting}, Admin!</h1>
            <p className="text-purple-200 mt-1">Here's what's happening with your platform today.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className={`w-2 h-2 rounded-full ${healthScore >= 70 ? 'bg-green-400' : healthScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`}></div>
              <span className="text-sm">Health: {healthScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => onTabChange?.('restaurants')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all shadow-sm"
        >
          <Plus size={16} />
          Add Restaurant
        </button>
        <button 
          onClick={() => onTabChange?.('staff')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all shadow-sm"
        >
          <UserPlus size={16} />
          Add Staff
        </button>
        <button 
          onClick={() => onTabChange?.('registrations')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all shadow-sm"
        >
          <ClipboardList size={16} />
          Registrations
          {registrationStats.pending > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{registrationStats.pending}</span>
          )}
        </button>
        <button 
          onClick={() => onTabChange?.('subscriptions')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all shadow-sm"
        >
          <CreditCard size={16} />
          Subscriptions
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Restaurants */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
          onClick={() => onTabChange?.('restaurants')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Building2 className="text-white" size={22} />
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.restaurants.total}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total Restaurants</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.restaurants.total > 0 ? (stats.restaurants.active / stats.restaurants.total * 100) : 0}%` }}
              />
            </div>
            <span className="text-xs font-medium text-green-600">{stats.restaurants.active} active</span>
          </div>
        </div>

        {/* Total Staff */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
          onClick={() => onTabChange?.('staff')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Users className="text-white" size={22} />
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.staff.total}</p>
          <p className="text-sm text-gray-500 mt-0.5">Staff Members</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.staff.total > 0 ? (stats.staff.connected / stats.staff.total * 100) : 0}%` }}
              />
            </div>
            <span className="text-xs font-medium text-blue-600">{stats.staff.connected} linked</span>
          </div>
        </div>

        {/* Subscriptions */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group"
          onClick={() => onTabChange?.('subscriptions')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <CreditCard className="text-white" size={22} />
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.subscriptions.total}</p>
          <p className="text-sm text-gray-500 mt-0.5">Subscriptions</p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              {stats.subscriptions.active} active
            </span>
            {stats.subscriptions.gracePeriod > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                {stats.subscriptions.gracePeriod} grace
              </span>
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <IndianRupee className="text-white" size={22} />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              stats.revenue.growth >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
            }`}>
              {stats.revenue.growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(stats.revenue.growth).toFixed(1)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue.total)}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total Revenue</p>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>MRR: <span className="font-medium text-gray-700">{formatCurrency(stats.revenue.monthly)}</span></span>
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
                {planTotal > 0 && planData.reduce((acc, plan, i) => {
                  const percentage = (plan.value / planTotal) * 100;
                  const circumference = 2 * Math.PI * 40;
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                  const offset = acc;
                  acc += percentage;
                  return (
                    <React.Fragment key={plan.name}>
                      <circle
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
                      {acc}
                    </React.Fragment>
                  );
                }, 0)}
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
              <span className={`text-lg font-bold ${
                healthScore >= 70 ? 'text-green-600' : healthScore >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>{healthScore}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  healthScore >= 70 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
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
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-sm ${
                    renewal.daysUntilExpiry <= 2 
                      ? 'bg-red-50 border-red-100' 
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      renewal.daysUntilExpiry <= 2 ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      <Clock size={18} className={renewal.daysUntilExpiry <= 2 ? 'text-red-600' : 'text-amber-600'} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{renewal.restaurant?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{renewal.plan_name}</p>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    renewal.daysUntilExpiry <= 2 
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-blue-500" />
              Recent Activity
            </h3>
            <span className="text-xs text-gray-500">Live updates</span>
          </div>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Activity size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No activity yet</p>
              <p className="text-sm">Recent subscription changes will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.restaurant?.name || 'Unknown Restaurant'}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="capitalize">{activity.action}</span>
                      {activity.new_plan && <span className="ml-1">• {activity.new_plan}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    {activity.amount_paid > 0 && (
                      <p className="text-sm font-bold text-emerald-600">+{formatCurrency(activity.amount_paid)}</p>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(activity.created_at)}</p>
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
          {[
            { role: 'Managers', count: stats.staff.managers, icon: Crown, color: 'purple' },
            { role: 'Captains', count: stats.staff.captains, icon: Star, color: 'blue' },
            { role: 'Chefs', count: stats.staff.chefs, icon: Zap, color: 'orange' },
            { role: 'Waiters', count: stats.staff.waiters, icon: Users, color: 'green' },
            { role: 'Pending', count: stats.staff.pending, icon: Clock, color: 'amber' },
          ].map((item) => (
            <div key={item.role} className={`bg-${item.color}-50 rounded-xl p-4 text-center`}>
              <item.icon size={24} className={`mx-auto mb-2 text-${item.color}-500`} />
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-600">{item.role}</p>
            </div>
          ))}
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
    </div>
  );
};

export default AdminDashboard;
