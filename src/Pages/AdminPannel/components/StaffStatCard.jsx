import React from 'react';

const StaffStatCard = ({ title, value, icon: Icon, color, description, gradient }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 font-spartan">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 font-spartan">{title}</p>
          <p className="text-3xl font-bold text-gray-900 font-spartan">{value}</p>
          <p className="text-xs text-gray-500 font-spartan">{description}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StaffStatCard; 