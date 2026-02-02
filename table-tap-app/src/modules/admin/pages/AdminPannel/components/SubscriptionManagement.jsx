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
  CalendarClock
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

const SubscriptionManagement = () => {
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600">Manage restaurant subscriptions and billing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleProcessExpired}
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            title="Check for expired subscriptions"
          >
            <CalendarClock className="w-4 h-4" />
            Process Expirations
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => openPlanModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
          <button
            onClick={() => openAssignModal()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            Assign Subscription
          </button>
        </div>
      </div>

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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'subscriptions', label: 'All Subscriptions', icon: Building2 },
            { id: 'expiring', label: 'Expiring Soon', icon: AlertTriangle, count: upcomingRenewals.length },
            { id: 'plans', label: 'Plans', icon: Package }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Grace Period</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.gracePeriodSubscriptions || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.monthlyRecurringRevenue || 0).toLocaleString()}</p>
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
                <div key={plan.id} className="bg-white p-6 rounded-lg shadow border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 capitalize">{plan.name}</h3>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <p className={`text-3xl font-bold ${colorClass}`}>{count}</p>
                  <p className="text-sm text-gray-500">
                    ₹{plan.base_price?.toLocaleString()}/month each
                  </p>
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
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No subscriptions found. Assign subscriptions to restaurants to get started.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((subscription) => {
                    const daysLeft = getDaysRemaining(subscription.end_date);
                    return (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.restaurant?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {subscription.restaurant?.contact_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {subscription.plan_name}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {subscription.billing_cycle}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                            {getStatusIcon(subscription.status)}
                            {subscription.status.replace('_', ' ')}
                          </span>
                          {subscription.status === 'active' && daysLeft !== null && daysLeft <= 14 && (
                            <p className="text-xs text-orange-600 mt-1">
                              Expires in {daysLeft} days
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900">{formatDate(subscription.start_date)}</div>
                          <div className="text-gray-500">to {formatDate(subscription.end_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{subscription.total_amount?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openAssignModal(subscription)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                              disabled={processingId === subscription.id}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {subscription.status === 'active' && (
                              <button
                                onClick={() => handleCancelSubscription(subscription)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel"
                                disabled={processingId === subscription.id}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {['cancelled', 'expired'].includes(subscription.status) && (
                              <button
                                onClick={() => handleReactivate(subscription)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Reactivate"
                                disabled={processingId === subscription.id}
                              >
                                <RotateCcw className="w-4 h-4" />
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
        <div className="space-y-4">
          {upcomingRenewals.length === 0 ? (
            <div className="bg-white rounded-lg shadow border p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">All Good!</h3>
              <p className="text-gray-500">No subscriptions expiring in the next 14 days</p>
            </div>
          ) : (
            upcomingRenewals.map((sub) => (
              <div key={sub.id} className="bg-white rounded-lg shadow border p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${sub.daysUntilExpiry <= 3 ? 'bg-red-100' : 'bg-orange-100'}`}>
                    <AlertTriangle className={`w-6 h-6 ${sub.daysUntilExpiry <= 3 ? 'text-red-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{sub.restaurant?.name}</h3>
                    <p className="text-sm text-gray-500">{sub.plan?.name} - ₹{sub.total_amount?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${sub.daysUntilExpiry <= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                    {sub.daysUntilExpiry <= 0 ? 'Expired!' : `${sub.daysUntilExpiry} days left`}
                  </p>
                  <p className="text-sm text-gray-500">Expires {formatDate(sub.end_date)}</p>
                </div>
                <button
                  onClick={() => openAssignModal(sub)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Renew
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col ${!plan.is_active ? 'opacity-50 grayscale' : ''}`}>
              <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openPlanModal(plan)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-black text-gray-900">₹{plan.base_price?.toLocaleString()}</span>
                  <span className="text-gray-500 font-medium">/month</span>
                </div>

                <ul className="space-y-3">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
                <code className="text-[10px] font-mono text-gray-400">{plan.key}</code>
              </div>
            </div>
          ))}
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
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSubscription ? 'Update Subscription' : 'Assign Subscription'}
            </h2>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                <select
                  value={assignForm.restaurant_id}
                  onChange={(e) => setAssignForm({ ...assignForm, restaurant_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                  disabled={!!editingSubscription}
                >
                  <option value="">Select Restaurant</option>
                  {(editingSubscription ? restaurants : availableRestaurants).map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <select
                  value={assignForm.plan_id}
                  onChange={(e) => setAssignForm({ ...assignForm, plan_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.key}>
                      {plan.name} - ₹{plan.base_price}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                <select
                  value={assignForm.billing_cycle}
                  onChange={(e) => setAssignForm({ ...assignForm, billing_cycle: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {billingCycles.map(cycle => (
                    <option key={cycle.id} value={cycle.key}>
                      {cycle.label} {cycle.discount_percentage > 0 ? `(${cycle.discount_percentage}% discount)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  value={assignForm.payment_method}
                  onChange={(e) => setAssignForm({ ...assignForm, payment_method: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="manual">Manual</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={processingId === 'assign'}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {processingId === 'assign' ? 'Processing...' : (editingSubscription ? 'Update' : 'Assign')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
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

export default SubscriptionManagement;