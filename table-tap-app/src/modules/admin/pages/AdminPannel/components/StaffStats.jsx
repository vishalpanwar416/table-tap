import React from 'react';
import StaffStatCard from './StaffStatCard';
import { Users, Building2, CheckCircle, XCircle } from 'lucide-react';

const StaffStats = ({ staff, restaurants }) => {
  const stats = [
    {
      title: 'Total Staff',
      value: staff.length,
      icon: Users,
      color: 'blue',
      description: 'All staff members',
      gradient: ' ',
    },
    {
      title: 'Restaurants',
      value: restaurants.length,
      icon: Building2,
      color: 'purple',
      description: 'Active restaurants',
      gradient: ' ',
    },
    {
      title: 'Connected',
      value: staff.filter((s) => s.connected).length,
      icon: CheckCircle,
      color: 'green',
      description: 'Online staff',
      gradient: ' ',
    },
    {
      title: 'Disconnected',
      value: staff.filter((s) => !s.connected).length,
      icon: XCircle,
      color: 'red',
      description: 'Offline staff',
      gradient: ' ',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 font-spartan">
      {stats.map((stat, index) => (
        <div key={index} className="transition-all duration-300 hover:shadow-md">
          <StaffStatCard {...stat} />
        </div>
      ))}
    </div>
  );
};

export default StaffStats;
