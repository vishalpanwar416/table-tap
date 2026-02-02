'use client';

import { QrCode, Smartphone, ChefHat, Sparkles } from 'lucide-react';
import data from '../data/landing-data.json';

const IconMap = {
    '01': QrCode,
    '02': Smartphone,
    '03': ChefHat
};

const HowItWorks = () => {
    const { howItWorks } = data;

    return (
        <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-12 sm:py-16 md:py-24 relative bg-white overflow-hidden">
            {/* Background - smaller on mobile */}
            <div className="absolute top-1/2 left-0 w-[280px] sm:w-[400px] md:w-[500px] h-[280px] sm:h-[400px] md:h-[500px] bg-[#F4A261]/5 rounded-full blur-[80px] sm:blur-[120px] -translate-x-1/2" />

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-full">
                <div className="text-center mb-12 sm:mb-20 md:mb-32">
                    <div className="inline-flex items-center gap-3 bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 px-4 sm:px-6 py-2 rounded-2xl mb-6 sm:mb-10">
                        <Sparkles size={16} className="sm:w-[18px] sm:h-[18px] text-[#2A9D8F]" />
                        <span className="text-[#2A9D8F] text-[11px] sm:text-[12px] font-black uppercase tracking-[0.3em]">{howItWorks.badge}</span>
                    </div>
                    <h2
                        id="how-it-works-heading"
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black text-gray-900 mb-6 sm:mb-10 leading-[0.85] tracking-tighter px-2"
                    >
                        {howItWorks.titlePrefix} <span className="gradient-text italic font-serif">{howItWorks.titleItalic}</span>
                    </h2>
                </div>

                <div className="flex flex-col md:flex-row items-start justify-center gap-8 sm:gap-10 md:gap-8 relative" role="list" aria-label="Setup steps">
                    <div className="absolute hidden lg:block top-[60px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-[#2A9D8F]/30 to-transparent -z-10" />

                    {howItWorks.steps.map((step, index) => {
                        const Icon = IconMap[step.number];
                        return (
                            <article
                                key={step.title}
                                role="listitem"
                                className="w-full md:max-w-xs flex flex-col items-center group relative pt-4 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            >
                                <div className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-[32px] sm:rounded-[40px] md:rounded-[48px] ${step.color} flex items-center justify-center mb-6 sm:mb-12 relative transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-xl shadow-transparent group-hover:shadow-current/10`}>
                                    <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white shadow-2xl flex items-center justify-center font-black text-sm sm:text-lg text-gray-900 border border-gray-50 z-10">
                                        {step.number}
                                    </div>
                                    <Icon className="text-gray-900 opacity-80 group-hover:opacity-100 transition-opacity w-10 h-10 sm:w-12 sm:h-12 md:w-[48px] md:h-[48px]" />
                                </div>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight text-center">{step.title}</h3>
                                <p className="text-gray-500 text-sm font-bold max-w-[260px] sm:max-w-[220px] text-center leading-relaxed px-2">
                                    {step.description}
                                </p>
                            </article>
                        );
                    })}
                </div>

                {/* Device Showcase Section - stack on mobile, grid on lg */}
                <div className="mt-16 sm:mt-24 md:mt-40 lg:mt-56 grid lg:grid-cols-2 gap-12 sm:gap-20 lg:gap-32 items-center">
                    <div className="relative animate-fade-in-up order-2 lg:order-1">
                        <div className="absolute inset-0 bg-[#2A9D8F]/5 rounded-full scale-125 blur-3xl" />

                        <div className="glass rounded-2xl sm:rounded-[48px] md:rounded-[72px] p-2 aspect-[4/3] relative z-10 border-white shadow-3xl group overflow-hidden max-w-lg mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative w-full h-full rounded-xl sm:rounded-[56px] md:rounded-[68px] overflow-hidden bg-white shadow-inner flex flex-col p-6 sm:p-10 md:p-12">
                                <div className="flex justify-between items-center mb-6 sm:mb-12">
                                    <div className="h-3 sm:h-4 w-24 sm:w-40 bg-gray-50 rounded-full" />
                                    <div className="h-9 w-9 sm:h-12 sm:w-12 bg-[#2A9D8F] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-[#2A9D8F]/30 animate-pulse">
                                        <Smartphone size={20} className="sm:w-6 sm:h-6 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-4 sm:space-y-8">
                                    <div className="h-4 sm:h-6 w-full bg-gray-50 rounded-full" />
                                    <div className="h-4 sm:h-6 w-5/6 bg-gray-50 rounded-full" />
                                    <div className="h-4 sm:h-6 w-2/3 bg-gray-50 rounded-full" />
                                    <div className="pt-6 sm:pt-12 grid grid-cols-2 gap-4 sm:gap-6">
                                        <div className="h-20 sm:h-32 bg-gray-50 rounded-2xl sm:rounded-[32px] border border-gray-100/50 hover:-translate-y-2 transition-transform" />
                                        <div className="h-20 sm:h-32 bg-gray-50 rounded-2xl sm:rounded-[32px] border border-gray-100/50 shadow-sm hover:-translate-y-2 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge - hide on very small, show from sm */}
                        <div className="absolute -bottom-8 -right-4 sm:-bottom-16 sm:-right-16 glass-card p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[40px] shadow-3xl z-20 border-white/50 backdrop-blur-2xl animate-float max-w-[200px] sm:max-w-none">
                            <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Sparkles size={16} className="sm:w-5 sm:h-5 text-emerald-500" />
                                </div>
                                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500">Live Status</p>
                            </div>
                            <p className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">Order Received!</p>
                            <p className="text-gray-400 text-[10px] sm:text-xs font-bold mt-1">Sent to Kitchen • 12s ago</p>
                        </div>
                    </div>

                    <div className="text-center lg:text-left py-4 sm:py-10 order-1 lg:order-2">
                        <div className="flex items-center justify-center lg:justify-start gap-4 text-[#2A9D8F] text-xs sm:text-sm font-black uppercase tracking-[0.3em] mb-6 sm:mb-8">
                            <span className="w-8 sm:w-10 h-1 bg-[#2A9D8F]" />
                            {howItWorks.experience.badge}
                        </div>

                        <h3 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-6 sm:mb-10 leading-[0.9] tracking-tighter px-2">
                            {howItWorks.experience.title} <br />
                            <span className="text-gray-400 italic">{howItWorks.experience.subtitle}</span>
                        </h3>

                        <div className="space-y-6 sm:space-y-10 mt-8 sm:mt-12">
                            {howItWorks.experience.benefits.map((benefit, i) => (
                                <div
                                    key={benefit}
                                    className="flex items-start gap-4 sm:gap-8 group animate-fade-in-up"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-900 text-white flex items-center justify-center shrink-0 group-hover:bg-[#2A9D8F] group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-gray-200">
                                        <Sparkles size={14} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-gray-900 font-black text-base sm:text-xl mb-1 tracking-tight">{benefit.split(' - ')[0]}</p>
                                        <p className="text-gray-500 font-bold text-xs sm:text-sm leading-relaxed">{benefit.split(' - ')[1]}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
