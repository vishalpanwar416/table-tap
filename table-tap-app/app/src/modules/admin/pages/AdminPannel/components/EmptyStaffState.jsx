import React from 'react';
import { Users, Plus, Building2 } from 'lucide-react';

const EmptyStaffState = ({ restaurantName, onAddStaff }) => {
  return (
    <div className="text-center py-16 px-6 font-spartan">
      <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Users className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 font-spartan">
        {restaurantName ? `No staff members in ${restaurantName}` : 'No staff members yet'}
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto font-spartan">
        {restaurantName 
          ? `Get started by adding staff members to ${restaurantName}`
          : 'Get started by adding your first staff member'
        }
      </p>
      <button 
        onClick={onAddStaff}
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-spartan"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Staff Member
      </button>
    </div>
  );
};

export default EmptyStaffState; 