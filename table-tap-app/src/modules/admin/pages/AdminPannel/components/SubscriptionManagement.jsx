import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Building2,
  Package,
  Brain,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  CalendarClock,
  ChevronDown
} from 'lucide-react';
import {
  getSubscriptionPlans,
  getBillingCycles,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getRestaurantSubscriptions,
  assignSubscriptionToRestaurant,
  updateRestaurantSubscription,
  cancelRestaurantSubscription,
  reactivateSubscription,
  getSubscriptionStats,
  getUpcomingRenewals,
  processExpiredSubscriptions
} from '../../../../admin/api/subscriptionService';
import { getAllRestaurants } from '../admin_service';

const SubscriptionManagementV2 = () => {
  // DEBUG CHECK
  useEffect(() => {
    console.log("SubscriptionManagementV2 Component Loaded - ULTRA FORCE");
  }, []);

  const [activeTab, setActiveTab] = useState('overview');
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [billingCycles, setBillingCycles] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Form states
  const [assignForm, setAssignForm] = useState({
    restaurant_id: '',
    plan_id: '',
    billing_cycle: 'monthly',
    payment_method: 'manual',
    notes: ''
  });

  const [planForm, setPlanForm] = useState({
    key: '',
    name: '',
    description: '',
    base_price: 0,
    features: [],
    color: 'from-blue-500 to-cyan-500',
    icon: 'Zap',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        plansResponse,
        cyclesResponse,
        subscriptionsResponse,
        restaurantsResponse,
        statsResponse,
        renewalsResponse
      ] = await Promise.all([
        getSubscriptionPlans(),
        getBillingCycles(),
        getRestaurantSubscriptions(),
        getAllRestaurants(),
        getSubscriptionStats(),
        getUpcomingRenewals(14)
      ]);

      if (plansResponse.error) throw new Error(plansResponse.error);
      if (subscriptionsResponse.error) throw new Error(subscriptionsResponse.error);
      if (statsResponse.error) throw new Error(statsResponse.error);

      setPlans(plansResponse.data || []);
      setBillingCycles(cyclesResponse.data || []);
      setSubscriptions(subscriptionsResponse.data || []);
      setRestaurants(restaurantsResponse.data || []);
      setStats(statsResponse.data);
      setUpcomingRenewals(renewalsResponse.data || []);

      if (plansResponse.data?.length > 0 && !assignForm.plan_id) {
        setAssignForm(prev => ({ ...prev, plan_id: plansResponse.data[0].key }));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExpired = async () => {
    try {
      setLoading(true);
      const response = await processExpiredSubscriptions();
      if (response.error) throw new Error(response.error);
      setSuccess(`Processed ${response.data?.processedCount || 0} expired subscriptions`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessingId('assign');
      const subscriptionData = {
        ...assignForm,
        status: 'active'
      };

      let response;
      if (editingSubscription) {
        response = await updateRestaurantSubscription(editingSubscription.id, subscriptionData);
      } else {
        response = await assignSubscriptionToRestaurant(subscriptionData);
      }

      if (response.error) throw new Error(response.error);

      setShowAssignModal(false);
      setEditingSubscription(null);
      resetAssignForm();
      setSuccess(editingSubscription ? 'Subscription updated!' : 'Subscription assigned!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelSubscription = async (subscription) => {
    const reason = window.prompt('Enter cancellation reason (optional):');
    if (reason === null) return;

    try {
      setProcessingId(subscription.id);
      const response = await cancelRestaurantSubscription(subscription.id, reason);
      if (response.error) throw new Error(response.error);
      setSuccess(`Subscription for "${subscription.restaurant?.name}" has been cancelled`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReactivate = async (subscription) => {
    if (!window.confirm(`Reactivate subscription for "${subscription.restaurant?.name}"?`)) return;

    try {
      setProcessingId(subscription.id);
      const response = await reactivateSubscription(subscription.id);
      if (response.error) throw new Error(response.error);
      setSuccess(`Subscription for "${subscription.restaurant?.name}" has been reactivated`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const resetAssignForm = () => {
    setAssignForm({
      restaurant_id: '',
      plan_id: 'professional',
      billing_cycle: 'monthly',
      payment_method: 'manual',
      notes: ''
    });
  };

  const openPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      // Ensure features is an array and exclude potentially problematic fields like nested objects
      setPlanForm({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        // Ensure other fields have defaults if missing
        color: plan.color || 'from-blue-500 to-cyan-500',
        icon: plan.icon || 'Zap',
        is_public: plan.is_public !== false // Default to true if undefined
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        key: '',
        name: '',
        description: '',
        base_price: 0,
        features: [],
        color: 'from-blue-500 to-cyan-500',
        icon: 'Zap',
        is_active: true,
        is_public: true
      });
    }
    setShowPlanModal(true);
  };

  const openAssignModal = (subscription = null) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setAssignForm({
        restaurant_id: subscription.restaurant_id,
        plan_id: subscription.plan_name,
        billing_cycle: subscription.billing_cycle,
        payment_method: subscription.payment_method || 'manual',
        notes: ''
      });
    } else {
      setEditingSubscription(null);
      resetAssignForm();
      // Pre-select first plan if available
      if (plans.length > 0) {
        setAssignForm(prev => ({ ...prev, plan_id: plans[0].key }));
      }
    }
    setShowAssignModal(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessingId('plan');
      let response;

      // Extract only the fields we want to save/update
      const payload = {
        key: planForm.key,
        name: planForm.name,
        description: planForm.description,
        base_price: parseInt(planForm.base_price),
        features: planForm.features,
        color: planForm.color,
        icon: planForm.icon,
        is_active: planForm.is_active,
        is_public: planForm.is_public
      };

      if (editingPlan) {
        // Remove key from update payload if it shouldn't be changed
        // const { key, ...updatePayload } = payload;
        response = await updateSubscriptionPlan(editingPlan.id, payload);
      } else {
        response = await createSubscriptionPlan(payload);
      }

      if (response.error) throw new Error(response.error);

      setShowPlanModal(false);
      setSuccess(editingPlan ? 'Plan updated!' : 'Plan created!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this plan?')) return;
    try {
      const response = await deleteSubscriptionPlan(id);
      if (response.error) throw new Error(response.error);
      setSuccess('Plan deactivated');
      fetchData();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!window.confirm('This will create default plans (Starter, Professional, Enterprise). Continue?')) return;
    setLoading(true);
    try {
      const defaultPlans = [
        {
          key: 'starter',
          name: 'Starter',
          description: 'Perfect for cafes and small restaurants just getting started.',
          base_price: 999,
          features: ["Unlimited Tables", "QR Menu & Ordering", "Order Management", "Basic Analytics", "Email Support"],
          color: 'from-blue-500 to-cyan-500',
          icon: 'Zap',
          is_active: true,
          is_public: true
        },
        {
          key: 'professional',
          name: 'Professional',
          description: 'For growing restaurants that want the complete experience.',
          base_price: 1999,
          features: ["Unlimited Tables", "Swiggy & Zomato Sync", "Staff Management", "Inventory Tracking", "AI Analytics", "Offers & Promotions", "Priority Support"],
          color: 'from-purple-500 to-pink-500',
          icon: 'Sparkles',
          is_active: true,
          is_public: true
        },
        {
          key: 'enterprise',
          name: 'Enterprise',
          description: 'Custom solutions for restaurant chains and franchises.',
          base_price: 0,
          features: ["Multi-Location Support", "Unified Analytics Dashboard", "Cross-Restaurant Insights", "Custom Integrations", "Dedicated Account Manager"],
          color: 'from-slate-700 to-slate-900',
          icon: 'Building2',
          is_active: true,
          is_public: true
        }
      ];

      for (const plan of defaultPlans) {
        const existing = plans.find(p => p.key === plan.key);
        if (!existing) {
          await createSubscriptionPlan(plan);
        }
      }
      setSuccess('Default plans initialized successfully');
      await fetchData();
    } catch (err) {
      setError('Failed to initialize plans: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get restaurants without active subscription
  const availableRestaurants = restaurants.filter(r =>
    !subscriptions.some(s => s.restaurant_id === r.id && ['active', 'grace_period'].includes(s.status))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'grace_period': return 'text-orange-600 bg-orange-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'grace_period': return <AlertTriangle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Removed as per request */}

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Tabs */}
      {/* Tabs - Modern Pills */}
      <div className="flex overflow-x-auto pb-2 no-scrollbar">
        <nav className="flex space-x-2 p-1 bg-gray-100/50 rounded-2xl">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'subscriptions', label: 'All Subscriptions', icon: Building2 },
            { id: 'expiring', label: 'Expiring Soon', icon: AlertTriangle, count: upcomingRenewals.length },
            { id: 'plans', label: 'Plans', icon: Package }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                  ? 'bg-black text-white shadow-lg shadow-gray-900/20'
                  : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                  }`}
              >
                <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 text-[10px] rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Quick Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Dashboard Overview</h3>
              <p className="text-sm text-gray-500">Real-time subscription metrics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleProcessExpired}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-200 text-orange-700 rounded-xl hover:bg-orange-50 transition-all shadow-sm text-sm font-medium"
              >
                <CalendarClock className="w-4 h-4" />
                Process Expirations
              </button>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button
                onClick={() => openAssignModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 text-sm font-medium"
              >
                <Package className="w-4 h-4" />
                Assign Subscription
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Subscriptions</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grace Period</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.gracePeriodSubscriptions || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Revenue</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">₹{(stats.monthlyRecurringRevenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const count = stats.planCounts?.[plan.key] || 0;
              // Map icon name to component or fallback
              const Icon = plan.key === 'starter' ? Zap : plan.key === 'professional' ? Brain : Building2;
              const colorClass = plan.key === 'starter' ? 'text-blue-600' : plan.key === 'professional' ? 'text-purple-600' : 'text-indigo-600';
              const iconColor = plan.key === 'starter' ? 'text-blue-500' : plan.key === 'professional' ? 'text-purple-500' : 'text-indigo-500';

              return (
                <div key={plan.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 capitalize text-lg">{plan.name}</h3>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                  </div>
                  <p className={`text-4xl font-black ${colorClass} mb-1`}>{count}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    active users
                  </p>
                  <div className="mt-4 pt-4 border-t border-dashed">
                    <p className="text-sm font-medium text-gray-500">
                      ₹{plan.base_price?.toLocaleString()}<span className="text-xs">/mo</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expiring Soon Alert */}
          {upcomingRenewals.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-semibold text-orange-800">Subscriptions Expiring Soon</h3>
                  <p className="text-orange-700 text-sm">
                    {upcomingRenewals.length} subscription(s) will expire within 14 days
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('expiring')}
                  className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                >
                  View All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {/* Subscriptions Tab - Premium Table */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  <th className="px-8 py-4">Restaurant</th>
                  <th className="px-6 py-4">Plan & Cycle</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-200" />
                      <p>No subscriptions found. Assign one to get started.</p>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((subscription) => {
                    const daysLeft = getDaysRemaining(subscription.end_date);
                    return (
                      <tr key={subscription.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200 text-sm">
                              {subscription.restaurant?.name?.charAt(0) || 'R'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 leading-tight">
                                {subscription.restaurant?.name || 'Unknown Restaurant'}
                              </div>
                              <div className="text-xs text-gray-400 font-medium mt-0.5">
                                {subscription.restaurant?.contact_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
                              {subscription.plan_name}
                            </span>
                            <span className="text-xs text-gray-400 font-medium ml-1 capitalize">
                              {subscription.billing_cycle}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit ${getStatusColor(subscription.status)}`}>
                              {getStatusIcon(subscription.status)}
                              <span className="capitalize">{subscription.status.replace('_', ' ')}</span>
                            </span>
                            {subscription.status === 'active' && daysLeft !== null && daysLeft <= 14 && (
                              <span className="text-[10px] font-bold text-orange-600 pl-1 animation-pulse">
                                Expires in {daysLeft} days
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-medium text-gray-900">{formatDate(subscription.start_date)}</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">to {formatDate(subscription.end_date)}</div>
                        </td>
                        <td className="px-6 py-5 text-sm font-black text-gray-900 font-mono">
                          ₹{subscription.total_amount?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openAssignModal(subscription)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Subscription"
                              disabled={processingId === subscription.id}
                            >
                              <Edit size={16} />
                            </button>
                            {subscription.status === 'active' && (
                              <button
                                onClick={() => handleCancelSubscription(subscription)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Cancel Subscription"
                                disabled={processingId === subscription.id}
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            {['cancelled', 'expired'].includes(subscription.status) && (
                              <button
                                onClick={() => handleReactivate(subscription)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Reactivate Subscription"
                                disabled={processingId === subscription.id}
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiring Soon Tab */}
      {activeTab === 'expiring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {upcomingRenewals.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">All Good!</h3>
              <p className="text-gray-500 mt-2">No subscriptions expiring in the next 14 days</p>
            </div>
          ) : (
            upcomingRenewals.map((sub) => (
              <div key={sub.id} className="bg-white rounded-3xl shadow-sm border border-orange-200 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${sub.daysUntilExpiry <= 3 ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {sub.daysUntilExpiry <= 0 ? 'Expired' : `${sub.daysUntilExpiry} days left`}
                  </p>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${sub.daysUntilExpiry <= 3 ? 'bg-red-50' : 'bg-orange-50'}`}>
                    <AlertTriangle className={`w-6 h-6 ${sub.daysUntilExpiry <= 3 ? 'text-red-500' : 'text-orange-500'}`} />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{sub.restaurant?.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{sub.plan?.name}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-center mb-4 text-xs font-medium text-gray-500">
                    <span>Expires: {formatDate(sub.end_date)}</span>
                    <span className="font-bold text-gray-900">₹{sub.total_amount?.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => openAssignModal(sub)}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:to-red-600 transition-all"
                  >
                    Renew Subscription
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Plan Stats */}
          {/* Plan Stats */}
          {/* Plan Stats - One Line Scrollable */}
          <div className="flex flex-row gap-4 overflow-x-auto pb-4 items-stretch no-scrollbar">
            <div className="bg-white p-5 rounded-xl border shadow-sm min-w-[200px] flex-shrink-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Plans</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{plans.length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm min-w-[200px] flex-shrink-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Active Plans</p>
              <p className="text-3xl font-black text-green-700 mt-2">{plans.filter(p => p.is_active).length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm min-w-[200px] flex-shrink-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inactive Plans</p>
              <p className="text-3xl font-black text-gray-400 mt-2">{plans.filter(p => !p.is_active).length}</p>
            </div>

            {/* Plan Wise Subscription Counts */}
            {plans.map(plan => (
              <div key={`stat-${plan.id}`} className="bg-white p-5 rounded-xl border shadow-sm min-w-[200px] flex-shrink-0 flex flex-col justify-center">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider truncate" title={`${plan.name} Users`}>
                  {plan.name} Users
                </p>
                <p className="text-3xl font-black text-indigo-700 mt-2">
                  {stats?.planCounts?.[plan.key] || 0}
                </p>
              </div>
            ))}

            {/* Add Plan Action Card */}
            <button
              onClick={() => openPlanModal()}
              className="bg-white p-5 rounded-xl border-dashed border-2 border-blue-300 shadow-sm min-w-[200px] flex-shrink-0 flex flex-col items-center justify-center hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors mb-2">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Add New Plan (+)</p>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 flex flex-col items-center gap-4">
                <p className="text-gray-500 font-medium">No subscription plans found in the system.</p>
                <button
                  onClick={handleInitializeDefaults}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-500/20"
                >
                  Initialize Default Plans
                </button>
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className={`group relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 ${!plan.is_active ? 'opacity-75 grayscale' : ''}`}>
                  <div className={`h-2.5 bg-gradient-to-r ${plan.color || 'from-gray-400 to-gray-500'}`} />

                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openPlanModal(plan)} className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-full shadow-sm border border-gray-100">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-white text-red-600 hover:bg-red-50 rounded-full shadow-sm border border-gray-100">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="p-7 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                      <p className="text-gray-500 text-sm mt-2 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="mb-6 pb-6 border-b border-gray-50">
                      <span className="text-4xl font-black text-gray-900 tracking-tight">₹{plan.base_price?.toLocaleString()}</span>
                      <span className="text-gray-400 font-bold text-sm ml-1">/month</span>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-between items-center pt-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {plan.is_active ? 'Active Plan' : 'Inactive'}
                      </span>
                      <code className="text-[10px] font-mono text-gray-300 bg-gray-50 px-2 py-1 rounded">{plan.key}</code>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
              </h2>
              <button onClick={() => setShowPlanModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handlePlanSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Plan Key (Unique)</label>
                  <input
                    value={planForm.key}
                    onChange={(e) => setPlanForm({ ...planForm, key: e.target.value.toLowerCase() })}
                    className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. starter"
                    required
                    disabled={!!editingPlan}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Plan Name</label>
                  <input
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Starter Plan"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Base Price (Monthly)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      value={planForm.base_price}
                      onChange={(e) => setPlanForm({ ...planForm, base_price: parseInt(e.target.value) })}
                      className="w-full border rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Icon Type</label>
                  <select
                    value={planForm.icon}
                    onChange={(e) => setPlanForm({ ...planForm, icon: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Zap">Zap (Lightning)</option>
                    <option value="Crown">Crown</option>
                    <option value="Stars">Stars</option>
                    <option value="Shield">Shield</option>
                    <option value="Building2">Building</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Features (Comma separated)</label>
                <textarea
                  value={planForm.features.join(', ')}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value.split(',').map(f => f.trim()) })}
                  className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="Unlimited Tables, QR Menu, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gradient Color (Tailwind)</label>
                <input
                  value={planForm.color}
                  onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="from-blue-500 to-cyan-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={planForm.is_active}
                    onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-bold text-gray-700">Active (Usable)</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={planForm.is_public}
                    onChange={(e) => setPlanForm({ ...planForm, is_public: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_public" className="text-sm font-bold text-gray-700">Public (Show on Website)</label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  disabled={processingId === 'plan'}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {processingId === 'plan' ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Subscription Modal */}
      {/* Assign Subscription Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSubscription ? 'Update Subscription' : 'Assign Subscription'}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Select Restaurant
                </label>
                <div className="relative">
                  <select
                    value={assignForm.restaurant_id}
                    onChange={(e) => setAssignForm({ ...assignForm, restaurant_id: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    required
                    disabled={!!editingSubscription}
                  >
                    <option value="">Choose a restaurant...</option>
                    {(editingSubscription ? restaurants : availableRestaurants).map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Subscription Plan
                </label>
                <div className="relative">
                  <select
                    value={assignForm.plan_id}
                    onChange={(e) => setAssignForm({ ...assignForm, plan_id: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    required
                  >
                    <option value="">Select a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.key}>
                        {plan.name} — ₹{plan.base_price?.toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Billing Cycle
                  </label>
                  <div className="relative">
                    <select
                      value={assignForm.billing_cycle}
                      onChange={(e) => setAssignForm({ ...assignForm, billing_cycle: e.target.value })}
                      className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm"
                    >
                      {billingCycles.map(cycle => (
                        <option key={cycle.id} value={cycle.key}>
                          {cycle.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      value={assignForm.payment_method}
                      onChange={(e) => setAssignForm({ ...assignForm, payment_method: e.target.value })}
                      className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm"
                    >
                      <option value="manual">Manual Entry</option>
                      <option value="razorpay">Razorpay</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                  placeholder="Payment details, transaction ID, or other remarks..."
                />
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-transparent mt-2">
                <button
                  type="submit"
                  disabled={processingId === 'assign'}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === 'assign' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{editingSubscription ? 'Update Subscription' : 'Assign Plan'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagementV2;