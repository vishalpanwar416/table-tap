import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { QrCode, TrendingUp, Users, Clock } from 'lucide-react';

export const metadata = {
    title: "Best QR Code Ordering System in Delhi NCR | Table Tap",
    description: "Modernize your Delhi restaurant with Table Tap. India's #1 QR menu & contactless ordering system. Ideal for fine dining in South Delhi, cafes in Hauz Khas, and corporate hubs in Gurgaon.",
    keywords: ["restaurant ordering system delhi", "digital menu delhi", "QR code menu delhi ncr", "contactless ordering gurgaon", "restaurant management software delhi"]
};

export default function DelhiSEO() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-slate-50 relative overflow-hidden">
                <div className="blob bottom-[-100px] left-[-100px] bg-[#2A9D8F]/10 w-[500px] h-[500px]" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-[#2A9D8F]/10 text-[#2A9D8F] font-bold text-sm mb-6 uppercase tracking-widest">
                            Built for Delhi NCR
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1]">
                            Elevate the <span className="text-[#2A9D8F]">Capital&apos;s</span> Dining Experience.
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            From the legendary eateries of Connaught Place to the sophisticated fine-dining scene in South Delhi, Table Tap is the trusted partner for 150+ Delhi NCR restaurants.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="btn-premium">Get Started in Delhi</button>
                            <a href="#features" className="btn-outline">See Full Features</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Local Stats */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Clock className="text-[#2A9D8F]" />, label: "Wait Time Reduction", value: "45%↓" },
                            { icon: <TrendingUp className="text-[#2A9D8F]" />, label: "Order Accuracy", value: "99.9%" },
                            { icon: <Users className="text-[#2A9D8F]" />, label: "Delhi NCR Outlets", value: "180+" },
                            { icon: <QrCode className="text-[#2A9D8F]" />, label: "Monthly Orders", value: "75k+" },
                        ].map((stat, i) => (
                            <div key={stat.label} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-[#2A9D8F]/30 transition-all group">
                                <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                                    {stat.icon}
                                </div>
                                <div className="text-4xl font-black text-slate-900 mb-2">{stat.value}</div>
                                <div className="text-slate-500 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Neighborhood Specifics */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Dominating the North.</h2>
                        <p className="text-slate-400 text-lg">Whether it&apos;s a crowded QSR in Chandni Chowk or a rooftop bar in Gurgaon, we deliver performance.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "CP & South Delhi", desc: "Elegant digital menus for premium dining and boutique cafes." },
                            { name: "Gurgaon & Noida", desc: "Corporate-ready ordering for high-volume office hubs and malls." },
                            { name: "West & North Delhi", desc: "Robust systems for family restaurants and high-traffic food courts." }
                        ].map((place) => (
                            <div key={place.name} className="p-10 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <h3 className="text-2xl font-bold mb-4">{place.name}</h3>
                                <p className="text-slate-400 leading-relaxed">{place.desc}</p>
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
