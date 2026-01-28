'use client';

import { motion } from 'framer-motion';
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
        <section id="services" className="py-24 relative bg-white overflow-hidden">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#2A9D8F]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-12">
                    <div className="max-w-2xl text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-3 text-[#2A9D8F] text-sm font-black uppercase tracking-[0.3em] mb-6"
                        >
                            <span className="w-8 h-[2px] bg-[#2A9D8F]" />
                            {services.badge}
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-8 leading-[0.85] tracking-tighter"
                        >
                            {services.title} <br />
                            <span className="gradient-text italic">{services.titleHighlight}</span>
                        </motion.h2>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="max-w-md pb-4"
                    >
                        <p className="text-gray-500 text-xl font-bold leading-relaxed border-l-4 border-gray-100 pl-8">
                            {services.description}
                        </p>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.items.map((service, index) => {
                        const Icon = IconMap[service.id];
                        return (
                            <motion.div
                                key={service.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -15 }}
                                className="glass-card p-12 rounded-[48px] group relative overflow-hidden flex flex-col min-h-[440px] border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-[#0F172A] flex items-center justify-center mb-10 shadow-2xl shadow-gray-200 group-hover:rotate-6 transition-transform duration-500">
                                    <Icon className="text-white" size={38} />
                                </div>

                                <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight leading-none">{service.title}</h3>
                                <p className="text-gray-500 text-sm mb-10 leading-relaxed font-bold flex-grow">{service.description}</p>

                                <div className="space-y-4 pt-8 border-t border-gray-50 mt-auto">
                                    {service.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-4">
                                            <div className="w-5 h-5 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#2A9D8F] transition-colors duration-300">
                                                <Check size={12} className="text-[#2A9D8F] group-hover:text-white transition-colors" />
                                            </div>
                                            <span className="text-gray-900 text-[11px] font-black uppercase tracking-wider">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute bottom-0 left-12 right-12 h-1.5 bg-[#2A9D8F] translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-t-full opacity-50" />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Services;
