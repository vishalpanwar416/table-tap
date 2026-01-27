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
  Brain
} from 'lucide-react';
import {
  getSubscriptionPlans,
  getRestaurantSubscriptions,
  assignSubscriptionToRestaurant,
  updateRestaurantSubscription,
  cancelRestaurantSubscription,
  getSubscriptionStats,
  getUpcomingRenewals
} from '../../../api/subscriptionService';
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

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);

  // Form states
  const [assignForm, setAssignForm] = useState({
    restaurant_id: '',
    plan_id: '',
    payment_method: 'manual',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        plansResponse,
        subscriptionsResponse,
        restaurantsResponse,
        statsResponse,
        renewalsResponse
      ] = await Promise.all([
        getSubscriptionPlans(),
        getRestaurantSubscriptions(),
        getAllRestaurants(),
        getSubscriptionStats(),
        getUpcomingRenewals()
      ]);

      if (plansResponse.error) throw new Error(plansResponse.error);
      if (subscriptionsResponse.error) throw new Error(subscriptionsResponse.error);
      if (statsResponse.error) throw new Error(statsResponse.error);

      setPlans(plansResponse.data || []);
      setSubscriptions(subscriptionsResponse.data || []);
      setRestaurants(restaurantsResponse.data || []);
      setStats(statsResponse.data);
      setUpcomingRenewals(renewalsResponse.data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const subscriptionData = {
        ...assignForm,
        status: 'active',
        payment_status: 'paid'
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
      fetchData();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const response = await cancelRestaurantSubscription(subscriptionId);
      if (response.error) throw new Error(response.error);
      fetchData();
    } catch (error) {
      setError(error.message);
    }
  };

  const resetAssignForm = () => {
    setAssignForm({
      restaurant_id: '',
      plan_id: '',
      payment_method: 'manual',
      notes: ''
    });
  };

  const openAssignModal = (subscription = null) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setAssignForm({
        restaurant_id: subscription.restaurant_id,
        plan_id: subscription.plan_id,
        payment_method: subscription.payment_method || 'manual',
        notes: subscription.notes || ''
      });
    } else {
      setEditingSubscription(null);
      resetAssignForm();
    }
    setShowAssignModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
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
          <p className="text-gray-600">Manage restaurant subscriptions using existing data</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openAssignModal()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            Assign Subscription
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'plans', label: 'Subscription Plans', icon: Package },
            { id: 'subscriptions', label: 'Restaurant Subscriptions', icon: Building2 },
            { id: 'renewals', label: 'Active Restaurants', icon: Calendar }
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
                  <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
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
                  <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Premium (AI) Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.premiumSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Subscriptions</h3>
            </div>
            <div className="p-6">
              {subscriptions.slice(0, 5).map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{subscription.restaurant?.name}</p>
                      <p className="text-sm text-gray-600">{subscription.plan?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status}
                    </span>
                    <span className="text-sm text-gray-600">₹{subscription.amount_paid}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {plan.ai_features_enabled && (
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Brain className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-sm text-gray-600">per month</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      Up to {plan.max_staff_members} staff members
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      {plan.max_orders_per_month.toLocaleString()} orders/month
                    </div>
                    {plan.ai_features_enabled && (
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Zap className="w-4 h-4" />
                        AI Features Enabled
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.restaurant?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscription.restaurant?.contact_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subscription.plan?.name}</div>
                      <div className="text-sm text-gray-500">₹{subscription.plan?.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        {getStatusIcon(subscription.status)}
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{subscription.amount_paid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(subscription.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAssignModal(subscription)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {subscription.status === 'active' && (
                          <button
                            onClick={() => handleCancelSubscription(subscription.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Renewals Tab */}
      {activeTab === 'renewals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Active Restaurants</h3>
            </div>
            <div className="p-6">
              {upcomingRenewals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active restaurants</p>
              ) : (
                <div className="space-y-4">
                  {upcomingRenewals.map((renewal) => (
                    <div key={renewal.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Building2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{renewal.restaurant?.name}</p>
                          <p className="text-sm text-gray-600">{renewal.plan?.name} - ₹{renewal.plan?.price}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Active since: {new Date(renewal.restaurant?.created_at || renewal.start_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {renewal.plan?.ai_features_enabled ? 'Premium Plan' : 'Basic Plan'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Subscription Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSubscription ? 'Edit Subscription' : 'Assign Subscription'}
            </h2>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                <select
                  value={assignForm.restaurant_id}
                  onChange={(e) => setAssignForm({ ...assignForm, restaurant_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map((restaurant) => (
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
                  <option value="">Select Plan</option>
                  {plans.filter(plan => plan.is_active).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price} {plan.ai_features_enabled ? '(AI Enabled)' : ''}
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
                  <option value="online">Online</option>
                  <option value="cash">Cash</option>
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
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  {editingSubscription ? 'Update Subscription' : 'Assign Subscription'}
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