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
            <section className="pt-32 pb-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <span className="inline-block px-4 py-2 rounded-full bg-[#2A9D8F]/20 text-[#2A9D8F] font-bold text-sm mb-6 uppercase tracking-widest border border-[#2A9D8F]/30">
                            Intelligence Beyond Data
                        </span>
                        <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1]">
                            Data is Noise. <br />
                            <span className="text-[#2A9D8F]">AI is Clarity.</span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                            Our AI doesn't just show you charts; it tells you what to do. From spotting a trending dish to alerting you about a drop in service speed, it's like having a full-time consultant for your restaurant.
                        </p>
                        <button className="px-10 py-5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-bold transition-all shadow-xl">Get Your First AI Report</button>
                    </div>
                </div>
            </section>

            {/* AI Insight Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className="space-y-12">
                            <div className="group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:scale-110 transition-transform">
                                        <Lightbulb className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-3xl font-bold">Menu Engineering</h3>
                                </div>
                                <p className="text-slate-500 text-lg leading-relaxed font-medium">
                                    Our AI categorizes your menu into "Stars," "Plowhorses," and "Dogs." It suggests price adjustments to maximize profit without scaring away customers.
                                </p>
                            </div>
                            <div className="group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-3xl font-bold">Sales Forecasting</h3>
                                </div>
                                <p className="text-slate-500 text-lg leading-relaxed font-medium">
                                    Predict peak times with 92% accuracy. Use our AI to schedule the right amount of staff, reducing labor costs while keeping service fast.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-12">
                            <div className="group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:scale-110 transition-transform">
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-3xl font-bold">Anomaly Detection</h3>
                                </div>
                                <p className="text-slate-500 text-lg leading-relaxed font-medium">
                                    Get notified immediately if an item is being voided too often or if billing patterns look unusual. AI keeps your business secure.
                                </p>
                            </div>
                            <div className="group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:scale-110 transition-transform">
                                        <PieChart className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-3xl font-bold">Customer Cohorts</h3>
                                </div>
                                <p className="text-slate-500 text-lg leading-relaxed font-medium">
                                    Understand exactly who your big spenders are. AI groups your guests by behavior, allowing for hyper-targeted marketing campaigns.
                                </p>
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
