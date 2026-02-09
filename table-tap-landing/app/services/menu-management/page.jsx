import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Layout, Palette, RefreshCw, BarChart } from 'lucide-react';

export const metadata = {
    title: "Dynamic Digital Menu Management | Table Tap",
    description: "Manage your restaurant menu in real-time. Update prices, add items, and create categories with Table Tap's easy-to-use digital menu builder.",
    keywords: ["digital menu management", "restaurant menu builder", "real-time menu update", "digital QR menu editor"]
};

export default function MenuManagementSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#10B981]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <Layout size={16} className="text-[#10B981]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            Menu Control
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Update Your Menu <br />
                        <span className="gradient-text">in Seconds.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Ditch the expensive paper printing. With Table Tap, you have complete control over your offerings. Change prices, toggle out-of-stock items, and launch seasonal specials instantly.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#10B981]/20 hover:shadow-[#10B981]/40">Start Building Your Menu</button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: <RefreshCw />, title: "Real-time Sync", desc: "Changes reflect on all customer phones immediately without refreshing." },
                            { icon: <Palette />, title: "Beautiful Design", desc: "Highly visual layouts that make your food look irresistible." },
                            { icon: <Layout />, title: "Smart Categories", desc: "Organize items by cuisine, course, or popularity for easy browsing." },
                            { icon: <BarChart />, title: "Menu Analytics", desc: "See which items are viewed most and which ones drive your profit." }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-card p-8 rounded-[32px] hover:-translate-y-2 transition-transform duration-300 group"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#10B981] shadow-lg group-hover:rotate-12 transition-transform">
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
