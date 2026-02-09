import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Box, BarChart, RefreshCw, Truck, Zap, ShieldCheck } from 'lucide-react';

export const metadata = {
    title: "AI Inventory & Smart Supply Management | Table Tap",
    description: "Eliminate stockouts and reduce food waste with Table Tap AI. Automated inventory tracking, demand forecasting, and smart vendor management for restaurants.",
    keywords: ["AI restaurant inventory", "food waste reduction AI", "predictive supply chain for food", "automated stock management"]
};

export default function AIInventorySolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#4F46E5]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <Box size={16} className="text-[#4F46E5]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            Intelligent Stock Control
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Zero Waste. <br />
                        <span className="gradient-text">Pure Profit.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Stop throwing away your margins. Table Tap AI predicts your inventory needs down to the gram, ensuring you never run out of your best-sellers and never over-order perishables.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#4F46E5]/20 hover:shadow-[#4F46E5]/40">Optimize Your Inventory</button>
                    </div>
                </div>
            </section>

            {/* AI Inventory Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <RefreshCw />,
                                title: "Auto-Refill Alerts",
                                desc: "Our AI monitors stock levels in real-time and alerts you (or your vendors) before items reach a critical threshold."
                            },
                            {
                                icon: <BarChart />,
                                title: "Demand Forecasting",
                                desc: "Using deep learning, we predict next week's requirements based on seasonal trends and local festivals."
                            },
                            {
                                icon: <Truck />,
                                title: "Vendor Intelligence",
                                desc: "Track supplier performance, lead times, and price fluctuations with AI-driven procurement reports."
                            }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-card p-10 rounded-[40px] hover:-translate-y-2 transition-transform duration-300 group"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#4F46E5] shadow-lg group-hover:rotate-12 transition-transform">
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
