'use client';

import {
    Zap, Lock, Smartphone, Globe, Headphones, Palette, Sparkles, ArrowRight, Building2, BarChart3
} from 'lucide-react';
import data from '../data/landing-data.json';

const IconMap = {
    zap: Zap,
    lock: Lock,
    smartphone: Smartphone,
    globe: Globe,
    headphones: Headphones,
    palette: Palette,
    building: Building2,
    chart: BarChart3
};

const Features = () => {
    const { features } = data;

    return (
        <section id="features" aria-labelledby="features-heading" className="py-24 bg-[#F8FAFC]/30 relative overflow-hidden">
            {/* Background Particles - CSS only */}
            <div className="absolute top-1/4 left-10 w-2 h-2 bg-[#2A9D8F] rounded-full opacity-20 animate-float" />
            <div className="absolute bottom-1/4 right-10 w-3 h-3 bg-[#F4A261] rounded-full opacity-20 animate-float-slow" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-32">
                    <div className="inline-flex items-center gap-3 bg-white px-5 py-2 rounded-2xl shadow-sm border border-gray-100 mb-8">
                        <Sparkles size={16} className="text-[#2A9D8F]" />
                        <span className="text-gray-900 text-[11px] font-black uppercase tracking-[0.2em]">{features.badge}</span>
                    </div>

                    <h2
                        id="features-heading"
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-10 tracking-tighter leading-none"
                    >
                        {features.title}
                    </h2>
                    <p className="text-gray-500 text-xl font-bold max-w-3xl mx-auto leading-relaxed">
                        {features.description}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12" role="list" aria-label="Restaurant management features">
                    {features.mainFeatures.map((feature, index) => {
                        const Icon = IconMap[feature.type] || Zap;
                        return (
                            <article
                                key={feature.title}
                                role="listitem"
                                className="glass-card p-14 rounded-[56px] flex flex-col items-center text-center group border-white/50 active:scale-95 transition-all duration-300 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="w-24 h-24 rounded-[32px] bg-[#0F172A] shadow-2xl flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                                    <Icon className="text-[#2A9D8F]" size={42} aria-hidden="true" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-bold text-base opacity-80">{feature.description}</p>
                            </article>
                        );
                    })}
                </div>

                {/* Partnership Banner */}
                <div className="mt-24 relative group">
                    {/* Background Glows */}
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2A9D8F]/10 rounded-full blur-[120px] group-hover:bg-[#2A9D8F]/20 transition-colors duration-1000" />
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#F4A261]/10 rounded-full blur-[120px] group-hover:bg-[#F4A261]/20 transition-colors duration-1000" />

                    <div className="glass rounded-[72px] p-2 overflow-hidden relative border-white">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-[#2A9D8F]/10" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-12 md:p-20 gap-16">
                            {/* Text Content */}
                            <div className="text-left max-w-2xl">
                                <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] mb-6">
                                    <div className="w-1.5 h-1.5 bg-[#2A9D8F] rounded-full animate-pulse" />
                                    Partnership
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-[0.85] tracking-tighter">
                                    Your Control. <br />
                                    <span className="gradient-text italic">Our Support.</span>
                                </h3>
                                <p className="text-gray-500 text-lg font-bold mb-8 leading-relaxed max-w-lg">
                                    You run your restaurant, we power your technology. Full control over menus, offers, and orders—with 24/7 support whenever you need us.
                                </p>
                                <a
                                    href={features.banner.ctaHref}
                                    className="btn-premium px-12 py-6 text-xl rounded-2xl inline-flex items-center gap-4 group/btn shadow-3xl shadow-[#2A9D8F]/20 hover:translate-x-2 transition-transform"
                                >
                                    {features.banner.ctaText}
                                    <ArrowRight className="group-hover/btn:translate-x-2 transition-transform" />
                                </a>
                            </div>

                            {/* Metric Card */}
                            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                                {/* Rotating Borders - CSS */}
                                <div className="absolute inset-0 border-[3px] border-dashed border-[#2A9D8F]/20 rounded-full scale-110 animate-spin-slow" />
                                <div className="absolute inset-10 border border-gray-100 rounded-full opacity-50 animate-spin-reverse" />

                                {/* Metric Card */}
                                <div className="glass-card w-80 h-80 rounded-[64px] flex flex-col items-center justify-center relative bg-white/90 border-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] z-20 group-hover:shadow-[0_60px_120px_rgba(42,157,143,0.15)] transition-all duration-700 hover:-translate-y-5">
                                    <div className="text-[100px] font-black gradient-text tracking-tighter mb-4 leading-none">
                                        {features.banner.statValue}
                                    </div>
                                    <p className="text-gray-400 font-black text-[12px] uppercase tracking-[0.3em] text-center px-12 leading-relaxed">
                                        {features.banner.statLabel}
                                    </p>

                                    {/* Icon Badge */}
                                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#2A9D8F] rounded-[24px] flex items-center justify-center shadow-2xl shadow-[#2A9D8F]/40 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                        <Zap size={32} className="text-white" />
                                    </div>
                                </div>

                                {/* Background Accent */}
                                <div className="absolute -z-10 w-full h-full flex items-center justify-center">
                                    <div className="w-[400px] h-[400px] bg-[#2A9D8F]/5 rounded-full blur-[100px]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
