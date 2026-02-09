import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { LayoutGrid, Users, ClipboardCheck, BarChart2 } from 'lucide-react';

export const metadata = {
    title: "All-in-One Restaurant Management Software | Table Tap",
    description: "Simplified restaurant management with Table Tap. Handle orders, staff, inventory, and customer feedback from a single, intuitive platform.",
    keywords: ["restaurant management system", "restaurant software India", "cloud restaurant management", "digital restaurant operations"]
};

export default function RestaurantManagement() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E76F51]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                            <LayoutGrid size={16} className="text-[#2A9D8F]" />
                            <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                                Complete Operational Control
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            Manage Smarter, <br />
                            <span className="gradient-text">Grow Faster.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Table Tap is more than just a QR menu. It's a comprehensive restaurant management system that streamlines your entire operation, from the moment a guest sits down to the final checkout.
                        </p>

                        <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#2A9D8F]/20 hover:shadow-[#2A9D8F]/40">See How It Works</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Modules */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">One Platform, <span className="gradient-text">Every Department.</span></h2>
                        <p className="text-gray-500 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
                            We've modularized restaurant management to give you exactly what you need.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: <LayoutGrid />, title: "Order Tracking", desc: "Monitor every table's order status, prep time, and service speed in real-time." },
                            { icon: <Users />, title: "Staff Control", desc: "Manage permissions and see server performance metrics instantly." },
                            { icon: <ClipboardCheck />, title: "Inventory", desc: "Low-stock alerts and automated deductions as orders are served." },
                            { icon: <BarChart2 />, title: "Live Reporting", desc: "Daily sales summaries and profit analytics delivered to your phone." }
                        ].map((module, i) => (
                            <div
                                key={i}
                                className="glass-card p-8 rounded-[32px] hover:-translate-y-2 transition-transform duration-300 group"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#2A9D8F] shadow-lg group-hover:rotate-12 transition-transform">
                                    {React.cloneElement(module.icon, { size: 28 })}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">{module.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{module.desc}</p>
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
