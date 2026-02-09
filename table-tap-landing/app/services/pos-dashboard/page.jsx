import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { LayoutDashboard, Users, Clock, ShoppingBag } from 'lucide-react';

export const metadata = {
    title: "All-in-One Restaurant POS & Dashboard | Table Tap",
    description: "Manage your entire restaurant operation from one unified dashboard. Track live orders, manage staff, and view real-time analytics with Table Tap POS.",
    keywords: ["restaurant pos system", "cloud-based pos india", "order management dashboard", "restaurant operations software"]
};

export default function POSSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#6366F1]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <LayoutDashboard size={16} className="text-[#6366F1]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            Centralized Command Center
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Your Entire Restaurant, <br />
                        <span className="gradient-text">One Dashboard.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Table Tap's cloud-based POS gives you a bird's eye view of your business. Manage multiple outlets, track live table statuses, and oversee staff performance from anywhere in the world.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#6366F1]/20 hover:shadow-[#6366F1]/40">Get Your Free Demo</button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: <LayoutDashboard />, title: "Live Monitoring", desc: "Watch orders flow from table to kitchen in real-time." },
                            { icon: <Users />, title: "Staff Management", desc: "Assign roles, track attendance, and monitor server speed." },
                            { icon: <ShoppingBag />, title: "Inventory Sync", desc: "Automatically deduct stock as orders are placed." },
                            { icon: <Clock />, title: "Table Matrix", desc: "Visual representation of your floor plan with live statuses." }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-card p-8 rounded-[32px] hover:-translate-y-2 transition-transform duration-300 group"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#6366F1] shadow-lg group-hover:rotate-12 transition-transform">
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
        </main >
    );
}
