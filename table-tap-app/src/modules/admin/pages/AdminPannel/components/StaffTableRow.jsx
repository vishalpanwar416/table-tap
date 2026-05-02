import React from 'react';
import { Edit, Trash2, User, CheckCircle, XCircle, MoreVertical } from 'lucide-react';

const StaffTableRow = ({ staff, restaurant, onEdit, onDelete, index }) => {
  const handleEdit = () => {
    onEdit(staff);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      onDelete(staff.id);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'manager':
        return 'Manager';
      case 'captain':
        return 'Captain';
      case 'waiter':
        return 'Waiter';
      case 'chef':
        return 'Chef';
      case 'cashier':
        return 'Cashier';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'captain':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'waiter':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'chef':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'cashier':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <tr
      className="hover:bg-primary-50 transition-all duration-200 font-spartan"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="">
            <div className="text-sm font-semibold text-gray-900 font-spartan">
              {staff.name}
            </div>
            <div className="text-sm text-gray-500 font-spartan">
              {staff.email}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border font-spartan ${getRoleColor(staff.role)}`}>
          {getRoleDisplayName(staff.role)}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {staff.connected ? (
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500 mr-2" />
          )}
          <span className={`text-sm font-medium font-spartan ${staff.connected ? 'text-green-800' : 'text-red-800'
            }`}>
            {staff.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-all duration-200"
            title="Edit staff member"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Delete staff member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StaffTableRow; 