import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { CreditCard, ShieldCheck, Zap, Smartphone } from 'lucide-react';

export const metadata = {
    title: "Seamless Contactless Payments for Restaurants | Table Tap",
    description: "Accept UPI, Cards, and Net Banking directly from your QR menu. Table Tap's integrated payment system reduces checkout friction and speeds up table turnover.",
    keywords: ["restaurant contactless payments", "UPI payment for restaurants India", "QR code payment system", "digital billing for restaurants"]
};

export default function PaymentsSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#3B82F6]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <CreditCard size={16} className="text-[#3B82F6]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            Unified Payments
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Payments as Smooth <br />
                        <span className="gradient-text">as Your Service.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Eliminate the "bill-please" wait time. Let your guests pay instantly via UPI or cards directly from their phone. Fast, secure, and automatically synced with your dashboard.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#3B82F6]/20 hover:shadow-[#3B82F6]/40">Enable Digital Payments</button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: <Smartphone />, title: "UPI Ready", desc: "Native support for GPay, PhonePe, and Paytm ensures zero friction." },
                            { icon: <ShieldCheck />, title: "Secure & PCI", desc: "Enterprise-grade encryption for all card transactions." },
                            { icon: <Zap />, title: "Instant Settlement", desc: "Get your funds settled directly into your bank account." },
                            { icon: <CreditCard />, title: "Digital Bills", desc: "Automated GST-compliant invoices sent directly to customer WhatsApp/Email." }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-card p-8 rounded-[32px] hover:-translate-y-2 transition-transform duration-300 group"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#3B82F6] shadow-lg group-hover:rotate-12 transition-transform">
                                    {React.cloneElement(item.icon, { size: 28 })}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">{item.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
