import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { ShieldCheck, Zap, X, Check, ArrowRight, DollarSign } from 'lucide-react';

export const metadata = {
    title: "Table Tap vs DotPe | The Best DotPe Alternative for Premium Branding",
    description: "Compare Table Tap vs DotPe. Why top Indian cafes and bars are switching to Table Tap for higher margins, better aesthetics, and AI-powered ordering.",
    keywords: ["DotPe alternative", "DotPe vs Table Tap", "restaurant payment gateway India", "digital menu provider"]
};

export default function DotPeComparison() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            <section className="pt-32 pb-24 bg-blue-50">
                <div className="container mx-auto px-4 text-center">
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold uppercase tracking-widest mb-6 inline-block">
                        Competitor Comparison
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter">
                        Table Tap <span className="text-slate-400">vs</span> DotPe
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                        DotPe is great for mass-market catalogs. Table Tap is built for <strong>Brand Conscious</strong> restaurants that want a high-end, AI-powered experience.
                    </p>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-black mb-8">Stop paying high commission on Every Order.</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed font-medium">
                                Many platforms lock you into high transaction fees that eat your margins. Table Tap offers <strong>flat-fee pricing</strong> so your growth stays in your pocket.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Flat Subscription: Predictable costs",
                                    "Direct UPI: Zero payment commissions",
                                    "Own Your Data: Complete CRM access",
                                    "Premium UI: No generic storefronts"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="p-1 bg-emerald-100 rounded-full"><Check size={14} className="text-emerald-600" /></div>
                                        <span className="font-bold text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-10 rounded-[40px] bg-slate-900 text-white shadow-2xl">
                            <h3 className="text-2xl font-black mb-6">The Visual Gap</h3>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">DotPe Style</p>
                                    <div className="h-4 w-full bg-slate-800 rounded-full mb-2" />
                                    <div className="h-4 w-2/3 bg-slate-800 rounded-full" />
                                </div>
                                <div>
                                    <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-2">Table Tap Style</p>
                                    <div className="h-4 w-full bg-emerald-500 rounded-full mb-2" />
                                    <div className="h-10 w-full bg-emerald-500/20 rounded-2xl flex items-center px-4">
                                        <span className="text-xs font-black uppercase text-emerald-400">AI Predictive Catalog</span>
                                    </div>
                                </div>
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
