'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowLeft,
    ArrowRight,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    ChefHat,
    Users,
    Store,
    Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Redirect to restaurant dashboard
                redirectToDashboard();
            }
        };
        checkSession();
    }, []);

    const redirectToDashboard = () => {
        // Determine the correct dashboard URL based on environment
        const isLocalhost = typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        let dashboardUrl;
        
        if (isLocalhost) {
            // In development, redirect to the table-tap-app running locally
            // The app uses path-based routing: /restaurant/* for restaurant dashboard
            // Default port for table-tap-app is 3000 (or 3001 if landing is on 3000)
            const appPort = process.env.NEXT_PUBLIC_APP_PORT || '3001';
            dashboardUrl = `http://localhost:${appPort}/restaurant/`;
        } else {
            // In production, redirect to restaurant subdomain
            dashboardUrl = 'https://restaurant.table-tap.com';
        }
        
        window.location.href = dashboardUrl;
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;

            if (data?.user) {
                // Check if user has restaurant access
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, restaurant_id')
                    .eq('id', data.user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Profile fetch error:', profileError);
                }

                // Check if user has restaurant staff role
                const allowedRoles = ['owner', 'manager', 'captain', 'chef', 'staff', 'admin'];
                if (profile && allowedRoles.includes(profile.role)) {
                    redirectToDashboard();
                } else {
                    // User doesn't have restaurant access
                    setError('You do not have access to the restaurant dashboard. Please contact your restaurant administrator.');
                    await supabase.auth.signOut();
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            if (err.message.includes('Invalid login credentials')) {
                setError('Invalid email or password. Please try again.');
            } else if (err.message.includes('Email not confirmed')) {
                setError('Please verify your email address before logging in.');
            } else {
                setError(err.message || 'Failed to sign in. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/login`
                }
            });

            if (error) throw error;
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError('Failed to sign in with Google. Please try again.');
            setIsGoogleLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;

            setResetEmailSent(true);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Forgot Password View
    if (showForgotPassword) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
                {/* Background Blobs */}
                <div className="blob fixed top-0 left-0 opacity-50" />
                <div className="blob blob-secondary fixed bottom-0 right-0 opacity-50" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-8">
                            <Image src="/logo.png" alt="Table Tap" width={160} height={64} className="h-14 w-auto mx-auto" />
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Reset Password</h1>
                        <p className="text-gray-500 font-bold">
                            {resetEmailSent 
                                ? 'Check your email for reset instructions'
                                : 'Enter your email to receive reset instructions'
                            }
                        </p>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
                        {resetEmailSent ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Mail className="text-emerald-500" size={32} />
                                </div>
                                <p className="text-gray-600 mb-6">
                                    We've sent a password reset link to <strong>{email}</strong>. 
                                    Please check your inbox and follow the instructions.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetEmailSent(false);
                                    }}
                                    className="btn-premium w-full flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} /> Back to Login
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
                                        <AlertCircle size={20} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-premium w-full flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>Send Reset Link <ArrowRight size={20} /></>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="w-full text-center text-gray-500 font-bold hover:text-gray-700 transition-colors"
                                >
                                    Back to Login
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    // Main Login View
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Background Blobs */}
            <div className="blob fixed top-0 left-0 opacity-50" />
            <div className="blob blob-secondary fixed bottom-0 right-0 opacity-50" />

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Table Tap" width={140} height={56} className="h-12 w-auto" />
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                        <ArrowLeft size={18} /> Back to Home
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Side - Info */}
                    <div className="hidden lg:block">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
                                Restaurant <span className="gradient-text">Dashboard</span>
                            </h1>
                            <p className="text-gray-500 font-bold text-lg mb-8">
                                Access your restaurant management portal. Manage orders, staff, menu, and more.
                            </p>

                            {/* Role Cards */}
                            <div className="space-y-4">
                                <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Store className="text-[#2A9D8F]" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900">Restaurant Owners</h3>
                                        <p className="text-sm text-gray-500">Full access to analytics, settings, and financial reports</p>
                                    </div>
                                </div>

                                <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Users className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900">Managers & Captains</h3>
                                        <p className="text-sm text-gray-500">Handle orders, manage tables, and coordinate staff</p>
                                    </div>
                                </div>

                                <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <ChefHat className="text-amber-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900">Kitchen Staff</h3>
                                        <p className="text-sm text-gray-500">View incoming orders and update preparation status</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Side - Login Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="bg-white rounded-[48px] p-10 shadow-xl border border-gray-100">
                            <div className="text-center mb-8 lg:hidden">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h1>
                                <p className="text-gray-500 font-bold">Sign in to your restaurant dashboard</p>
                            </div>

                            <div className="hidden lg:block text-center mb-8">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h2>
                                <p className="text-gray-500 font-bold">Sign in to continue</p>
                            </div>

                            {/* Google Sign-In Button */}
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isGoogleLoading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-6"
                            >
                                {isGoogleLoading ? (
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                )}
                                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                            </button>

                            {/* Divider */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500 font-bold">or sign in with email</span>
                                </div>
                            </div>

                            {/* Email Login Form */}
                            <form onSubmit={handleEmailLogin} className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Forgot Password Link */}
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm font-bold text-[#2A9D8F] hover:text-[#238b7e] transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-start gap-3 font-bold text-sm">
                                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-premium w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>Sign In <ArrowRight size={20} /></>
                                    )}
                                </button>
                            </form>

                            {/* Security Note */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Shield size={18} className="text-[#2A9D8F]" />
                                    <span className="font-bold">Your connection is secure and encrypted</span>
                                </div>
                            </div>

                            {/* Register Link */}
                            <div className="mt-6 text-center">
                                <p className="text-gray-500 font-bold">
                                    Don't have an account?{' '}
                                    <Link href="/register" className="text-[#2A9D8F] hover:text-[#238b7e] font-black transition-colors">
                                        Register your restaurant
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
