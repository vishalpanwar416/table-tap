import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    Receipt,
    Calendar,
    CreditCard,
    CheckCircle,
    Clock,
    AlertTriangle,
    FileText,
    Printer,
    ChevronRight,
    RefreshCw,
    IndianRupee,
    Building,
    Mail,
    Phone,
    ExternalLink,
    Filter,
    Search
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';

const BillingInvoice = ({ isOpen, onClose, restaurantId, restaurant }) => {
    const [subscription, setSubscription] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, history, invoices
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && restaurantId) {
            fetchSubscriptionData();
            fetchPaymentHistory();
        }
    }, [isOpen, restaurantId]);

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            setSubscription(data);
        } catch (err) {
            console.error('Error fetching subscription:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentHistory = async () => {
        try {
            setHistoryLoading(true);
            const { data, error } = await supabase
                .from('subscription_history')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPaymentHistory(data || []);
        } catch (err) {
            console.error('Error fetching payment history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'grace_period': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'expired': return 'bg-red-100 text-red-700 border-red-200';
            case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'purchased': return 'bg-green-100 text-green-700';
            case 'renewed': return 'bg-blue-100 text-blue-700';
            case 'upgraded': return 'bg-purple-100 text-purple-700';
            case 'downgraded': return 'bg-orange-100 text-orange-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'expired': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDaysRemaining = () => {
        if (!subscription?.end_date) return null;
        const days = Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const generateInvoiceHTML = (payment) => {
        const invoiceNumber = `INV-${payment.id?.slice(0, 8).toUpperCase() || 'N/A'}`;
        const invoiceDate = formatDate(payment.created_at);
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice ${invoiceNumber}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
        .logo { font-size: 28px; font-weight: 800; color: #7C3AED; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { margin: 0; color: #333; font-size: 24px; }
        .invoice-title p { margin: 5px 0 0; color: #666; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .detail-box h4 { margin: 0 0 10px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .detail-box p { margin: 5px 0; color: #333; }
        .items { margin-bottom: 40px; }
        .items table { width: 100%; border-collapse: collapse; }
        .items th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #eee; }
        .items td { padding: 16px 12px; border-bottom: 1px solid #eee; }
        .items .amount { text-align: right; }
        .totals { margin-left: auto; width: 300px; }
        .totals .row { display: flex; justify-content: space-between; padding: 8px 0; }
        .totals .row.total { border-top: 2px solid #333; font-weight: 700; font-size: 18px; padding-top: 12px; margin-top: 8px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; border-radius: 20px; font-size: 12px; font-weight: 600; }
        @media print { body { background: white; padding: 0; } .invoice { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div class="logo">TableTap</div>
            <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>${invoiceNumber}</p>
            </div>
        </div>
        
        <div class="details">
            <div class="detail-box">
                <h4>Bill To</h4>
                <p><strong>${restaurant?.name || 'Restaurant'}</strong></p>
                <p>${restaurant?.address || ''}</p>
                <p>${restaurant?.contact_email || ''}</p>
                <p>${restaurant?.contact_phone || ''}</p>
                ${restaurant?.gst_number ? `<p>GST: ${restaurant.gst_number}</p>` : ''}
            </div>
            <div class="detail-box" style="text-align: right;">
                <h4>Invoice Details</h4>
                <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
                <p><strong>Payment ID:</strong> ${payment.payment_reference || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="badge">PAID</span></p>
            </div>
        </div>
        
        <div class="items">
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Period</th>
                        <th class="amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>${payment.notes || 'Subscription'}</strong>
                            <br><small style="color: #666;">Plan: ${subscription?.plan_name?.toUpperCase() || 'N/A'}</small>
                        </td>
                        <td>${subscription?.billing_cycle || 'Monthly'}</td>
                        <td class="amount">${formatCurrency(subscription?.plan_price || payment.amount_paid * 0.85)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="totals">
            <div class="row">
                <span>Subtotal</span>
                <span>${formatCurrency(subscription?.plan_price || payment.amount_paid * 0.85)}</span>
            </div>
            <div class="row">
                <span>GST (18%)</span>
                <span>${formatCurrency(subscription?.gst_amount || payment.amount_paid * 0.15)}</span>
            </div>
            <div class="row total">
                <span>Total</span>
                <span>${formatCurrency(payment.amount_paid)}</span>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>TableTap • support@tabletap.in • www.tabletap.in</p>
        </div>
    </div>
</body>
</html>`;
    };

    const handleDownloadInvoice = (payment) => {
        const html = generateInvoiceHTML(payment);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${payment.id?.slice(0, 8).toUpperCase() || 'N/A'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrintInvoice = (payment) => {
        const html = generateInvoiceHTML(payment);
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
        };
    };

    const filteredHistory = paymentHistory.filter(item => {
        if (filterStatus !== 'all' && item.action !== filterStatus) return false;
        if (searchTerm && !item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !item.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            {/* Slide Panel */}
            <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl transform transition-transform">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Receipt className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Billing & Invoices</h2>
                                <p className="text-purple-200 text-sm">{restaurant?.name || 'Restaurant'}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-6">
                        {[
                            { id: 'overview', label: 'Overview', icon: CreditCard },
                            { id: 'history', label: 'Payment History', icon: Clock },
                            { id: 'invoices', label: 'Invoices', icon: FileText }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white text-purple-600'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100vh-180px)] p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Current Plan Card */}
                                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <p className="text-sm text-purple-600 font-semibold mb-1">Current Plan</p>
                                                <h3 className="text-2xl font-bold text-gray-900 capitalize">
                                                    {subscription?.plan_name || 'No Active Plan'}
                                                </h3>
                                            </div>
                                            {subscription && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(subscription.status)}`}>
                                                    {subscription.status?.replace('_', ' ').toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {subscription ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white rounded-xl p-4">
                                                    <p className="text-xs text-gray-500 mb-1">Billing Cycle</p>
                                                    <p className="font-bold text-gray-900 capitalize">{subscription.billing_cycle}</p>
                                                </div>
                                                <div className="bg-white rounded-xl p-4">
                                                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                                                    <p className="font-bold text-gray-900">{formatCurrency(subscription.total_amount)}</p>
                                                </div>
                                                <div className="bg-white rounded-xl p-4">
                                                    <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                                                    <p className="font-bold text-gray-900">{formatDate(subscription.end_date)}</p>
                                                </div>
                                                <div className="bg-white rounded-xl p-4">
                                                    <p className="text-xs text-gray-500 mb-1">Days Remaining</p>
                                                    <p className={`font-bold ${getDaysRemaining() < 7 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {getDaysRemaining()} days
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No active subscription found.</p>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-xl p-5 border border-gray-200">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <IndianRupee className="w-5 h-5 text-green-600" />
                                                </div>
                                                <p className="text-sm text-gray-600">Total Paid</p>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(paymentHistory.reduce((sum, p) => sum + (p.amount_paid || 0), 0))}
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-xl p-5 border border-gray-200">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Receipt className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <p className="text-sm text-gray-600">Total Invoices</p>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {paymentHistory.filter(p => p.amount_paid > 0).length}
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-xl p-5 border border-gray-200">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <Calendar className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <p className="text-sm text-gray-600">Member Since</p>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatDate(paymentHistory[paymentHistory.length - 1]?.created_at || subscription?.start_date)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Billing Details */}
                                    {subscription && (
                                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Building className="w-5 h-5 text-gray-400" />
                                                Billing Information
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 mb-1">Business Name</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-1">Email</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.contact_email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-1">Phone</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.contact_phone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-1">GST Number</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.gst_number || 'N/A'}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-gray-500 mb-1">Address</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.address || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* History Tab */}
                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    {/* Filters */}
                                    <div className="flex flex-wrap gap-3">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by payment ID or description..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                            />
                                        </div>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                        >
                                            <option value="all">All Actions</option>
                                            <option value="purchased">Purchased</option>
                                            <option value="renewed">Renewed</option>
                                            <option value="upgraded">Upgraded</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    {/* History List */}
                                    {historyLoading ? (
                                        <div className="flex items-center justify-center h-32">
                                            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                                        </div>
                                    ) : filteredHistory.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No payment history found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredHistory.map((item, index) => (
                                                <div
                                                    key={item.id || index}
                                                    className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-200 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActionColor(item.action)}`}>
                                                                {item.action === 'purchased' && <CheckCircle className="w-5 h-5" />}
                                                                {item.action === 'renewed' && <RefreshCw className="w-5 h-5" />}
                                                                {item.action === 'cancelled' && <AlertTriangle className="w-5 h-5" />}
                                                                {!['purchased', 'renewed', 'cancelled'].includes(item.action) && <CreditCard className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900 capitalize">{item.action}</p>
                                                                <p className="text-sm text-gray-500">{item.notes || 'No description'}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{formatDateTime(item.created_at)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {item.amount_paid > 0 && (
                                                                <p className="font-bold text-green-600">{formatCurrency(item.amount_paid)}</p>
                                                            )}
                                                            {item.payment_reference && (
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    ID: {item.payment_reference.slice(0, 12)}...
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Invoices Tab */}
                            {activeTab === 'invoices' && (
                                <div className="space-y-4">
                                    {historyLoading ? (
                                        <div className="flex items-center justify-center h-32">
                                            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                                        </div>
                                    ) : paymentHistory.filter(p => p.amount_paid > 0).length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No invoices available</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {paymentHistory
                                                .filter(p => p.amount_paid > 0)
                                                .map((payment, index) => (
                                                    <div
                                                        key={payment.id || index}
                                                        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                                                    <FileText className="w-6 h-6 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900">
                                                                        INV-{payment.id?.slice(0, 8).toUpperCase() || `${index + 1}`.padStart(4, '0')}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">{payment.notes || 'Subscription Payment'}</p>
                                                                    <p className="text-xs text-gray-400 mt-1">{formatDate(payment.created_at)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right">
                                                                    <p className="font-bold text-gray-900">{formatCurrency(payment.amount_paid)}</p>
                                                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                                                                        PAID
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handlePrintInvoice(payment)}
                                                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                        title="Print Invoice"
                                                                    >
                                                                        <Printer className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDownloadInvoice(payment)}
                                                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                        title="Download Invoice"
                                                                    >
                                                                        <Download className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingInvoice;
