import React from 'react';

const StaffStatCard = ({ title, value, icon: Icon, color, description, gradient }) => {
  const borderAccent = {
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    green: 'border-l-green-500',
    red: 'border-l-red-500'
  };

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl border border-gray-100 border-l-4 ${borderAccent[color] || 'border-l-gray-400'} p-4 sm:p-5 hover:shadow-md transition-all duration-300 font-spartan`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide font-spartan">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 font-spartan mt-1 tabular-nums">{value}</p>
          <p className="text-xs text-gray-500 font-spartan mt-0.5">{description}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StaffStatCard; 