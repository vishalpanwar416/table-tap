'use client';

import { useState, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Contact from '../components/Contact';
import { Calculator, TrendingUp, Users, Clock, ArrowRight, CheckCircle2, Percent } from 'lucide-react';

export default function PricingCalculator() {
    const [avgOrders, setAvgOrders] = useState(50);
    const [avgTicket, setAvgTicket] = useState(500);
    const [tables, setTables] = useState(15);
    const [staffCount, setStaffCount] = useState(4);

    const { monthlyRevenue, potentialUpsell, staffEfficiency, totalValue } = useMemo(() => {
        const currentRevenue = avgOrders * avgTicket * 30;
        const upsellImpact = currentRevenue * 0.15;
        const efficiencyGain = (staffCount * 15000) * 0.25;
        return {
            monthlyRevenue: currentRevenue,
            potentialUpsell: upsellImpact,
            staffEfficiency: efficiencyGain,
            totalValue: upsellImpact + efficiencyGain
        };
    }, [avgOrders, avgTicket, staffCount]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <Header />

            <section className="pt-32 pb-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm mb-6 border border-emerald-100">
                            <Calculator size={16} /> ROI & Earnings Estimator
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                            See Your Profit <span className="gradient-text">Skyrocket.</span>
                        </h1>
                        <p className="text-xl text-slate-600 font-medium">
                            Adjust the sliders to estimate how much additional revenue Table Tap can generate for your restaurant.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-6xl mx-auto">
                        {/* Inputs Column */}
                        <div className="lg:col-span-5 space-y-8 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-4">
                                        <label className="font-bold text-slate-700">Daily Orders</label>
                                        <span className="text-emerald-600 font-black">{avgOrders}</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="500" step="10"
                                        value={avgOrders} onChange={(e) => setAvgOrders(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-4">
                                        <label className="font-bold text-slate-700">Avg. Order Value (₹)</label>
                                        <span className="text-emerald-600 font-black">₹{avgTicket}</span>
                                    </div>
                                    <input
                                        type="range" min="100" max="5000" step="50"
                                        value={avgTicket} onChange={(e) => setAvgTicket(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-4">
                                        <label className="font-bold text-slate-700">Number of Tables</label>
                                        <span className="text-emerald-600 font-black">{tables}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="100"
                                        value={tables} onChange={(e) => setTables(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-4">
                                        <label className="font-bold text-slate-700">Front-of-House Staff</label>
                                        <span className="text-emerald-600 font-black">{staffCount}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="20"
                                        value={staffCount} onChange={(e) => setStaffCount(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 italic text-slate-400 text-sm">
                                *Estimates based on average Table Tap partner performance in India.
                            </div>
                        </div>

                        {/* Results Column */}
                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col justify-between shadow-2xl shadow-emerald-500/5">
                                <div className="p-3 bg-emerald-50 rounded-2xl w-fit mb-6">
                                    <TrendingUp className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-2">Upsell Growth</p>
                                    <h3 className="text-4xl font-black text-slate-900 mb-2">{formatCurrency(potentialUpsell)}</h3>
                                    <p className="text-emerald-600 font-bold text-sm flex items-center gap-1">
                                        <Percent size={14} /> +15% expected increase
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col justify-between">
                                <div className="p-3 bg-blue-50 rounded-2xl w-fit mb-6">
                                    <Users className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-2">Staff Efficiency</p>
                                    <h3 className="text-4xl font-black text-slate-900 mb-2">{formatCurrency(staffEfficiency)}</h3>
                                    <p className="text-blue-600 font-bold text-sm">₹ Saved in labor optimization</p>
                                </div>
                            </div>

                            <div className="md:col-span-2 bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden">
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div>
                                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-3">Total Estimated Annual Value</p>
                                        <h2 className="text-5xl md:text-7xl font-black mb-4">
                                            {formatCurrency(totalValue * 12)}
                                        </h2>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={18} className="text-emerald-400" />
                                                <span className="text-sm text-slate-300 font-medium">No Setup Fees</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={18} className="text-emerald-400" />
                                                <span className="text-sm text-slate-300 font-medium">ROI in 30 Days</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-3 whitespace-nowrap shadow-xl shadow-emerald-500/20">
                                        Get Started Now <ArrowRight size={20} />
                                    </button>
                                </div>
                                {/* Aesthetic Gradient Circle */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
