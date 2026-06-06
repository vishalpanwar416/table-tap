import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../../shared/supabase';

const CentralizedBilling = ({ restaurants }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState({});
  const [plans, setPlans] = useState({});
  const [billingCycles, setBillingCycles] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!restaurants || restaurants.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const restaurantIds = restaurants.map((r) => r.id);

        // Fetch subscriptions, plans and billing cycles in parallel
        const [subsRes, plansRes, cyclesRes] = await Promise.all([
          supabase.from('subscriptions').select('*').in('restaurant_id', restaurantIds),
          supabase.from('subscription_plans').select('*'),
          supabase.from('billing_cycles').select('*'),
        ]);

        if (subsRes.data) {
          const subsMap = {};
          subsRes.data.forEach((s) => {
            subsMap[s.restaurant_id] = s;
          });
          setSubscriptions(subsMap);
        }

        if (plansRes.data) {
          const plansMap = {};
          plansRes.data.forEach((p) => {
            plansMap[p.key] = p;
          });
          setPlans(plansMap);
        }

        if (cyclesRes.data) {
          const cyclesMap = {};
          cyclesRes.data.forEach((c) => {
            cyclesMap[c.key] = c;
          });
          setBillingCycles(cyclesMap);
        }
      } catch (err) {
        console.error('Error fetching billing data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [restaurants]);

  const getStatusConfig = (sub) => {
    if (!sub)
      return { label: 'No Active Plan', color: 'bg-slate-100 text-slate-600', icon: AlertCircle };

    switch (sub.status) {
      case 'active':
        return { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
      case 'grace_period':
        return { label: 'Grace Period', color: 'bg-amber-100 text-amber-700', icon: Clock };
      case 'expired':
        return { label: 'Expired', color: 'bg-red-100 text-red-700', icon: AlertCircle };
      default:
        return { label: sub.status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const sub = subscriptions[r.id];
    const status = sub?.status || 'none';

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'urgent')
      return matchesSearch && (status === 'expired' || status === 'grace_period');
    return matchesSearch && status === filterStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Consolidating billing records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Total Monthly Spend
          </p>
          <h3 className="text-2xl font-black text-gray-900">
            {formatCurrency(
              Object.values(subscriptions).reduce((acc, sub) => acc + (sub.plan_price || 0), 0),
            )}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Active Subscriptions
          </p>
          <h3 className="text-2xl font-black text-green-600">
            {Object.values(subscriptions).filter((s) => s.status === 'active').length} /{' '}
            {restaurants.length}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Needs Attention
          </p>
          <h3 className="text-2xl font-black text-orange-600">
            {
              Object.values(subscriptions).filter(
                (s) => s.status === 'expired' || s.status === 'grace_period',
              ).length
            }
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Find restaurant..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['all', 'active', 'urgent', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status === 'urgent' ? 'Needs Attention' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Restaurant
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Current Plan
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Expires On
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRestaurants.map((restaurant) => {
              const sub = subscriptions[restaurant.id];
              const plan = sub ? plans[sub.plan_name] : null;
              const status = getStatusConfig(sub);
              const StatusIcon = status.icon;

              return (
                <tr key={restaurant.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                        {restaurant.logo_url ? (
                          <img src={restaurant.logo_url} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm uppercase tracking-tight">
                          {restaurant.name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {restaurant.address || 'No address'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {plan ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-orange-500" />
                          <span className="font-bold text-gray-800 text-xs uppercase">
                            {plan.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">
                          {formatCurrency(sub.total_amount)} / {sub.billing_cycle}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium italic">
                        No subscription
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status.color}`}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {sub ? (
                      <div>
                        <p className="text-xs font-bold text-gray-700">
                          {new Date(sub.end_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Calendar size={12} className="text-gray-400" />
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                            {Math.ceil(
                              (new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24),
                            )}{' '}
                            Days Left
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/restaurant/${restaurant.id}/dashboard?tab=billing`)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-black rounded-xl text-[10px] hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all uppercase tracking-wider flex items-center justify-center gap-2 ml-auto"
                    >
                      Manage Billing <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredRestaurants.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="text-gray-300" size={32} />
            </div>
            <h4 className="text-gray-900 font-bold mb-1">No restaurants found</h4>
            <p className="text-gray-500 text-sm">Try adjusting your filters or search term</p>
          </div>
        )}
      </div>

      <div className="bg-orange-600 rounded-2xl p-8 text-white shadow-xl shadow-orange-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-2">Bulk Renewal Notice</h3>
          <p className="text-orange-100 text-sm max-w-md">
            You have {Object.values(subscriptions).filter((s) => s.status !== 'active').length}{' '}
            restaurants with inactive or expiring subscriptions. Manage them individually or contact
            support for corporate enterprise billing.
          </p>
        </div>
        <button className="relative z-10 px-8 py-4 bg-white text-orange-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-3 active:scale-95">
          Contact Billing Support <ExternalLink size={20} />
        </button>
      </div>
    </div>
  );
};

export default CentralizedBilling;
