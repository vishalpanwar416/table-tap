import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { QrCode, TrendingUp, Users, Clock } from 'lucide-react';

export const metadata = {
    title: "Best QR Code Ordering System in Mumbai | Table Tap",
    description: "Empower your Mumbai restaurant with Table Tap. India's #1 QR menu & contactless ordering system. Scaling QSRs in Dadar, fine dining in Colaba, and bars in Bandra.",
    keywords: ["restaurant ordering system mumbai", "digital menu mumbai", "QR code menu mumbai", "contactless ordering mumbai", "restaurant automation mumbai"]
};

export default function MumbaiSEO() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-slate-50 relative overflow-hidden">
                <div className="blob top-0 left-1/2 -translate-x-1/2 bg-[#2A9D8F]/10 w-[600px] h-[600px]" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-[#2A9D8F]/10 text-[#2A9D8F] font-bold text-sm mb-6 uppercase tracking-widest">
                            Maximum Performance for Mumbai
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1]">
                            The Fastest Way to Order in <span className="text-[#2A9D8F]">Mumbai.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            Mumbai never stops, and neither should your service. Table Tap is providing high-speed digital ordering to 120+ restaurants across the Maximum City.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="btn-premium">Get Started in Mumbai</button>
                            <a href="#features" className="btn-outline">Watch Demo</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Local Stats */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Clock className="text-[#2A9D8F]" />, label: "Service Speedup", value: "50%↑" },
                            { icon: <TrendingUp className="text-[#2A9D8F]" />, label: "Revenue Growth", value: "22%↑" },
                            { icon: <Users className="text-[#2A9D8F]" />, label: "Mumbai Outlets", value: "130+" },
                            { icon: <QrCode className="text-[#2A9D8F]" />, label: "Daily Transactions", value: "10k+" },
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
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Built for High Volume.</h2>
                        <p className="text-slate-400 text-lg">Our system handles the Mumbai rush with ease. Zero lag, 100% uptime.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "South Mumbai & Colaba", desc: "Sophisticated digital experiences for iconic heritage restaurants." },
                            { name: "Bandra & Juhu", desc: "Trendy and visual-first menus for the city's coolest bars and cafes." },
                            { name: "Andheri & BKC", desc: "Efficiency-driven ordering for the corporate and entertainment hubs." }
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
