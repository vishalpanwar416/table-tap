import React from 'react';
import { Users, Plus } from 'lucide-react';

const EmptyStaffState = ({ restaurantName, onAddStaff }) => {
  return (
    <div className="text-center py-12 sm:py-16 px-4 sm:px-6 font-spartan">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
        <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-spartan">
        {restaurantName ? `No staff in ${restaurantName}` : 'No staff yet'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm font-spartan">
        {restaurantName
          ? `Add staff members for this restaurant`
          : 'Add your first staff member to get started'}
      </p>
      <button
        onClick={onAddStaff}
        className="inline-flex items-center min-h-[44px] px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 shadow-md hover:shadow-lg font-semibold font-spartan touch-manipulation"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Staff Member
      </button>
    </div>
  );
};

export default EmptyStaffState;
