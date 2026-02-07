import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Mail,
  MailCheck,
  MailX,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Calendar,
  Building2,
  CreditCard,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Send,
  Receipt,
  UserPlus,
  Bell,
  Shield,
  Settings,
  IndianRupee,
  Eye,
  X,
  Download
} from 'lucide-react';
import {
  getAdminActivityLogs,
  getActivityStats,
  ACTIVITY_TYPES,
  EMAIL_TYPES
} from '../../../api/adminActivityLogService';

const AdminActivityLogs = ({ searchTerm }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  // searchTerm is now a prop
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('30days');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  // Selected log for detail view
  const [selectedLog, setSelectedLog] = useState(null);

  // Activity type categories
  const activityCategories = {
    'Emails': [
      { type: ACTIVITY_TYPES.EMAIL_SENT, label: 'Email Sent', icon: MailCheck, color: 'text-green-500' },
      { type: ACTIVITY_TYPES.EMAIL_FAILED, label: 'Email Failed', icon: MailX, color: 'text-red-500' },
      { type: ACTIVITY_TYPES.EMAIL_QUEUED, label: 'Email Queued', icon: Mail, color: 'text-amber-500' }
    ],
    'Subscriptions': [
      { type: ACTIVITY_TYPES.SUBSCRIPTION_CREATED, label: 'Created', icon: CreditCard, color: 'text-blue-500' },
      { type: ACTIVITY_TYPES.SUBSCRIPTION_RENEWED, label: 'Renewed', icon: RefreshCw, color: 'text-green-500' },
      { type: ACTIVITY_TYPES.SUBSCRIPTION_CANCELLED, label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
      { type: ACTIVITY_TYPES.SUBSCRIPTION_EXPIRED, label: 'Expired', icon: AlertTriangle, color: 'text-orange-500' }
    ],
    'Restaurants': [
      { type: ACTIVITY_TYPES.RESTAURANT_CREATED, label: 'Created', icon: Building2, color: 'text-purple-500' },
      { type: ACTIVITY_TYPES.RESTAURANT_ACTIVATED, label: 'Activated', icon: CheckCircle, color: 'text-green-500' },
      { type: ACTIVITY_TYPES.RESTAURANT_DEACTIVATED, label: 'Deactivated', icon: XCircle, color: 'text-gray-500' },
      { type: ACTIVITY_TYPES.RESTAURANT_UPDATED, label: 'Updated', icon: Settings, color: 'text-blue-500' },
      { type: ACTIVITY_TYPES.RESTAURANT_DELETED, label: 'Deleted', icon: XCircle, color: 'text-red-500' }
    ],
    'Staff': [
      { type: ACTIVITY_TYPES.STAFF_CREATED, label: 'Staff Added', icon: UserPlus, color: 'text-blue-500' },
      { type: ACTIVITY_TYPES.STAFF_UPDATED, label: 'Staff Updated', icon: User, color: 'text-amber-500' },
      { type: ACTIVITY_TYPES.STAFF_DELETED, label: 'Staff Removed', icon: XCircle, color: 'text-red-500' }
    ],
    'System': [
      { type: ACTIVITY_TYPES.SYSTEM_ALERT, label: 'Alert', icon: Bell, color: 'text-red-500' },
      { type: ACTIVITY_TYPES.CRON_JOB, label: 'Cron Job', icon: Settings, color: 'text-gray-500' },
      { type: ACTIVITY_TYPES.AUTO_PROCESS, label: 'Auto Process', icon: Activity, color: 'text-blue-500' }
    ]
  };

  // Email type labels
  const emailTypeLabels = {
    [EMAIL_TYPES.BILL]: { label: 'Bill/Invoice', icon: Receipt },
    [EMAIL_TYPES.WELCOME]: { label: 'Welcome Email', icon: UserPlus },
    [EMAIL_TYPES.SUBSCRIPTION_CONFIRMATION]: { label: 'Subscription Confirmation', icon: CreditCard },
    [EMAIL_TYPES.SUBSCRIPTION_REMINDER]: { label: 'Subscription Reminder', icon: Bell },
    [EMAIL_TYPES.SUBSCRIPTION_EXPIRED]: { label: 'Subscription Expired', icon: AlertTriangle },
    [EMAIL_TYPES.PAYMENT_RECEIPT]: { label: 'Payment Receipt', icon: IndianRupee },
    [EMAIL_TYPES.PAYMENT_FAILED]: { label: 'Payment Failed', icon: XCircle },
    [EMAIL_TYPES.PASSWORD_RESET]: { label: 'Password Reset', icon: Shield },
    [EMAIL_TYPES.REGISTRATION_APPROVED]: { label: 'Registration Approved', icon: CheckCircle },
    [EMAIL_TYPES.REGISTRATION_REJECTED]: { label: 'Registration Rejected', icon: XCircle },
    [EMAIL_TYPES.INQUIRY_RESPONSE]: { label: 'Inquiry Response', icon: Mail },
    [EMAIL_TYPES.INVOICE]: { label: 'Invoice', icon: FileText }
  };

  useEffect(() => {
    fetchLogs(true);
    fetchStats();
  }, [activityTypeFilter, statusFilter, dateFilter, searchTerm]);

  const fetchLogs = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;

      // Build filters
      const filters = {};
      if (activityTypeFilter !== 'all') {
        filters.activity_type = activityTypeFilter;
      }
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (dateFilter !== 'all') {
        const dateFrom = new Date();
        switch (dateFilter) {
          case '24hours':
            dateFrom.setHours(dateFrom.getHours() - 24);
            break;
          case '7days':
            dateFrom.setDate(dateFrom.getDate() - 7);
            break;
          case '30days':
            dateFrom.setDate(dateFrom.getDate() - 30);
            break;
          default:
            break;
        }
        if (dateFilter !== 'all') {
          filters.date_from = dateFrom.toISOString();
        }
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const { data, count, error: fetchError } = await getAdminActivityLogs(filters, currentPage, PAGE_SIZE);

      if (fetchError) throw new Error(fetchError);

      if (reset) {
        setLogs(data || []);
      } else {
        setLogs(prev => [...prev, ...(data || [])]);
      }

      setTotalCount(count || 0);
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStats = async () => {
    const days = dateFilter === '24hours' ? 1 : dateFilter === '7days' ? 7 : 30;
    const { data } = await getActivityStats(days);
    setStats(data);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    fetchLogs(false);
  };

  const getActivityIcon = (type) => {
    for (const category of Object.values(activityCategories)) {
      const found = category.find(item => item.type === type);
      if (found) {
        const Icon = found.icon;
        return <Icon className={`w-4 h-4 ${found.color}`} />;
      }
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getEmailTypeInfo = (emailType) => {
    return emailTypeLabels[emailType] || { label: emailType, icon: Mail };
  };

  // Filter logs by search
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const search = searchTerm.toLowerCase();
    return logs.filter(log =>
      log.description?.toLowerCase().includes(search) ||
      log.target_name?.toLowerCase().includes(search) ||
      log.activity_name?.toLowerCase().includes(search) ||
      log.user_name?.toLowerCase().includes(search)
    );
  }, [logs, searchTerm]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Actions - Moved to Filters */}

      {/* Stats Cards */}
      {stats && (
        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-2 no-scrollbar px-1">
          {/* Total */}
          <div className="bg-white rounded-lg border border-gray-100 p-2 min-w-[70px] flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-blue-600 mb-1" />
            <p className="text-sm font-bold text-gray-900 leading-tight">{stats.total}</p>
            <p className="text-[9px] text-gray-400">Total</p>
          </div>

          {/* Sent */}
          <div className="bg-white rounded-lg border border-gray-100 p-2 min-w-[70px] flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
            <MailCheck className="w-3.5 h-3.5 text-green-600 mb-1" />
            <p className="text-sm font-bold text-gray-900 leading-tight">{stats.emails.sent}</p>
            <p className="text-[9px] text-gray-400">Sent</p>
          </div>

          {/* Failed */}
          <div className="bg-white rounded-lg border border-gray-100 p-2 min-w-[70px] flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
            <MailX className="w-3.5 h-3.5 text-red-600 mb-1" />
            <p className="text-sm font-bold text-gray-900 leading-tight">{stats.emails.failed}</p>
            <p className="text-[9px] text-gray-400">Failed</p>
          </div>

          {/* Successful */}
          <div className="bg-white rounded-lg border border-gray-100 p-2 min-w-[70px] flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mb-1" />
            <p className="text-sm font-bold text-gray-900 leading-tight">{stats.byStatus.success}</p>
            <p className="text-[9px] text-gray-400">Success</p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-lg border border-gray-100 p-2 min-w-[70px] flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-600 mb-1" />
            <p className="text-sm font-bold text-gray-900 leading-tight">{stats.byStatus.pending}</p>
            <p className="text-[9px] text-gray-400">Pending</p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Refresh & Export */}
            <div className="flex items-center gap-2 flex-shrink-0">

              <button className="flex items-center gap-1.5 px-2 py-2 md:px-3 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-medium whitespace-nowrap active:bg-gray-50">
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
            {/* Search removed - available in header */}



            {/* Status Filter (Dropdown) */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm flex-shrink-0 min-w-[110px]"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm flex-shrink-0"
            >
              <option value="24hours">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
          Showing {filteredLogs.length} of {totalCount} activities
        </div>

        {/* Logs List */}
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Activity className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">No activities found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || activityTypeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Activities will appear here as they occur'
                }
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                onClick={() => setSelectedLog(log)}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 p-1.5 rounded-lg mt-0.5 ${log.status === 'failed' ? 'bg-red-50' :
                  log.status === 'pending' ? 'bg-amber-50' :
                    'bg-gray-50'
                  }`}>
                  {React.cloneElement(getActivityIcon(log.activity_type), { className: "w-4 h-4" })}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
                      {log.activity_name}
                      {log.target_name && <span className="text-gray-400 font-normal ml-1">· {log.target_name}</span>}
                    </h4>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap mt-0.5">
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {log.description}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="scale-75 origin-left -ml-1">
                      {getStatusBadge(log.status)}
                    </div>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3 opacity-70" />
                      {log.user_name}
                    </span>
                    {log.details?.amount && (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 border-l border-gray-200 pl-2">
                        <IndianRupee className="w-2.5 h-2.5" />
                        {log.details.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && !loading && filteredLogs.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-600 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Click outside handler for dropdown */}
      {
        showFilters && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowFilters(false)}
          />
        )
      }

      {/* Detail Modal */}
      {
        selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Activity Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gray-50">
                    {getActivityIcon(selectedLog.activity_type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedLog.activity_name}</h4>
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-gray-700">{selectedLog.description}</p>

                  {selectedLog.target_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Recipient:</span>
                      <span className="font-medium text-gray-900">{selectedLog.target_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Triggered by:</span>
                    <span className="font-medium text-gray-900">{selectedLog.user_name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedLog.created_at)}</span>
                  </div>
                </div>

                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Additional Details</h5>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {selectedLog.details.email_type && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Email Type:</span>
                          <span className="font-medium text-gray-900">
                            {getEmailTypeInfo(selectedLog.details.email_type).label}
                          </span>
                        </div>
                      )}
                      {selectedLog.details.subject && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Subject:</span>
                          <span className="font-medium text-gray-900">{selectedLog.details.subject}</span>
                        </div>
                      )}
                      {selectedLog.details.amount && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Amount:</span>
                          <span className="font-medium text-emerald-600">₹{selectedLog.details.amount.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedLog.details.order_id && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Order ID:</span>
                          <span className="font-mono text-gray-900">{selectedLog.details.order_id}</span>
                        </div>
                      )}
                      {selectedLog.details.error_message && (
                        <div className="text-sm">
                          <span className="text-gray-500">Error:</span>
                          <p className="mt-1 text-red-600 bg-red-50 rounded-lg p-2 text-xs font-mono">
                            {selectedLog.details.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminActivityLogs;
