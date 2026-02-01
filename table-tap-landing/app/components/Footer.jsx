'use client';

import { motion } from 'framer-motion';
import { Globe, Instagram, Twitter, Linkedin, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';
import data from '../data/landing-data.json';

const IconMap = {
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    globe: Globe
};

const Footer = () => {
    const { footer, contact } = data;

    return (
        <footer className="bg-[#0F172A] pt-16 pb-8 relative overflow-hidden" role="contentinfo" aria-label="Site footer">
            {/* Subtle Background Glow */}
            <div className="absolute top-0 left-1/2 w-[400px] h-[200px] bg-[#2A9D8F]/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Main Footer Content */}
                <div className="flex flex-col lg:flex-row justify-between gap-12 pb-10 border-b border-white/5">
                    {/* Brand & Description */}
                    <div className="shrink-0">
                        <a href="#home" className="flex items-center gap-3 mb-4 group">
                            <div className="h-12 rounded-xl overflow-hidden group-hover:scale-105 transition-transform bg-white/10 p-1">
                                <Image 
                                    src="/logo.png" 
                                    alt="Table Tap Logo" 
                                    width={120} 
                                    height={48}
                                    className="h-full w-auto object-contain brightness-0 invert"
                                />
                            </div>
                        </a>
                        <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-5">
                            Seamless QR-based ordering for modern restaurants. Built in India.
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-3">
                            {footer.socialLinks.map((social, i) => {
                                const Icon = IconMap[social.icon] || Globe;
                                return (
                                    <motion.a
                                        key={i}
                                        whileHover={{ y: -2 }}
                                        href={social.href}
                                        aria-label={`Follow Table Tap on ${social.platform}`}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2A9D8F] transition-all duration-200"
                                    >
                                        <Icon size={16} aria-hidden="true" />
                                    </motion.a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Links - Horizontal on larger screens */}
                    <div className="flex flex-wrap gap-x-16 gap-y-8">
                        {footer.links.slice(0, 2).map((group) => (
                            <nav key={group.title} aria-label={`${group.title} links`}>
                                <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">{group.title}</h4>
                                <ul className="space-y-2" role="list">
                                    {group.items.map(link => (
                                        <li key={link.label}>
                                            <a
                                                href={link.href}
                                                className="text-gray-400 hover:text-[#2A9D8F] text-sm font-medium transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Contact</h4>
                            <ul className="space-y-2" role="list">
                                <li>
                                    <a href={`mailto:${contact.info[0].value}`} className="text-gray-400 hover:text-[#2A9D8F] text-sm font-medium transition-colors flex items-center gap-2">
                                        <Mail size={14} className="text-gray-600" />
                                        {contact.info[0].value}
                                    </a>
                                </li>
                                <li>
                                    <a href={`tel:${contact.info[1].value.replace(/\s/g, '')}`} className="text-gray-400 hover:text-[#2A9D8F] text-sm font-medium transition-colors flex items-center gap-2">
                                        <Phone size={14} className="text-gray-600" />
                                        {contact.info[1].value}
                                    </a>
                                </li>
                                <li className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                    <MapPin size={14} className="text-gray-600" />
                                    {contact.info[2].value}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-xs">
                        © {new Date().getFullYear()} Table Tap. Made with ❤️ in India
                    </p>
                    <div className="flex gap-6">
                        <a href="/privacy" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Privacy</a>
                        <a href="/terms" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Terms</a>
                        <a href="/refunds" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Refunds</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
