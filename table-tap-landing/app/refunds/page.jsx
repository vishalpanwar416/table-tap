'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { RefreshCcw, Calendar, CreditCard, Clock, XCircle, Gift, Headphones, CheckCircle } from 'lucide-react';

export default function RefundPolicy() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-100">
                <div className="container mx-auto px-4 sm:px-6 text-center">
                    <div className="w-16 h-16 bg-[#2A9D8F]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <RefreshCcw className="w-8 h-8 text-[#2A9D8F]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">Refund Policy</h1>
                    <p className="text-slate-500">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </section>

            {/* Content */}
            <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
                {/* Free Trial */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12 mb-8">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center shrink-0">
                            <Gift className="w-6 h-6 text-[#2A9D8F]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Free Trial</h2>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                Table Tap offers a free trial period for new users. During the trial, you can explore all features without any payment. No refund is applicable for free trial periods.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Subscription Refunds */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center shrink-0">
                                <CreditCard className="w-6 h-6 text-[#2A9D8F]" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 pt-2">Subscription Refunds</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-[#2A9D8F]/10 p-6 rounded-xl border border-[#2A9D8F]/20">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#2A9D8F]" />
                                    Monthly Subscriptions
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <CheckCircle className="w-5 h-5 text-[#2A9D8F] shrink-0 mt-0.5" />
                                        <span><strong>Within 7 days:</strong> Full refund if not satisfied</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <span><strong>After 7 days:</strong> No refund, continue until billing cycle ends</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#2A9D8F]" />
                                    Annual Subscriptions
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <CheckCircle className="w-5 h-5 text-[#2A9D8F] shrink-0 mt-0.5" />
                                        <span><strong>Within 14 days:</strong> Full refund if not satisfied</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <RefreshCcw className="w-5 h-5 text-[#2A9D8F] shrink-0 mt-0.5" />
                                        <span><strong>After 14 days:</strong> Pro-rata refund for unused months</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to Request */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center shrink-0">
                                <Headphones className="w-6 h-6 text-[#2A9D8F]" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 pt-2">How to Request a Refund</h3>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                            {[
                                { step: "1", title: "Email Us", desc: "Send request with account details" },
                                { step: "2", title: "Include Info", desc: "Email & reason for refund" },
                                { step: "3", title: "Review", desc: "2-3 business days" },
                                { step: "4", title: "Processing", desc: "5-7 business days" }
                            ].map((item, i) => (
                                <div key={i} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 bg-[#2A9D8F] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                                        {item.step}
                                    </div>
                                    <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Non-Refundable */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 pt-2">Non-Refundable Items</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                            {["Setup fees (if applicable)", "Custom development work", "Training sessions conducted", "Domain registration fees", "Third-party integration costs"].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Refund Processing Times */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center shrink-0">
                                <Clock className="w-6 h-6 text-[#2A9D8F]" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 pt-2">Refund Processing Times</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { method: "Credit/Debit Card", time: "5-7 days" },
                                { method: "UPI", time: "2-3 days" },
                                { method: "Net Banking", time: "5-7 days" },
                                { method: "Wallet", time: "1-2 days" }
                            ].map((item, i) => (
                                <div key={i} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="font-semibold text-slate-900 mb-1">{item.method}</p>
                                    <p className="text-[#2A9D8F] font-bold">{item.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Our Commitment */}
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white mb-8">
                    <h3 className="text-2xl font-bold mb-4">Our Commitment</h3>
                    <p className="text-slate-300 text-lg leading-relaxed">
                        At Table Tap, customer satisfaction is our priority. If you&apos;re not happy with our service, we&apos;ll work with you to make it right. Our goal is to build long-term partnerships with restaurants, not just transactions.
                    </p>
                </div>
            </div>

            <Footer />
        </main>
    );
}
