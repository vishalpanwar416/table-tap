import React from 'react';
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
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E76F51]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                            <Smartphone size={16} className="text-[#2A9D8F]" />
                            <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                                The Digital Evolution
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            Not Just a Menu. <br />
                            <span className="gradient-text">A Dining Experience.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Table Tap&apos;s QR ordering system turns every table into a point of sale. No apps, no registration—just scan and savor.
                        </p>

                        <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <button className="btn-premium px-8 py-4 text-lg shadow-2xl shadow-[#2A9D8F]/20 hover:shadow-[#2A9D8F]/40">Launch Your Digital Menu</button>
                            <button className="btn-outline px-8 py-4 text-lg">View Sample Menu</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Deep Dive */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 tracking-tight">Why 500+ Restaurants <br /> <span className="gradient-text">Switched to Digital.</span></h2>
                            <div className="space-y-6">
                                {[
                                    { icon: <Smartphone />, title: "No App Required", desc: "Guests simply use their phone camera. No friction, no barriers to ordering." },
                                    { icon: <Zap />, title: "Instant Updates", desc: "Sold out of a dish? Toggle it off instantly. No more crossing out items on paper." },
                                    { icon: <MousePointer2 />, title: "Smart Upselling", desc: "Auto-recommend pairings like 'Add a cold brew' or 'Make it a combo'." },
                                    { icon: <BarChart3 />, title: "Data Insights", desc: "Know which dishes are viewed most, not just which sell most." }
                                ].map((item, i) => (
                                    <div key={i} className="glass-card p-6 rounded-2xl flex gap-6 hover:-translate-x-2 transition-transform duration-300">
                                        <div className="shrink-0 w-14 h-14 rounded-xl bg-[#0F172A] flex items-center justify-center text-[#2A9D8F] shadow-lg">
                                            {React.cloneElement(item.icon, { size: 24 })}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                                            <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
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
