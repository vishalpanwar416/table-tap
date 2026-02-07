'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { useSettings } from '../context/SettingsContext';
import data from '../data/landing-data.json';

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { header } = data;
    const { openModal } = useModal();
    const { logo, company } = useSettings();

    const logoUrl = logo?.url || "/logo.png";
    const companyName = company?.name || "Table Tap";

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 animate-slide-down safe-area-inset-top ${isScrolled ? 'glass-header py-2 sm:py-3 px-3 sm:px-4 mx-2 sm:mx-4 lg:mx-auto max-w-[1200px] lg:mt-4 rounded-xl sm:rounded-2xl shadow-lg' : 'bg-transparent py-4 sm:py-6'
                }`}
        >
            <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between max-w-full">
                {/* Logo */}
                <Link href="#home" className="flex items-center gap-2 group min-h-[44px] min-w-[44px] shrink-0">
                    <Image
                        src={logoUrl}
                        alt={companyName}
                        width={180}
                        height={72}
                        className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto transition-transform group-hover:scale-105"
                        priority
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-10">
                    {header.navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-gray-600 hover:text-gray-900 transition-colors text-[16px] font-bold tracking-tight uppercase group relative"
                        >
                            {link.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2A9D8F] transition-all duration-300 group-hover:w-full" />
                        </a>
                    ))}
                </nav>

                {/* CTA */}
                <div className="hidden lg:flex items-center">
                    <button
                        onClick={() => openModal('starter')}
                        className="btn-premium text-[14px] hover:scale-105 active:scale-95 transition-transform"
                    >
                        {header.cta.text}
                    </button>
                </div>

                {/* Mobile Menu Button - 44px min touch target */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden p-3 -mr-2 text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isMobileMenuOpen}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu - full width below header, scrollable if needed */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-2 right-2 mt-2 glass rounded-2xl overflow-hidden shadow-2xl p-5 animate-fade-in-up max-h-[calc(100vh-5rem)] overflow-y-auto">
                    <div className="flex flex-col gap-1">
                        {header.navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-gray-900 text-base font-bold py-4 px-3 -mx-3 rounded-xl hover:bg-white/50 active:bg-gray-100 border-b border-gray-100 last:border-0 min-h-[48px] flex items-center"
                            >
                                {link.name}
                            </a>
                        ))}
                        <button
                            onClick={() => { openModal('starter'); setIsMobileMenuOpen(false); }}
                            className="btn-premium text-center w-full mt-4 py-4 min-h-[48px]"
                        >
                            {header.cta.text}
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
