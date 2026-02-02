'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import data from '../data/landing-data.json';

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { header } = data;
    const { openModal } = useModal();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 animate-slide-down ${isScrolled ? 'glass-header py-3 px-4 mx-auto max-w-[1200px] mt-4 rounded-2xl shadow-lg' : 'bg-transparent py-6'
                }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="#home" className="flex items-center gap-2 group">
                    <Image
                        src="/logo.png"
                        alt="Table Tap"
                        width={180}
                        height={72}
                        className="h-16 w-auto transition-transform group-hover:scale-105"
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

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden p-2 text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 right-0 mt-4 mx-4 glass rounded-3xl overflow-hidden shadow-2xl p-6 animate-fade-in-up">
                    <div className="flex flex-col gap-6">
                        {header.navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-gray-900 text-lg font-bold border-b border-gray-100 pb-2"
                            >
                                {link.name}
                            </a>
                        ))}
                        <button
                            onClick={() => { openModal('starter'); setIsMobileMenuOpen(false); }}
                            className="btn-premium text-center"
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
