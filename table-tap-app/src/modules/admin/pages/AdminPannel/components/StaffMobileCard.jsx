import React from 'react';
import { User, Mail, Phone, Edit, Trash2, Shield, ChefHat } from 'lucide-react';

const StaffMobileCard = ({ member, onEdit, onDelete }) => {
  const getRoleIcon = (role) => {
    switch (role) {
      case 'manager':
        return <Shield className="h-4 w-4 text-orange-600" />;
      case 'captain':
        return <ChefHat className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-orange-100 text-orange-800';
      case 'captain':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* Header with Avatar and Basic Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {member.avatar_url ? (
              <img
                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                src={member.avatar_url}
                alt={member.name}
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center border-2 border-white shadow-sm">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-gray-900 truncate">{member.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              {getRoleIcon(member.role)}
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}
              >
                {member.role}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            member.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {member.connected ? 'Connected' : 'Standalone'}
        </span>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="truncate">{member.email}</span>
        </div>
        {member.phone_number && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{member.phone_number}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(member)}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span className="text-sm font-medium">Edit</span>
        </button>
        <button
          onClick={() => onDelete(member.id)}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-sm font-medium">Delete</span>
        </button>
      </div>
    </div>
  );
};

export default StaffMobileCard;
