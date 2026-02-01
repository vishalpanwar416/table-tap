'use client';

import { motion } from 'framer-motion';
import { QrCode, Globe, Instagram, Twitter, Linkedin, Facebook, ArrowUpRight } from 'lucide-react';
import data from '../data/landing-data.json';

const IconMap = {
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    globe: Globe
};

const Footer = () => {
    const { footer } = data;

    return (
        <footer className="bg-[#0F172A] pt-64 pb-20 relative overflow-hidden" role="contentinfo" aria-label="Site footer">
            {/* Background Aesthetic Section */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#2A9D8F]/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-4 mb-10 group"
                        >
                            <div className="w-14 h-14 bg-[#2A9D8F] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#2A9D8F]/40 group-hover:rotate-12 transition-transform">
                                <QrCode className="text-white" size={32} />
                            </div>
                            <span className="text-3xl font-black text-white tracking-tighter">Table Tap</span>
                        </motion.div>
                        <p className="text-gray-400 font-bold text-lg mb-10 leading-relaxed max-w-xs">{footer.description}</p>
                        <div className="flex gap-6">
                            {footer.socialLinks.map((social, i) => {
                                const Icon = IconMap[social.icon] || Globe;
                                return (
                                    <motion.a
                                        key={i}
                                        whileHover={{ y: -5, scale: 1.1 }}
                                        href={social.href}
                                        aria-label={`Follow Table Tap on ${social.platform}`}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A9D8F] transition-all duration-300 border border-white/5"
                                    >
                                        <Icon size={20} aria-hidden="true" />
                                    </motion.a>
                                );
                            })}
                        </div>
                    </div>

                    {footer.links.map((group) => (
                        <nav key={group.title} aria-label={`${group.title} links`}>
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-10 opacity-50">{group.title}</h4>
                            <ul className="space-y-6" role="list">
                                {group.items.map(link => (
                                    <li key={link.label}>
                                        <motion.a
                                            whileHover={{ x: 5 }}
                                            href={link.href}
                                            className="text-gray-400 hover:text-[#2A9D8F] font-black text-base uppercase tracking-widest transition-colors flex items-center gap-3 group"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-[#2A9D8F] transition-colors" />
                                            {link.label}
                                        </motion.a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                    <p className="text-gray-500 font-bold text-sm tracking-wide">{footer.copyright}</p>
                    <div className="flex gap-12">
                        <a href="#" className="text-gray-500 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-colors">Privacy Policy</a>
                        <a href="#" className="text-gray-500 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
