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
                let displayLabel = c.label.toUpperCase();
                // Ensure consistency: 3 MONTHS-10%, YEARLY-35% SAVINGS
                if (c.duration_months >= 12) {
                    if (!displayLabel.includes('SAVING')) {
                        if (!displayLabel.includes('%') && c.discount_percentage > 0) {
                            displayLabel += `-${Math.round(c.discount_percentage)}% SAVINGS`;
                        } else {
                            displayLabel += ' SAVINGS';
                        }
                    }
                } else if (c.discount_percentage > 0 && !displayLabel.includes('%')) {
                    displayLabel += `-${Math.round(c.discount_percentage)}%`;
                }

                cyclesMap[c.key] = {
                    label: displayLabel,
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

            const razorpayKey = restaurantData?.razorpay_key_id || process.env.REACT_APP_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;

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
                    color: '#F97316' // Orange-500
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

                        // Log to history (this will also trigger automatic invoice creation)
                        await supabase
                            .from('subscription_history')
                            .insert([{
                                subscription_id: subscription?.id || latestSub?.id,
                                restaurant_id: restaurantId,
                                action: subscription ? 'renewed' : 'purchased',
                                old_status: subscription?.status || 'none',
                                new_status: 'active',
                                old_plan: subscription?.plan_name || null,
                                new_plan: planKey,
                                amount_paid: total,
                                gst_amount: gst,
                                payment_reference: response.razorpay_payment_id,
                                notes: `${subscription ? 'Renewed' : 'Purchased'} ${plan.name} plan via ${paymentMethod.toUpperCase()} - ${billingCycles[billingCycle]?.label}${enableAutopay ? ' (Autopay enabled)' : ''}`
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
            active: { bg: 'bg-orange-600', text: 'text-white', icon: CheckCircle, label: 'Active' },
            grace_period: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle, label: 'Grace Period' },
            expired: { bg: 'bg-slate-200', text: 'text-slate-700', icon: XCircle, label: 'Expired' },
            cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', icon: XCircle, label: 'Cancelled' }
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
    // Use master data if available, fallback to basic info if plan was deleted
    const masterPlan = (subscription && plans[subscription.plan_name]) ? plans[subscription.plan_name] : null;

    // Create a safe current plan object that works even if the plan is deleted from master data
    const currentPlan = subscription ? {
        name: masterPlan?.name || subscription.plan_name,
        description: masterPlan?.description || 'Legacy Subscription Plan',
        color: masterPlan?.color?.includes('blue') || masterPlan?.color?.includes('purple')
            ? 'from-orange-600 to-amber-700'
            : (masterPlan?.color || 'from-slate-900 to-black'),
        icon: masterPlan?.icon || Zap,
        features: masterPlan?.features || ['Core Features', 'Order Management'],
        isAvailable: !!masterPlan
    } : null;

    const PlanIcon = currentPlan?.icon || Zap;

    if (loading || masterLoading) {
        return (
            <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-2xl p-8 border">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <span className="ml-3 text-gray-600">Loading subscription...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
                    <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2 text-orange-600" />
                    Subscription & Billing
                </h3>
                <button
                    onClick={fetchSubscription}
                    className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    {error}
                </div>
            )}

            {(!subscription) ? (
                // No subscription found OR plan was deleted/missing - SHOW PLAN SELECTION
                <div className="space-y-3 md:space-y-8">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl md:rounded-2xl p-3 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-5 flex-1">
                            <div className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-lg md:rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
                                <Star className="w-5 h-5 md:w-8 md:h-8 text-orange-600" />
                            </div>
                            <div>
                                <h4 className="text-base md:text-xl font-bold text-gray-900">Choose your TableTap plan</h4>
                                <p className="text-[10px] md:text-sm text-gray-600">Select a plan and billing cycle to activate.</p>
                            </div>
                        </div>

                        {/* Billing Cycle Switcher */}
                        <div className="bg-white/80 backdrop-blur-sm p-0.5 md:p-1 rounded-xl md:rounded-2xl shadow-inner border border-white flex items-center gap-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
                            {Object.entries(billingCycles).map(([key, cycle]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCycle(key)}
                                    className={`flex-none px-2 md:px-6 py-2 md:py-3.5 rounded-lg md:rounded-xl text-[9px] md:text-sm font-black transition-all duration-300 whitespace-nowrap flex items-center justify-center group ${selectedCycle === key
                                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="uppercase tracking-tighter">{cycle.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-6 max-w-4xl mx-auto">
                        {Object.entries(plans).filter(([_, plan]) => plan.is_public).map(([key, plan]) => {
                            const Icon = plan.icon;
                            const price = calculatePrice(plan.basePrice, selectedCycle);
                            const totalWithGst = Math.round(price * 1.18);
                            const cycleData = billingCycles[selectedCycle];

                            if (!cycleData) return null;

                            return (
                                <div key={key} className="bg-white border hover:border-orange-200 rounded-xl md:rounded-2xl overflow-hidden transition-all hover:shadow-xl flex flex-col">
                                    <div className={`h-1 md:h-2 bg-gradient-to-r ${plan.color}`} />
                                    <div className="p-3 md:p-6 flex-1">
                                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                            <div className="p-1 md:p-2 bg-gray-50 rounded-lg">
                                                <Icon className="w-4 h-4 md:w-6 md:h-6 text-gray-700" />
                                            </div>
                                            <h5 className="text-sm md:text-xl font-bold text-gray-900">{plan.name}</h5>
                                        </div>
                                        <p className="text-gray-500 text-[10px] md:text-sm mb-3 md:mb-6 leading-tight line-clamp-2 md:line-clamp-none">{plan.description}</p>

                                        <div className="space-y-1 md:space-y-2">
                                            {plan.features.slice(0, 3).map((feature, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-[9px] md:text-sm text-gray-600">
                                                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
                                                    <span className="truncate">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-3 md:p-6 bg-gray-50 border-t border-gray-100 mt-auto text-center">
                                        <div className="mb-2 md:mb-4">
                                            <div className="text-[10px] md:text-sm text-gray-500 mb-0.5 md:mb-1 uppercase tracking-wider font-bold">
                                                {cycleData.label}
                                            </div>
                                            <div className="flex justify-center items-baseline gap-0.5 mb-1">
                                                <span className="text-lg md:text-4xl font-black text-gray-900">₹{price.toLocaleString()}</span>
                                                <span className="text-gray-500 text-[10px] md:text-sm font-medium">/{selectedCycle === 'monthly' ? 'mo' : cycleData.label.split(' ')[0]}</span>
                                            </div>
                                            {cycleData.discount > 0 && (
                                                <div className="text-orange-600 text-[8px] md:text-xs font-bold mb-2 md:mb-4">
                                                    Save ₹{(plan.basePrice * cycleData.months - price).toLocaleString()}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => openPaymentModal(key, selectedCycle)}
                                                disabled={processing}
                                                className={`w-full py-2.5 md:py-4 bg-gradient-to-r ${plan.color} text-white font-bold rounded-lg md:rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-[10px] md:text-base`}
                                            >
                                                {processing ? (
                                                    <Loader2 className="w-3 h-3 md:w-5 md:h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CreditCard className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                                        Pay ₹{totalWithGst.toLocaleString()}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-[7px] md:text-[10px] text-gray-400 font-bold">Includes 18% GST</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <>
                    {/* Current Plan Card */}
                    <div className={`bg-gradient-to-br ${currentPlan.color} rounded-xl md:rounded-2xl p-3 md:p-6 text-white shadow-lg`}>
                        <div className="flex items-start justify-between mb-3 md:mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center border border-white/20">
                                    <PlanIcon className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg md:text-2xl font-black tracking-tight">{currentPlan.name} Plan</h4>
                                    <p className="text-white/60 text-[10px] md:text-sm font-medium">{currentPlan.description}</p>
                                </div>
                            </div>
                            <div className="scale-75 md:scale-100 origin-right">
                                {getStatusBadge()}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                            <div className="bg-white/10 rounded-lg md:rounded-xl p-2.5 md:p-4">
                                <p className="text-white/70 text-[10px] uppercase tracking-wider mb-0.5 md:mb-1">Billing</p>
                                <p className="text-xs md:text-base font-semibold capitalize">{subscription.billing_cycle}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg md:rounded-xl p-2.5 md:p-4">
                                <p className="text-white/70 text-[10px] uppercase tracking-wider mb-0.5 md:mb-1">Amount</p>
                                <p className="text-xs md:text-base font-semibold">₹{subscription.total_amount?.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg md:rounded-xl p-2.5 md:p-4">
                                <p className="text-white/70 text-[10px] uppercase tracking-wider mb-0.5 md:mb-1">Until</p>
                                <p className="text-xs md:text-base font-semibold">{formatDate(subscription.end_date)}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg md:rounded-xl p-2.5 md:p-4">
                                <p className="text-white/70 text-[10px] uppercase tracking-wider mb-0.5 md:mb-1">Remaining</p>
                                <p className={`text-xs md:text-base font-semibold ${daysRemaining <= 7 ? 'text-orange-400' : ''}`}>
                                    {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} Days` : 'Expired') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Expired/Grace Warning */}
                    {(subscription.status === 'expired' || subscription.status === 'grace_period') && (
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <XCircle className="w-4 h-4 md:w-6 md:h-6 text-slate-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm md:text-base font-semibold text-slate-800">
                                    {subscription.status === 'grace_period' ? 'Grace Period Active' : 'Subscription Expired'}
                                </h4>
                                <p className="text-slate-600 text-xs md:text-sm">
                                    {subscription.status === 'grace_period'
                                        ? 'Renew now to continue using all features.'
                                        : 'Renew to restore access to your dashboard.'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Expiry Warning */}
                    {daysRemaining !== null && daysRemaining <= 14 && daysRemaining > 0 && subscription.status === 'active' && (
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm md:text-base font-semibold text-orange-800">Subscription Expiring Soon</h4>
                                <p className="text-orange-700 text-xs md:text-sm">
                                    Your subscription will expire in {daysRemaining} days.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Renewal Options */}
                    <div className="bg-white rounded-xl md:rounded-2xl border p-3 md:p-6 mb-4 md:mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-8">
                            <h4 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                                Renew Your {currentPlan.name} Subscription
                            </h4>

                            {!currentPlan.isAvailable ? (
                                <div className="space-y-6 w-full mt-4">
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 md:p-6 text-center">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                                        </div>
                                        <h4 className="text-sm md:text-lg font-bold text-gray-900 mb-1">Plan No Longer Available</h4>
                                        <p className="text-[10px] md:text-sm text-gray-600 max-w-sm mx-auto">
                                            Your current plan (<strong>{currentPlan.name}</strong>) is no longer available.
                                            Please select a new plan to continue.
                                        </p>
                                    </div>

                                    <div className="space-y-4 md:space-y-8">
                                        <div className="flex flex-col md:flex-row items-center gap-2 justify-between bg-gray-50 p-2.5 md:p-4 rounded-xl border">
                                            <h4 className="text-xs md:text-sm font-bold text-gray-900">Choose a New Plan</h4>
                                            <div className="bg-white/60 backdrop-blur-sm p-0.5 rounded-xl border flex items-center gap-1 overflow-x-auto scrollbar-hide">
                                                {Object.entries(billingCycles).map(([key, cycle]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedCycle(key)}
                                                        className={`flex-none px-2 py-2 rounded-lg text-[8px] md:text-xs font-black transition-all duration-300 whitespace-nowrap flex items-center ${selectedCycle === key
                                                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                                                            : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                                            }`}
                                                    >
                                                        <span className="uppercase tracking-tighter">{cycle.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6">
                                            {Object.entries(plans).filter(([_, plan]) => plan.is_public).map(([key, plan]) => {
                                                const Icon = plan.icon;
                                                const price = calculatePrice(plan.basePrice, selectedCycle);
                                                const totalWithGst = Math.round(price * 1.18);
                                                return (
                                                    <div key={key} className="bg-white border hover:border-orange-300 rounded-xl md:rounded-2xl p-3 md:p-6 transition-all hover:shadow-lg flex flex-col text-left">
                                                        <div className="flex items-center gap-2 mb-2 md:mb-4">
                                                            <div className="p-1 md:p-2 bg-gray-50 rounded-lg">
                                                                <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                                                            </div>
                                                            <h5 className="text-xs md:font-bold text-gray-900 truncate">{plan.name}</h5>
                                                        </div>
                                                        <p className="text-gray-500 text-[9px] mb-3 md:mb-6 h-8 line-clamp-2">{plan.description}</p>
                                                        <div className="mb-3 md:mb-6">
                                                            <div className="flex items-baseline gap-0.5">
                                                                <span className="text-base md:text-2xl font-black text-gray-900">₹{price.toLocaleString()}</span>
                                                                <span className="text-gray-400 text-[8px] font-medium">/{selectedCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                                            </div>
                                                            <p className="text-[8px] text-gray-400 mt-0.5 whitespace-nowrap">₹{totalWithGst.toLocaleString()} incl. GST</p>
                                                        </div>
                                                        <button
                                                            onClick={() => openPaymentModal(key, selectedCycle)}
                                                            className={`w-full py-2 bg-gradient-to-r ${plan.color} text-white font-bold rounded-lg shadow-md transition-all text-[10px]`}
                                                        >
                                                            Switch to {plan.name}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-100/80 backdrop-blur-sm p-1 rounded-2xl shadow-inner border flex items-center gap-1 overflow-x-auto scrollbar-hide">
                                    {Object.entries(billingCycles).map(([key, cycle]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedCycle(key)}
                                            className={`flex-none px-2.5 md:px-5 py-2.5 md:py-3 rounded-xl text-[9px] md:text-xs font-black transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${selectedCycle === key
                                                ? 'bg-white text-orange-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-orange-100'
                                                : 'text-gray-500 hover:text-gray-900 border border-transparent'
                                                }`}
                                        >
                                            <span className="uppercase tracking-tighter md:tracking-tight">{cycle.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {currentPlan.isAvailable && masterPlan && (
                            <div className="max-w-2xl mx-auto bg-gradient-to-br from-gray-50 to-slate-50 border rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
                                <div className="mb-4 md:mb-6">
                                    <div className="text-[10px] md:text-sm text-gray-500 mb-1 uppercase tracking-wider font-bold">
                                        Renew for {billingCycles[selectedCycle]?.label}
                                    </div>
                                    <div className="flex justify-center items-baseline gap-1">
                                        <span className="text-3xl md:text-5xl font-black text-gray-900">
                                            ₹{calculatePrice(masterPlan.basePrice, selectedCycle).toLocaleString()}
                                        </span>
                                        <span className="text-gray-500 text-sm md:text-lg">
                                            /{selectedCycle === 'monthly' ? 'mo' : billingCycles[selectedCycle]?.label}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openPaymentModal(subscription.plan_name, selectedCycle)}
                                    disabled={processing}
                                    className={`w-full max-w-sm mx-auto py-3 md:py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mb-3 md:mb-4 text-sm md:text-base`}
                                >
                                    {processing ? (
                                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Star className="w-4 h-4 md:w-5 md:h-5" />
                                            Pay ₹{Math.round(calculatePrice(masterPlan.basePrice, selectedCycle) * 1.18).toLocaleString()}
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-gray-400">
                                    Total includes 18% GST • Autopay available
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-xl md:rounded-2xl p-3 md:p-6 border mb-4 md:mb-6">
                        <h4 className="text-[11px] md:text-base font-semibold text-gray-900 mb-2 md:mb-4 flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 md:w-5 md:h-5 text-orange-500" />
                            Your Plan Includes
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3">
                            {currentPlan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 md:gap-3 p-1.5 md:p-3 bg-white rounded-lg md:rounded-xl border shadow-sm">
                                    <CheckCircle className="w-3 h-3 md:w-5 md:h-5 text-orange-500 flex-shrink-0" />
                                    <span className="text-[9px] md:text-sm text-gray-700 font-medium truncate">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Autopay Status */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl md:rounded-2xl p-3 md:p-5 border border-orange-100 mb-4 md:mb-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
                            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto text-left">
                                <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${subscription.auto_renew ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                    {subscription.auto_renew ? (
                                        <Bell className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                                    ) : (
                                        <BellOff className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-[11px] md:text-base font-bold text-gray-900">Auto-Renewal</h4>
                                    <p className="text-[9px] md:text-sm text-gray-500">
                                        {subscription.auto_renew
                                            ? `Next: ${formatDate(subscription.end_date)}`
                                            : 'Will expire without renewal'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleAutopay}
                                disabled={autopayUpdating}
                                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-black transition-all ${subscription.auto_renew
                                    ? 'bg-slate-900 text-white hover:bg-black'
                                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                    } disabled:opacity-50 border border-transparent shadow-sm`}
                            >
                                {autopayUpdating ? (
                                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                                ) : subscription.auto_renew ? (
                                    <><ToggleRight className="w-3.5 h-3.5 md:w-5 md:h-5" /> Disable</>
                                ) : (
                                    <><ToggleLeft className="w-3.5 h-3.5 md:w-5 md:h-5" /> Enable</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Payment History Link */}
                    <div className="flex flex-row items-center justify-between p-2.5 md:p-4 bg-gray-50 rounded-xl border gap-2">
                        <div className="flex items-center gap-1.5 md:gap-3">
                            <Shield className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-500" />
                            <span className="text-gray-600 text-[9px] md:text-sm">
                                Last payment: {formatDate(subscription.last_payment_date)}
                            </span>
                        </div>
                        <span className="text-gray-400 text-[9px] md:text-sm border-l pl-2 border-gray-200">
                            ID: {subscription.razorpay_subscription_id?.slice(-8) || 'Manual'}
                        </span>
                    </div>
                </>
            )
            }

            {/* Payment Method Modal */}
            {
                showPaymentModal && selectedPlan && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Choose Payment Method</h3>
                                        <p className="text-orange-100 text-sm mt-1">
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
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'card'
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-200 hover:border-orange-200'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'card' ? 'bg-orange-100' : 'bg-gray-100'
                                                }`}>
                                                <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-orange-600' : 'text-gray-500'}`} />
                                            </div>
                                            <span className={`font-semibold ${paymentMethod === 'card' ? 'text-orange-700' : 'text-gray-700'}`}>
                                                Credit/Debit Card
                                            </span>
                                            <span className="text-xs text-gray-500">Visa, Mastercard, RuPay</span>
                                        </button>

                                        <button
                                            onClick={() => setPaymentMethod('upi')}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'upi'
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-200 hover:border-orange-200'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'upi' ? 'bg-orange-100' : 'bg-gray-100'
                                                }`}>
                                                <Smartphone className={`w-6 h-6 ${paymentMethod === 'upi' ? 'text-orange-600' : 'text-gray-500'}`} />
                                            </div>
                                            <span className={`font-semibold ${paymentMethod === 'upi' ? 'text-orange-700' : 'text-gray-700'}`}>
                                                UPI
                                            </span>
                                            <span className="text-xs text-gray-500">GPay, PhonePe, Paytm</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Autopay Toggle */}
                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enableAutopay ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                                <RefreshCw className={`w-5 h-5 ${enableAutopay ? 'text-orange-600' : 'text-gray-400'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Enable Autopay</h4>
                                                <p className="text-xs text-gray-500">Auto-renew subscription before expiry</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enableAutopay}
                                                onChange={(e) => setEnableAutopay(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                        </label>
                                    </div>
                                    {enableAutopay && (
                                        <div className="mt-3 p-3 bg-white/50 rounded-lg flex gap-2 items-start">
                                            <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-gray-600 leading-relaxed">
                                                Your card/UPI will be automatically charged {billingCycles[selectedPlan.billingCycle]?.label.toLowerCase()} for uninterrupted service. You can disable this anytime in your dashboard.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Plan Summary */}
                                <div className="border-t border-gray-100 pt-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold">₹{calculatePrice(plans[selectedPlan.planKey]?.basePrice, selectedPlan.billingCycle).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-600">GST (18%)</span>
                                        <span className="font-semibold">₹{Math.round(calculatePrice(plans[selectedPlan.planKey]?.basePrice, selectedPlan.billingCycle) * 0.18).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-t border-gray-100">
                                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                        <span className="text-2xl font-black text-orange-600">
                                            ₹{Math.round(calculatePrice(plans[selectedPlan.planKey]?.basePrice, selectedPlan.billingCycle) * 1.18).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                                >
                                    {processing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Shield className="w-5 h-5" />
                                            Confirm & Pay Securely
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-gray-400">
                                    Secure encrypted payment powered by Razorpay
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SubscriptionSection;
