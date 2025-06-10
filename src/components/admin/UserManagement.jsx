import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import NotificationToast from './NotificationToast';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');

  useEffect(() => {
    fetchStaff();
    // Get current user ID
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_role', 'caption')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to fetch staff members');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', formData.email)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          throw new Error('User not found. Please ensure the user has signed up first.');
        }
        throw userError;
      }

      // Check if trying to change manager's role
      if (userData.id === currentUserId) {
        setToastMessage('You cannot change your own role from manager to staff.');
        setToastType('error');
        setShowToast(true);
        return;
      }

      // Check if user is already a staff member
      if (userData.profile_role === 'caption') {
        throw new Error('This user is already a staff member.');
      }

      // Update user role to caption
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_role: 'caption' })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      setSuccess('Staff member added successfully');
      setFormData({ email: '' });
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
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;

    try {
      // Update user role back to customer
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_role: 'customer' })
        .eq('id', staffId);

      if (updateError) throw updateError;

      setSuccess('Staff member removed successfully');
      fetchStaff();
    } catch (error) {
      console.error('Error removing staff:', error);
      setError('Failed to remove staff member');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Staff Management</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {/* Disclaimer Alert */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-1">Important Notice</h3>
            <p className="text-sm text-blue-700">
              Users must sign up through their device first before they can be added as staff members. 
              Adding a user as staff will only work if they have an existing account with the provided email.
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

      {isCreating && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Add Existing User as Staff</h3>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter the email of the existing user"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Staff'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setError('');
                  setFormData({ email: '' });
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
                Mobile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
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
                        src={member.avatar_url}
                        alt={member.full_name}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {member.full_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.mobile_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    {member.profile_role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleRemoveStaff(member.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Remove from staff"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No staff members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
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