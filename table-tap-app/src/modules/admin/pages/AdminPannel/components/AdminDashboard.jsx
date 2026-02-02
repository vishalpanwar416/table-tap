import React, { useState, useEffect } from 'react';
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
  DollarSign,
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
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '../../../../shared/supabase';
import { getSubscriptionStats, getUpcomingRenewals, getSubscriptionPlans } from '../../../api/subscriptionService';

const AdminDashboard = ({ restaurants, staff, onTabChange }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    restaurants: { total: 0, active: 0, inactive: 0 },
    staff: { total: 0, connected: 0, pending: 0 },
    subscriptions: { total: 0, active: 0, expired: 0, cancelled: 0, gracePeriod: 0 },
    revenue: { total: 0, monthly: 0, growth: 0 },
    plans: { starter: 0, professional: 0, enterprise: 0 }
  });
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [inquiryStats, setInquiryStats] = useState({ total: 0, pending: 0, contacted: 0, converted: 0 });

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
        captains: staff?.filter(s => s.role === 'captain').length || 0
      };

      // Get subscription stats from API
      const { data: subStats } = await getSubscriptionStats();
      
      // Get upcoming renewals
      const { data: renewals } = await getUpcomingRenewals(7);
      setUpcomingRenewals(renewals || []);

      // Get subscription plans
      const { data: plans } = await getSubscriptionPlans();
      setSubscriptionPlans(plans || []);

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

      // Get recent activity (subscription history)
      const { data: history } = await supabase
        .from('subscription_history')
        .select(`
          *,
          restaurant:restaurants (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentActivity(history || []);

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
          growth: 12.5 // This would come from comparing periods
        },
        plans: subStats?.planCounts || { starter: 0, professional: 0, enterprise: 0 }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
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
      month: 'short',
      year: 'numeric'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return <CheckCircle className="text-green-500" size={16} />;
      case 'cancelled': return <XCircle className="text-red-500" size={16} />;
      case 'renewed': return <RefreshCw className="text-blue-500" size={16} />;
      case 'upgraded': return <TrendingUp className="text-purple-500" size={16} />;
      case 'reactivated': return <Zap className="text-amber-500" size={16} />;
      default: return <Activity className="text-gray-500" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your platform performance</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors self-start"
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Restaurants */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          onClick={() => onTabChange?.('restaurants')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="text-white" size={24} />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              <span>{stats.restaurants.active} active</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.restaurants.total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Restaurants</p>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={12} /> {stats.restaurants.active} Active
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <XCircle size={12} /> {stats.restaurants.inactive} Inactive
            </span>
          </div>
        </div>

        {/* Total Staff */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          onClick={() => onTabChange?.('staff')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="text-white" size={24} />
            </div>
            <div className="flex items-center gap-1 text-blue-600 text-sm font-medium bg-blue-50 px-2 py-1 rounded-full">
              <CheckCircle size={14} />
              <span>{stats.staff.connected} connected</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.staff.total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Staff Members</p>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-blue-600">
              <Users size={12} /> {stats.staff.managers} Managers
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <Clock size={12} /> {stats.staff.pending} Pending
            </span>
          </div>
        </div>

        {/* Subscriptions */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          onClick={() => onTabChange?.('subscriptions')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <CreditCard className="text-white" size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp size={14} />
              <span>{stats.subscriptions.active} active</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.subscriptions.total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Subscriptions</p>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={12} /> {stats.subscriptions.gracePeriod} Grace
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <XCircle size={12} /> {stats.subscriptions.expired} Expired
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <IndianRupee className="text-white" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${stats.revenue.growth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              {stats.revenue.growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{Math.abs(stats.revenue.growth)}%</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue.total)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
          <div className="mt-3 text-xs text-gray-500">
            MRR: {formatCurrency(stats.revenue.monthly)}
          </div>
        </div>
      </div>

      {/* Second Row - Plan Distribution & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-purple-500" />
            Plan Distribution
          </h3>
          <div className="space-y-4">
            {/* Starter Plan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Star size={14} className="text-blue-500" />
                  Starter
                </span>
                <span className="text-sm font-bold text-gray-900">{stats.plans.starter || 0}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                  style={{ width: `${stats.subscriptions.active > 0 ? ((stats.plans.starter || 0) / stats.subscriptions.active * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Professional Plan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Zap size={14} className="text-purple-500" />
                  Professional
                </span>
                <span className="text-sm font-bold text-gray-900">{stats.plans.professional || 0}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                  style={{ width: `${stats.subscriptions.active > 0 ? ((stats.plans.professional || 0) / stats.subscriptions.active * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Enterprise Plan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Crown size={14} className="text-amber-500" />
                  Enterprise
                </span>
                <span className="text-sm font-bold text-gray-900">{stats.plans.enterprise || 0}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                  style={{ width: `${stats.subscriptions.active > 0 ? ((stats.plans.enterprise || 0) / stats.subscriptions.active * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Starter
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div> Pro
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div> Enterprise
            </span>
          </div>
        </div>

        {/* Feature Adoption */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-emerald-500" />
            Feature Adoption
          </h3>
          <div className="space-y-4">
            {/* AI Analytics */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Zap size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI Analytics</p>
                  <p className="text-xs text-gray-500">Smart insights enabled</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-indigo-600">{stats.restaurants.withAI}</p>
                <p className="text-xs text-gray-500">restaurants</p>
              </div>
            </div>

            {/* Aggregator Integration */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Aggregators</p>
                  <p className="text-xs text-gray-500">Swiggy/Zomato enabled</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-orange-600">{stats.restaurants.withAggregators}</p>
                <p className="text-xs text-gray-500">restaurants</p>
              </div>
            </div>

            {/* Staff Connected */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Connected Staff</p>
                  <p className="text-xs text-gray-500">Accounts linked</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">{stats.staff.connected}</p>
                <p className="text-xs text-gray-500">of {stats.staff.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Inquiries */}
        <div 
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
          onClick={() => onTabChange?.('inquiries')}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-pink-500" />
            Lead Inquiries
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-pink-600">{inquiryStats.total}</p>
              <p className="text-xs text-gray-600 mt-1">Total Leads</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{inquiryStats.pending}</p>
              <p className="text-xs text-gray-600 mt-1">Pending</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{inquiryStats.contacted}</p>
              <p className="text-xs text-gray-600 mt-1">Contacted</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{inquiryStats.converted}</p>
              <p className="text-xs text-gray-600 mt-1">Converted</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Conversion Rate</span>
              <span className="font-bold text-emerald-600">
                {inquiryStats.total > 0 ? ((inquiryStats.converted / inquiryStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Upcoming Renewals & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-amber-500" />
              Upcoming Renewals
            </h3>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">
              Next 7 days
            </span>
          </div>
          
          {upcomingRenewals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p>No renewals due in the next 7 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRenewals.slice(0, 5).map((renewal) => (
                <div key={renewal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      renewal.daysUntilExpiry <= 2 ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      <Clock size={18} className={renewal.daysUntilExpiry <= 2 ? 'text-red-600' : 'text-amber-600'} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{renewal.restaurant?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        {renewal.plan_name} • Expires {formatDate(renewal.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    renewal.daysUntilExpiry <= 2 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {renewal.daysUntilExpiry} days
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcomingRenewals.length > 5 && (
            <button 
              onClick={() => onTabChange?.('subscriptions')}
              className="w-full mt-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              View all {upcomingRenewals.length} renewals
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            Recent Activity
          </h3>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity size={40} className="mx-auto mb-3 opacity-30" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.restaurant?.name || 'Unknown Restaurant'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      Subscription {activity.action}
                      {activity.new_plan && ` • ${activity.new_plan}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                  {activity.amount_paid > 0 && (
                    <span className="text-sm font-bold text-emerald-600">
                      +{formatCurrency(activity.amount_paid)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.subscriptions.active}</p>
            <p className="text-purple-200 text-sm">Active Subscriptions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{formatCurrency(stats.revenue.monthly)}</p>
            <p className="text-purple-200 text-sm">Monthly Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.restaurants.active}</p>
            <p className="text-purple-200 text-sm">Active Restaurants</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{((stats.staff.connected / stats.staff.total) * 100 || 0).toFixed(0)}%</p>
            <p className="text-purple-200 text-sm">Staff Onboarded</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
