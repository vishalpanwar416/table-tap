import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Star, ShieldCheck, Zap, Check, ArrowRight, Layout, Smartphone } from 'lucide-react';

export const metadata = {
    title: "Table Tap vs FineDine | Luxury QR Menus with AI Intelligence",
    description: "Compare Table Tap vs FineDine. Experience the same luxury visuals and tablet-style ordering with advanced AI upselling and better local support in India.",
    keywords: ["FineDine alternative", "luxury QR menu system", "FineDine vs Table Tap", "best iPad menu for restaurants"]
};

export default function FineDineComparison() {
    return (
        <main className="min-h-screen bg-slate-900 text-white">
            <Header />

            <section className="pt-32 pb-24 bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="container mx-auto px-4 text-center">
                    <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold uppercase tracking-widest mb-6 inline-block border border-emerald-500/30">
                        Luxury Comparison
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter">
                        Table Tap <span className="text-slate-600">vs</span> FineDine
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                        Both platforms offer elite visuals. Table Tap adds the <strong>AI Brain</strong> to the <strong>Beautiful Body</strong>, ensuring your beauty drives actual revenue.
                    </p>
                </div>
            </section>

            <section className="py-24 bg-white text-slate-900">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="p-8 rounded-[40px] border border-slate-100 shadow-2xl relative overflow-hidden group">
                            <div className="bg-slate-50 p-6 rounded-3xl mb-8 group-hover:bg-slate-100 transition-colors">
                                <h3 className="text-2xl font-black mb-4">The AI Advantage</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">While FineDine focuses on tablet aesthetics, Table Tap focuses on <strong>Predictive Pathing</strong>. We map how guests browse and position high-margin items where they are most likely to click.</p>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    "Native UPI Integrations for India",
                                    "AI-Driven Cross-Selling Engine",
                                    "Lighter, Faster Mobile Loading",
                                    "Dedicated 24/7 Local WhatsApp Support"
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 items-center font-bold text-slate-700">
                                        <Check className="text-emerald-500" size={18} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black mb-8">Performance <br />Meets Aesthetics.</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed font-medium text-lg">
                                Don&apos;t choose between a pretty menu and a powerful POS. Table Tap provides the same &apos;iPad-style&apos; luxury on every guest&apos;s smartphone, powered by a backend that out-thinks the competition.
                            </p>
                            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-3 hover:gap-5 transition-all">
                                Request a Luxury Demo <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
