import React, { useState, useEffect } from 'react';
import { ChevronLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBasePathNavigate } from '../../../../shared/config/BasePathContext';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleIcon from '../../../../shared/components/icons/GoogleIcon';
import { authService } from '../../../../shared/api/authService';
import { supabase } from '../../../../shared/supabase';

// Allowed roles for admin panel access
const ALLOWED_ROLES = ['admin'];

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useBasePathNavigate();

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const user = await authService.getCurrentUser();
                if (user) {
                    // Check if user has admin role
                    const profile = await authService.getProfile(user.id);
                    if (profile && ALLOWED_ROLES.includes(profile.profile_role || profile.role)) {
                        navigate('/');
                    }
                }
            } catch (err) {
                console.log('No existing session');
            }
        };
        checkSession();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { user: authUser } = await authService.signInWithPassword(email.trim(), password);

            // Get user profile to check role
            const profile = await authService.getProfile(authUser.id);

            if (profile && ALLOWED_ROLES.includes(profile.profile_role || profile.role)) {
                navigate('/');
            } else {
                setError('Access denied. This portal is restricted to administrators only.');
                await authService.signOut();
            }
        } catch (err) {
            if (err.message?.includes('Invalid login credentials')) {
                setError('Invalid email or password. Please try again.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            // On production subdomains (app/restaurant/admin.table-tap.in), use /auth-callback
            // so App.js renders AuthCallback. On localhost we use /admin/auth-callback.
            const isProdSubdomain = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            const callbackPath = isProdSubdomain ? '/auth-callback' : '/admin/auth-callback';

            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}${callbackPath}`
                }
            });
        } catch (err) {
            setError(err.message || 'Google login failed');
            setLoading(false);
        }
    };

    // Animation variants
    const bgVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 1 } }
    };
    const cardVariants = {
        initial: { y: 40, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60, damping: 16 } },
        exit: { y: 40, opacity: 0, transition: { duration: 0.2 } }
    };
    const stagger = {
        animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
    };
    const itemVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } }
    };
    const errorVariants = {
        initial: { opacity: 0, x: 0 },
        animate: { opacity: 1, x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.5 } },
        exit: { opacity: 0 }
    };
    const buttonVariants = {
        initial: { scale: 1 },
        hover: { scale: 1.04 },
        tap: { scale: 0.98 },
        loading: { scale: 1, opacity: 0.7 }
    };

    return (
        <motion.div
            className="flex justify-center items-start min-h-screen bg-black relative overflow-hidden"
            variants={bgVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col z-10">
                {/* Header */}
                <div className="w-full px-6 py-8 relative flex items-center justify-center">
                    <button
                        className="absolute left-4 text-primary-500 hover:text-primary-600 transition-all duration-300 p-2 rounded-full hover:bg-primary-500/10 active:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-500/30 z-10"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <ChevronLeft size={30} />
                    </button>
                    <motion.h1
                        className="text-gray-100 text-3xl font-medium font-spartan"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Admin Portal
                    </motion.h1>
                </div>

                {/* Login Container */}
                <motion.div
                    className="bg-gray-200 w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan shadow-2xl z-10"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    {/* Welcome Section */}
                    <motion.div
                        className="text-center mb-8"
                        variants={itemVariants}
                    >
                        <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="text-primary-500" size={32} />
                        </div>
                        <h2 className="text-black text-3xl font-semibold mb-2">
                            Welcome Back, Admin!
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Platform management access
                        </p>
                    </motion.div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-center text-sm"
                                variants={errorVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                key={error}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <motion.div
                        className="space-y-5"
                        variants={stagger}
                        initial="initial"
                        animate="animate"
                    >
                        {/* Email Input */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-black mb-2 text-lg font-medium">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter admin email"
                                required
                                className="w-full p-4 bg-white rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-300"
                            />
                        </motion.div>

                        {/* Password Input */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-black mb-2 text-lg font-medium">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                    className="w-full p-4 bg-white rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-300 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="flex justify-end mt-2">
                                <Link
                                    to="/admin/forgot-password"
                                    className="text-primary-500 text-sm font-medium hover:text-primary-600"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </motion.div>

                        {/* Login Button */}
                        <motion.div variants={itemVariants}>
                            <motion.button
                                type="submit"
                                disabled={loading}
                                onClick={handleSubmit}
                                className="w-full bg-gray-700 text-white py-4 rounded-3xl font-semibold text-lg shadow-lg transition-all disabled:opacity-50 hover:bg-gray-800"
                                variants={buttonVariants}
                                whileHover={!loading ? "hover" : undefined}
                                whileTap={!loading ? "tap" : undefined}
                                animate={loading ? "loading" : "initial"}
                            >
                                {loading ? (
                                    <motion.span
                                        initial={{ opacity: 0.7 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                                    >
                                        Authenticating...
                                    </motion.span>
                                ) : 'Access Console'}
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    {/* Divider */}
                    <motion.div
                        className="flex items-center my-6"
                        variants={itemVariants}
                    >
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-gray-500 text-sm">secure login</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </motion.div>

                    {/* Google Login */}
                    <motion.div variants={itemVariants}>
                        <motion.button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white text-gray-700 py-4 rounded-3xl font-medium flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50 shadow border border-gray-200"
                            variants={buttonVariants}
                            whileHover={!loading ? "hover" : undefined}
                            whileTap={!loading ? "tap" : undefined}
                            type="button"
                        >
                            {loading ? (
                                <span className="inline-block h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <GoogleIcon size={22} />
                            )}
                            <span>{loading ? 'Signing in...' : 'Admin Sign In'}</span>
                        </motion.button>
                    </motion.div>

                    {/* Footer Warning */}
                    <motion.div
                        className="mt-auto pt-6 text-center"
                        variants={itemVariants}
                    >
                        <p className="text-gray-400 text-xs pb-4">
                            Authorized personnel only. All activities are monitored.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
}
