import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Zap,
    Crown,
    RefreshCw,
    ArrowRight,
    Shield,
    Loader2,
    Star,
    TrendingUp,
    Smartphone,
    Wallet,
    ToggleLeft,
    ToggleRight,
    X,
    Info,
    Bell,
    BellOff
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';

const SubscriptionSection = ({ restaurantId }) => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState('monthly');

    const [plans, setPlans] = useState({});
    const [billingCycles, setBillingCycles] = useState({});
    const [masterLoading, setMasterLoading] = useState(true);

    // Autopay state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'upi'
    const [enableAutopay, setEnableAutopay] = useState(true);
    const [autopayUpdating, setAutopayUpdating] = useState(false);

    const ICON_MAP = { Zap, Crown, Star, Shield, CreditCard };

    // Fetch master data (plans and billing cycles)
    const fetchMasterData = async () => {
        try {
            setMasterLoading(true);
            const [plansRes, cyclesRes] = await Promise.all([
                supabase.from('subscription_plans').select('*').eq('is_active', true).order('base_price', { ascending: true }),
                supabase.from('billing_cycles').select('*').eq('is_active', true).order('duration_months', { ascending: true })
            ]);

            if (plansRes.error) throw plansRes.error;
            if (cyclesRes.error) throw cyclesRes.error;

            const plansMap = {};
            plansRes.data.forEach(p => {
                plansMap[p.key] = {
                    ...p,
                    basePrice: p.base_price,
                    icon: ICON_MAP[p.icon] || Zap
                };
            });
            setPlans(plansMap);

            const cyclesMap = {};
            cyclesRes.data.forEach(c => {
                cyclesMap[c.key] = {
                    label: c.label,
                    months: c.duration_months,
                    discount: c.discount_percentage
                };
            });
            setBillingCycles(cyclesMap);
        } catch (err) {
            console.error('Error fetching master data:', err);
            setError('Failed to load plan details. Please refresh.');
        } finally {
            setMasterLoading(false);
        }
    };

    const calculatePrice = (basePrice, cycleKey) => {
        const cycle = billingCycles[cycleKey];
        if (!cycle) return 0;
        const totalBase = basePrice * cycle.months;
        const discountAmount = Math.round(totalBase * (cycle.discount / 100));
        return totalBase - discountAmount;
    };

    // Fetch subscription
    const fetchSubscription = async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .in('status', ['active', 'grace_period', 'expired'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            setSubscription(data);
        } catch (err) {
            console.error('Error fetching subscription:', err);
            setError('Failed to load subscription details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
        fetchSubscription();
    }, [restaurantId]);

    // Calculate days remaining
    const getDaysRemaining = () => {
        if (!subscription?.end_date) return null;
        const days = Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Open payment modal with plan selection
    const openPaymentModal = (planKey, billingCycle = 'monthly') => {
        setSelectedPlan({ planKey, billingCycle });
        setShowPaymentModal(true);
    };

    // Handle Razorpay payment with autopay option
    const handlePayment = async () => {
        if (!selectedPlan) return;
        
        const { planKey, billingCycle } = selectedPlan;
        const plan = plans[planKey];
        if (!plan) return;

        const amount = calculatePrice(plan.basePrice, billingCycle);
        const gst = Math.round(amount * 0.18);
        const total = amount + gst;

        // Check if Razorpay is loaded
        if (!window.Razorpay) {
            alert('Payment gateway is loading. Please try again.');
            return;
        }

        setProcessing(true);
        setShowPaymentModal(false);

        try {
            // Get restaurant details
            const { data: restaurantData } = await supabase
                .from('restaurants')
                .select('razorpay_key_id, name, contact_email, contact_phone')
                .eq('id', restaurantId)
                .maybeSingle();

            const razorpayKey = restaurantData?.razorpay_key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;

            if (!razorpayKey) {
                alert('Payment gateway not configured. Please contact support.');
                setProcessing(false);
                return;
            }

            // Payment options based on selected method
            const options = {
                key: razorpayKey,
                amount: total * 100,
                currency: 'INR',
                name: 'TableTap',
                description: `${plan.name} Plan - ${billingCycles[billingCycle]?.label} Subscription${enableAutopay ? ' (Autopay)' : ''}`,
                image: '/favicon.ico',
                prefill: {
                    name: restaurantData?.name || '',
                    email: restaurantData?.contact_email || '',
                    contact: restaurantData?.contact_phone || ''
                },
                theme: {
                    color: '#7C3AED'
                },
                // Restrict to selected payment method
                config: {
                    display: {
                        blocks: {
                            banks: {
                                name: paymentMethod === 'upi' ? 'Pay via UPI' : 'Pay via Card',
                                instruments: paymentMethod === 'upi' 
                                    ? [{ method: 'upi' }]
                                    : [{ method: 'card' }]
                            }
                        },
                        sequence: ['block.banks'],
                        preferences: {
                            show_default_blocks: false
                        }
                    }
                },
                // For recurring payments / mandates
                recurring: enableAutopay ? '1' : '0',
                subscription_card_change: enableAutopay ? 1 : 0,
                handler: async function (response) {
                    try {
                        const startDate = new Date();
                        const endDate = new Date();
                        const monthsToAdd = billingCycles[billingCycle]?.months || 1;
                        endDate.setMonth(endDate.getMonth() + monthsToAdd);

                        const subData = {
                            restaurant_id: restaurantId,
                            plan_name: planKey,
                            status: 'active',
                            billing_cycle: billingCycle,
                            plan_price: amount,
                            gst_amount: gst,
                            total_amount: total,
                            start_date: startDate.toISOString(),
                            end_date: endDate.toISOString(),
                            next_payment_date: endDate.toISOString(),
                            last_payment_date: startDate.toISOString(),
                            payment_method: paymentMethod === 'upi' ? 'razorpay_upi' : 'razorpay_card',
                            razorpay_subscription_id: response.razorpay_payment_id,
                            auto_renew: enableAutopay,
                            autopay_method: enableAutopay ? paymentMethod : null,
                            autopay_token: enableAutopay ? (response.razorpay_payment_id || null) : null,
                            grace_period_days: 7,
                            updated_at: new Date().toISOString()
                        };

                        let result;
                        if (subscription) {
                            // Update existing
                            result = await supabase
                                .from('subscriptions')
                                .update(subData)
                                .eq('id', subscription.id);
                        } else {
                            // Create new
                            result = await supabase
                                .from('subscriptions')
                                .insert([subData]);
                        }

                        if (result.error) throw result.error;

                        const { data: latestSub } = await supabase.from('subscriptions').select('id').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(1).maybeSingle();

                        // Log to history
                        await supabase
                            .from('subscription_history')
                            .insert([{
                                subscription_id: subscription?.id || latestSub?.id,
                                restaurant_id: restaurantId,
                                action: subscription ? 'renewed' : 'purchased',
                                old_status: subscription?.status || 'none',
                                new_status: 'active',
                                amount_paid: total,
                                payment_reference: response.razorpay_payment_id,
                                notes: `${subscription ? 'Renewed' : 'Purchased'} ${planKey} plan via ${paymentMethod.toUpperCase()} - ${billingCycle}${enableAutopay ? ' (Autopay enabled)' : ''}`
                            }]);

                        alert(`Successfully ${subscription ? 'renewed' : 'activated'}!${enableAutopay ? ' Autopay has been set up for future renewals.' : ''}`);
                        fetchSubscription();
                    } catch (err) {
                        console.error('Error saving subscription:', err);
                        alert('Payment received but failed to update subscription. Please contact support with payment ID: ' + response.razorpay_payment_id);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error('Error initiating payment:', err);
            alert('Failed to initiate payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    // Toggle autopay for existing subscription
    const toggleAutopay = async () => {
        if (!subscription) return;
        
        setAutopayUpdating(true);
        try {
            const newAutoRenew = !subscription.auto_renew;
            
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update({ 
                    auto_renew: newAutoRenew,
                    updated_at: new Date().toISOString()
                })
                .eq('id', subscription.id);

            if (updateError) throw updateError;

            // Log to history
            await supabase
                .from('subscription_history')
                .insert([{
                    subscription_id: subscription.id,
                    restaurant_id: restaurantId,
                    action: newAutoRenew ? 'autopay_enabled' : 'autopay_disabled',
                    old_status: subscription.status,
                    new_status: subscription.status,
                    notes: `Autopay ${newAutoRenew ? 'enabled' : 'disabled'} for ${subscription.plan_name} plan`
                }]);

            setSubscription(prev => ({ ...prev, auto_renew: newAutoRenew }));
            alert(`Autopay has been ${newAutoRenew ? 'enabled' : 'disabled'} successfully.`);
        } catch (err) {
            console.error('Error toggling autopay:', err);
            alert('Failed to update autopay setting. Please try again.');
        } finally {
            setAutopayUpdating(false);
        }
    };

    // Status badge
    const getStatusBadge = () => {
        if (!subscription) return null;

        const statusConfig = {
            active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Active' },
            grace_period: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle, label: 'Grace Period' },
            expired: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Expired' },
            cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle, label: 'Cancelled' }
        };

        const config = statusConfig[subscription.status] || statusConfig.expired;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
                <Icon size={16} />
                {config.label}
            </span>
        );
    };

    const daysRemaining = getDaysRemaining();
    const currentPlan = subscription ? (plans[subscription.plan_name] || Object.values(plans)[0]) : null;
    const PlanIcon = currentPlan?.icon || Zap;

    if (loading || masterLoading) {
        return (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-gray-600">Loading subscription...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                    Subscription & Billing
                </h3>
                <button
                    onClick={fetchSubscription}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    {error}
                </div>
            )}

            {!subscription ? (
                // No subscription found - SHOW PLAN SELECTION
                <div className="space-y-8">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-5 flex-1">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
                                <Star className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-gray-900">Choose your TableTap plan</h4>
                                <p className="text-gray-600">Select a plan and billing cycle to activate your restaurant.</p>
                            </div>
                        </div>

                        {/* Billing Cycle Switcher */}
                        <div className="bg-white p-1.5 rounded-2xl shadow-sm border flex items-center gap-1">
                            {Object.entries(billingCycles).map(([key, cycle]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCycle(key)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedCycle === key
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {cycle.label}
                                    {cycle.discount > 0 && (
                                        <span className="ml-1 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                                            -{cycle.discount}%
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {Object.entries(plans).map(([key, plan]) => {
                            const Icon = plan.icon;
                            const price = calculatePrice(plan.basePrice, selectedCycle);
                            const totalWithGst = Math.round(price * 1.18);
                            const cycleData = billingCycles[selectedCycle];

                            if (!cycleData) return null;

                            return (
                                <div key={key} className="bg-white border-2 border-gray-100 hover:border-purple-200 rounded-2xl overflow-hidden transition-all hover:shadow-xl flex flex-col">
                                    <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
                                    <div className="p-6 flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <Icon size={24} className="text-gray-700" />
                                            </div>
                                            <h5 className="text-xl font-bold text-gray-900">{plan.name}</h5>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-6">{plan.description}</p>

                                        <div className="space-y-3 mb-8">
                                            {plan.features.map((feature, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <CheckCircle size={16} className="text-green-500" />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto text-center">
                                        <div className="mb-4">
                                            <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-bold">
                                                {cycleData.label} Billing
                                            </div>
                                            <div className="flex justify-center items-baseline gap-1 mb-1">
                                                <span className="text-4xl font-black text-gray-900">₹{price.toLocaleString()}</span>
                                                <span className="text-gray-500 text-sm font-medium">/{selectedCycle === 'monthly' ? 'mo' : cycleData.label}</span>
                                            </div>
                                            {cycleData.discount > 0 && (
                                                <div className="text-green-600 text-xs font-bold mb-4">
                                                    Save ₹{(plan.basePrice * cycleData.months - price).toLocaleString()} with {cycleData.label} plan
                                                </div>
                                            )}

                                            <button
                                                onClick={() => openPaymentModal(key, selectedCycle)}
                                                disabled={processing}
                                                className={`w-full py-4 bg-gradient-to-r ${plan.color} text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50`}
                                            >
                                                {processing ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CreditCard className="w-5 h-5" />
                                                        Pay ₹{totalWithGst.toLocaleString()}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Includes 18% GST • Autopay available</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <>
                    {/* Current Plan Card */}
                    <div className={`bg-gradient-to-br ${currentPlan.color} rounded-2xl p-6 text-white shadow-lg`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <PlanIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold">{currentPlan.name} Plan</h4>
                                    <p className="text-white/80 text-sm">{currentPlan.description}</p>
                                </div>
                            </div>
                            {getStatusBadge()}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Billing</p>
                                <p className="font-semibold capitalize">{subscription.billing_cycle}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Amount</p>
                                <p className="font-semibold">₹{subscription.total_amount?.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Valid Until</p>
                                <p className="font-semibold">{formatDate(subscription.end_date)}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Days Left</p>
                                <p className={`font-semibold ${daysRemaining <= 7 ? 'text-yellow-300' : ''}`}>
                                    {daysRemaining !== null ? (daysRemaining > 0 ? daysRemaining : 'Expired') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Expiry Warning */}
                    {daysRemaining !== null && daysRemaining <= 14 && daysRemaining > 0 && (
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-orange-800">Subscription Expiring Soon</h4>
                                <p className="text-orange-700 text-sm">
                                    Your subscription will expire in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
                                    Renew now to avoid service interruption.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Expired Warning */}
                    {(subscription.status === 'expired' || subscription.status === 'grace_period') && (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <XCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-800">
                                    {subscription.status === 'grace_period' ? 'Grace Period Active' : 'Subscription Expired'}
                                </h4>
                                <p className="text-red-700 text-sm">
                                    {subscription.status === 'grace_period'
                                        ? 'Your subscription is in grace period. Renew now to continue using all features.'
                                        : 'Your subscription has expired. Renew to restore access to your restaurant dashboard.'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Renewal Options */}
                    <div className="bg-white rounded-2xl border p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-purple-500" />
                                Renew Your {currentPlan.name} Subscription
                            </h4>

                            {/* Billing Cycle Switcher */}
                            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
                                {Object.entries(billingCycles).map(([key, cycle]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedCycle(key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedCycle === key
                                            ? 'bg-white text-purple-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {cycle.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="max-w-2xl mx-auto bg-gradient-to-br from-gray-50 to-slate-50 border rounded-2xl p-8 text-center">
                            <div className="mb-6">
                                <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-bold">
                                    Renew for {billingCycles[selectedCycle]?.label}
                                </div>
                                <div className="flex justify-center items-baseline gap-1">
                                    <span className="text-5xl font-black text-gray-900">
                                        ₹{calculatePrice(currentPlan.basePrice, selectedCycle).toLocaleString()}
                                    </span>
                                    <span className="text-gray-500 text-lg">
                                        /{selectedCycle === 'monthly' ? 'mo' : billingCycles[selectedCycle]?.label}
                                    </span>
                                </div>
                                {billingCycles[selectedCycle]?.discount > 0 && (
                                    <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                        Included {billingCycles[selectedCycle]?.discount}% Discount
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => openPaymentModal(subscription.plan_name, selectedCycle)}
                                disabled={processing}
                                className={`w-full max-w-sm mx-auto py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mb-4`}
                            >
                                {processing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Star className="w-5 h-5" />
                                        Pay ₹{Math.round(calculatePrice(currentPlan.basePrice, selectedCycle) * 1.18).toLocaleString()} to Renew
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-400">
                                Total includes 18% GST • Autopay available for future renewals
                            </p>
                        </div>
                    </div>

                    {/* Plan Features */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-blue-500" />
                            Your Plan Includes
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                            {currentPlan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Autopay Status */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${subscription.auto_renew ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {subscription.auto_renew ? (
                                        <Bell className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <BellOff className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Auto-Renewal</h4>
                                    <p className="text-sm text-gray-500">
                                        {subscription.auto_renew 
                                            ? `Will auto-renew on ${formatDate(subscription.end_date)}` 
                                            : 'Subscription will expire without renewal'}
                                    </p>
                                    {subscription.autopay_method && subscription.auto_renew && (
                                        <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                                            {subscription.autopay_method === 'upi' ? (
                                                <><Smartphone className="w-3 h-3" /> UPI Autopay</>
                                            ) : (
                                                <><CreditCard className="w-3 h-3" /> Card Autopay</>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={toggleAutopay}
                                disabled={autopayUpdating}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                                    subscription.auto_renew 
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                } disabled:opacity-50`}
                            >
                                {autopayUpdating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : subscription.auto_renew ? (
                                    <><ToggleRight className="w-5 h-5" /> Disable</>
                                ) : (
                                    <><ToggleLeft className="w-5 h-5" /> Enable</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Payment History Link */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-600 text-sm">
                                Last payment: {formatDate(subscription.last_payment_date)}
                            </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                            Payment ID: {subscription.razorpay_subscription_id || 'Manual'}
                        </span>
                    </div>
                </>
            )}

            {/* Payment Method Modal */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Choose Payment Method</h3>
                                    <p className="text-purple-200 text-sm mt-1">
                                        {plans[selectedPlan.planKey]?.name} Plan - {billingCycles[selectedPlan.billingCycle]?.label}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Payment Method Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Select Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                            paymentMethod === 'card'
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-200'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            paymentMethod === 'card' ? 'bg-purple-100' : 'bg-gray-100'
                                        }`}>
                                            <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-purple-600' : 'text-gray-500'}`} />
                                        </div>
                                        <span className={`font-semibold ${paymentMethod === 'card' ? 'text-purple-700' : 'text-gray-700'}`}>
                                            Credit/Debit Card
                                        </span>
                                        <span className="text-xs text-gray-500">Visa, Mastercard, RuPay</span>
                                    </button>

                                    <button
                                        onClick={() => setPaymentMethod('upi')}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                            paymentMethod === 'upi'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-green-200'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            paymentMethod === 'upi' ? 'bg-green-100' : 'bg-gray-100'
                                        }`}>
                                            <Smartphone className={`w-6 h-6 ${paymentMethod === 'upi' ? 'text-green-600' : 'text-gray-500'}`} />
                                        </div>
                                        <span className={`font-semibold ${paymentMethod === 'upi' ? 'text-green-700' : 'text-gray-700'}`}>
                                            UPI
                                        </span>
                                        <span className="text-xs text-gray-500">GPay, PhonePe, Paytm</span>
                                    </button>
                                </div>
                            </div>

                            {/* Autopay Toggle */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enableAutopay ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            <RefreshCw className={`w-5 h-5 ${enableAutopay ? 'text-blue-600' : 'text-gray-400'}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Enable Autopay</h4>
                                            <p className="text-xs text-gray-500">Auto-renew subscription before expiry</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEnableAutopay(!enableAutopay)}
                                        className={`relative w-12 h-7 rounded-full transition-colors ${enableAutopay ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${enableAutopay ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                {enableAutopay && (
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                        <div className="flex items-start gap-2 text-xs text-blue-700">
                                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <p>
                                                {paymentMethod === 'upi' 
                                                    ? 'UPI mandate will be created for automatic debits. You can cancel anytime.'
                                                    : 'Your card will be saved securely for automatic renewals. You can cancel anytime.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Price Summary */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Plan Amount</span>
                                    <span className="font-semibold">₹{calculatePrice(plans[selectedPlan.planKey]?.basePrice, selectedPlan.billingCycle).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">GST (18%)</span>
                                    <span className="font-semibold">₹{Math.round(calculatePrice(plans[selectedPlan.planKey]?.basePrice, selectedPlan.billingCycle) * 0.18).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-xl font-bold text-purple-600">
                                        ₹{Math.round(calculatePrice(plans[selectedPlan.planKey]?.basePrice, selectedPlan.billingCycle) * 1.18).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handlePayment}
                                disabled={processing}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {processing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {paymentMethod === 'upi' ? <Smartphone className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                        Pay with {paymentMethod === 'upi' ? 'UPI' : 'Card'}
                                        {enableAutopay && ' + Setup Autopay'}
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                Secured by Razorpay • 256-bit SSL Encryption
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionSection;
