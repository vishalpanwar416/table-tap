

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
        <section id="features" aria-labelledby="features-heading" className="py-12 sm:py-16 md:py-24 bg-[#F8FAFC]/30 relative overflow-hidden">
            {/* Background Particles - CSS only */}
            <div className="absolute top-1/4 left-4 sm:left-10 w-2 h-2 bg-[#2A9D8F] rounded-full opacity-20 animate-float" />
            <div className="absolute bottom-1/4 right-4 sm:right-10 w-3 h-3 bg-[#F4A261] rounded-full opacity-20 animate-float-slow" />

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-full">
                <div className="text-center mb-12 sm:mb-20 md:mb-32">
                    <div className="inline-flex items-center gap-3 bg-white px-4 sm:px-5 py-2 rounded-2xl shadow-sm border border-gray-100 mb-6 sm:mb-8">
                        <Sparkles size={14} className="sm:w-4 sm:h-4 text-[#2A9D8F]" />
                        <span className="text-gray-900 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{features.badge}</span>
                    </div>

                    <h2
                        id="features-heading"
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black text-gray-900 mb-6 sm:mb-10 tracking-tighter leading-none px-2"
                    >
                        {features.title}
                    </h2>
                    <p className="text-gray-500 text-base sm:text-lg md:text-xl font-bold max-w-3xl mx-auto leading-relaxed px-2">
                        {features.description}
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12" role="list" aria-label="Restaurant management features">
                    {features.mainFeatures.map((feature, index) => {
                        const Icon = IconMap[feature.type] || Zap;
                        return (
                            <article
                                key={feature.title}
                                role="listitem"
                                className="glass-card p-6 sm:p-10 md:p-14 rounded-[32px] sm:rounded-[48px] md:rounded-[56px] flex flex-col items-center text-center group border-white/50 active:scale-[0.98] transition-all duration-300 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24px] sm:rounded-[32px] bg-[#0F172A] shadow-2xl flex items-center justify-center mb-6 sm:mb-10 group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                                    <Icon className="text-[#2A9D8F]" size={32} className="sm:w-10 sm:h-10 md:w-[42px] md:h-[42px]" aria-hidden="true" />
                                </div>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-bold text-sm sm:text-base opacity-80">{feature.description}</p>
                            </article>
                        );
                    })}
                </div>

                {/* Partnership Banner */}
                <div className="mt-12 sm:mt-16 md:mt-24 relative group">
                    {/* Background Glows - smaller on mobile */}
                    <div className="absolute -top-16 sm:-top-32 -left-16 sm:-left-32 w-48 h-48 sm:w-96 sm:h-96 bg-[#2A9D8F]/10 rounded-full blur-[80px] sm:blur-[120px] group-hover:bg-[#2A9D8F]/20 transition-colors duration-1000" />
                    <div className="absolute -bottom-16 sm:-bottom-32 -right-16 sm:-right-32 w-48 h-48 sm:w-96 sm:h-96 bg-[#F4A261]/10 rounded-full blur-[80px] sm:blur-[120px] group-hover:bg-[#F4A261]/20 transition-colors duration-1000" />

                    <div className="glass rounded-2xl sm:rounded-[48px] md:rounded-[72px] p-2 overflow-hidden relative border-white">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-[#2A9D8F]/10" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-6 sm:p-10 md:p-12 lg:p-20 gap-10 sm:gap-16">
                            {/* Text Content */}
                            <div className="text-center lg:text-left max-w-2xl w-full">
                                <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-4 sm:px-6 py-2 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] mb-4 sm:mb-6">
                                    <div className="w-1.5 h-1.5 bg-[#2A9D8F] rounded-full animate-pulse" />
                                    Partnership
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 sm:mb-6 leading-[0.85] tracking-tighter">
                                    Your Control. <br />
                                    <span className="gradient-text italic">Our Support.</span>
                                </h3>
                                <p className="text-gray-500 text-sm sm:text-base md:text-lg font-bold mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                    You run your restaurant, we power your technology. Full control over menus, offers, and orders—with 24/7 support whenever you need us.
                                </p>
                                <a
                                    href={features.banner.ctaHref}
                                    className="btn-premium px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl rounded-xl sm:rounded-2xl inline-flex items-center justify-center gap-3 sm:gap-4 group/btn shadow-3xl shadow-[#2A9D8F]/20 hover:translate-x-2 transition-transform min-h-[48px]"
                                >
                                    {features.banner.ctaText}
                                    <ArrowRight className="group-hover/btn:translate-x-2 transition-transform w-5 h-5" />
                                </a>
                            </div>

                            {/* Metric Card - responsive size */}
                            <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-lg aspect-square flex items-center justify-center shrink-0">
                                <div className="absolute inset-0 border-[2px] sm:border-[3px] border-dashed border-[#2A9D8F]/20 rounded-full scale-110 animate-spin-slow" />
                                <div className="absolute inset-6 sm:inset-10 border border-gray-100 rounded-full opacity-50 animate-spin-reverse" />

                                <div className="glass-card w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-[40px] sm:rounded-[56px] md:rounded-[64px] flex flex-col items-center justify-center relative bg-white/90 border-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] z-20 group-hover:shadow-[0_60px_120px_rgba(42,157,143,0.15)] transition-all duration-700 hover:-translate-y-5">
                                    <div className="text-5xl sm:text-7xl md:text-[100px] font-black gradient-text tracking-tighter mb-2 sm:mb-4 leading-none">
                                        {features.banner.statValue}
                                    </div>
                                    <p className="text-gray-400 font-black text-[10px] sm:text-[12px] uppercase tracking-[0.3em] text-center px-6 sm:px-12 leading-relaxed">
                                        {features.banner.statLabel}
                                    </p>

                                    <div className="absolute -top-3 -right-3 sm:-top-6 sm:-right-6 w-10 h-10 sm:w-16 sm:h-16 bg-[#2A9D8F] rounded-xl sm:rounded-[24px] flex items-center justify-center shadow-2xl shadow-[#2A9D8F]/40 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                        <Zap size={20} className="sm:w-8 sm:h-8 text-white" />
                                    </div>
                                </div>

                                <div className="absolute -z-10 w-full h-full flex items-center justify-center">
                                    <div className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] bg-[#2A9D8F]/5 rounded-full blur-[60px] sm:blur-[100px]" />
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
