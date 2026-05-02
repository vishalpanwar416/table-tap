import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, CreditCard, X, Clock, RefreshCw, ExternalLink, Zap, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabase';

/**
 * SubscriptionExpiredBanner
 *
 * States:
 *  active, >7 days left      → nothing
 *  active, ≤7 days left      → amber shimmer top bar (expiring soon)
 *  expired/active, ≤7d past  → red pulsing top bar (grace period)
 *  expired, >7d past         → full-screen blocking modal
 *  cancelled / missing       → full-screen blocking modal
 */
const SubscriptionExpiredBanner = ({ restaurantId, userRole }) => {
    const [subscription, setSubscription] = useState(undefined);
    const [dismissed, setDismissed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const abortRef = useRef(null);
    const mountedRef = useRef(true);

    const fetchSubscription = useCallback(async () => {
        if (!restaurantId) return;
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        try {
            const { data } = await supabase
                .from('subscriptions')
                .select('id, status, end_date, plan_name')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (mountedRef.current) setSubscription(data || null);
        } catch (err) {
            if (err?.name !== 'AbortError' && mountedRef.current) setSubscription(null);
        }
    }, [restaurantId]);

    useEffect(() => {
        mountedRef.current = true;
        fetchSubscription();
        return () => {
            mountedRef.current = false;
            if (abortRef.current) abortRef.current.abort();
        };
    }, [fetchSubscription]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSubscription();
        setRefreshing(false);
        setDismissed(false);
    };

    if (subscription === undefined) return null;

    const daysRemaining = subscription?.end_date
        ? Math.ceil((new Date(subscription.end_date) - new Date()) / 86400000)
        : null;
    const daysSinceExpiry = subscription?.end_date
        ? Math.ceil((new Date() - new Date(subscription.end_date)) / 86400000)
        : null;
    const status = subscription?.status;

    // Classify
    const effectivelyExpired =
        (status === 'active' || status === 'expired') &&
        daysRemaining !== null && daysRemaining <= 0;

    const isActive = status === 'active' && daysRemaining !== null && daysRemaining > 7;
    const isExpiringSoon = status === 'active' && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
    const isGracePeriodDB = status === 'grace_period';
    const isInGraceWindow = effectivelyExpired && daysSinceExpiry !== null && daysSinceExpiry <= 7;
    const isHardBlocked = !subscription || status === 'cancelled' ||
        (effectivelyExpired && daysSinceExpiry !== null && daysSinceExpiry > 7);

    if (isActive) return null;
    if (dismissed && !isHardBlocked) return null;

    // ── 1. Expiring Soon ──────────────────────────────────────────────────
    if (isExpiringSoon || isGracePeriodDB) {
        const daysLeft = daysRemaining ?? 0;
        return (
            <div style={{
                background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #d97706 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite',
            }} className="w-full relative overflow-hidden">
                <style>{`
                    @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
                `}</style>
                <div className="relative z-10 flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <Clock size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-semibold">
                            ⚠️ Subscription expires in{' '}
                            <strong className="text-yellow-100 underline decoration-dotted">
                                {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                            </strong>
                            {' '}— renew now to avoid interruption.
                        </span>
                    </div>
                    <a
                        href="https://table-tap.in/#pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-1.5 bg-white text-amber-700 text-xs font-bold px-3.5 py-1.5 rounded-full shadow hover:shadow-md transition-all whitespace-nowrap hover:bg-amber-50"
                    >
                        <Zap size={11} className="fill-amber-500 text-amber-500" />
                        Renew Now
                    </a>
                    <button
                        onClick={() => setDismissed(true)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <X size={12} className="text-white" />
                    </button>
                </div>
            </div>
        );
    }

    // ── 2. Grace Window ──────────────────────────────────────────────────
    if (isInGraceWindow) {
        const daysLeft = 7 - (daysSinceExpiry ?? 0);
        const urgency = daysLeft <= 2;
        return (
            <div className={`w-full relative overflow-hidden ${urgency ? 'bg-red-600' : 'bg-rose-600'}`}>
                {/* Animated pulse overlay */}
                <div className={`absolute inset-0 ${urgency ? 'bg-red-500/40 animate-pulse' : 'bg-rose-500/20'}`} />
                <div className="relative z-10 flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                        <ShieldAlert size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold leading-tight">
                            🔴 Subscription Expired — Grace Period
                        </p>
                        <p className="text-red-100 text-xs font-medium mt-0.5">
                            <strong className="text-white">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> left before your dashboard & customer app are locked.
                        </p>
                    </div>
                    <a
                        href="https://table-tap.in/#pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-1.5 bg-white text-red-600 text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all whitespace-nowrap hover:bg-red-50"
                    >
                        <CreditCard size={12} />
                        Renew Now
                        <ExternalLink size={10} className="opacity-60" />
                    </a>
                    <button
                        onClick={() => setDismissed(true)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <X size={12} className="text-white" />
                    </button>
                </div>
                {/* Progress bar showing grace window */}
                <div className="h-0.5 w-full bg-white/20">
                    <div
                        className="h-full bg-white/70 transition-all"
                        style={{ width: `${(daysLeft / 7) * 100}%` }}
                    />
                </div>
            </div>
        );
    }

    // ── 3. Hard Blocked modal ────────────────────────────────────────────
    if (!isHardBlocked) return null;
    const canDismiss = userRole === 'admin';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
        >
            {canDismiss && (
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                    <X size={18} />
                </button>
            )}

            <div className="bg-white rounded-[28px] shadow-2xl max-w-sm w-full overflow-hidden">
                {/* Top gradient bar */}
                <div className="h-2 w-full bg-gradient-to-r from-red-500 via-rose-500 to-orange-500" />

                <div className="p-7 text-center">
                    {/* Icon */}
                    <div className="relative w-20 h-20 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-30" />
                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-red-100 to-rose-100 border-2 border-red-200 flex items-center justify-center">
                            <AlertTriangle size={36} className="text-red-500" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-1">Access Suspended</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-1">
                        Your{subscription?.plan_name ? ` ${subscription.plan_name}` : ''} subscription has expired.
                    </p>
                    {subscription?.end_date && (
                        <p className="text-xs text-red-400 font-semibold mb-5">
                            Expired on {new Date(subscription.end_date).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </p>
                    )}

                    {/* Impact cards */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {[
                            { icon: '🛑', text: 'Orders paused' },
                            { icon: '📵', text: 'QR codes off' },
                            { icon: '👁️', text: 'Hidden from customers' },
                            { icon: '🔒', text: 'Dashboard locked' },
                        ].map((item) => (
                            <div key={item.text} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-2.5 text-left">
                                <span className="text-base">{item.icon}</span>
                                <span className="text-xs font-semibold text-red-700">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <a
                        href="https://table-tap.in/#pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-rose-600 transition-all mb-3"
                    >
                        <CreditCard size={18} />
                        Renew Subscription
                        <ExternalLink size={13} className="opacity-70" />
                    </a>

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Checking...' : "I've Renewed — Check Again"}
                    </button>

                    <p className="mt-4 text-xs text-gray-400">
                        Need help?{' '}
                        <a href="mailto:support@table-tap.in" className="text-orange-500 hover:underline font-medium">
                            support@table-tap.in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionExpiredBanner;
