import Header from '../components/Header';
import Footer from '../components/Footer';
import Contact from '../components/Contact';
import Link from 'next/link';
import { ArrowRight, Check, X, ShieldCheck, Zap, Heart, Sparkles } from 'lucide-react';

export const metadata = {
    title: "Best Restaurant POS Alternatives in India | Table Tap vs Competitors",
    description: "Compare Table Tap with Petpooja, DotPe, MenuTiger, and more. See why top restaurants are switching for better AI, premium branding, and lower costs.",
    keywords: ["Petpooja alternative", "DotPe vs Table Tap", "Best QR menu system India", "Restaurant POS comparison"]
};

const competitors = [
    {
        name: "Petpooja",
        strength: "Large Scale",
        weakness: "Complex interface & high setup cost",
        tableTapAdvantage: "AI-First simplicity & 15-min setup",
        href: "/alternatives/petpooja"
    },
    {
        name: "MenuTiger",
        strength: "Customization",
        weakness: "Basic analytics",
        tableTapAdvantage: "Predictive AI Insights & custom branding",
        href: "/alternatives/menutiger"
    },
    {
        name: "DotPe",
        strength: "Market Share",
        weakness: "Transaction fees & generic design",
        tableTapAdvantage: "Fixed pricing & premium aesthetics",
        href: "/alternatives/dotpe"
    },
    {
        name: "FineDine",
        strength: "Tablet Luxury",
        weakness: "Expensive for small venues",
        tableTapAdvantage: "Luxury feel at QSR prices",
        href: "/alternatives/finedine"
    }
];

export default function AlternativesHub() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            <section className="pt-32 pb-20 bg-slate-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8">
                        The Smart way to <br />
                        <span className="gradient-text">Switch & Save.</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                        Looking for a better alternative to your current POS or QR menu provider? See how Table Tap stacks up against the industry leaders.
                    </p>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {competitors.map((comp, i) => (
                            <div key={i} className="p-10 rounded-[40px] border border-slate-100 hover:border-emerald-500/20 transition-all bg-white group shadow-sm hover:shadow-xl">
                                <h3 className="text-3xl font-black mb-6">Table Tap vs {comp.name}</h3>
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-rose-50 rounded-full"><X size={14} className="text-rose-500" /></div>
                                        <p className="text-slate-500 font-medium">{comp.name} is known for: <span className="text-slate-900">{comp.strength}</span>, but falls short on {comp.weakness.toLowerCase()}.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-emerald-50 rounded-full"><Check size={14} className="text-emerald-500" /></div>
                                        <p className="text-slate-500 font-medium">Table Tap Advantage: <span className="text-emerald-600 font-bold">{comp.tableTapAdvantage}</span></p>
                                    </div>
                                </div>
                                <Link href={comp.href} className="inline-flex items-center gap-2 font-black text-emerald-600 group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                                    Deep Comparison <ArrowRight size={16} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-8">Ready to provide a <span className="text-emerald-400">Premium experience?</span></h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">Join the 500+ restaurants that switched for the beauty and stayed for the AI.</p>
                    <button className="btn-premium px-12 py-5 text-lg">Switch to Table Tap Today</button>
                </div>
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
