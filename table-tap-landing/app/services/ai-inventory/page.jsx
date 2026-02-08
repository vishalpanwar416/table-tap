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
            <section className="pt-32 pb-24 bg-indigo-50 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm mb-6 uppercase tracking-widest border border-indigo-200">
                        Intelligent Stock Control
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
                        Zero Waste. <br />
                        <span className="text-indigo-600">Pure Profit.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Stop throwing away your margins. Table Tap AI predicts your inventory needs down to the gram, ensuring you never run out of your best-sellers and never over-order perishables.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all shadow-2xl">Optimize Your Inventory</button>
                    </div>
                </div>
            </section>

            {/* AI Inventory Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <RefreshCw className="text-indigo-600 w-8 h-8" />,
                                title: "Auto-Refill Alerts",
                                desc: "Our AI monitors stock levels in real-time and alerts you (or your vendors) before items reach a critical threshold."
                            },
                            {
                                icon: <BarChart className="text-indigo-600 w-8 h-8" />,
                                title: "Demand Forecasting",
                                desc: "Using deep learning, we predict next week's requirements based on seasonal trends and local festivals."
                            },
                            {
                                icon: <Truck className="text-indigo-600 w-8 h-8" />,
                                title: "Vendor Intelligence",
                                desc: "Track supplier performance, lead times, and price fluctuations with AI-driven procurement reports."
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:shadow-lg transition-all">
                                <div className="mb-8 p-4 bg-white rounded-2xl w-fit shadow-sm">{item.icon}</div>
                                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
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
