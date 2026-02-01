import React, { useState } from 'react';
import { Building2, Plus, TrendingUp, Clock, Users, List, Grid, Brain } from 'lucide-react';
import RestaurantCard from './RestaurantCard';
import RestaurantListView from './RestaurantListView';
import RestaurantGrid from './RestaurantGrid';

const RestaurantManagement = ({
  restaurants,
  loading,
  onAddRestaurant,
  onToggleStatus,
  onToggleAI,
  onToggleAggregators,
  onEdit,
  onDelete,
  onClick,
  onLoadMore
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

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
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 font-spartan">
              Restaurant Management
            </h3>
            <p className="text-sm text-gray-600 font-spartan">
              Manage all restaurants in your network
            </p>
          </div>
          <button
            onClick={onAddRestaurant}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-spartan"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium font-spartan">Add Restaurant</span>
          </button>
        </div>

        {/* Loading Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 font-spartan">
            Restaurant Management
          </h3>
          <p className="text-sm text-gray-600 font-spartan">
            Manage all restaurants in your network
          </p>
        </div>
        <button
          onClick={onAddRestaurant}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-spartan"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium font-spartan">Add Restaurant</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 font-spartan">{stats.total}</div>
          <div className="text-sm text-gray-600 font-spartan">Total</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 font-spartan">{stats.active}</div>
          <div className="text-sm text-gray-600 font-spartan">Active</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 font-spartan">{stats.inactive}</div>
          <div className="text-sm text-gray-600 font-spartan">Inactive</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 font-spartan">{stats.totalStaff}</div>
          <div className="text-sm text-gray-600 font-spartan">Staff</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 font-spartan">{stats.aiEnabled}</div>
          <div className="text-sm text-gray-600 font-spartan">AI Enabled</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 font-spartan">{stats.recentlyUpdated}</div>
          <div className="text-sm text-gray-600 font-spartan">Recently Updated</div>
        </div>
      </div>

      {/* Additional Growth Information */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium font-spartan">Growth This Month</p>
              <p className="text-2xl font-bold text-blue-900 font-spartan">{stats.newThisMonth}</p>
              <p className="text-xs text-blue-600 font-spartan">new restaurants</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium font-spartan">Active Rate</p>
              <p className="text-2xl font-bold text-green-900 font-spartan">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </p>
              <p className="text-xs text-green-600 font-spartan">of restaurants active</p>
            </div>
            <Building2 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium font-spartan">AI Adoption</p>
              <p className="text-2xl font-bold text-purple-900 font-spartan">
                {stats.total > 0 ? Math.round((stats.aiEnabled / stats.total) * 100) : 0}%
              </p>
              <p className="text-xs text-purple-600 font-spartan">using AI analytics</p>
            </div>
            <Brain className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium font-spartan">Avg Staff per Restaurant</p>
              <p className="text-2xl font-bold text-orange-900 font-spartan">
                {stats.total > 0 ? Math.round(stats.totalStaff / stats.total) : 0}
              </p>
              <p className="text-xs text-orange-600 font-spartan">staff members</p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Restaurant View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
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
                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list'
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
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
                onLoadMore={onLoadMore}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RestaurantManagement; 