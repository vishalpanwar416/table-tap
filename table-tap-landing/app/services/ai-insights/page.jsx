import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { BarChart3, Search, Lightbulb, TrendingUp, Zap, PieChart } from 'lucide-react';

export const metadata = {
    title: "AI Business Insights for Restaurants | Table Tap AI",
    description: "Get superhuman clarity on your restaurant's performance. Our AI interprets your sales data to provide actionable advice on menu pricing and staffing.",
    keywords: ["AI restaurant analytics", "business intelligence for food", "predictive sales insights", "automated restaurant reporting"]
};

export default function AIInsightsService() {
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

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <Lightbulb size={16} className="text-[#2A9D8F]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            Intelligence Beyond Data
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Data is Noise. <br />
                        <span className="gradient-text">AI is Clarity.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Our AI doesn't just show you charts; it tells you what to do. From spotting a trending dish to alerting you about a drop in service speed, it's like having a full-time consultant for your restaurant.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#2A9D8F]/20 hover:shadow-[#2A9D8F]/40">Get Your First AI Report</button>
                    </div>
                </div>
            </section>

            {/* AI Insight Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            {[
                                {
                                    icon: <Lightbulb />,
                                    title: "Menu Engineering",
                                    desc: "Our AI categorizes your menu into \"Stars,\" \"Plowhorses,\" and \"Dogs.\" It suggests price adjustments to maximize profit without scaring away customers."
                                },
                                {
                                    icon: <TrendingUp />,
                                    title: "Sales Forecasting",
                                    desc: "Predict peak times with 92% accuracy. Use our AI to schedule the right amount of staff, reducing labor costs while keeping service fast."
                                }
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="glass-card p-10 rounded-[40px] hover:-translate-y-2 transition-transform duration-300 group"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#2A9D8F] shadow-lg group-hover:rotate-12 transition-transform">
                                            {React.cloneElement(item.icon, { size: 32 })}
                                        </div>
                                        <h3 className="text-3xl font-black text-gray-900">{item.title}</h3>
                                    </div>
                                    <p className="text-gray-500 text-lg leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-8 md:pt-16">
                            {[
                                {
                                    icon: <Search />,
                                    title: "Anomaly Detection",
                                    desc: "Get notified immediately if an item is being voided too often or if billing patterns look unusual. AI keeps your business secure."
                                },
                                {
                                    icon: <PieChart />,
                                    title: "Customer Cohorts",
                                    desc: "Understand exactly who your big spenders are. AI groups your guests by behavior, allowing for hyper-targeted marketing campaigns."
                                }
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="glass-card p-10 rounded-[40px] hover:-translate-y-2 transition-transform duration-300 group"
                                    style={{ animationDelay: `${i * 0.1 + 0.2}s` }}
                                >
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#E76F51] shadow-lg group-hover:rotate-12 transition-transform">
                                            {React.cloneElement(item.icon, { size: 32 })}
                                        </div>
                                        <h3 className="text-3xl font-black text-gray-900">{item.title}</h3>
                                    </div>
                                    <p className="text-gray-500 text-lg leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
