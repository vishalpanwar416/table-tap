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
        <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-5 md:overflow-visible px-0.5">
          {/* Total Activities */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[140px] md:min-w-0 flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{stats.total}</p>
                <p className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">Total Activities</p>
              </div>
            </div>
          </div>

          {/* Emails Sent */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[140px] md:min-w-0 flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg shrink-0">
                <MailCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{stats.emails.sent}</p>
                <p className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">Emails Sent</p>
              </div>
            </div>
          </div>

          {/* Emails Failed */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[140px] md:min-w-0 flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <MailX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{stats.emails.failed}</p>
                <p className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">Emails Failed</p>
              </div>
            </div>
          </div>

          {/* Successful */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[140px] md:min-w-0 flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{stats.byStatus.success}</p>
                <p className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">Successful</p>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 min-w-[140px] md:min-w-0 flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{stats.byStatus.pending}</p>
                <p className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">Pending</p>
              </div>
            </div>
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

            {/* Activity Type Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-2 py-2 md:px-3 md:gap-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all text-xs font-medium text-gray-700 min-w-0 md:min-w-[120px] justify-between whitespace-nowrap shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden md:inline">
                    {activityTypeFilter === 'all' ? 'All Types' :
                      Object.values(activityCategories).flat().find(a => a.type === activityTypeFilter)?.label || activityTypeFilter}
                  </span>
                  <span className="md:hidden">
                    {activityTypeFilter === 'all' ? 'Type' : 'Filt.'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={() => { setActivityTypeFilter('all'); setShowFilters(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activityTypeFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                      All Types
                    </button>
                  </div>
                  {Object.entries(activityCategories).map(([category, types]) => (
                    <div key={category} className="border-t border-gray-100">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        {category}
                      </div>
                      <div className="p-2">
                        {types.map(({ type, label, icon: Icon, color }) => (
                          <button
                            key={type}
                            onClick={() => { setActivityTypeFilter(type); setShowFilters(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${activityTypeFilter === type ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                          >
                            <Icon className={`w-4 h-4 ${color}`} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
              {[
                { value: 'all', label: 'All', icon: null },
                { value: 'success', label: 'Success', icon: CheckCircle },
                { value: 'failed', label: 'Failed', icon: XCircle },
                { value: 'pending', label: 'Pending', icon: Clock }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${statusFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  title={label}
                >
                  {Icon ? (
                    <>
                      <Icon className="w-3.5 h-3.5 md:hidden" />
                      <span className="hidden md:inline">{label}</span>
                    </>
                  ) : (
                    label
                  )}
                </button>
              ))}
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
                className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 p-2.5 rounded-xl ${log.status === 'failed' ? 'bg-red-50' :
                  log.status === 'pending' ? 'bg-amber-50' :
                    'bg-gray-50'
                  }`}>
                  {getActivityIcon(log.activity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {log.activity_name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {log.description}
                      </p>
                      {log.target_name && (
                        <p className="text-xs text-gray-400 mt-1">
                          To: {log.target_name}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.user_name}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(log.created_at)}
                    </span>
                    {log.details?.amount && (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {log.details.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
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
