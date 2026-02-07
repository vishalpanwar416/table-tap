'use client';

import { QrCode, ArrowRight, Zap, CreditCard } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { useSettings } from '../context/SettingsContext';
import data from '../data/landing-data.json';

const Hero = () => {
    const { hero: dbHero } = useSettings();
    const hero = dbHero || data.hero;
    const { openModal } = useModal();

    return (
        <section
            id="home"
            aria-label="Hero section - Introduction to Table Tap"
            className="relative min-h-[90dvh] sm:min-h-[100vh] flex items-center pt-16 sm:pt-28 md:pt-36 pb-10 sm:pb-14 md:pb-18 overflow-hidden bg-white"
        >
            {/* Background Aesthetic Elements - CSS only (smaller on mobile) */}
            <div className="blob top-[-80px] left-[-80px] bg-[#2A9D8F]/20 opacity-40 sm:opacity-60 w-[220px] h-[220px] sm:w-[480px] sm:h-[480px]" />
            <div className="blob blob-secondary bottom-[-80px] right-[-80px] opacity-30 sm:opacity-40 w-[200px] h-[200px] sm:w-[420px] sm:h-[420px]" />
            <div className="blob top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E76F51]/5 w-[320px] h-[320px] sm:w-[700px] sm:h-[700px] opacity-20 sm:opacity-30" />

            {/* Floating Decorative Objects - CSS animations */}
            <div className="absolute top-[20%] left-[10%] opacity-[0.05] hidden lg:block pointer-events-none animate-float">
                <div className="w-16 h-16 bg-[#2A9D8F] rounded-2xl blur-xl" />
            </div>
            <div className="absolute bottom-[20%] right-[10%] opacity-[0.03] hidden lg:block pointer-events-none animate-float-slow">
                <QrCode size={120} className="text-[#2A9D8F]" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-full">
                <div className="flex flex-col items-center text-center">
                    {/* Main Title */}
                    <div className="overflow-hidden mb-4 sm:mb-6 md:mb-8 pb-2 sm:pb-4">
                        <h1 className="text-[clamp(2rem,6vw+0.5rem,3.8rem)] sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.98] animate-slide-up px-1">
                            <span className="text-gray-900">{hero.titlePrefix} </span>
                            <span className="gradient-text drop-shadow-sm">{hero.titleMain}</span>
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p className="text-gray-500 text-[0.95rem] sm:text-lg md:text-xl lg:text-2xl max-w-2xl sm:max-w-3xl mb-7 sm:mb-10 md:mb-12 leading-relaxed font-medium animate-fade-in-up px-3 sm:px-2">
                        {hero.subtitle}
                    </p>

                    {/* CTA Section - stack on very small, side-by-side on sm+ */}
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-5 mb-10 sm:mb-16 md:mb-20 animate-fade-in-up-delay w-full sm:w-auto max-w-sm sm:max-w-none px-2">
                        <button
                            onClick={() => openModal('starter')}
                            aria-label="Start your free trial of Table Tap"
                            className="btn-premium flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg px-5 sm:px-8 md:px-12 py-3.5 sm:py-5 md:py-6 shadow-2xl shadow-[#2A9D8F]/20 hover:scale-105 active:scale-95 transition-transform min-h-[44px]"
                        >
                            {hero.ctaPrimary.text} <ArrowRight size={20} className="sm:w-[22px] sm:h-[22px]" aria-hidden="true" />
                        </button>
                        <a
                            href={hero.ctaSecondary.href}
                            aria-label="Watch a demo of Table Tap in action"
                            className="btn-outline flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg px-5 sm:px-8 md:px-12 py-3.5 sm:py-5 md:py-6 backdrop-blur-md hover:scale-105 active:scale-95 transition-transform min-h-[44px]"
                        >
                            {hero.ctaSecondary.text}
                        </a>
                    </div>

                    {/* Phone Showcase - smaller on mobile */}
                    <div className="relative w-full max-w-4xl mx-auto min-h-[280px] sm:min-h-[430px] md:min-h-[560px] mt-4 sm:mt-10 flex justify-center px-2">
                        {/* Main Phone View */}
                        <div className="relative w-[210px] h-[380px] sm:w-[270px] sm:h-[480px] md:w-[300px] md:h-[550px] bg-[#0F172A] rounded-[34px] sm:rounded-[46px] md:rounded-[56px] p-3 sm:p-4 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.15)] sm:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] z-20 border-[5px] sm:border-[8px] border-white ring-1 ring-gray-200 animate-phone-appear">
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
                                <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-2">
                                    <div className="flex justify-between items-center mb-3 sm:mb-6">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gray-50 flex items-center justify-center p-1.5 sm:p-2 border border-blue-50">
                                                <div className="w-full h-full bg-[#2A9D8F] rounded-full shadow-inner" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] sm:text-[14px] font-black text-gray-900 mb-0.5">The Sanctuary</h4>
                                                <p className="text-[9px] sm:text-[11px] text-[#2A9D8F] font-black uppercase tracking-widest">Table 12</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div className="flex gap-2 sm:gap-3 overflow-hidden mb-4 sm:mb-8">
                                        {['All', 'Artisan', 'Pairings'].map((cat, i) => (
                                            <div key={cat} className={`flex-shrink-0 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black transition-all ${i === 0 ? 'bg-[#2A9D8F] text-white shadow-xl shadow-[#2A9D8F]/20' : 'bg-gray-50 text-gray-400'}`}>
                                                {cat}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="flex-1 overflow-hidden px-3 sm:px-6 space-y-3 sm:space-y-6">
                                    {[
                                        { name: 'Heirloom Pizza', price: '₹499', color: 'bg-orange-50' },
                                        { name: 'Truffle Pasta', price: '₹699', color: 'bg-emerald-50' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-2 sm:gap-4 items-center">
                                            <div className="flex-1 min-w-0">
                                                <div className="h-2.5 sm:h-3 w-3/4 bg-gray-900 rounded-full mb-1.5 sm:mb-2" />
                                                <div className="h-1.5 sm:h-2 w-1/2 bg-gray-100 rounded-full mb-2 sm:mb-3" />
                                                <p className="text-[10px] sm:text-[12px] font-black text-gray-900">{item.price}</p>
                                            </div>
                                            <div className={`w-14 h-14 sm:w-20 sm:h-20 ${item.color} rounded-xl sm:rounded-2xl flex-shrink-0 relative`}>
                                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-white px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black shadow-md border border-gray-100">ADD</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Cart Bar */}
                                <div className="p-3 sm:p-6 pt-2">
                                    <div className="w-full h-10 sm:h-14 bg-[#2A9D8F] rounded-xl sm:rounded-2xl flex items-center justify-between px-4 sm:px-6 text-white shadow-2xl shadow-[#2A9D8F]/30">
                                        <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest">2 Items</span>
                                        <span className="text-[12px] sm:text-[14px] font-black">₹898</span>
                                    </div>
                                    <div className="h-1 sm:h-1.5 w-1/4 bg-gray-100 mx-auto mt-4 sm:mt-6 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Floating Cards - CSS animations */}
                        <div className="absolute right-[5%] top-[15%] glass-card p-6 rounded-[32px] z-30 hidden md:flex items-center gap-5 border-white shadow-3xl animate-float">
                            <div className="p-4 bg-emerald-50 rounded-2xl">
                                <Zap size={24} className="text-[#2A9D8F]" />
                            </div>
                            <div className="pr-4">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{hero.stats[0].label}</p>
                                <p className="text-3xl font-black text-gray-900 leading-none">{hero.stats[0].value}</p>
                            </div>
                        </div>

                        <div className="absolute left-[5%] top-[35%] glass-card p-6 rounded-[32px] z-30 hidden md:flex items-center gap-4 border-white shadow-3xl animate-float-slow">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <CreditCard size={24} className="text-blue-500" />
                            </div>
                            <p className="text-gray-900 font-black text-sm tracking-tight">Secure Payments</p>
                        </div>

                        <div className="absolute right-[10%] bottom-[15%] glass-card p-5 rounded-[32px] z-30 hidden md:flex items-center gap-4 border-white shadow-3xl animate-float-medium">
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
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
