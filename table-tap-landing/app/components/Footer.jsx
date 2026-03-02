'use client';

import { Globe, Instagram, Twitter, Linkedin, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import data from '../data/landing-data.json';
import siteConfig from '../data/site-config.json';
import { useSettings } from '../context/SettingsContext';

const IconMap = {
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    globe: Globe
};

const Footer = () => {
    const { footer: localFooter, contact: localContact } = data;
    const { company, social, logo, loading } = useSettings();

    const companyName = company?.name || siteConfig.site.name;
    const logoUrl = logo?.url || "/logo.png";

    const contact = {
        ...localContact,
        info: localContact.info.map(item => {
            if (item.type === 'mail') {
                const value = company?.email || siteConfig.contact.email;
                return { ...item, value: value || item.value };
            }
            if (item.type === 'phone') {
                const value = company?.phone || siteConfig.contact.phone;
                return { ...item, value: value || item.value };
            }
            if (item.type === 'map-pin') {
                const value = company?.address
                    ? `${company.address}, ${company.city}, ${company.state} - ${company.pincode}`
                    : siteConfig.contact.address;
                return { ...item, value: value || item.value };
            }
            return item;
        })
    };

    const footer = {
        ...localFooter,
        socialLinks: localFooter.socialLinks.map(link => {
            if (!social) return link;
            const platformKey = link.platform.toLowerCase();
            if (social[platformKey]) {
                return { ...link, href: social[platformKey] };
            }
            return link;
        })
    };

    return (
        <footer className="bg-[#0F172A] pt-10 sm:pt-14 md:pt-16 pb-6 sm:pb-8 relative overflow-hidden" role="contentinfo" aria-label="Site footer">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 w-[300px] sm:w-[400px] h-[150px] sm:h-[200px] bg-[#2A9D8F]/5 rounded-full blur-[80px] sm:blur-[100px] -translate-x-1/2 -translate-y-1/2" />

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-full">
                {/* Main Footer Content */}
                <div className="flex flex-col lg:flex-row justify-between gap-10 sm:gap-12 pb-8 sm:pb-10 border-b border-white/5">
                    {/* Brand & Description */}
                    <div className="shrink-0 text-center lg:text-left">
                        <Link href="/" className="inline-flex items-center gap-3 mb-4 group min-h-[44px]">
                            <div className="h-10 sm:h-12 rounded-xl overflow-hidden group-hover:scale-105 transition-transform bg-white/10 p-1">
                                <Image
                                    src={logoUrl}
                                    alt={`${companyName} Logo`}
                                    width={120}
                                    height={48}
                                    className={`h-full w-auto object-contain ${!logo?.url ? 'brightness-0 invert' : ''}`}
                                />
                            </div>
                        </Link>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-xs leading-relaxed mb-4 sm:mb-5 mx-auto lg:mx-0">
                            Seamless QR-based ordering for modern restaurants. Built in India.
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-2 sm:gap-3 justify-center lg:justify-start">
                            {footer.socialLinks.map((social, i) => {
                                const Icon = IconMap[social.icon] || Globe;
                                return (
                                    <a
                                        key={i}
                                        href={social.href}
                                        aria-label={`Follow Table Tap on ${social.platform}`}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2A9D8F] hover:-translate-y-1 transition-all duration-200 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                                    >
                                        <Icon size={18} className="sm:w-4 sm:h-4" aria-hidden="true" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Links - stack on mobile */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-x-8 sm:gap-x-12 gap-y-10 justify-center lg:justify-end">
                        {footer.links.map((group) => (
                            <nav key={group.title} aria-label={`${group.title} links`} className="text-center lg:text-left">
                                <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em] mb-3 sm:mb-4">{group.title}</h4>
                                <ul className="space-y-2" role="list">
                                    {group.items.map(link => (
                                        <li key={link.label}>
                                            <a
                                                href={link.href}
                                                className="text-gray-400 hover:text-[#2A9D8F] text-xs sm:text-sm font-medium transition-colors inline-block py-1 min-h-[44px] flex items-center justify-center lg:justify-start"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}

                        {/* Contact Info */}
                        <div className="text-center lg:text-left w-full sm:w-auto">
                            <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em] mb-3 sm:mb-4">Contact</h4>
                            <ul className="space-y-2" role="list">
                                <li>
                                    <a href={`mailto:${contact.info[0].value}`} className="text-gray-400 hover:text-[#2A9D8F] text-xs sm:text-sm font-medium transition-colors flex items-center justify-center lg:justify-start gap-2 min-h-[44px] sm:min-h-0 py-2 sm:py-0 break-all">
                                        <Mail size={14} className="text-gray-600 shrink-0" />
                                        <span className="truncate">{contact.info[0].value}</span>
                                    </a>
                                </li>
                                <li>
                                    <a href={`tel:${contact.info[1].value.replace(/\s/g, '')}`} className="text-gray-400 hover:text-[#2A9D8F] text-xs sm:text-sm font-medium transition-colors flex items-center justify-center lg:justify-start gap-2 min-h-[44px] sm:min-h-0 py-2 sm:py-0">
                                        <Phone size={14} className="text-gray-600 shrink-0" />
                                        {contact.info[1].value}
                                    </a>
                                </li>
                                <li className="text-gray-400 text-xs sm:text-sm font-medium flex items-center justify-center lg:justify-start gap-2 min-h-[44px] sm:min-h-0 py-2 sm:py-0">
                                    <MapPin size={14} className="text-gray-600 shrink-0" />
                                    <span className="truncate">{contact.info[2].value}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-xs text-center sm:text-left">
                        © {new Date().getFullYear()} Table Tap. Made with ❤️ in India
                    </p>
                    <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
                        <a href="/privacy" className="text-gray-600 hover:text-gray-400 text-xs transition-colors min-h-[44px] flex items-center">Privacy</a>
                        <a href="/terms" className="text-gray-600 hover:text-gray-400 text-xs transition-colors min-h-[44px] flex items-center">Terms</a>
                        <a href="/refunds" className="text-gray-600 hover:text-gray-400 text-xs transition-colors min-h-[44px] flex items-center">Refunds</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
