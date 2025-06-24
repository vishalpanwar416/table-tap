import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, AlertCircle, UserPlus, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabase';
import NotificationToast from './NotificationToast';
import { useAdminRestaurant } from '../../context/AdminRestaurantContext';

const StaffManagement = () => {
  const { userRestaurantId, userRole, isAdmin } = useAdminRestaurant();
  const [staff, setStaff] = useState([]);
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

  useEffect(() => {
    if (userRestaurantId) {
      fetchStaff();
    }
    // Get current user ID
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, [userRestaurantId]);

  // Helper function to check if current user can edit/delete a staff member
  const canModifyStaff = (staffMember) => {
    // Admin can modify any staff member
    if (userRole === 'admin') return true;
    
    // Manager cannot modify their own record
    if (userRole === 'manager' && staffMember.user_id === currentUserId) {
      return false;
    }
    
    // Manager can modify other staff members
    if (userRole === 'manager') return true;
    
    // Other roles cannot modify any staff members
    return false;
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if userRestaurantId is available
      if (!userRestaurantId) {
        console.error('No restaurant ID available');
        setError('No restaurant assigned. Please contact an administrator.');
        return;
      }
      
      console.log('Fetching staff for restaurant ID:', userRestaurantId);
      
      // Try a simpler query first to test access
      const { data: simpleData, error: simpleError } = await supabase
        .from('restaurant_staff')
        .select('id, staff_name, staff_email')
        .eq('restaurant_id', userRestaurantId)
        .limit(1);
      
      if (simpleError) {
        console.error('Simple query failed:', simpleError);
        throw new Error(`Database access denied: ${simpleError.message}`);
      }
      
      // If simple query works, try the full query (removed created_at)
      const { data, error } = await supabase
        .from('restaurant_staff')
        .select(`
          id,
          staff_role,
          staff_name,
          staff_email,
          staff_phone_number,
          connected,
          user_id,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('restaurant_id', userRestaurantId)
        .order('id', { ascending: false }); // Changed from created_at to id

      if (error) {
        console.error('Full query error:', error);
        throw error;
      }
      
      console.log('Successfully fetched staff members:', data);
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      
      // Provide more specific error messages
      if (error.message.includes('permission')) {
        setError('Access denied: You do not have permission to view staff members.');
      } else if (error.message.includes('relation')) {
        setError('Database error: Staff table not found. Please contact support.');
      } else {
        setError(`Failed to fetch staff members: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if staff member already exists for this restaurant
      const { data: existingStaff, error: checkError } = await supabase
        .from('restaurant_staff')
        .select('*')
        .eq('restaurant_id', userRestaurantId)
        .eq('staff_email', formData.email)
        .single();

      if (existingStaff) {
        throw new Error('A staff member with this email already exists for this restaurant.');
      }

      // Create new staff member
      const { data: newStaff, error: createError } = await supabase
        .from('restaurant_staff')
        .insert({
          restaurant_id: userRestaurantId,
          staff_name: formData.name,
          staff_email: formData.email,
          staff_phone_number: formData.phone_number,
          staff_role: formData.role
        })
        .select()
        .single();

      if (createError) throw createError;

      setSuccess('Staff member added successfully');
      setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
      setIsCreating(false);
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
      setError(error.message || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    // Find the staff member to check permissions
    const staffMember = staff.find(member => member.id === staffId);
    
    if (!canModifyStaff(staffMember)) {
      setError('You cannot remove your own staff record. Please contact an administrator.');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this staff member?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('restaurant_staff')
        .delete()
        .eq('id', staffId);

      if (deleteError) throw deleteError;

      setSuccess('Staff member removed successfully');
      fetchStaff();
    } catch (error) {
      console.error('Error removing staff:', error);
      setError('Failed to remove staff member');
    }
  };

  const handleConnectUser = async (staffId, staffEmail) => {
    try {
      // Find user with matching email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', staffEmail)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          setToastMessage('User not found. Please ensure the user has signed up first.');
          setToastType('error');
          setShowToast(true);
          return;
        }
        throw userError;
      }

      // Update staff member to connect with user
      const { error: updateError } = await supabase
        .from('restaurant_staff')
        .update({ 
          user_id: userData.id,
          connected: true 
        })
        .eq('id', staffId);

      if (updateError) throw updateError;

      setSuccess('Staff member connected to user account successfully');
      fetchStaff();
    } catch (error) {
      console.error('Error connecting staff:', error);
      setError('Failed to connect staff member to user account');
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

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if email is being changed and if it already exists
      if (formData.email !== editingStaff.staff_email) {
        const { data: existingStaff, error: checkError } = await supabase
          .from('restaurant_staff')
          .select('*')
          .eq('restaurant_id', userRestaurantId)
          .eq('staff_email', formData.email)
          .neq('id', editingStaff.id)
          .single();

        if (existingStaff) {
          throw new Error('A staff member with this email already exists for this restaurant.');
        }
      }

      // Update staff member
      const { data: updatedStaff, error: updateError } = await supabase
        .from('restaurant_staff')
        .update({
          staff_name: formData.name,
          staff_email: formData.email,
          staff_phone_number: formData.phone_number,
          staff_role: formData.role
        })
        .eq('id', editingStaff.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setSuccess('Staff member updated successfully');
      setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
      setIsEditing(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
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

  // Also add a debug section to show current state
  useEffect(() => {
    console.log('Current state:', {
      userRestaurantId,
      userRole,
      isAdmin: isAdmin(),
      loading
    });
  }, [userRestaurantId, userRole, loading]);

  if (!userRestaurantId && !isAdmin()) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Restaurant Assigned</h3>
          <p className="text-gray-500">You need to be assigned to a restaurant to manage staff.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Staff Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {(userRole === 'admin' || userRole === 'manager') && (
            <button
              onClick={() => {
                setIsCreating(true);
                setIsEditing(false);
                setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Disclaimer Alert */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-1">Staff Management</h3>
            <p className="text-sm text-blue-700">
              {userRole === 'admin' || userRole === 'manager' 
                ? 'Add and edit staff members for your restaurant. They can connect their accounts later by signing up with the same email address.'
                : 'View staff members for this restaurant.'
              }
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (userRole === 'admin' || userRole === 'manager') && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h3>
          <form onSubmit={isEditing ? handleUpdateStaff : handleAddStaff} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="captain">Captain</option>
                  <option value="waiter">Waiter</option>
                  <option value="chef">Chef</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Staff' : 'Add Staff')}
              </button>
              <button
                type="button"
                onClick={isEditing ? handleCancelEdit : () => {
                  setIsCreating(false);
                  setError('');
                  setFormData({ name: '', email: '', phone_number: '', role: 'captain' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading staff members...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {(userRole === 'admin' || userRole === 'manager') && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={member.connected && member.profiles?.avatar_url ? member.profiles.avatar_url : '/default-avatar.png'}
                          alt={member.staff_name}
                          onError={(e) => {
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.connected && member.profiles ? member.profiles.full_name : member.staff_name}
                          {/* Show indicator if this is the current user */}
                          {member.user_id === currentUserId && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">(You)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.connected && member.profiles ? member.profiles.email : member.staff_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.staff_phone_number || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.staff_role === 'manager' ? 'bg-purple-100 text-purple-800' :
                      member.staff_role === 'captain' ? 'bg-blue-100 text-blue-800' :
                      member.staff_role === 'chef' ? 'bg-orange-100 text-orange-800' :
                      member.staff_role === 'waiter' ? 'bg-green-100 text-green-800' :
                      member.staff_role === 'cashier' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.staff_role.charAt(0).toUpperCase() + member.staff_role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.connected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.connected ? 'Connected' : 'Standalone'}
                    </span>
                  </td>
                  {(userRole === 'admin' || userRole === 'manager') && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* Edit button - only show if user can modify this staff member */}
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
                        {/* Delete button - only show if user can modify this staff member */}
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
              {staff.length === 0 && (
                <tr>
                  <td colSpan={userRole === 'admin' || userRole === 'manager' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Toast Notification */}
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