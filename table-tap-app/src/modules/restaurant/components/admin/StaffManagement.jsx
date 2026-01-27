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
  UserCheck
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

// Simple avatar component: uses Lucide User icon if no image
const StaffAvatar = ({ src, alt, size = 48 }) => (
  <div
    className="flex items-center justify-center bg-gray-100 rounded-full"
    style={{ width: size, height: size }}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        className="object-cover rounded-full"
        style={{ width: size, height: size }}
        onError={e => { e.target.onerror = null; e.target.src = ''; }}
      />
    ) : (
      <User className="text-gray-400" style={{ width: size * 0.7, height: size * 0.7 }} />
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
    manager: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '' },
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
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Restaurant Assigned</h3>
          <p className="text-gray-500 max-w-md mx-auto">You need to be assigned to a restaurant to manage staff members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Staff Management</h1>
              <p className="text-orange-100">Manage your restaurant team</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(userRole === 'admin' || userRole === 'manager') && (
              <button
                onClick={() => {
                  setIsCreating(true);
                  setIsEditing(false);
                  setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-orange-500 rounded-xl hover:bg-orange-50 transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            )}
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-orange-100">Total Staff</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.connected}</div>
            <div className="text-sm text-orange-100">Connected</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.notConnected}</div>
            <div className="text-sm text-orange-100">Not Connected</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{Object.values(stats.byRole).reduce((a, b) => a + b, 0)}</div>
            <div className="text-sm text-orange-100">All Roles</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {/* Removed search and filter UI as it's now handled by parent */}



      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (userRole === 'admin' || userRole === 'manager') && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-xl">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
          </div>
          <form onSubmit={isEditing ? handleUpdateStaff : handleAddStaff} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  {Object.keys(roleConfig).map(role => (
                    <option key={role} value={role}>
                      {roleConfig[role].icon} {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {isEditing ? 'Update Staff' : 'Add Staff'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={isEditing ? handleCancelEdit : () => {
                  setIsCreating(false);
                  setError('');
                  setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Display */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading staff members...</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {(userRole === 'admin' || userRole === 'manager') && (
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="">
                          <div className="text-sm font-medium text-gray-900">
                            {member.connected && member.profiles ? member.profiles.full_name : member.staff_name}
                            {member.user_id === currentUserId && (
                              <span className="ml-2 text-xs text-blue-600 font-medium">(You)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{member.staff_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.staff_phone_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${roleConfig[member.staff_role]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        {roleConfig[member.staff_role]?.icon} {member.staff_role.charAt(0).toUpperCase() + member.staff_role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.connected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {member.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </td>
                    {(userRole === 'admin' || userRole === 'manager') && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {canModifyStaff(member) && (
                            <button
                              onClick={() => handleEditStaff(member)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit staff member"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {!member.connected && (
                            <button
                              onClick={() => handleConnectUser(member.id, member.staff_email)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Connect to user account"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          {canModifyStaff(member) && (
                            <button
                              onClick={() => handleRemoveStaff(member.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove from staff"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={userRole === 'admin' || userRole === 'manager' ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                      No staff members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid View
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No staff members found</div>
            ) : (
              filteredStaff.map((member) => (
                <div key={member.id} className="bg-gray-50 rounded-xl shadow p-4 flex flex-col items-center">
                  <StaffAvatar
                    src={member.connected && member.profiles?.avatar_url ? member.profiles.avatar_url : ''}
                    alt={member.staff_name}
                    size={64}
                  />
                  <div className="text-base font-semibold text-gray-900 text-center">
                    {member.connected && member.profiles ? member.profiles.full_name : member.staff_name}
                    {member.user_id === currentUserId && (
                      <span className="ml-2 text-xs text-blue-600 font-medium">(You)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 text-center">{member.staff_email}</div>
                  <div className="text-xs text-gray-500 text-center">{member.staff_phone_number || 'N/A'}</div>
                  <div className={`mt-2 px-2 py-1 text-xs rounded-full border font-semibold ${roleConfig[member.staff_role]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {roleConfig[member.staff_role]?.icon} {member.staff_role.charAt(0).toUpperCase() + member.staff_role.slice(1)}
                  </div>
                  <div className={`mt-1 px-2 py-1 text-xs rounded-full font-semibold ${member.connected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {member.connected ? 'Connected' : 'Not Connected'}
                  </div>
                  {(userRole === 'admin' || userRole === 'manager') && (
                    <div className="flex gap-2 mt-3">
                      {canModifyStaff(member) && (
                        <button
                          onClick={() => handleEditStaff(member)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit staff member"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {!member.connected && (
                        <button
                          onClick={() => handleConnectUser(member.id, member.staff_email)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Connect to user account"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      {canModifyStaff(member) && (
                        <button
                          onClick={() => handleRemoveStaff(member.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove from staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
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