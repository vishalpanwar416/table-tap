import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CreditCard, X, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';

/**
 * SubscriptionExpiredBanner
 *
 * Shows a full-screen blocking modal when a restaurant's subscription is
 * expired, cancelled, or missing. Shown in the manager/owner dashboard wrapper.
 *
 * Shows a softer top banner when subscription expires within 7 days.
 */
const SubscriptionExpiredBanner = ({ restaurantId, userRole }) => {
    const [subscription, setSubscription] = useState(undefined); // undefined = loading
    const [dismissed, setDismissed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSubscription = useCallback(async () => {
        if (!restaurantId) return;
        try {
            const { data } = await supabase
                .from('subscriptions')
                .select('id, status, end_date, plan_name')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            setSubscription(data || null);
        } catch {
            setSubscription(null);
        }
    }, [restaurantId]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSubscription();
        setRefreshing(false);
        setDismissed(false);
    };

    // Still loading
    if (subscription === undefined) return null;

    const daysRemaining = subscription?.end_date
        ? Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    const isExpired = !subscription || subscription.status === 'expired' || subscription.status === 'cancelled';
    const isGracePeriod = subscription?.status === 'grace_period';
    const isExpiringSoon = subscription?.status === 'active' && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

    // Admins see everything but are not blocked
    const isBlocking = isExpired || isGracePeriod;
    const canDismiss = userRole === 'admin' || (!isBlocking && isExpiringSoon);

    if (!isExpired && !isGracePeriod && !isExpiringSoon) return null;
    if (!isBlocking && dismissed) return null;

    // ── Expiring-soon top banner (dismissible) ─────────────────────────────
    if (isExpiringSoon && !isBlocking) {
        return (
            <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 flex items-center gap-3 shadow-md z-50">
                <Clock size={18} className="flex-shrink-0" />
                <span className="flex-1 text-sm font-semibold">
                    ⚠️ Your subscription expires in <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>. Renew now to avoid interruption.
                </span>
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors flex-shrink-0"
                    title="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    // ── Full-screen blocking modal for expired / grace period ──────────────
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>

            {/* Admin dismiss button */}
            {canDismiss && (
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                    title="Dismiss (Admin only)"
                >
                    <X size={20} />
                </button>
            )}

            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Red top stripe */}
                <div className={`h-2 w-full ${isGracePeriod ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-rose-600'}`} />

                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isGracePeriod ? 'bg-amber-100' : 'bg-red-100'}`}>
                        <AlertTriangle
                            size={40}
                            className={isGracePeriod ? 'text-amber-500' : 'text-red-500'}
                        />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                        {isGracePeriod ? 'Grace Period Active' : 'Subscription Expired'}
                    </h2>

                    {/* Message */}
                    <p className="text-gray-500 text-sm leading-relaxed mb-2">
                        {isGracePeriod
                            ? `Your subscription has entered its grace period. Please renew immediately to avoid service interruption.`
                            : `Your ${subscription?.plan_name ? `${subscription.plan_name} ` : ''}subscription has expired. Your restaurant is currently hidden from customers.`
                        }
                    </p>

                    {subscription?.end_date && (
                        <p className="text-xs text-gray-400 mb-6">
                            {isGracePeriod ? 'Grace period ends' : 'Expired on'}{' '}
                            <strong>{new Date(subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </p>
                    )}

                    {/* Impact bullets */}
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left space-y-2">
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Impact</p>
                        {[
                            'Restaurant hidden from customers',
                            'Online orders paused',
                            'QR code menus unavailable',
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-2 text-sm text-red-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3">
                        <a
                            href="https://table-tap.in/#pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600 transition-all"
                        >
                            <CreditCard size={18} />
                            Renew Subscription
                            <ExternalLink size={14} className="opacity-70" />
                        </a>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Checking...' : "I've Renewed \u2014 Check Again"}
                        </button>
                    </div>

                    <p className="mt-4 text-xs text-gray-400">
                        Need help? Contact{' '}
                        <a href="mailto:support@table-tap.in" className="text-orange-500 hover:underline">
                            support@table-tap.in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionExpiredBanner;
