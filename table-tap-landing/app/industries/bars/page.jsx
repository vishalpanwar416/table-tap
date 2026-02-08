import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Wine, Zap, Music, Users } from 'lucide-react';

export const metadata = {
    title: "Best QR Code Ordering for Bars & Lounges | Table Tap",
    description: "Keep the drinks flowing with Table Tap. Digital menus for bars, instant re-ordering, and real-time tabs. Reduce wait times and increase beverage sales by 20%.",
    keywords: ["bar ordering system", "lounge digital menu", "qr code for bars", "nightclub management software"]
};

export default function BarsSolution() {
    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm mb-6 uppercase tracking-widest border border-purple-500/30">
                        High-Volume Service
                    </span>
                    <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.9]">
                        Faster Drinks. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Better Nights.</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
                        In a crowded bar, every second counts. Table Tap's lightning-fast QR ordering means your guests spend more time enjoying and less time waiting at the counter.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl font-bold transition-all transform hover:scale-105">Get Your Bar Online</button>
                    </div>
                </div>
            </section>

            {/* Bar Specific Features */}
            <section className="py-24 bg-slate-900">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Wine className="text-purple-400" />, title: "Digital Cocktails", desc: "Showcase your signature drinks with stunning visuals and ingredients." },
                            { icon: <Zap className="text-blue-400" />, title: "Instant Re-order", desc: "One-tap re-ordering for the same drink keeps the revenue flowing." },
                            { icon: <Music className="text-pink-400" />, title: "Dark-Mode UI", desc: "A sleek interface that looks perfect in low-light environments." },
                            { icon: <Users className="text-emerald-400" />, title: "Group Tabs", desc: "Easily handle group orders and split bills without the headache." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 bg-slate-800/50 border border-slate-700 rounded-[32px] hover:border-purple-500/50 transition-all">
                                <div className="mb-6">{item.icon}</div>
                                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
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
