import React from 'react';
import { Users, Building2, Mail, Phone, Edit, Trash2, Plus } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';

const StaffListView = ({ staff, restaurants, onEdit, onDelete, onAddStaff }) => {
  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    return restaurant ? restaurant.name : 'Unknown Restaurant';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'captain':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConnectionStatus = (connected) => {
    return connected ? (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
        Connected
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded-full">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
        Disconnected
      </span>
    );
  };

  const Row = ({ index, style, data }) => {
    const member = data[index];
    return (
      <tr style={style} key={member.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 font-spartan">
                {member.name || 'Unnamed Staff'}
              </div>
              <div className="text-sm text-gray-500 font-spartan">
                {member.email}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-900 font-spartan">
              {getRestaurantName(member.restaurant_id)}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
            {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Unknown'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            {member.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-3 h-3 mr-1" />
                {member.email}
              </div>
            )}
            {member.phone_number && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-3 h-3 mr-1" />
                {member.phone_number}
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getConnectionStatus(member.connected)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(member)}
              className="text-blue-600 hover:text-blue-900 transition-colors"
              title="Edit staff member"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(member.id)}
              className="text-red-600 hover:text-red-900 transition-colors"
              title="Delete staff member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 font-spartan">No staff members found</h3>
        <p className="text-gray-600 mb-4 font-spartan">Get started by adding your first staff member</p>
        <button
          onClick={onAddStaff}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-spartan"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-700 font-spartan">All Staff Members</h4>
        <div className="text-sm text-gray-500 font-spartan">
          {staff.length} staff member{staff.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <List
                height={400}
                itemCount={staff.length}
                itemSize={60}
                width="100%"
                itemData={staff}
              >
                {Row}
              </List>
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
          disabled={staffPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {staffPage} of {Math.max(1, Math.ceil(staffTotal / staffPageSize))}
        </span>
        <button
          onClick={() => setStaffPage((p) => p + 1)}
          disabled={staffPage * staffPageSize >= staffTotal}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StaffListView; 