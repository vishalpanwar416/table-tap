import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  RefreshCw,
  ChevronRight,
  Zap,
  Calendar,
  IndianRupee,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ClipboardList,
  UserPlus,
  Briefcase,
  ChefHat,
  Utensils,
} from 'lucide-react';
import { supabase } from '../../../../shared/supabase';
import {
  getSubscriptionStats,
  getUpcomingRenewals,
  getSubscriptionPlans,
} from '../../../api/subscriptionService';
import { ACTIVITY_TYPES } from '../../../api/adminActivityLogService';

const DASHBOARD_ACTIVITY_TYPES = [
  ACTIVITY_TYPES.SUBSCRIPTION_CREATED,
  ACTIVITY_TYPES.SUBSCRIPTION_RENEWED,
  ACTIVITY_TYPES.SUBSCRIPTION_CANCELLED,
  ACTIVITY_TYPES.SUBSCRIPTION_EXPIRED,
  ACTIVITY_TYPES.SYSTEM_ALERT,
  ACTIVITY_TYPES.CRON_JOB,
  ACTIVITY_TYPES.AUTO_PROCESS,
];

const getDashboardActivityAction = (log) => {
  switch (log.activity_type) {
    case ACTIVITY_TYPES.SUBSCRIPTION_CREATED:
      return 'created';
    case ACTIVITY_TYPES.SUBSCRIPTION_RENEWED:
      return log.details?.old_plan && log.details?.new_plan ? 'upgraded' : 'renewed';
    case ACTIVITY_TYPES.SUBSCRIPTION_CANCELLED:
      return 'cancelled';
    case ACTIVITY_TYPES.SUBSCRIPTION_EXPIRED:
      return 'expired';
    default:
      return 'system';
  }
};

const getDashboardActivityPlan = (details = {}) =>
  details.new_plan || details.plan || details.plan_name || null;

const getDashboardActivityAmount = (details = {}) =>
  Number(details.total_amount || details.amount || 0);

const AdminDashboard = ({
  restaurants,
  totalRestaurants,
  staff,
  totalStaff,
  currentUser,
  onTabChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    restaurants: { total: 0, active: 0, inactive: 0, withAI: 0, withAggregators: 0 },
    staff: { total: 0, connected: 0, pending: 0, managers: 0, captains: 0 },
    subscriptions: { total: 0, active: 0, expired: 0, cancelled: 0, gracePeriod: 0 },
    revenue: { total: 0, monthly: 0, growth: 0, lastMonth: 0 },
    plans: {},
  });
  const [availablePlans, setAvailablePlans] = useState([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [inquiryStats, setInquiryStats] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    converted: 0,
  });
  const [registrationStats, setRegistrationStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
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
    // Safety net — never hang longer than 8s regardless of network
    const safetyTimer = setTimeout(() => setLoading(false), 8000);
    try {
      // Stats derived from already-loaded props — no network call
      const restaurantStats = {
        total: totalRestaurants || restaurants?.length || 0,
        active: restaurants?.filter((r) => r.is_active).length || 0,
        inactive: restaurants?.filter((r) => !r.is_active).length || 0,
        withAI: restaurants?.filter((r) => r.ai_enabled).length || 0,
        withAggregators: restaurants?.filter((r) => r.aggregators_enabled).length || 0,
      };
      const staffStats = {
        total: totalStaff || staff?.length || 0,
        connected: staff?.filter((s) => s.connected).length || 0,
        pending: staff?.filter((s) => !s.connected).length || 0,
        managers: staff?.filter((s) => s.role === 'manager').length || 0,
        captains: staff?.filter((s) => s.role === 'captain').length || 0,
        chefs: staff?.filter((s) => s.role === 'chef').length || 0,
        waiters: staff?.filter((s) => s.role === 'waiter').length || 0,
      };

      // Fire ALL network requests in parallel
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Wrap each query in a timeout so a single stalled query can't block everything
      const withTimeout = (promise, ms = 5000) =>
        Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

      const [
        subStatsRes,
        renewalsRes,
        inquiriesRes,
        registrationsRes,
        activityRes,
        thisMonthRes,
        lastMonthRes,
        plansRes,
      ] = await Promise.all([
        withTimeout(getSubscriptionStats()),
        withTimeout(getUpcomingRenewals(30)),
        withTimeout(supabase.from('landing_inquiries').select('status')),
        withTimeout(supabase.from('restaurant_registrations').select('status')),
        withTimeout(
          supabase
            .from('admin_activity_logs')
            .select('*')
            .in('activity_type', DASHBOARD_ACTIVITY_TYPES)
            .order('created_at', { ascending: false })
            .limit(6),
        ),
        withTimeout(
          supabase
            .from('subscription_history')
            .select('amount_paid')
            .gte('created_at', thisMonthStart)
            .in('action', ['created', 'renewed', 'upgraded']),
        ),
        withTimeout(
          supabase
            .from('subscription_history')
            .select('amount_paid')
            .gte('created_at', lastMonthStart)
            .lte('created_at', lastMonthEnd)
            .in('action', ['created', 'renewed', 'upgraded']),
        ),
        withTimeout(getSubscriptionPlans()),
      ]);

      const subStats = subStatsRes?.data;
      setUpcomingRenewals(renewalsRes?.data || []);

      const inquiries = inquiriesRes?.data || [];
      setInquiryStats({
        total: inquiries.length,
        pending: inquiries.filter((i) => i.status === 'pending' || i.status === 'new').length,
        contacted: inquiries.filter((i) => i.status === 'contacted').length,
        converted: inquiries.filter((i) => i.status === 'converted').length,
      });

      const registrations = registrationsRes?.data || [];
      setRegistrationStats({
        total: registrations.length,
        pending: registrations.filter((r) => r.status === 'pending').length,
        approved: registrations.filter((r) => r.status === 'approved').length,
        rejected: registrations.filter((r) => r.status === 'rejected').length,
      });

      const activityRows = (activityRes?.data || []).map((row) => {
        const action = getDashboardActivityAction(row);
        const restaurantName =
          row.target_name || restaurants?.find((r) => r.id === row.restaurant_id)?.name || null;

        return {
          id: row.id,
          action,
          action_label: row.activity_name || action,
          activity_name: row.activity_name,
          new_plan: getDashboardActivityPlan(row.details),
          amount_paid: getDashboardActivityAmount(row.details),
          status: row.status,
          created_at: row.created_at,
          description: row.description,
          restaurant: {
            name:
              restaurantName || (action === 'system' ? row.activity_name : 'Unknown Restaurant'),
          },
        };
      });
      setRecentActivity(activityRows);

      const thisMonthTotal = (thisMonthRes?.data || []).reduce(
        (s, r) => s + (r.amount_paid || 0),
        0,
      );
      const lastMonthTotal = (lastMonthRes?.data || []).reduce(
        (s, r) => s + (r.amount_paid || 0),
        0,
      );
      const growth =
        lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

      setStats({
        restaurants: restaurantStats,
        staff: staffStats,
        subscriptions: {
          total: subStats?.totalSubscriptions || 0,
          active: subStats?.activeSubscriptions || 0,
          expired: subStats?.expiredSubscriptions || 0,
          cancelled: subStats?.cancelledSubscriptions || 0,
          gracePeriod: subStats?.gracePeriodSubscriptions || 0,
        },
        revenue: {
          total: subStats?.totalRevenue || 0,
          monthly: subStats?.monthlyRecurringRevenue || 0,
          growth,
          thisMonth: thisMonthTotal,
          lastMonth: lastMonthTotal,
        },
        plans: subStats?.planCounts || {},
      });

      if (plansRes?.data) setAvailablePlans(plansRes.data);

      setTopRestaurants([...(restaurants || [])].filter((r) => r.is_active).slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      clearTimeout(safetyTimer);
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
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action) => {
    const iconProps = { size: 14 };
    switch (action) {
      case 'created':
        return <CheckCircle className="text-green-500" {...iconProps} />;
      case 'cancelled':
        return <XCircle className="text-red-500" {...iconProps} />;
      case 'expired':
        return <AlertTriangle className="text-orange-500" {...iconProps} />;
      case 'renewed':
        return <RefreshCw className="text-gray-600" {...iconProps} />;
      case 'upgraded':
        return <TrendingUp className="text-orange-500" {...iconProps} />;
      case 'reactivated':
        return <Zap className="text-amber-500" {...iconProps} />;
      case 'system':
        return <Activity className="text-gray-600" {...iconProps} />;
      default:
        return <Activity className="text-gray-500" {...iconProps} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'expired':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'renewed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'upgraded':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'reactivated':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'system':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Calculate health score
  const healthScore = useMemo(() => {
    if (stats.restaurants.total === 0) return 0;
    const activeRate = stats.restaurants.active / stats.restaurants.total;
    const connectedRate = stats.staff.total > 0 ? stats.staff.connected / stats.staff.total : 0;
    const subRate =
      stats.subscriptions.total > 0 ? stats.subscriptions.active / stats.subscriptions.total : 0;
    return Math.round(((activeRate + connectedRate + subRate) / 3) * 100);
  }, [stats]);

  // Donut chart data - Dynamic from available plans
  const planTotal = Object.values(stats.plans).reduce((sum, count) => sum + count, 0);
  const planColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#6366F1', '#EC4899'];
  const planData = useMemo(() => {
    return availablePlans.map((plan, index) => ({
      name: plan.name,
      value: stats.plans[plan.key] || 0,
      color: planColors[index % planColors.length],
    }));
  }, [availablePlans, stats.plans]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="relative mb-4">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-orange-200 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-12 h-12 md:w-16 md:h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-lg">Loading Dashboard...</p>
          <p className="text-sm text-gray-500 mt-1">Fetching your analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* Welcome Header - Compact */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden shadow-lg shadow-orange-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={12} className="text-yellow-300" />
              <span className="text-orange-100 font-bold uppercase text-[9px] md:text-[10px] tracking-widest">
                {currentTime.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              {greeting},
              <span className="text-white">{currentUser?.full_name?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-orange-100 text-xs md:text-sm opacity-90 mt-1 md:mt-0">
              Here's your platform overview.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="group flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-1.5 md:py-2 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50 text-xs font-semibold"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? 'animate-spin'
                    : 'group-hover:rotate-180 transition-transform duration-500'
                }
              />
              <span>Refresh</span>
            </button>
            <div className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-1.5 md:py-2 bg-gray-950/30 backdrop-blur-md rounded-xl border border-white/10">
              <div
                className={`w-2 h-2 rounded-full ${healthScore >= 70 ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}
              ></div>
              <div className="flex flex-col leading-none">
                <span className="text-[8px] md:text-[9px] uppercase font-bold text-orange-300">
                  Health
                </span>
                <span className="text-[10px] md:text-xs font-bold">{healthScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          {
            id: 'staff',
            label: 'Add Staff',
            fullLabel: 'Add Staff Member',
            icon: UserPlus,
            color: 'text-gray-600',
            hoverBg: 'hover:bg-gray-50',
            hoverBorder: 'hover:border-gray-200',
          },
          {
            id: 'registrations',
            label: 'Registrations',
            fullLabel: 'Pending Registrations',
            icon: ClipboardList,
            color: 'text-amber-600',
            hoverBg: 'hover:bg-amber-50',
            hoverBorder: 'hover:border-amber-200',
            count: registrationStats.pending,
          },
          {
            id: 'subscriptions',
            label: 'Subscriptions',
            fullLabel: 'Manage Subscriptions',
            icon: CreditCard,
            color: 'text-emerald-600',
            hoverBg: 'hover:bg-emerald-50',
            hoverBorder: 'hover:border-emerald-200',
          },
        ].map((action) => (
          <button
            key={action.id}
            onClick={() => onTabChange?.(action.id)}
            className={`group flex flex-col md:flex-row items-center md:justify-start gap-2 md:gap-3 p-3 md:px-6 md:py-4 bg-white border border-gray-100 rounded-2xl text-[10px] md:text-sm font-bold text-gray-600 ${action.hoverBg} ${action.hoverBorder} hover:shadow-lg transition-all hover:scale-105 duration-200`}
          >
            <div
              className={`p-1.5 md:p-2 rounded-xl bg-gray-50 group-hover:bg-white transition-colors relative`}
            >
              <action.icon size={16} className={`${action.color} md:w-[18px] md:h-[18px]`} />
              {action.count > 0 && (
                <span className="md:hidden absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  {action.count}
                </span>
              )}
            </div>
            <span className="text-center md:text-left leading-tight">
              <span className="md:hidden">{action.label}</span>
              <span className="hidden md:inline">{action.fullLabel}</span>
            </span>
            {action.count > 0 && (
              <span className="hidden md:inline-block bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md shadow-red-500/20 ml-auto md:ml-1">
                {action.count}
              </span>
            )}
            <ChevronRight
              size={14}
              className="hidden md:block opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-gray-300 ml-auto"
            />
          </button>
        ))}
      </div>

      {/* Main Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 xl:grid-cols-12 gap-3 md:gap-4">
        {/* Total Restaurants - Wide Card */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-xl transition-all col-span-2 md:col-span-6 xl:col-span-5 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="text-white" size={20} />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                  {stats.restaurants.total}
                </p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Total Restaurants
                </p>
              </div>
            </div>
            <button
              onClick={() => onTabChange?.('restaurants')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold uppercase hover:bg-orange-100 transition-all"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {/* Stats Grid - Dynamic Plans */}
          <div className="flex flex-wrap gap-1 mb-2">
            <div className="flex-1 min-w-[60px] bg-green-50 rounded-xl p-2 text-center">
              <p className="text-base font-black text-green-600">{stats.restaurants.active}</p>
              <p className="text-[9px] font-bold text-green-700/60 uppercase">Active</p>
            </div>
            <div className="flex-1 min-w-[60px] bg-red-50 rounded-xl p-2 text-center">
              <p className="text-base font-black text-red-500">{stats.restaurants.inactive}</p>
              <p className="text-[9px] font-bold text-red-700/60 uppercase">Inactive</p>
            </div>
            {availablePlans
              .filter((p) => p.key !== 'demo')
              .slice(0, 5)
              .map((plan, idx) => (
                <div
                  key={plan.key}
                  className={`flex-1 min-w-[70px] rounded-xl p-2 text-center ${idx === 0 ? 'bg-gray-50' : idx === 1 ? 'bg-orange-50' : idx === 2 ? 'bg-orange-50' : 'bg-orange-50'}`}
                >
                  <p
                    className={`text-base font-black ${idx === 0 ? 'text-gray-600' : idx === 1 ? 'text-orange-600' : idx === 2 ? 'text-orange-600' : 'text-orange-600'}`}
                  >
                    {stats.plans[plan.key] || 0}
                  </p>
                  <p
                    className={`text-[9px] font-bold uppercase ${idx === 0 ? 'text-gray-700/60' : idx === 1 ? 'text-orange-700/60' : idx === 2 ? 'text-orange-700/60' : 'text-orange-700/60'}`}
                  >
                    {plan.name.split(' ')[0]}
                  </p>
                </div>
              ))}
          </div>

          {/* Plan overflow info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-4 text-xs font-medium">
              {availablePlans
                .filter((p) => p.key === 'demo')
                .map((demoPlan) => (
                  <span key="demo-stat" className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-gray-500">Demo:</span>
                    <span className="font-bold text-gray-900">
                      {stats.plans[demoPlan.key] || 0}
                    </span>
                  </span>
                ))}
            </div>
            <button
              onClick={() => onTabChange?.('restaurants')}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 group/btn"
            >
              View All{' '}
              <ChevronRight
                size={14}
                className="group-hover/btn:translate-x-0.5 transition-transform"
              />
            </button>
          </div>
        </div>

        {/* Total Staff */}
        <div
          className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all cursor-pointer group col-span-1 md:col-span-2 xl:col-span-2 flex flex-col justify-between"
          onClick={() => onTabChange?.('staff')}
        >
          <div>
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-700 rounded-xl flex items-center justify-center shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform">
                <Users className="text-white" size={16} />
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-50 group-hover:text-gray-600 transition-colors">
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-600" />
              </div>
            </div>

            <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats.staff.total}
            </p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">
              Staff Members
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.staff.total > 0 ? (stats.staff.connected / stats.staff.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap">
              {stats.staff.connected} linked
            </span>
          </div>
        </div>

        {/* Subscriptions */}
        <div
          className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group col-span-1 md:col-span-2 xl:col-span-2 flex flex-col justify-between"
          onClick={() => onTabChange?.('subscriptions')}
        >
          <div>
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <CreditCard className="text-white" size={16} />
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500" />
              </div>
            </div>

            <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats.subscriptions.total}
            </p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">
              Subscriptions
            </p>
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
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:border-amber-200 transition-all group col-span-2 md:col-span-2 xl:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                <IndianRupee className="text-white" size={20} />
              </div>
              <div
                className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                  stats.revenue.growth >= 0
                    ? 'text-green-700 bg-green-50'
                    : 'text-red-700 bg-red-50'
                }`}
              >
                {stats.revenue.growth >= 0 ? (
                  <ArrowUpRight size={10} />
                ) : (
                  <ArrowDownRight size={10} />
                )}
                {Math.abs(stats.revenue.growth).toFixed(1)}%
              </div>
            </div>
            <p className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(stats.revenue.total)}
            </p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">
              Total Revenue
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-dashed border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
            <span>
              MRR:{' '}
              <span className="font-black text-gray-900">
                {formatCurrency(stats.revenue.monthly)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Plan Distribution - Visual Donut */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Plan Distribution</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {planTotal} total
            </span>
          </div>

          {/* Visual Donut Chart */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-28 h-28 md:w-36 md:h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                {planTotal > 0 &&
                  (() => {
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
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: plan.color }}
                  ></div>
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

        {/* Leads & Registrations */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            Leads & Registrations
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Registrations */}
            <div
              className="bg-amber-50 rounded-xl p-3 md:p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => onTabChange?.('registrations')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-amber-600" />
                  <span className="text-sm font-medium text-gray-900">Registrations</span>
                </div>
                {registrationStats.pending > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {registrationStats.pending} pending
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
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
              className="bg-orange-50 rounded-xl p-3 md:p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => onTabChange?.('inquiries')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-orange-600" />
                  <span className="text-sm font-medium text-gray-900">Lead Inquiries</span>
                </div>
                <span className="text-xs text-gray-500">{inquiryStats.total} total</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-600">{inquiryStats.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-600">{inquiryStats.contacted}</p>
                  <p className="text-xs text-gray-500">Contacted</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">{inquiryStats.converted}</p>
                  <p className="text-xs text-gray-500">Converted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Renewals & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Upcoming Renewals */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-amber-500" />
              Upcoming Renewals
            </h3>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              Next 30 days
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
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${
                        renewal.daysUntilExpiry <= 2 ? 'bg-red-100' : 'bg-amber-100'
                      }`}
                    >
                      <Clock
                        size={18}
                        className={renewal.daysUntilExpiry <= 2 ? 'text-red-600' : 'text-amber-600'}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {renewal.restaurant?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{renewal.plan_name}</p>
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      renewal.daysUntilExpiry <= 2
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {renewal.daysUntilExpiry}d
                  </div>
                </div>
              ))}
              {upcomingRenewals.length > 5 && (
                <button
                  onClick={() => onTabChange?.('subscriptions')}
                  className="w-full mt-2 py-2.5 text-sm text-orange-600 hover:bg-orange-50 rounded-xl transition-colors flex items-center justify-center gap-1 font-medium"
                >
                  View all {upcomingRenewals.length} renewals
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Activity size={20} className="text-gray-600" />
              </div>
              Recent Activity
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Live Updates
            </span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-400 border border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
              <Activity size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">No activity yet</p>
              <p className="text-sm">Subscription and system events will appear here</p>
            </div>
          ) : (
            <div className="relative space-y-0 pl-4 before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-gray-200 before:rounded-full">
              {recentActivity.map((activity, idx) => (
                <div key={activity.id} className="relative pl-6 pb-6 last:pb-0 group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-0 top-1.5 -translate-x-[5px] w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${
                      activity.action === 'created'
                        ? 'bg-green-500'
                        : activity.action === 'renewed'
                          ? 'bg-gray-600'
                          : activity.action === 'cancelled'
                            ? 'bg-red-500'
                            : activity.action === 'expired'
                              ? 'bg-orange-500'
                              : 'bg-gray-400'
                    } group-hover:scale-125 transition-transform duration-300`}
                  ></div>

                  <div className="flex items-start justify-between gap-4 p-3 md:p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-1 p-2 rounded-xl flex items-center justify-center shadow-sm ${getActionColor(activity.action)}`}
                      >
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                          {activity.restaurant?.name || 'Unknown Restaurant'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <span className="capitalize font-medium text-gray-700">
                            {activity.action_label || activity.action}
                          </span>
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
                        <p className="text-sm font-black text-emerald-600 font-mono">
                          +{formatCurrency(activity.amount_paid)}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Distribution */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Staff Distribution
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-orange-50 rounded-xl p-3 md:p-4 text-center">
            <Briefcase size={16} className="mx-auto mb-1 md:mb-2 text-orange-500 md:w-6 md:h-6" />
            <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.staff.managers}</p>
            <p className="text-[10px] md:text-xs text-gray-600">Managers</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 md:p-4 text-center">
            <ClipboardList size={16} className="mx-auto mb-1 md:mb-2 text-gray-600 md:w-6 md:h-6" />
            <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.staff.captains}</p>
            <p className="text-[10px] md:text-xs text-gray-600">Captains</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-2 md:p-4 text-center">
            <ChefHat size={16} className="mx-auto mb-1 md:mb-2 text-orange-500 md:w-6 md:h-6" />
            <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.staff.chefs || 0}</p>
            <p className="text-[10px] md:text-xs text-gray-600">Chefs</p>
          </div>
          <div className="bg-green-50 rounded-xl p-2 md:p-4 text-center">
            <Utensils size={16} className="mx-auto mb-1 md:mb-2 text-green-500 md:w-6 md:h-6" />
            <p className="text-lg md:text-2xl font-bold text-gray-900">
              {stats.staff.waiters || 0}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600">Waiters</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-2 md:p-4 text-center">
            <UserPlus size={16} className="mx-auto mb-1 md:mb-2 text-amber-500 md:w-6 md:h-6" />
            <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.staff.pending}</p>
            <p className="text-[10px] md:text-xs text-gray-600">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
