import { Clock, Truck, CheckCircle, X } from 'lucide-react';

// Generate chart data for daily (hourly), weekly (last 7 days), monthly (last 30 days)
export const generateChartData = (orders, period = 'weekly') => {
  const now = new Date();

  // Normalize order list: include only completed orders for revenue
  const completedOrders = Array.isArray(orders)
    ? orders.filter(o => o && o.status === 'completed')
    : [];

  if (period === 'daily') {
    // 24 hours of today
    const segments = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h}:00`,
      orders: 0,
      revenue: 0
    }));

    completedOrders.forEach(order => {
      const d = new Date(order.created_at);
      if (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      ) {
        const hr = d.getHours();
        segments[hr].orders += 1;
        segments[hr].revenue += parseFloat(order.total) || 0;
      }
    });

    return segments.map(s => ({ name: s.label, orders: s.orders, revenue: s.revenue }));
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const windowDays = period === 'monthly' ? 30 : 7;
  const days = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({
      date: d,
      label: period === 'monthly' ? `${d.getDate()}` : dayLabels[d.getDay()],
      orders: 0,
      revenue: 0
    });
  }

  completedOrders.forEach(order => {
    const orderDate = new Date(order.created_at);
    days.forEach(day => {
      if (
        orderDate.getFullYear() === day.date.getFullYear() &&
        orderDate.getMonth() === day.date.getMonth() &&
        orderDate.getDate() === day.date.getDate()
      ) {
        day.orders += 1;
        day.revenue += parseFloat(order.total) || 0;
      }
    });
  });

  return days.map(day => ({ name: day.label, orders: day.orders, revenue: day.revenue }));
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'preparing':
      return <Truck className="h-5 w-5 text-primary-500" />;
    case 'ready':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'rejected':
      return <X className="h-5 w-5 text-red-500" />;
    case 'cancelled':
      return <X className="h-5 w-5 text-gray-500" />;
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-blue-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
};

export const getStatusBadge = (status) => {
  const statusClasses = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    preparing: 'bg-primary-100 text-primary-800 border border-primary-200',
    ready: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border border-gray-200',
    completed: 'bg-blue-100 text-blue-800 border border-blue-200'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100'}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
    </span>
  );
};
