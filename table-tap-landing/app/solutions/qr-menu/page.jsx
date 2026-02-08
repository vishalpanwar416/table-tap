import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Smartphone, Zap, MousePointer2, BarChart3 } from 'lucide-react';

export const metadata = {
    title: "Best QR Code Menu for Restaurants | Contactless Ordering System",
    description: "Create a digital QR menu for your restaurant in minutes. No app download required for guests. Increase table turnover and order value with Table Tap's visual ordering system.",
    keywords: ["qr code menu", "digital restaurant menu", "contactless ordering", "qr menu ordering system", "restaurant technology"]
};

export default function QRMenuSolution() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <span className="inline-block px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm mb-6 uppercase tracking-widest border border-emerald-100">
                            The Digital Evolution
                        </span>
                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1]">
                            Not Just a Menu. <br />
                            <span className="gradient-text">A Dining Experience.</span>
                        </h1>
                        <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-2xl">
                            Table Tap's QR ordering system turns every table into a point of sale. No apps, no registration—just scan and savor.
                        </p>
                        <div className="flex flex-wrap justify-center gap-5">
                            <button className="btn-premium px-10">Launch Your Digital Menu</button>
                            <button className="btn-outline px-10">View Sample Menu</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Deep Dive */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8">Why 500+ Restaurants <br /> Switched to Digital.</h2>
                            <div className="space-y-8">
                                {[
                                    { icon: <Smartphone />, title: "No App Required", desc: "Guests simply use their phone camera. No friction, no barriers to ordering." },
                                    { icon: <Zap />, title: "Instant Updates", desc: "Sold out of a dish? Toggle it off instantly. No more crossing out items on paper." },
                                    { icon: <MousePointer2 />, title: "Smart Upselling", desc: "Auto-recommend pairings like 'Add a cold brew' or 'Make it a combo'." },
                                    { icon: <BarChart3 />, title: "Data Insights", desc: "Know which dishes are viewed most, not just which sell most." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="shrink-0 w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#2A9D8F]">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                            <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="w-full aspect-[4/5] bg-slate-200 rounded-[48px] overflow-hidden shadow-2xl skew-y-2 hover:skew-y-0 transition-transform duration-700">
                                {/* Placeholder for Product image */}
                                <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-2xl font-bold opacity-50">
                                    [Interactive Phone Mockup]
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
