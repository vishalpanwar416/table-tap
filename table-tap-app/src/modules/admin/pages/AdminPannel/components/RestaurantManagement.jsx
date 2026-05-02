import React, { useState, useEffect } from 'react';
import { Building2, Plus, List, Grid } from 'lucide-react';
import RestaurantCard from './RestaurantCard';
import RestaurantListView from './RestaurantListView';
import RestaurantGrid from './RestaurantGrid';
import { supabase } from '../../../../shared/supabase';

const RestaurantManagement = ({
  restaurants,
  total,
  loading,
  onAddRestaurant,
  onToggleStatus,
  onToggleAI,
  onToggleAggregators,
  onToggleOnlineBill,
  onEdit,
  onDelete,
  onClick,
  onLoadMore
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [planCounts, setPlanCounts] = useState({});
  const [availablePlans, setAvailablePlans] = useState([]);

  // Fetch plan counts from subscriptions
  useEffect(() => {
    const fetchPlanCounts = async () => {
      try {
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('plan_name, status')
          .in('status', ['active', 'grace_period']);

        if (subscriptions) {
          const counts = {};
          subscriptions.forEach(s => {
            counts[s.plan_name] = (counts[s.plan_name] || 0) + 1;
          });
          setPlanCounts(counts);
        }

        // Also fetch the list of available plans
        const { data: plansList } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('base_price', { ascending: true });

        if (plansList) {
          setAvailablePlans(plansList);
        }
      } catch (error) {
        console.error('Error fetching plan counts:', error);
      }
    };
    fetchPlanCounts();
  }, [restaurants]);

  // Calculate stats
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.is_active).length,
    inactive: restaurants.filter(r => !r.is_active).length,
    totalStaff: restaurants.reduce((sum, r) => sum + (r.staff_count || 0), 0),
    aiEnabled: restaurants.filter(r => r.ai_enabled).length,
    aiDisabled: restaurants.filter(r => !r.ai_enabled).length,
    aggregatorsEnabled: restaurants.filter(r => r.aggregators_enabled).length,
    newThisMonth: restaurants.filter(r => {
      const createdDate = new Date(r.created_at);
      return createdDate >= thirtyDaysAgo;
    }).length,
    newThisWeek: restaurants.filter(r => {
      const createdDate = new Date(r.created_at);
      return createdDate >= sevenDaysAgo;
    }).length,
    recentlyUpdated: restaurants.filter(r => {
      const updatedDate = new Date(r.updated_at || r.created_at);
      return updatedDate >= sevenDaysAgo;
    }).length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end items-center">
          <button
            onClick={onAddRestaurant}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-spartan"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium font-spartan">Add Restaurant</span>
          </button>
        </div>

        {/* Loading Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 mx-auto w-12"></div>
              <div className="h-3 bg-gray-200 rounded mx-auto w-16"></div>
            </div>
          ))}
        </div>

        {/* Loading Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-4">


      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
        {/* Total */}
        <div className="text-center p-2 md:p-4 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200">
          <div className="text-lg md:text-2xl font-bold text-gray-900 font-spartan">{stats.total}</div>
          <div className="text-xs text-gray-600 font-spartan">Total</div>
        </div>

        {/* Active */}
        <div className="text-center p-2 md:p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
          <div className="text-lg md:text-2xl font-bold text-green-700 font-spartan">{stats.active}</div>
          <div className="text-xs text-green-600 font-spartan">Active</div>
        </div>

        {/* Inactive */}
        <div className="text-center p-2 md:p-4 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl border border-red-200">
          <div className="text-lg md:text-2xl font-bold text-red-600 font-spartan">{stats.inactive}</div>
          <div className="text-xs text-red-500 font-spartan">Inactive</div>
        </div>

        {/* Dynamic Plans */}
        {availablePlans.slice(0, 3).map((plan, idx) => {
          const colors = [
            'from-blue-50 to-sky-100 border-blue-200 text-blue-700 text-blue-600',
            'from-purple-50 to-violet-100 border-purple-200 text-purple-700 text-purple-600',
            'from-amber-50 to-yellow-100 border-amber-200 text-amber-700 text-amber-600'
          ];
          const [bg, border, text, subtext] = colors[idx % colors.length].split(' border-');
          const [borderClass, textClasses] = border.split(' text-');
          const [primaryText, secondaryText] = textClasses.split(' ');

          return (
            <div key={plan.key} className={`text-center p-2 md:p-4 bg-gradient-to-br ${bg} rounded-xl border border-${borderClass}`}>
              <div className={`text-lg md:text-2xl font-bold ${primaryText} font-spartan`}>
                {planCounts[plan.key] || 0}
              </div>
              <div className={`text-xs ${secondaryText} font-spartan`}>{plan.name}</div>
            </div>
          );
        })}

        {/* Add Restaurant Action Card - Restored */}
        <button
          onClick={onAddRestaurant}
          className="col-span-3 sm:col-span-1 bg-white p-2 md:p-4 rounded-xl border-dashed border-2 border-blue-300 shadow-sm flex flex-row md:flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-all group min-h-[48px] md:min-h-[100px]"
        >
          <div className="hidden md:block p-1.5 md:p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors md:mb-2">
            <Plus className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
          </div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Add Restaurant (+)</p>
        </button>
      </div>

      {/* Restaurant View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 md:p-4">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-spartan">Restaurants</h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 font-spartan">
              {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`hidden md:block p-2 rounded-lg transition-all duration-200 ${viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Building2 className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 font-spartan">No restaurants yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg font-spartan">
              Get started by adding your first restaurant to your network
            </p>
            <button
              onClick={onAddRestaurant}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-spartan"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Restaurant
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <RestaurantGrid
                restaurants={restaurants}
                onToggleStatus={onToggleStatus}
                onToggleAI={onToggleAI}
                onToggleAggregators={onToggleAggregators}
                onToggleOnlineBill={onToggleOnlineBill}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
                onLoadMore={onLoadMore}
              />
            ) : (
              <RestaurantListView
                restaurants={restaurants}
                onToggleStatus={onToggleStatus}
                onToggleAI={onToggleAI}
                onToggleAggregators={onToggleAggregators}
                onToggleOnlineBill={onToggleOnlineBill}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
                onLoadMore={onLoadMore}
              />
            )}

            {/* Load More Button */}
            {restaurants.length < (total || restaurants.length) && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={onLoadMore}
                  className="px-8 py-3 bg-white border-2 border-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <span>Load More Restaurants</span>
                  <span className="text-xs font-normal text-blue-400">
                    ({restaurants.length} of {total})
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RestaurantManagement; 