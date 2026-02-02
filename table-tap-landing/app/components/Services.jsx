'use client';

import {
    QrCode,
    UtensilsCrossed,
    LayoutDashboard,
    Tag,
    Check
} from 'lucide-react';
import data from '../data/landing-data.json';

const IconMap = {
    'qr-ordering': QrCode,
    'digital-menu': UtensilsCrossed,
    'unified-orders': LayoutDashboard,
    'offers-promotions': Tag
};

const Services = () => {
    const { services } = data;

    return (
        <section id="services" aria-labelledby="services-heading" className="py-12 sm:py-16 md:py-24 relative bg-white overflow-hidden">
            {/* Background - smaller on mobile */}
            <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-[#2A9D8F]/5 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 translate-x-1/4 sm:translate-x-1/2" />

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-full">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 sm:mb-20 md:mb-24 gap-8 sm:gap-12">
                    <div className="max-w-2xl text-left w-full">
                        <div className="flex items-center gap-3 text-[#2A9D8F] text-xs sm:text-sm font-black uppercase tracking-[0.3em] mb-4 sm:mb-6">
                            <span className="w-6 sm:w-8 h-[2px] bg-[#2A9D8F]" />
                            {services.badge}
                        </div>
                        <h2
                            id="services-heading"
                            className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 mb-6 sm:mb-8 leading-[0.85] tracking-tighter"
                        >
                            {services.title} <br />
                            <span className="gradient-text italic">{services.titleHighlight}</span>
                        </h2>
                    </div>
                    <div className="max-w-md w-full pb-0 md:pb-4">
                        <p className="text-gray-500 text-base sm:text-lg md:text-xl font-bold leading-relaxed border-l-4 border-gray-100 pl-4 sm:pl-8">
                            {services.description}
                        </p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8" role="list" aria-label="Table Tap services and features">
                    {services.items.map((service, index) => {
                        const Icon = IconMap[service.id];
                        return (
                            <article
                                key={service.title}
                                role="listitem"
                                className="glass-card p-6 sm:p-8 md:p-12 rounded-[32px] sm:rounded-[40px] md:rounded-[48px] group relative overflow-hidden flex flex-col min-h-[320px] sm:min-h-[380px] md:min-h-[440px] border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in-up hover:-translate-y-2 sm:hover:-translate-y-4 active:scale-[0.99]"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-[#0F172A] flex items-center justify-center mb-6 sm:mb-10 shadow-2xl shadow-gray-200 group-hover:rotate-6 transition-transform duration-500" aria-hidden="true">
                                    <Icon className="text-white w-7 h-7 sm:w-9 sm:h-9 md:w-[38px] md:h-[38px]" aria-hidden="true" />
                                </div>

                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight leading-none">{service.title}</h3>
                                <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-10 leading-relaxed font-bold flex-grow">{service.description}</p>

                                <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-gray-50 mt-auto">
                                    {service.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center shrink-0 group-hover:bg-[#2A9D8F] transition-colors duration-300">
                                                <Check size={12} className="text-[#2A9D8F] group-hover:text-white transition-colors" />
                                            </div>
                                            <span className="text-gray-900 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute bottom-0 left-6 right-6 sm:left-12 sm:right-12 h-1.5 bg-[#2A9D8F] translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-t-full opacity-50" aria-hidden="true" />
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Services;
