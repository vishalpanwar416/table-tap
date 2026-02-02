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
        <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-24 relative bg-white overflow-hidden">
            {/* Background */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#F4A261]/5 rounded-full blur-[120px] -translate-x-1/2" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-32">
                    <div className="inline-flex items-center gap-3 bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 px-6 py-2 rounded-2xl mb-10">
                        <Sparkles size={18} className="text-[#2A9D8F]" />
                        <span className="text-[#2A9D8F] text-[12px] font-black uppercase tracking-[0.3em]">{howItWorks.badge}</span>
                    </div>
                    <h2
                        id="how-it-works-heading"
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-10 leading-[0.85] tracking-tighter"
                    >
                        {howItWorks.titlePrefix} <span className="gradient-text italic font-serif">{howItWorks.titleItalic}</span>
                    </h2>
                </div>

                <div className="flex flex-col md:flex-row items-start justify-center gap-12 md:gap-8 relative" role="list" aria-label="Setup steps">
                    {/* Timeline Connector */}
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
                                <div className={`w-32 h-32 rounded-[48px] ${step.color} flex items-center justify-center mb-12 relative transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-xl shadow-transparent group-hover:shadow-current/10`}>
                                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-white shadow-2xl flex items-center justify-center font-black text-lg text-gray-900 border border-gray-50 z-10">
                                        {step.number}
                                    </div>
                                    <Icon className="text-gray-900 opacity-80 group-hover:opacity-100 transition-opacity" size={48} />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{step.title}</h3>
                                <p className="text-gray-500 text-sm font-bold max-w-[220px] text-center leading-relaxed">
                                    {step.description}
                                </p>
                            </article>
                        );
                    })}
                </div>

                {/* Device Showcase Section */}
                <div className="mt-56 grid lg:grid-cols-2 gap-32 items-center">
                    <div className="relative animate-fade-in-up">
                        {/* Background Circle */}
                        <div className="absolute inset-0 bg-[#2A9D8F]/5 rounded-full scale-125 blur-3xl" />

                        <div className="glass rounded-[72px] p-2 aspect-[4/3] relative z-10 border-white shadow-3xl group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative w-full h-full rounded-[68px] overflow-hidden bg-white shadow-inner flex flex-col p-12">
                                <div className="flex justify-between items-center mb-12">
                                    <div className="h-4 w-40 bg-gray-50 rounded-full" />
                                    <div className="h-12 w-12 bg-[#2A9D8F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2A9D8F]/30 animate-pulse">
                                        <Smartphone size={24} className="text-white" />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="h-6 w-full bg-gray-50 rounded-full" />
                                    <div className="h-6 w-5/6 bg-gray-50 rounded-full" />
                                    <div className="h-6 w-2/3 bg-gray-50 rounded-full" />
                                    <div className="pt-12 grid grid-cols-2 gap-6">
                                        <div className="h-32 bg-gray-50 rounded-[32px] border border-gray-100/50 hover:-translate-y-2 transition-transform" />
                                        <div className="h-32 bg-gray-50 rounded-[32px] border border-gray-100/50 shadow-sm hover:-translate-y-2 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-16 -right-16 glass-card p-8 rounded-[40px] shadow-3xl z-20 border-white/50 backdrop-blur-2xl animate-float">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Sparkles size={20} className="text-emerald-500" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500">Live Status</p>
                            </div>
                            <p className="text-2xl font-black text-gray-900 tracking-tight">Order Received!</p>
                            <p className="text-gray-400 text-xs font-bold mt-1">Sent to Kitchen Display • 12s ago</p>
                        </div>
                    </div>

                    <div className="text-left py-10">
                        <div className="flex items-center gap-4 text-[#2A9D8F] text-sm font-black uppercase tracking-[0.3em] mb-8">
                            <span className="w-10 h-1 bg-[#2A9D8F]" />
                            {howItWorks.experience.badge}
                        </div>

                        <h3 className="text-5xl md:text-7xl font-black text-gray-900 mb-10 leading-[0.9] tracking-tighter">
                            {howItWorks.experience.title} <br />
                            <span className="text-gray-400 italic">{howItWorks.experience.subtitle}</span>
                        </h3>

                        <div className="space-y-10 mt-12">
                            {howItWorks.experience.benefits.map((benefit, i) => (
                                <div
                                    key={benefit}
                                    className="flex items-start gap-8 group animate-fade-in-up"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center shrink-0 group-hover:bg-[#2A9D8F] group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-gray-200">
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <p className="text-gray-900 font-black text-xl mb-1 tracking-tight">{benefit.split(' - ')[0]}</p>
                                        <p className="text-gray-500 font-bold text-sm leading-relaxed">{benefit.split(' - ')[1]}</p>
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
