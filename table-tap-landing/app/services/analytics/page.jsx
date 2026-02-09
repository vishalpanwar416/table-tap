import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { BarChart3, PieChart, TrendingUp, Search } from 'lucide-react';

export const metadata = {
    title: "AI-Powered Restaurant Analytics | Table Tap",
    description: "Get deep insights into your restaurant's performance. Track sales, customer behavior, and inventory trends with Table Tap's advanced analytics dashboard.",
    keywords: ["restaurant analytics software", "food business insights", "sales reporting for restaurants", "customer behavior tracking"]
};

export default function AnalyticsSolution() {
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
                        <BarChart3 size={16} className="text-[#3B82F6]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            Data-Driven Growth
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Insightful Data. <br />
                        <span className="gradient-text">Smarter Decisions.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Stop guessing what works. Table Tap tracks every click and every order to provide you with actionable insights that help reduce waste and increase profit margins.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#3B82F6]/20 hover:shadow-[#3B82F6]/40">Explore Analytics</button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: <TrendingUp />, title: "Sales Trends", desc: "Identify your peak hours and high-volume days to optimize staffing." },
                            { icon: <PieChart />, title: "Popular Items", desc: "Know exactly which dishes are your champions and which need a tweak." },
                            { icon: <BarChart3 />, title: "Revenue Analysis", desc: "Track daily, weekly, and monthly revenue with high-precision charts." },
                            { icon: <Search />, title: "Guest Journey", desc: "Understand how customers browse your menu and where they convert." }
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
