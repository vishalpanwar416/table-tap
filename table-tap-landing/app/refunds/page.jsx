'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, RefreshCcw, Calendar, CreditCard, Clock, XCircle, Gift, Headphones, Mail, Phone, CheckCircle } from 'lucide-react';

export default function RefundPolicy() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="bg-[#0F172A] text-white">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-[#2A9D8F] hover:text-[#3DBDAD] transition-all duration-300 p-2 -ml-2 rounded-full hover:bg-white/5"
                        >
                            <ChevronLeft size={28} />
                            <span className="font-medium">Back</span>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mt-8 pb-8"
                    >
                        <div className="w-16 h-16 bg-[#2A9D8F]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <RefreshCcw className="w-8 h-8 text-[#2A9D8F]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3">Refund Policy</h1>
                        <p className="text-gray-400">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-12 max-w-4xl">
                {/* Free Trial */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8"
                >
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shrink-0">
                            <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Free Trial</h2>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                Table Tap offers a free trial period for new users. During the trial, you can explore all features without any payment. No refund is applicable for free trial periods.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Subscription Refunds */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6"
                >
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 pt-2">Subscription Refunds</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-[#2A9D8F]/10 p-6 rounded-xl border border-[#2A9D8F]/20">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#2A9D8F]" />
                                    Monthly Subscriptions
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <span><strong>Within 7 days:</strong> Full refund if not satisfied</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        <span><strong>After 7 days:</strong> No refund, continue until billing cycle ends</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    Annual Subscriptions
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <span><strong>Within 14 days:</strong> Full refund if not satisfied</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-gray-600">
                                        <RefreshCcw className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                        <span><strong>After 14 days:</strong> Pro-rata refund for unused months</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* How to Request */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6"
                >
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                                <Headphones className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 pt-2">How to Request a Refund</h3>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                            {[
                                { step: "1", title: "Email Us", desc: "Send request with account details" },
                                { step: "2", title: "Include Info", desc: "Email & reason for refund" },
                                { step: "3", title: "Review", desc: "2-3 business days" },
                                { step: "4", title: "Processing", desc: "5-7 business days" }
                            ].map((item, i) => (
                                <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-[#2A9D8F] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                                        {item.step}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Non-Refundable */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6"
                >
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 pt-2">Non-Refundable Items</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                            {["Setup fees (if applicable)", "Custom development work", "Training sessions conducted", "Domain registration fees", "Third-party integration costs"].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-gray-600 p-3 bg-red-50 rounded-lg">
                                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Refund Processing Times */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6"
                >
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 pt-2">Refund Processing Times</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { method: "Credit/Debit Card", time: "5-7 days" },
                                { method: "UPI", time: "2-3 days" },
                                { method: "Net Banking", time: "5-7 days" },
                                { method: "Wallet", time: "1-2 days" }
                            ].map((item, i) => (
                                <div key={i} className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <p className="font-semibold text-gray-900 mb-1">{item.method}</p>
                                    <p className="text-[#2A9D8F] font-bold">{item.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Our Commitment */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="bg-gradient-to-r from-[#2A9D8F] to-[#21867a] rounded-3xl p-8 md:p-12 text-white mb-8"
                >
                    <h3 className="text-2xl font-bold mb-4">Our Commitment</h3>
                    <p className="text-white/90 text-lg leading-relaxed">
                        At Table Tap, customer satisfaction is our priority. If you&apos;re not happy with our service, we&apos;ll work with you to make it right. Our goal is to build long-term partnerships with restaurants, not just transactions.
                    </p>
                </motion.div>

                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="bg-[#0F172A] rounded-3xl p-8 md:p-12 text-white"
                >
                    <h3 className="text-2xl font-bold mb-6">Need Help with Refunds?</h3>
                    <p className="text-gray-300 mb-6">Our support team responds within 24 hours:</p>
                    <div className="flex flex-wrap gap-4">
                        <a href="mailto:vishalpanwar416@gmail.com" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <Mail className="w-5 h-5 text-[#2A9D8F]" />
                            <span className="text-sm">vishalpanwar416@gmail.com</span>
                        </a>
                        <a href="tel:+917500988212" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <Phone className="w-5 h-5 text-[#2A9D8F]" />
                            <span className="text-sm">+91 75009 88212</span>
                        </a>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
