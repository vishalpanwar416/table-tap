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
    Search,
    Send,
    Eye,
    Zap,
    Star,
    Crown
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';
import {
    createInvoiceData,
    generateProfessionalInvoiceHTML,
    printInvoice,
    generateInvoicePDF,
    generateInvoiceNumber,
    COMPANY_DETAILS
} from '../../../shared/utils/invoiceGenerator';
import {
    getRestaurantInvoices,
    sendInvoiceEmail,
    getCompanyDetails
} from '../../../shared/api/invoiceService';
import { applyTemplate } from '../../../shared/api/emailService';
import { getEmailTemplate } from '../../../admin/pages/AdminPannel/admin_service.js';

const BillingInvoice = ({ isOpen, onClose, restaurantId, restaurant }) => {
    const [subscription, setSubscription] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, history, invoices
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [companyDetails, setCompanyDetails] = useState(COMPANY_DETAILS);
    const [processingId, setProcessingId] = useState(null);
    const [previewInvoice, setPreviewInvoice] = useState(null);

    // Mock plans if not provided by parent, though SubscriptionSection usually has them
    // For icon consistency in BillingInvoice
    const plans = {
        'Basic': { icon: Zap },
        'Professional': { icon: Star },
        'Premium': { icon: Crown }
    };

    useEffect(() => {
        if (isOpen && restaurantId) {
            fetchSubscriptionData();
            fetchPaymentHistory();
            fetchInvoices();
            fetchCompanyDetails();
        }
    }, [isOpen, restaurantId]);

    const fetchInvoices = async () => {
        try {
            const { data, error } = await getRestaurantInvoices(restaurantId);
            if (error) throw error;
            setInvoices(data || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
        }
    };

    const fetchCompanyDetails = async () => {
        try {
            const { data } = await getCompanyDetails();
            if (data) {
                setCompanyDetails(data);
            }
        } catch (err) {
            console.error('Error fetching company details:', err);
        }
    };

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
            case 'grace_period': return 'bg-primary-100 text-primary-700 border-primary-200';
            case 'expired': return 'bg-red-100 text-red-700 border-red-200';
            case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'purchased': return 'bg-green-100 text-green-700';
            case 'renewed': return 'bg-blue-100 text-blue-700';
            case 'upgraded': return 'bg-primary-100 text-primary-700';
            case 'downgraded': return 'bg-primary-100 text-primary-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'expired': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDaysRemaining = () => {
        if (!subscription?.end_date) return 0;
        const days = Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    };

    // Create invoice data from payment/history record
    const getInvoiceDataFromPayment = (payment) => {
        const invoiceNumber = payment.invoice_number ||
            `INV-${payment.id?.slice(0, 8).toUpperCase() || generateInvoiceNumber()}`;

        return createInvoiceData({
            transaction: {
                id: payment.id,
                created_at: payment.created_at,
                amount_paid: payment.amount_paid,
                gst_amount: payment.gst_amount || (payment.amount_paid - payment.amount_paid / 1.18),
                plan_name: payment.new_plan || subscription?.plan_name,
                billing_cycle: subscription?.billing_cycle,
                payment_reference: payment.payment_reference
            },
            restaurant: restaurant,
            subscription: subscription,
            invoiceNumber: invoiceNumber,
            companyDetails: companyDetails
        });
    };

    // Download invoice as PDF
    const handleDownloadInvoice = async (payment) => {
        try {
            setProcessingId(`download-${payment.id}`);
            const invoiceData = getInvoiceDataFromPayment(payment);
            await generateInvoicePDF(invoiceData);
        } catch (err) {
            console.error('Error downloading invoice:', err);
            // Fallback to HTML download
            const invoiceData = getInvoiceDataFromPayment(payment);
            const html = generateProfessionalInvoiceHTML(invoiceData);
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice-${invoiceData.invoiceNumber}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            setProcessingId(null);
        }
    };

    // Print invoice
    const handlePrintInvoice = (payment) => {
        const invoiceData = getInvoiceDataFromPayment(payment);
        printInvoice(invoiceData);
    };

    // Preview invoice in modal
    const handlePreviewInvoice = (payment) => {
        const invoiceData = getInvoiceDataFromPayment(payment);
        setPreviewInvoice(invoiceData);
    };

    // Send invoice email
    const handleSendInvoiceEmail = async (payment) => {
        if (!restaurant?.contact_email) {
            alert('No email address configured for this restaurant');
            return;
        }

        try {
            setProcessingId(`email-${payment.id}`);

            // Try to find existing invoice record
            const existingInvoice = invoices.find(inv =>
                inv.subscription_history_id === payment.id
            );

            if (existingInvoice) {
                const { error } = await sendInvoiceEmail(existingInvoice.id);
                if (error) throw new Error(error);
            } else {
                // Send email directly using edge function
                const invoiceData = getInvoiceDataFromPayment(payment);

                // Fetch template
                const template = await getEmailTemplate('email_template_invoice');
                let subject = `Invoice ${invoiceData.invoiceNumber} from TableTap`;
                let html = `<p>Please find your invoice attached.</p><p>Invoice Number: ${invoiceData.invoiceNumber}</p><p>Amount: ₹${payment.amount_paid}</p>`;

                if (template) {
                    const amount = Number(payment.amount_paid);
                    let subtotal, gst;
                    if (payment.gst_amount) {
                        gst = Number(payment.gst_amount).toFixed(2);
                        subtotal = (amount - Number(gst)).toFixed(2);
                    } else {
                        subtotal = (amount / 1.18).toFixed(2);
                        gst = (amount - Number(subtotal)).toFixed(2);
                    }

                    const vars = {
                        invoice_number: invoiceData.invoiceNumber,
                        date: formatDate(payment.created_at),
                        restaurant_name: restaurant.name,
                        plan_name: payment.new_plan || subscription?.plan_name || 'Professional',
                        billing_cycle: subscription?.billing_cycle || 'Monthly',
                        subtotal: subtotal,
                        gst: gst,
                        total_paid: amount.toFixed(2),
                        year: new Date().getFullYear()
                    };

                    const applied = applyTemplate(template.subject, template.html, vars);
                    subject = applied.subject;
                    html = applied.html;
                }

                const { error } = await supabase.functions.invoke('send-email', {
                    body: {
                        to: restaurant.contact_email,
                        subject: subject,
                        html: html,
                        text: `Invoice ${invoiceData.invoiceNumber} for ₹${payment.amount_paid}`
                    }
                });
                if (error) throw error;
            }

            alert(`Invoice sent to ${restaurant.contact_email}`);
            fetchInvoices(); // Refresh to update email status
        } catch (err) {
            console.error('Error sending invoice:', err);
            alert('Failed to send invoice email');
        } finally {
            setProcessingId(null);
        }
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
                <div className="bg-gradient-to-r from-primary-600 to-amber-600 px-4 md:px-6 py-3 md:py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                                <Receipt className="w-4 h-4 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base md:text-xl font-bold text-white leading-tight">Billing & Invoices</h2>
                                <p className="text-primary-100 text-[10px] md:text-sm truncate max-w-[150px] md:max-w-none">{restaurant?.name || 'Restaurant'}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors"
                        >
                            <X className="w-4 h-4 md:w-6 md:h-6 text-white" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 md:gap-2 mt-4 md:mt-6 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: CreditCard },
                            { id: 'history', label: 'History', icon: Clock },
                            { id: 'invoices', label: 'Invoices', icon: FileText }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-primary-600'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                <tab.icon className="w-3 h-3 md:w-4 md:h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100vh-180px)] p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Current Plan Card */}
                                    <div className="bg-gradient-to-br from-primary-50 to-amber-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-primary-100 shadow-sm">
                                        <div className="flex flex-row items-center justify-between mb-3 md:mb-6 gap-2">
                                            <div>
                                                <p className="text-[9px] md:text-sm text-primary-600 font-black mb-0.5 md:mb-1 uppercase tracking-widest">Plan</p>
                                                <h3 className="text-base md:text-2xl font-black text-gray-900 capitalize leading-none">
                                                    {subscription?.plan_name || 'No Active Plan'}
                                                </h3>
                                            </div>
                                            {subscription && (
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-xs font-black border uppercase tracking-tighter ${getStatusColor(subscription.status)}`}>
                                                    {subscription.status?.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>

                                        {subscription ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                                                <div className="bg-white rounded-lg md:rounded-xl p-2 md:p-4 border border-primary-50/50 shadow-sm">
                                                    <p className="text-[8px] md:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 md:mb-1 text-center sm:text-left">Billing</p>
                                                    <p className="text-[11px] md:text-base font-black text-gray-900 capitalize text-center sm:text-left truncate">{subscription.billing_cycle}</p>
                                                </div>
                                                <div className="bg-white rounded-lg md:rounded-xl p-2 md:p-4 border border-primary-50/50 shadow-sm">
                                                    <p className="text-[8px] md:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 md:mb-1 text-center sm:text-left">Amount</p>
                                                    <p className="text-[11px] md:text-base font-black text-gray-900 text-center sm:text-left truncate">{formatCurrency(subscription.total_amount)}</p>
                                                </div>
                                                <div className="bg-white rounded-lg md:rounded-xl p-2 md:p-4 border border-primary-50/50 shadow-sm">
                                                    <p className="text-[8px] md:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 md:mb-1 text-center sm:text-left">Until</p>
                                                    <p className="text-[11px] md:text-base font-black text-gray-900 text-center sm:text-left truncate">{formatDate(subscription.end_date)}</p>
                                                </div>
                                                <div className="bg-white rounded-lg md:rounded-xl p-2 md:p-4 border border-primary-50/50 shadow-sm">
                                                    <p className="text-[8px] md:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 md:mb-1 text-center sm:text-left">Days</p>
                                                    <p className={`text-[11px] md:text-base font-black text-center sm:text-left truncate ${getDaysRemaining() < 7 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {getDaysRemaining()}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] md:text-sm text-gray-500 italic">No active subscription found.</p>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4">
                                        <div className="bg-white rounded-lg md:rounded-xl p-2.5 md:p-5 border border-gray-100 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                                            <div className="flex items-center gap-1.5 md:gap-3 mb-1 md:mb-3">
                                                <div className="p-1 md:p-2 bg-green-50 rounded-lg">
                                                    <IndianRupee className="w-3 h-3 md:w-5 md:h-5 text-green-600" />
                                                </div>
                                                <p className="hidden sm:block text-[10px] md:text-sm text-gray-500 font-bold">Paid</p>
                                            </div>
                                            <p className="text-[11px] md:text-2xl font-black text-gray-900 truncate w-full">
                                                {formatCurrency(paymentHistory.reduce((sum, p) => sum + (p.amount_paid || 0), 0))}
                                            </p>
                                            <p className="sm:hidden text-[8px] text-gray-400 font-bold uppercase mt-0.5">Total Paid</p>
                                        </div>

                                        <div className="bg-white rounded-lg md:rounded-xl p-2.5 md:p-5 border border-gray-100 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                                            <div className="flex items-center gap-1.5 md:gap-3 mb-1 md:mb-3">
                                                <div className="p-1 md:p-2 bg-blue-50 rounded-lg">
                                                    <Receipt className="w-3 h-3 md:w-5 md:h-5 text-blue-600" />
                                                </div>
                                                <p className="hidden sm:block text-[10px] md:text-sm text-gray-500 font-bold">Invoices</p>
                                            </div>
                                            <p className="text-[11px] md:text-2xl font-black text-gray-900 truncate w-full">
                                                {paymentHistory.filter(p => p.amount_paid > 0).length}
                                            </p>
                                            <p className="sm:hidden text-[8px] text-gray-400 font-bold uppercase mt-0.5">Invoices</p>
                                        </div>

                                        <div className="bg-white rounded-lg md:rounded-xl p-2.5 md:p-5 border border-gray-100 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                                            <div className="flex items-center gap-1.5 md:gap-3 mb-1 md:mb-3">
                                                <div className="p-1 md:p-2 bg-primary-50 rounded-lg">
                                                    <Calendar className="w-3 h-3 md:w-5 md:h-5 text-primary-600" />
                                                </div>
                                                <p className="hidden sm:block text-[10px] md:text-sm text-gray-500 font-bold">Joined</p>
                                            </div>
                                            <p className="text-[10px] md:text-xl font-black text-gray-900 truncate w-full">
                                                {formatDate(paymentHistory[paymentHistory.length - 1]?.created_at || subscription?.start_date)}
                                            </p>
                                            <p className="sm:hidden text-[8px] text-gray-400 font-bold uppercase mt-0.5">Member Since</p>
                                        </div>
                                    </div>

                                    {/* Billing Details */}
                                    {restaurant && (
                                        <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200">
                                            <h4 className="text-sm md:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Building className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                                Billing Information
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm">
                                                <div>
                                                    <p className="text-gray-500 mb-0.5 md:mb-1">Business Name</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-0.5 md:mb-1">Email</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.contact_email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-0.5 md:mb-1">Phone</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.contact_phone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 mb-0.5 md:mb-1">GST Number</p>
                                                    <p className="font-semibold text-gray-900">{restaurant?.gst_number || 'N/A'}</p>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <p className="text-gray-500 mb-0.5 md:mb-1">Address</p>
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
                                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search payments..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                            />
                                        </div>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
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
                                            <RefreshCw className="w-6 h-6 text-primary-600 animate-spin" />
                                        </div>
                                    ) : filteredHistory.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No payment history found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 md:space-y-3">
                                            {filteredHistory.map((item, index) => (
                                                <div
                                                    key={item.id || index}
                                                    className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 hover:border-primary-200 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${getActionColor(item.action)}`}>
                                                                {item.action === 'purchased' && <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />}
                                                                {item.action === 'renewed' && <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />}
                                                                {item.action === 'cancelled' && <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />}
                                                                {!['purchased', 'renewed', 'cancelled'].includes(item.action) && <CreditCard className="w-4 h-4 md:w-5 md:h-5" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm md:text-base font-semibold text-gray-900 capitalize truncate">{item.action}</p>
                                                                <p className="text-xs text-gray-500 truncate">{item.notes || 'No description'}</p>
                                                                <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">{formatDateTime(item.created_at)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            {item.amount_paid > 0 && (
                                                                <p className="text-sm md:text-base font-bold text-green-600">{formatCurrency(item.amount_paid)}</p>
                                                            )}
                                                            {item.payment_reference && (
                                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                                    ID: {item.payment_reference.slice(-8)}
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
                                            <RefreshCw className="w-6 h-6 text-primary-600 animate-spin" />
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
                                                .map((payment, index) => {
                                                    const existingInvoice = invoices.find(inv =>
                                                        inv.subscription_history_id === payment.id
                                                    );
                                                    const invoiceNumber = existingInvoice?.invoice_number ||
                                                        `INV-${payment.id?.slice(0, 8).toUpperCase() || `${index + 1}`.padStart(4, '0')}`;

                                                    return (
                                                        <div
                                                            key={payment.id || index}
                                                            className="bg-white rounded-xl p-3 md:p-5 border border-gray-200 hover:shadow-md transition-all group"
                                                        >
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2 md:gap-4">
                                                                    <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-primary-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100 shrink-0">
                                                                        <FileText className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs md:text-base font-black text-gray-900 truncate">
                                                                            {invoiceNumber}
                                                                        </p>
                                                                        <p className="text-[10px] md:text-sm text-gray-400 font-medium truncate">
                                                                            {formatDate(payment.created_at)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-4">
                                                                    <div className="text-right">
                                                                        <p className="font-black text-gray-900 text-[13px] md:text-lg">{formatCurrency(payment.amount_paid)}</p>
                                                                        <span className="text-[8px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-lg font-black inline-flex items-center gap-1 uppercase tracking-tighter">
                                                                            <CheckCircle className="w-2.5 h-2.5" />
                                                                            PAID
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-0.5 md:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handlePreviewInvoice(payment)}
                                                                            className="p-1.5 md:p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                            title="Preview"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDownloadInvoice(payment)}
                                                                            disabled={processingId === `download-${payment.id}`}
                                                                            className="p-1.5 md:p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                                            title="Download"
                                                                        >
                                                                            {processingId === `download-${payment.id}` ? (
                                                                                <RefreshCw className="w-3.5 h-3.5 md:w-5 md:h-5 animate-spin" />
                                                                            ) : (
                                                                                <Download className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSendInvoiceEmail(payment)}
                                                                            disabled={processingId === `email-${payment.id}`}
                                                                            className="p-1.5 md:p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                                                                            title="Email"
                                                                        >
                                                                            {processingId === `email-${payment.id}` ? (
                                                                                <RefreshCw className="w-3.5 h-3.5 md:w-5 md:h-5 animate-spin" />
                                                                            ) : (
                                                                                <Send className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* GST Breakdown Row */}
                                                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-2 text-[10px] md:text-xs">
                                                                <div>
                                                                    <span className="text-gray-400">Subtotal:</span>
                                                                    <span className="ml-1 font-semibold text-gray-700">
                                                                        {formatCurrency(payment.amount_paid / 1.18)}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400">GST (18%):</span>
                                                                    <span className="ml-1 font-semibold text-gray-700">
                                                                        {formatCurrency(payment.gst_amount || payment.amount_paid - payment.amount_paid / 1.18)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Invoice Preview Modal */}
            {previewInvoice && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setPreviewInvoice(null)}
                    />
                    <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50 gap-3">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="w-9 h-9 md:w-10 md:h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">Invoice Preview</h3>
                                    <p className="text-[10px] md:text-sm text-gray-500 truncate">{previewInvoice.invoiceNumber}</p>
                                </div>
                                <button
                                    onClick={() => setPreviewInvoice(null)}
                                    className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => printInvoice(previewInvoice)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border sm:border-0"
                                >
                                    <Printer className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    Print
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await generateInvoicePDF(previewInvoice);
                                        } catch {
                                            // Fallback handled in function
                                        }
                                    }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    PDF
                                </button>
                                <button
                                    onClick={() => setPreviewInvoice(null)}
                                    className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div className="flex-1 overflow-auto bg-gray-100 p-2 md:p-6">
                            <div
                                className="bg-white shadow-lg mx-auto overflow-x-auto w-full md:w-auto"
                                style={{ maxWidth: '800px' }}
                                dangerouslySetInnerHTML={{
                                    __html: generateProfessionalInvoiceHTML(previewInvoice)
                                        .replace(/<html[^>]*>|<\/html>|<head>[\s\S]*?<\/head>|<body[^>]*>|<\/body>|<!DOCTYPE[^>]*>/gi, '')
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingInvoice;
