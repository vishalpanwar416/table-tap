import Header from '../components/Header';
import Footer from '../components/Footer';
import Contact from '../components/Contact';
import { Rocket, ShieldCheck, Heart, Zap } from 'lucide-react';

export const metadata = {
    title: "Partner with Table Tap | Join 500+ Restaurant Partners",
    description: "Join the Table Tap family. Become a restaurant partner and transform your guest experience with India's most trusted QR ordering system.",
    keywords: ["restaurant partner program", "partner with tabletap", "restaurant software partnership", "digital ordering partner"]
};

export default function PartnerPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-white font-bold text-sm mb-6 uppercase tracking-widest border border-white/20">
                        Grow With Us
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1]">
                        Become a <br />
                        <span className="text-[#2A9D8F]">Table Tap Partner.</span>
                    </h1>
                    <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Join 500+ forward-thinking restaurants and cafes that are reclaiming their time and revenue. Scaling your restaurant has never been this simple.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-[#2A9D8F] hover:bg-[#238b7e] text-white rounded-2xl font-bold transition-all shadow-xl shadow-[#2A9D8F]/20">Start Your Partnership</button>
                    </div>
                </div>
            </section>

            {/* Why Partner? */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {[
                            { icon: <Rocket className="text-[#2A9D8F]" />, title: "Rapid Growth", desc: "Our partners see an average 25% increase in revenue within the first 3 months." },
                            { icon: <ShieldCheck className="text-[#2A9D8F]" />, title: "Trusted Support", desc: "24/7 technical and business support to ensure your operations never stop." },
                            { icon: <Heart className="text-[#2A9D8F]" />, title: "Partner First", desc: "No hidden fees, no complex contracts. Just pure value for your business." },
                            { icon: <Zap className="text-[#2A9D8F]" />, title: "Instant Setup", desc: "Get your digital menu live and ready for orders in less than 15 minutes." }
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 group-hover:bg-[#2A9D8F]/10 transition-colors">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
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
