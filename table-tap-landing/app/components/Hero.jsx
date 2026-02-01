'use client';

import { motion } from 'framer-motion';
import { QrCode, ArrowRight, Zap, CreditCard, Smartphone } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import data from '../data/landing-data.json';

const Hero = () => {
    const { hero } = data;
    const { openModal } = useModal();

    return (
        <section id="home" aria-label="Hero section - Introduction to Table Tap" className="relative min-h-[100vh] flex items-center pt-40 pb-20 overflow-hidden bg-white">
            {/* Background Aesthetic Elements */}
            <div className="blob top-[-100px] left-[-100px] bg-[#2A9D8F]/20 opacity-60" />
            <div className="blob blob-secondary bottom-[-100px] right-[-100px] opacity-40" />
            <div className="blob top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E76F51]/5 w-[800px] h-[800px] opacity-30" />

            {/* Floating Decorative Objects */}
            <motion.div
                animate={{ y: [0, -40, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[20%] left-[10%] opacity-[0.05] hidden lg:block pointer-events-none"
            >
                <div className="w-16 h-16 bg-[#2A9D8F] rounded-2xl blur-xl" />
            </motion.div>
            <motion.div
                animate={{ y: [0, 50, 0], rotate: [0, -15, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[20%] right-[10%] opacity-[0.03] hidden lg:block pointer-events-none"
            >
                <QrCode size={120} className="text-[#2A9D8F]" />
            </motion.div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center">
                    {/* Main Title - Staggered Reveal */}
                    <div className="overflow-hidden mb-8 pb-4">
                        <motion.h1
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95]"
                        >
                            <span className="text-gray-900">{hero.titlePrefix} </span>
                            <span className="gradient-text drop-shadow-sm">{hero.titleMain}</span>
                        </motion.h1>
                    </div>

                    {/* Subtitle - Fade In with slide */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-gray-500 text-xl md:text-2xl max-w-3xl mb-12 leading-relaxed font-medium"
                    >
                        {hero.subtitle}
                    </motion.p>

                    {/* CTA Section - Magnetic Interactive */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-wrap justify-center gap-6 mb-24"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openModal('starter')}
                            aria-label="Start your free trial of Table Tap"
                            className="btn-premium flex items-center gap-3 text-lg px-12 py-6 shadow-2xl shadow-[#2A9D8F]/20"
                        >
                            {hero.ctaPrimary.text} <ArrowRight size={22} aria-hidden="true" />
                        </motion.button>
                        <motion.a
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href={hero.ctaSecondary.href}
                            aria-label="Watch a demo of Table Tap in action"
                            className="btn-outline flex items-center gap-3 text-lg px-12 py-6 backdrop-blur-md"
                        >
                            {hero.ctaSecondary.text}
                        </motion.a>
                    </motion.div>

                    {/* High-Fidelity Phone Showcase with Enhanced Floating Elements */}
                    <div className="relative w-full max-w-5xl mx-auto min-h-[600px] mt-12 flex justify-center">
                        {/* Main Phone View - Elevated with Shadow */}
                        <motion.div
                            initial={{ opacity: 0, y: 100, rotateX: 20 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                            className="relative w-[300px] h-[550px] bg-[#0F172A] rounded-[56px] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] z-20 border-[8px] border-white ring-1 ring-gray-200 perspective-1000"
                        >
                            <div className="bg-white w-full h-full rounded-[44px] overflow-hidden relative flex flex-col">
                                {/* Status Bar */}
                                <div className="h-8 w-full bg-white flex justify-between px-8 items-center pt-4">
                                    <div className="text-[11px] font-bold text-gray-900">9:41</div>
                                    <div className="flex gap-2 grayscale">
                                        <div className="w-4 h-2 bg-black rounded-[2px]" />
                                        <div className="w-3 h-2 bg-black rounded-[2px]" />
                                    </div>
                                </div>

                                {/* Mock App Content */}
                                <div className="px-6 pt-5 pb-2">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center p-2 border border-blue-50">
                                                <div className="w-full h-full bg-[#2A9D8F] rounded-full shadow-inner" />
                                            </div>
                                            <div>
                                                <h4 className="text-[14px] font-black text-gray-900 mb-0.5">The Sanctuary</h4>
                                                <p className="text-[11px] text-[#2A9D8F] font-black uppercase tracking-widest">Table 12</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div className="flex gap-3 overflow-hidden mb-8">
                                        {['All', 'Artisan', 'Pairings'].map((cat, i) => (
                                            <div key={cat} className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all ${i === 0 ? 'bg-[#2A9D8F] text-white shadow-xl shadow-[#2A9D8F]/20' : 'bg-gray-50 text-gray-400'}`}>
                                                {cat}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="flex-1 overflow-hidden px-6 space-y-6">
                                    {[
                                        { name: 'Heirloom Pizza', price: '₹499', color: 'bg-orange-50' },
                                        { name: 'Truffle Pasta', price: '₹699', color: 'bg-emerald-50' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 items-center animate-pulse-slow">
                                            <div className="flex-1">
                                                <div className="h-3 w-3/4 bg-gray-900 rounded-full mb-2" />
                                                <div className="h-2 w-1/2 bg-gray-100 rounded-full mb-3" />
                                                <p className="text-[12px] font-black text-gray-900">{item.price}</p>
                                            </div>
                                            <div className={`w-20 h-20 ${item.color} rounded-2xl flex-shrink-0 relative`}>
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-lg text-[9px] font-black shadow-md border border-gray-100">ADD</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Cart Bar */}
                                <div className="p-6 pt-2">
                                    <div className="w-full h-14 bg-[#2A9D8F] rounded-2xl flex items-center justify-between px-6 text-white shadow-2xl shadow-[#2A9D8F]/30">
                                        <span className="text-[12px] font-black uppercase tracking-widest">2 Items</span>
                                        <span className="text-[14px] font-black">₹898</span>
                                    </div>
                                    <div className="h-1.5 w-1/4 bg-gray-100 mx-auto mt-6 rounded-full" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Interaction Cards */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute right-[5%] top-[15%] glass-card p-6 rounded-[32px] z-30 hidden md:flex items-center gap-5 border-white shadow-3xl"
                        >
                            <div className="p-4 bg-emerald-50 rounded-2xl">
                                <Zap size={24} className="text-[#2A9D8F]" />
                            </div>
                            <div className="pr-4">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{hero.stats[0].label}</p>
                                <p className="text-3xl font-black text-gray-900 leading-none">{hero.stats[0].value}</p>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
                            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute left-[5%] top-[35%] glass-card p-6 rounded-[32px] z-30 hidden md:flex items-center gap-4 border-white shadow-3xl"
                        >
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <CreditCard size={24} className="text-blue-500" />
                            </div>
                            <p className="text-gray-900 font-black text-sm tracking-tight">Secure Payments</p>
                        </motion.div>

                        <motion.div
                            animate={{ scale: [1, 1.05, 1], y: [0, 15, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute right-[10%] bottom-[15%] glass-card p-5 rounded-[32px] z-30 hidden md:flex items-center gap-4 border-white shadow-3xl"
                        >
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-[3px] border-white bg-gray-100 shadow-sm" />
                                ))}
                            </div>
                            <div>
                                <p className="text-gray-900 font-black text-sm">{hero.stats[1].value} {hero.stats[1].label}</p>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full" />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
