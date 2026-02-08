import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  UserPlus,
  RefreshCw,
  Users,
  UserCheck,
  List,
  LayoutGrid,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';
import NotificationToast from './NotificationToast';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';
import {
  fetchStaff,
  addStaff,
  removeStaff,
  updateStaff,
  connectStaffUser
} from '../../api/admin/staffService';

// Avatar with border and consistent styling
const StaffAvatar = ({ src, alt, size = 48 }) => (
  <div
    className="flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border-2 border-white shadow-inner overflow-hidden flex-shrink-0"
    style={{ width: size, height: size }}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        className="object-cover w-full h-full"
        onError={e => { e.target.onerror = null; e.target.src = ''; }}
      />
    ) : (
      <User className="text-gray-500" style={{ width: size * 0.5, height: size * 0.5 }} />
    )}
  </div>
);

const StaffManagement = ({
  searchTerm = '',
  roleFilter = 'all',
  statusFilter = 'all',
}) => {
  const { userRestaurantId, userRole, isAdmin } = useAdminRestaurant();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    role: 'captain'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [viewMode, setViewMode] = useState('table');

  const roleConfig = useMemo(() => ({
    manager: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '' },
    captain: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '' },
    chef: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '' },
    waiter: { color: 'bg-green-100 text-green-800 border-green-200', icon: '' },
    cashier: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '' }
  }), []);

  const canModifyStaff = useCallback((staffMember) => {
    if (userRole === 'admin') return true;
    if (userRole === 'manager' && staffMember.user_id === currentUserId) return false;
    if (userRole === 'manager') return true;
    return false;
  }, [userRole, currentUserId]);

  // Use props for filtering
  const filterStaff = useCallback(() => {
    let filtered = [...staff];
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.staff_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(member.staff_phone_number || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(member => member.staff_role === roleFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(member =>
        statusFilter === 'connected' ? member.connected : !member.connected
      );
    }
    return filtered;
  }, [staff, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    setFilteredStaff(filterStaff());
  }, [filterStaff]);

  const stats = useMemo(() => ({
    total: staff.length,
    connected: staff.filter(s => s.connected).length,
    notConnected: staff.filter(s => !s.connected).length,
    byRole: Object.keys(roleConfig).reduce((acc, role) => {
      acc[role] = staff.filter(s => s.staff_role === role).length;
      return acc;
    }, {})
  }), [staff, roleConfig]);

  useEffect(() => {
    if (userRestaurantId) fetchStaffList();
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, [userRestaurantId]);

  // Fetch staff
  const fetchStaffList = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchStaff(userRestaurantId);
      setStaff(data);
    } catch (error) {
      setError(error.message || 'Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  // Add staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!userRestaurantId) {
        throw new Error('Please select a restaurant first (top-left selector) before adding staff.');
      }
      await addStaff(userRestaurantId, formData);
      setSuccess('Staff member added successfully');
      setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
      setIsCreating(false);
      fetchStaffList();
    } catch (error) {
      setError(error.message || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  // Remove staff
  const handleRemoveStaff = async (staffId) => {
    const staffMember = staff.find(member => member.id === staffId);
    if (!canModifyStaff(staffMember)) {
      setError('You cannot remove your own staff record. Please contact an administrator.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await removeStaff(staffId);
      setSuccess('Staff member removed successfully');
      fetchStaffList();
    } catch (error) {
      setError('Failed to remove staff member');
    }
  };

  // Connect staff
  const handleConnectUser = async (staffId, staffEmail) => {
    try {
      await connectStaffUser(staffId, staffEmail);
      setSuccess('Staff member connected to user account successfully');
      fetchStaffList();
    } catch (error) {
      setError(error.message || 'Failed to connect staff member to user account');
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.staff_name,
      email: staffMember.staff_email,
      phone_number: staffMember.staff_phone_number || '',
      role: staffMember.staff_role
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  // Update staff
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateStaff(userRestaurantId, editingStaff, formData);
      setSuccess('Staff member updated successfully');
      setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
      setIsEditing(false);
      setEditingStaff(null);
      fetchStaffList();
    } catch (error) {
      setError(error.message || 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingStaff(null);
    setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
    setError('');
  };

  const clearFilters = () => {
    // setRoleFilter('all'); // This is now handled by parent
    // setStatusFilter('all'); // This is now handled by parent
  };

  if (!userRestaurantId && !isAdmin()) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="text-center py-16 px-6">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 mb-5">
            <AlertCircle className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No restaurant assigned</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">You need to be assigned to a restaurant to manage staff.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-1 sm:px-0">
      {/* Overview card: title, subtitle, Add Staff, and stat cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="hidden md:block">
            <h2 className="text-xl font-bold text-gray-900">Staff</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage your restaurant team</p>
          </div>
          {(userRole === 'admin' || userRole === 'manager') && (
            <button
              onClick={() => {
                setIsCreating(true);
                setIsEditing(false);
                setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg font-semibold transition-all touch-manipulation shrink-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Staff
            </button>
          )}
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-4 gap-1.5 md:gap-4">
            <div className="min-w-0 rounded-lg md:rounded-xl border border-gray-100 bg-gray-50/50 p-1.5 md:p-4 border-l-2 md:border-l-4 border-l-orange-400">
              <p className="text-[9px] md:text-xs font-medium text-gray-500 uppercase tracking-wide truncate">Total</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 tabular-nums leading-none">{stats.total}</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 truncate">Members</p>
            </div>
            <div className="min-w-0 rounded-lg md:rounded-xl border border-gray-100 bg-green-50/50 p-1.5 md:p-4 border-l-2 md:border-l-4 border-l-green-500">
              <p className="text-[9px] md:text-xs font-medium text-gray-500 uppercase tracking-wide truncate">Online</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 tabular-nums leading-none">{stats.connected}</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 truncate">Connected</p>
            </div>
            <div className="min-w-0 rounded-lg md:rounded-xl border border-gray-100 bg-amber-50/50 p-1.5 md:p-4 border-l-2 md:border-l-4 border-l-amber-500">
              <p className="text-[9px] md:text-xs font-medium text-gray-500 uppercase tracking-wide truncate">Pending</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 tabular-nums leading-none">{stats.notConnected}</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 truncate">Not Linked</p>
            </div>
            <div className="min-w-0 rounded-lg md:rounded-xl border border-gray-100 bg-blue-50/50 p-1.5 md:p-4 border-l-2 md:border-l-4 border-l-blue-400">
              <p className="text-[9px] md:text-xs font-medium text-gray-500 uppercase tracking-wide truncate">Roles</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 tabular-nums leading-none">{Object.keys(roleConfig).length}</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 truncate">Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {/* Removed search and filter UI as it's now handled by parent */}



      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 flex items-start gap-3">
          <UserCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (userRole === 'admin' || userRole === 'manager') && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
          </div>
          <form onSubmit={isEditing ? handleUpdateStaff : handleAddStaff} className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                  required
                >
                  {Object.keys(roleConfig).map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="min-h-[44px] px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 touch-manipulation"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update' : 'Add Staff')}
              </button>
              <button
                type="button"
                onClick={isEditing ? handleCancelEdit : () => { setIsCreating(false); setError(''); setFormData({ name: '', email: '', phone_number: '', role: 'captain' }); }}
                className="min-h-[44px] px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff list / grid */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-gray-900">Team members</h3>
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center min-h-[40px] px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-orange-600'
                }`}
            >
              <List className="w-4 h-4 mr-2" />
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center min-h-[40px] px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-orange-600'
                }`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Grid
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="h-10 w-10 animate-spin text-orange-500 mb-4" />
            <p className="text-sm text-gray-500">Loading staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No team members yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Add your first staff member to get started.</p>
            {(userRole === 'admin' || userRole === 'manager') && (
              <button
                onClick={() => { setIsCreating(true); setIsEditing(false); setFormData({ name: '', email: '', phone_number: '', role: 'captain' }); }}
                className="inline-flex items-center min-h-[44px] px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold touch-manipulation"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Staff
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile View: Compact Cards */}
            <div className="md:hidden grid grid-cols-1 gap-3 p-3 bg-gray-50/30">
              {filteredStaff.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${member.connected ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <StaffAvatar
                    src={member.connected && member.profiles?.avatar_url ? member.profiles.avatar_url : ''}
                    alt={member.staff_name}
                    size={42}
                  />
                  <div className="flex-1 min-w-0 ml-1">
                    <div className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1.5">
                      {member.connected && member.profiles ? member.profiles.full_name : member.staff_name}
                      {member.user_id === currentUserId && <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded-full">You</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-md border ${roleConfig[member.staff_role]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        {member.staff_role.charAt(0).toUpperCase() + member.staff_role.slice(1)}
                      </span>
                      <span className={`text-[10px] font-medium ${member.connected ? 'text-green-600' : 'text-amber-600'}`}>
                        {member.connected ? 'Online' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {(userRole === 'admin' || userRole === 'manager') && (
                    <div className="flex items-center gap-1 pl-2 border-l border-gray-100">
                      {canModifyStaff(member) && (
                        <button
                          onClick={() => handleEditStaff(member)}
                          className="p-2 text-gray-400 hover:text-blue-600 active:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canModifyStaff(member) && (
                        <button
                          onClick={() => handleRemoveStaff(member.id)}
                          className="p-2 text-gray-400 hover:text-red-600 active:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {!member.connected && !canModifyStaff(member) && (
                        <button onClick={() => handleConnectUser(member.id, member.staff_email)} className="p-2 text-blue-500 bg-blue-50 rounded-lg">
                          <UserPlus size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View: Table or Grid */}
            <div className="hidden md:block">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50/80 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        {(userRole === 'admin' || userRole === 'manager') && (
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {filteredStaff.map((member) => (
                        <tr key={member.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <StaffAvatar
                                src={member.connected && member.profiles?.avatar_url ? member.profiles.avatar_url : ''}
                                alt={member.staff_name}
                                size={40}
                              />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {member.connected && member.profiles ? member.profiles.full_name : member.staff_name}
                                  {member.user_id === currentUserId && <span className="ml-1 text-xs text-orange-600 font-medium">(You)</span>}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {member.staff_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-1 text-gray-700">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {member.staff_phone_number || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${roleConfig[member.staff_role]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                              {member.staff_role.charAt(0).toUpperCase() + member.staff_role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${member.connected ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${member.connected ? 'bg-green-500' : 'bg-amber-500'}`} />
                              {member.connected ? 'Connected' : 'Not connected'}
                            </span>
                          </td>
                          {(userRole === 'admin' || userRole === 'manager') && (
                            <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                {canModifyStaff(member) && (
                                  <button onClick={() => handleEditStaff(member)} className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                {!member.connected && (
                                  <button onClick={() => handleConnectUser(member.id, member.staff_email)} className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Connect">
                                    <UserPlus className="w-4 h-4" />
                                  </button>
                                )}
                                {canModifyStaff(member) && (
                                  <button onClick={() => handleRemoveStaff(member.id)} className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Remove">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredStaff.map((member) => (
                    <div key={member.id} className="rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-orange-50/20 hover:border-orange-100 p-4 transition-all shadow-sm">
                      <div className="flex flex-col items-center text-center">
                        <StaffAvatar
                          src={member.connected && member.profiles?.avatar_url ? member.profiles.avatar_url : ''}
                          alt={member.staff_name}
                          size={56}
                        />
                        <div className="mt-3 font-semibold text-gray-900">
                          {member.connected && member.profiles ? member.profiles.full_name : member.staff_name}
                          {member.user_id === currentUserId && <span className="ml-1 text-xs text-orange-600">(You)</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{member.staff_email}</div>
                        <div className="text-xs text-gray-500">{member.staff_phone_number || 'No phone'}</div>
                        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${roleConfig[member.staff_role]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                            {member.staff_role.charAt(0).toUpperCase() + member.staff_role.slice(1)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${member.connected ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {member.connected ? 'Connected' : 'Not connected'}
                          </span>
                        </div>
                        {(userRole === 'admin' || userRole === 'manager') && (
                          <div className="flex gap-2 mt-3">
                            {canModifyStaff(member) && (
                              <button onClick={() => handleEditStaff(member)} className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {!member.connected && (
                              <button onClick={() => handleConnectUser(member.id, member.staff_email)} className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Connect">
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                            {canModifyStaff(member) && (
                              <button onClick={() => handleRemoveStaff(member.id)} className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Remove">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <NotificationToast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
        autoClose={true}
        duration={5000}
      />
    </div>
  );
};

export default StaffManagement;