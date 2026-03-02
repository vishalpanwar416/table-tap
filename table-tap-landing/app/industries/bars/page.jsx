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
    const features = [
        { icon: Wine, title: "Digital Cocktails", desc: "Showcase your signature drinks with stunning visuals and ingredients." },
        { icon: Zap, title: "Instant Re-order", desc: "One-tap re-ordering for the same drink keeps the revenue flowing." },
        { icon: Music, title: "Dark-Mode UI", desc: "A sleek interface that looks perfect in low-light environments." },
        { icon: Users, title: "Group Tabs", desc: "Easily handle group orders and split bills without the headache." }
    ];

    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-slate-50 relative overflow-hidden border-b border-slate-100">
                <div className="blob top-0 left-1/2 -translate-x-1/2 bg-[#2A9D8F]/10 w-[600px] h-[600px]" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-[#2A9D8F]/10 text-[#2A9D8F] font-bold text-sm mb-6 uppercase tracking-widest border border-[#2A9D8F]/20">
                        High-Volume Service
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight">
                        Faster Drinks. <br />
                        <span className="gradient-text">Better Nights.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        In a crowded bar, every second counts. Table Tap&apos;s lightning-fast QR ordering means your guests spend more time enjoying and less time waiting at the counter.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="btn-premium">Get Your Bar Online</button>
                    </div>
                </div>
            </section>

            {/* Bar Specific Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div key={i} className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] hover:border-[#2A9D8F]/30 transition-all">
                                    <div className="mb-6 p-4 bg-[#2A9D8F]/10 rounded-2xl w-fit">
                                        <Icon className="text-[#2A9D8F]" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
