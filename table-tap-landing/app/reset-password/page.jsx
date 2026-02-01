'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    Check,
    Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(null);

    // Check if user has a valid reset session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsValidSession(!!session);
        };
        checkSession();

        // Listen for auth state changes (when user clicks reset link)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);

            // Sign out and redirect to login after a delay
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/login');
            }, 3000);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while checking session
    if (isValidSession === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F]"></div>
            </div>
        );
    }

    // Invalid session state
    if (!isValidSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
                <div className="blob fixed top-0 left-0 opacity-50" />
                <div className="blob blob-secondary fixed bottom-0 right-0 opacity-50" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-8">
                            <Image src="/logo.png" alt="Table Tap" width={160} height={64} className="h-14 w-auto mx-auto" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="text-amber-500" size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-4">
                            Invalid or Expired Link
                        </h1>
                        <p className="text-gray-500 font-bold mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <Link
                            href="/login"
                            className="btn-premium inline-flex items-center gap-2"
                        >
                            Back to Login <ArrowRight size={20} />
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
                <div className="blob fixed top-0 left-0 opacity-50" />
                <div className="blob blob-secondary fixed bottom-0 right-0 opacity-50" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-8">
                            <Image src="/logo.png" alt="Table Tap" width={160} height={64} className="h-14 w-auto mx-auto" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="text-emerald-500" size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-4">
                            Password Reset Successful!
                        </h1>
                        <p className="text-gray-500 font-bold mb-6">
                            Your password has been successfully updated. Redirecting you to login...
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[#2A9D8F] font-bold">
                            <div className="w-5 h-5 border-2 border-[#2A9D8F] border-t-transparent rounded-full animate-spin" />
                            Redirecting...
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Reset Password Form
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create New Password</h1>
                    <p className="text-gray-500 font-bold">Enter your new password below</p>
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 font-bold">Minimum 6 characters</p>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
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
                                <>Reset Password <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>

                    {/* Security Note */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <Shield size={18} className="text-[#2A9D8F]" />
                            <span className="font-bold">Your new password will be encrypted and secure</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F]"></div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
