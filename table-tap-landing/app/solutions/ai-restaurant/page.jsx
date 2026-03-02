import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Sparkles, Brain, Zap, TrendingUp, Cpu, Bot } from 'lucide-react';

export const metadata = {
    title: "AI-Powered Restaurant Solutions | Future of Dining | Table Tap",
    description: "Transform your restaurant with Table Tap's AI suite. Automated upselling, predictive inventory, and AI-driven guest insights to boost your profit by 30%.",
    keywords: ["AI for restaurants", "artificial intelligence restaurant software", "smart restaurant solutions", "AI food ordering", "predictive analytics for cafes"]
};

export default function AIRestaurantSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Futuristic Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4F46E5]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <Sparkles size={16} className="text-[#2A9D8F]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            AI-Driven Hospitality
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        The First Autonomous <br />
                        <span className="gradient-text">Chef&apos;s Assistant.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Stop managing, start growing. Table Tap AI analyzes your sales patterns, predicts busy hours, and automatically suggests upsells to your guests, increasing average order value by 20% without human effort.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#2A9D8F]/20 hover:shadow-[#2A9D8F]/40 flex items-center gap-2">
                            Activate AI Dashboard <Zap className="w-5 h-5 fill-current" />
                        </button>
                    </div>
                </div>
            </section>

            {/* AI Capabilities Grid */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Brain />,
                                title: "Predictive Ordering",
                                desc: "Our AI forecasts tomorrow's sales based on past data, weather, and local events to help you optimize inventory."
                            },
                            {
                                icon: <Cpu />,
                                title: "Smart Upselling",
                                desc: "Dynamically recommend food pairings to guests while they browse your QR menu, just like Amazon."
                            },
                            {
                                icon: <Bot />,
                                title: "AI Guest Retention",
                                desc: "Automatically send personalized offers to your regulars based on their favorite dishes and peak visit times."
                            }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-card p-10 rounded-[40px] hover:-translate-y-2 transition-transform duration-300 group"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-8 w-16 h-16 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#2A9D8F] shadow-lg group-hover:rotate-12 transition-transform">
                                    {React.cloneElement(item.icon, { size: 32 })}
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-6">{item.title}</h3>
                                <p className="text-gray-500 text-lg leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="bg-[#0F172A] rounded-[60px] p-12 md:p-24 border border-white/10 text-center relative overflow-hidden">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#2A9D8F]/10 blur-[100px] rounded-full" />

                        <h2 className="text-4xl md:text-6xl font-black text-white mb-12 relative z-10">Numbers Speak Louder <br />Than Algorithms.</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                            <div>
                                <div className="text-6xl font-black text-[#2A9D8F] mb-4">22%</div>
                                <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">Higher Check Value</div>
                            </div>
                            <div>
                                <div className="text-6xl font-black text-[#4F46E5] mb-4">15%</div>
                                <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">Less Food Waste</div>
                            </div>
                            <div>
                                <div className="text-6xl font-black text-[#E76F51] mb-4">3x</div>
                                <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">Faster Table Service</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
