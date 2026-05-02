import React from 'react';

const StaffStatCard = ({ title, value, icon: Icon, color, description, gradient }) => {
  const accentColors = {
    primary: 'border-l-indigo-500 bg-indigo-50/30',
    amber: 'border-l-amber-500 bg-amber-50/30',
    green: 'border-l-emerald-500 bg-emerald-50/30',
    red: 'border-l-rose-500 bg-rose-50/30'
  };

  const iconColors = {
    primary: 'text-indigo-600 bg-indigo-50',
    amber: 'text-amber-600 bg-amber-50',
    green: 'text-emerald-600 bg-emerald-50',
    red: 'text-rose-600 bg-rose-50'
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${accentColors[color] || 'border-l-slate-400 bg-slate-50/30'} p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{value}</p>
            {description && <span className="text-[10px] font-medium text-slate-500">{description}</span>}
          </div>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 ${iconColors[color] || 'text-slate-500 bg-slate-100'} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm border border-black/5`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

export default StaffStatCard; 