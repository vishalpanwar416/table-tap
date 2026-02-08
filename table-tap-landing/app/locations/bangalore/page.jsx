import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { QrCode, TrendingUp, Users, Clock } from 'lucide-react';

export const metadata = {
    title: "Best QR Code Ordering System in Bangalore | Table Tap",
    description: "Scale your Bangalore restaurant with Table Tap. India's #1 QR menu & contactless ordering system. Perfect for pubs in Indiranagar, cafes in Koramangala, and tech-parks in Whitefield.",
    keywords: ["restaurant ordering system bangalore", "digital menu bangalore", "QR code menu bangalore", "contactless ordering bangalore", "pub management software bangalore"]
};

export default function BangaloreSEO() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-slate-50 relative overflow-hidden">
                <div className="blob top-[-100px] right-[-100px] bg-[#2A9D8F]/10 w-[500px] h-[500px]" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-[#2A9D8F]/10 text-[#2A9D8F] font-bold text-sm mb-6 uppercase tracking-widest">
                            Silicon Valley's Choice
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1]">
                            The Smartest way to Dine in <span className="text-[#2A9D8F]">Bangalore.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            From the high-energy pubs of Indiranagar to the tech-savvy crowd in Whitefield, Table Tap is streamlining the Bangalore dining experience with zero-wait ordering.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="btn-premium">Get Started in Bangalore</button>
                            <a href="#features" className="btn-outline">View Pub Solutions</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Local Stats */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Clock className="text-[#2A9D8F]" />, label: "Table Turnover Speed", value: "35%↑" },
                            { icon: <TrendingUp className="text-[#2A9D8F]" />, label: "Beverage Sales Increase", value: "20%↑" },
                            { icon: <Users className="text-[#2A9D8F]" />, label: "Bangalore Partners", value: "200+" },
                            { icon: <QrCode className="text-[#2A9D8F]" />, label: "Daily Scans in Bangalore", value: "15k+" },
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
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Serving the Tech Capital.</h2>
                        <p className="text-slate-400 text-lg">We understand the fast-paced lifestyle of Bangaloreans. Our system is built for speed and reliability.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Indiranagar & Koramangala", desc: "Dynamic QR menus for trendy pubs and artisanal cafes." },
                            { name: "Whitefield & Bellandur", desc: "Efficient ordering for office goers and corporate food courts." },
                            { name: "Jayanagar & JP Nagar", desc: "Digital management for heritage restaurants and family dining." }
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
