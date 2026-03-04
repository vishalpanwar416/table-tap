import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CreditCard, X, Clock, RefreshCw, ExternalLink, Bell } from 'lucide-react';
import { supabase } from '../supabase';

/**
 * SubscriptionExpiredBanner
 *
 * Grace period logic (matches customer-app RestaurantContext):
 *
 *  active                 → nothing shown
 *  active, ≤7 days left  → dismissible amber top banner ("expiring soon")
 *  expired, ≤7 days past → dismissible RED top banner ("grace period — renew to continue")
 *  expired, >7 days past → full-screen BLOCKING modal (dashboard locked)
 *  cancelled / missing   → full-screen BLOCKING modal
 *  grace_period (DB)     → treated same as "expiring soon" banner
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

    // Days helpers
    const daysRemaining = subscription?.end_date
        ? Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    const daysSinceExpiry = subscription?.end_date
        ? Math.ceil((new Date() - new Date(subscription.end_date)) / (1000 * 60 * 60 * 24))
        : null;

    const status = subscription?.status;

    // ── Classify the state ────────────────────────────────────────────────
    const isActive = status === 'active' && daysRemaining !== null && daysRemaining > 7;
    const isExpiringSoon = status === 'active' && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
    const isGracePeriodDB = status === 'grace_period'; // DB-marked grace
    const isInGraceWindow = status === 'expired' && daysSinceExpiry !== null && daysSinceExpiry <= 7;
    const isHardBlocked = !subscription || status === 'cancelled' ||
        (status === 'expired' && daysSinceExpiry !== null && daysSinceExpiry > 7);

    // Nothing to show
    if (isActive) return null;
    // Dismissed banners (non-blocking)
    if (dismissed && !isHardBlocked) return null;

    // ── 1. Expiring soon (≤7 days, still active) ─────────────────────────
    if (isExpiringSoon || isGracePeriodDB) {
        const daysLeft = isGracePeriodDB ? daysRemaining : daysRemaining;
        return (
            <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 flex items-center gap-3 shadow-md relative z-50">
                <Clock size={18} className="flex-shrink-0" />
                <span className="flex-1 text-sm font-semibold">
                    ⚠️ Your subscription expires in{' '}
                    <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.{' '}
                    Renew now to avoid interruption.
                </span>
                <a
                    href="https://table-tap.in/#pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                >
                    Renew <ExternalLink size={11} />
                </a>
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors flex-shrink-0"
                    title="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    // ── 2. Within 7-day grace window after expiry ─────────────────────────
    if (isInGraceWindow) {
        const daysLeft = 7 - daysSinceExpiry;
        return (
            <div className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-3 flex items-center gap-3 shadow-md relative z-50">
                <Bell size={18} className="flex-shrink-0 animate-pulse" />
                <span className="flex-1 text-sm font-semibold">
                    🔴 Subscription expired!{' '}
                    <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</strong>{' '}
                    before dashboard &amp; customer app are locked. Renew now.
                </span>
                <a
                    href="https://table-tap.in/#pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                >
                    Renew Now <ExternalLink size={11} />
                </a>
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors flex-shrink-0"
                    title="Dismiss for now"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    // ── 3. Hard blocked — full-screen modal (>7 days past expiry or cancelled) ──
    if (!isHardBlocked) return null;

    const canDismiss = userRole === 'admin';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
        >
            {/* Admin-only dismiss */}
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
                <div className="h-2 w-full bg-gradient-to-r from-red-500 to-rose-600" />

                <div className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                        <AlertTriangle size={40} className="text-red-500" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                        Subscription Expired
                    </h2>

                    <p className="text-gray-500 text-sm leading-relaxed mb-2">
                        Your{subscription?.plan_name ? ` ${subscription.plan_name}` : ''} subscription
                        has expired and the 7-day grace period has ended.
                        Renew to restore full access.
                    </p>

                    {subscription?.end_date && (
                        <p className="text-xs text-gray-400 mb-6">
                            Expired on{' '}
                            <strong>
                                {new Date(subscription.end_date).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </strong>
                        </p>
                    )}

                    {/* Impact */}
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left space-y-2">
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Impact</p>
                        {[
                            'Restaurant hidden from customers',
                            'Online orders paused',
                            'QR code menus unavailable',
                            'Dashboard access restricted',
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-2 text-sm text-red-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
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
                        Need help?{' '}
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
