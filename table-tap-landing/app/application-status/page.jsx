'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building2,
    Mail,
    Phone,
    Calendar,
    FileText,
    RefreshCw,
    Search,
    CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import siteConfig from '../data/site-config.json';

const statusConfig = {
    pending_review: {
        label: 'Pending Review',
        color: 'yellow',
        icon: Clock,
        message: 'Your application is waiting to be reviewed by our team. This usually takes 24-48 hours.',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500'
    },
    under_review: {
        label: 'Under Review',
        color: 'blue',
        icon: FileText,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500',
        message: 'Our team is currently reviewing your application. We&apos;ll notify you once the review is complete.',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500'
    },
    approved: {
        label: 'Approved',
        color: 'green',
        icon: CheckCircle,
        message: 'Congratulations! Your application has been approved. You should receive login credentials via email shortly.',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-500'
    },
    rejected: {
        label: 'Rejected',
        color: 'red',
        icon: XCircle,
        message: 'Unfortunately, your application was not approved. Please check your email for more details or contact support.',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500'
    },
    requires_info: {
        label: 'Additional Info Required',
        color: 'orange',
        icon: AlertCircle,
        message: 'We need additional information to process your application. Please check your email for details.',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-500'
    }
};

function StatusContent() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [razorpayKeyId, setRazorpayKeyId] = useState(null);
    const { company, logo } = useSettings();

    const logoUrl = logo?.url || "/logo.png";
    const companyName = company?.name || "Table Tap";
    const supportEmail = company?.email || siteConfig.contact.supportEmail;
    const supportPhone = company?.phone || siteConfig.contact.phone;

    // Fetch Razorpay Key
    useEffect(() => {
        const fetchPaymentConfig = async () => {
            try {
                const { data, error } = await supabase.functions.invoke('get-payment-config');
                if (data?.key_id) setRazorpayKeyId(data.key_id);
            } catch (err) {
                console.error('Failed to load payment config:', err);
                if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
                    setRazorpayKeyId(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
                }
            }
        };
        fetchPaymentConfig();
    }, []);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async (app) => {
        setProcessingPayment(true);
        setPaymentError(null);

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setPaymentError('Failed to load payment gateway');
            setProcessingPayment(false);
            return;
        }

        const amount = app.total_amount || app.plan_price;
        const amountInPaise = Math.round(parseFloat(amount) * 100);

        const options = {
            key: razorpayKeyId,
            amount: amountInPaise,
            currency: 'INR',
            name: 'Table Tap',
            description: `Payment for ${app.restaurant_name}`,
            image: logoUrl,
            prefill: {
                name: app.owner_name,
                email: app.owner_email,
                contact: app.owner_phone
            },
            notes: {
                registration_id: app.id
            },
            theme: { color: '#2A9D8F' },
            handler: async function (response) {
                try {
                    // Update Registration in DB
                    const { error } = await supabase
                        .from('restaurant_registrations')
                        .update({
                            payment_id: response.razorpay_payment_id,
                            payment_status: 'success',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', app.id);

                    if (error) throw error;

                    // Refresh data
                    handleSearch(app.owner_email);
                    alert('Payment Successful!');
                } catch (err) {
                    console.error('Payment update failed:', err);
                    setPaymentError('Payment successful but failed to update status. Please contact support.');
                } finally {
                    setProcessingPayment(false);
                }
            },
            modal: {
                ondismiss: function () {
                    setProcessingPayment(false);
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
            setPaymentError(response.error.description);
            setProcessingPayment(false);
        });
        rzp.open();
    };

    // Auto-search if email is in URL
    useEffect(() => {
        const urlEmail = searchParams.get('email');
        if (urlEmail) {
            setEmail(urlEmail);
            handleSearch(urlEmail);
        }
    }, [searchParams, handleSearch]);

    const handleSearch = useCallback(async (searchEmail = email) => {
        if (!searchEmail || !searchEmail.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const { data, error: fetchError } = await supabase
                .from('restaurant_registrations')
                .select('*')
                .eq('owner_email', searchEmail.toLowerCase().trim())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    setError('No application found with this email address.');
                    setApplication(null);
                } else {
                    throw fetchError;
                }
            } else {
                setApplication(data);
            }
        } catch (err) {
            console.error('Error fetching application:', err);
            setError('Failed to fetch application status. Please try again.');
            setApplication(null);
        } finally {
            setLoading(false);
        }
    }, [email]); // Added email as dependency since it's used as default param

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const status = application ? statusConfig[application.status] || statusConfig.pending_review : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src={logoUrl} alt={companyName} width={140} height={56} className="h-12 w-auto" />
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                        <ArrowLeft size={18} /> Back to Home
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12">
                <div className="max-w-2xl mx-auto">
                    {/* Title */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
                            Application Status
                        </h1>
                        <p className="text-gray-500 font-bold">
                            Track the status of your restaurant registration
                        </p>
                    </div>

                    {/* Search Box */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-8">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-3">
                            Enter your email address
                        </label>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="your@email.com"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                />
                            </div>
                            <button
                                onClick={() => handleSearch()}
                                disabled={loading}
                                className="px-6 py-4 bg-[#2A9D8F] text-white rounded-2xl font-black flex items-center gap-2 hover:bg-[#238b7e] transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <RefreshCw className="animate-spin" size={20} />
                                ) : (
                                    <Search size={20} />
                                )}
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-3 text-red-500 font-bold text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Application Status */}
                    {application && status && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Status Card */}
                            <div className={`${status.bgColor} ${status.borderColor} border-2 rounded-3xl p-8`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 ${status.bgColor} rounded-2xl flex items-center justify-center`}>
                                        <status.icon className={status.iconColor} size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className={`text-2xl font-black ${status.textColor} mb-2`}>
                                            {status.label}
                                        </h2>
                                        <p className={`${status.textColor} font-bold opacity-80`}>
                                            {status.message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Application Details */}
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <Building2 className="text-[#2A9D8F]" size={24} />
                                    Application Details
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Restaurant Name</p>
                                            <p className="font-black text-gray-900">{application.restaurant_name}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Owner Name</p>
                                            <p className="font-black text-gray-900">{application.owner_name}</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Email</p>
                                            <p className="font-bold text-gray-700 text-sm">{application.owner_email}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Phone</p>
                                            <p className="font-bold text-gray-700">{application.owner_phone}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Location</p>
                                        <p className="font-bold text-gray-700">{application.city}, {application.state}</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Selected Plan</p>
                                            <p className="font-black text-[#2A9D8F] capitalize">{application.selected_plan}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Submitted On</p>
                                            <p className="font-bold text-gray-700 text-sm">{formatDate(application.created_at)}</p>
                                        </div>
                                    </div>

                                    {application.payment_id ? (
                                        <div className="bg-green-50 rounded-2xl p-4">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-green-600 mb-1">Payment Status</p>
                                            <p className="font-black text-green-700">Paid ✓</p>
                                            <p className="text-xs text-green-600 mt-1">ID: {application.payment_id}</p>
                                        </div>
                                    ) : (application.plan_price > 0 || (application.total_amount && application.total_amount !== 'Custom')) && (
                                        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-wider text-indigo-600 mb-1">Payment Status</p>
                                                    <p className="font-black text-indigo-900 text-lg">Pending Payment</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-indigo-600">Amount Due</p>
                                                    <p className="font-black text-2xl text-indigo-900">₹{application.total_amount || application.plan_price}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handlePayment(application)}
                                                disabled={processingPayment}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {processingPayment ? (
                                                    <RefreshCw className="animate-spin" size={20} />
                                                ) : (
                                                    <CreditCard size={20} />
                                                )}
                                                {processingPayment ? 'Processing...' : 'Complete Payment Now'}
                                            </button>
                                            {paymentError && (
                                                <p className="mt-3 text-red-500 text-sm font-bold text-center bg-white p-2 rounded-lg border border-red-100">
                                                    {paymentError}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Help Section */}
                            <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                                <h4 className="font-black text-blue-900 mb-2">Need Help?</h4>
                                <p className="text-blue-700 text-sm font-bold mb-4">
                                    If you have any questions about your application, feel free to contact us.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <a
                                        href={`mailto:${supportEmail}`}
                                        className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                                    >
                                        <Mail size={16} />
                                        {supportEmail}
                                    </a>
                                    <a
                                        href={`tel:${supportPhone.replace(/\s/g, '')}`}
                                        className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                                    >
                                        <Phone size={16} />
                                        {supportPhone}
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* No Application Found */}
                    {searched && !application && !loading && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 rounded-3xl p-12 text-center"
                        >
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">No Application Found</h3>
                            <p className="text-gray-500 font-bold mb-6">
                                We couldn&apos;t find any application with this email address.
                            </p>
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2A9D8F] text-white rounded-2xl font-black hover:bg-[#238b7e] transition-colors"
                            >
                                Register Your Restaurant
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ApplicationStatusPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F]"></div>
            </div>
        }>
            <StatusContent />
        </Suspense>
    );
}
