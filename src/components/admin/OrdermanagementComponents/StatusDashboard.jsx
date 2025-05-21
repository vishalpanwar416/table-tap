import React from 'react';
import { Clock, Truck, CheckCircle, Check, X } from 'lucide-react';

const StatusDashboard = ({ statusCounts, statusFilter, setStatusFilter }) => {
  const statusCards = [
    {
      status: 'pending',
      label: 'Pending',
      count: statusCounts.pending,
      icon: <Clock className="h-5 w-5 text-yellow-600" />,
      color: 'yellow'
    },
    {
      status: 'preparing',
      label: 'Preparing',
      count: statusCounts.preparing,
      icon: <Truck className="h-5 w-5 text-purple-600" />,
      color: 'purple'
    },
    {
      status: 'ready',
      label: 'Ready',
      count: statusCounts.ready,
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      color: 'green'
    },
    {
      status: 'completed',
      label: 'Completed',
      count: statusCounts.completed,
      icon: <Check className="h-5 w-5 text-teal-600" />,
      color: 'teal'
    },
    {
      status: 'rejected',
      label: 'Rejected',
      count: statusCounts.rejected,
      icon: <X className="h-5 w-5 text-red-600" />,
      color: 'red'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusCards.map((card) => (
          <div 
            key={card.status}
            className={`p-3 rounded-lg bg-white shadow-sm border-l-4 border-${card.color}-400 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === card.status ? `ring-2 ring-${card.color}-400` : ''}`}
            onClick={() => setStatusFilter(statusFilter === card.status ? 'all' : card.status)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800">{card.count}</p>
              </div>
              <div className={`p-2 rounded-full bg-${card.color}-100`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusDashboard;