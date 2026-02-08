import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { QrCode, TrendingUp, Users, Clock } from 'lucide-react';

export const metadata = {
    title: "Best QR Code Ordering System in Jaipur | Table Tap",
    description: "Modernize your Jaipur restaurant with Table Tap. India's #1 QR menu & contactless ordering system. Perfect for heritage cafes in Pink City and rooftops in Malviya Nagar.",
    keywords: ["restaurant ordering system jaipur", "digital menu jaipur", "QR code menu jaipur", "contactless ordering jaipur", "restaurant software rajasthan"]
};

export default function JaipurSEO() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-rose-50 relative overflow-hidden">
                <div className="blob top-[-100px] left-[-100px] bg-rose-500/10 w-[500px] h-[500px]" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-rose-100 text-rose-600 font-bold text-sm mb-6 uppercase tracking-widest border border-rose-200">
                            Built for the Pink City
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1]">
                            Heritage Hospitality Meets <span className="text-rose-500">Modern Tech.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            From the bustling rooftop cafes in Malviya Nagar to the iconic heritage eateries in the Old City, Table Tap is helping Jaipur's food scene shine with seamless QR ordering.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all shadow-lg">Scale Your Jaipur Business</button>
                            <a href="#features" className="px-8 py-4 border-2 border-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all text-center">See Full Platform</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Local Stats */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Clock className="text-rose-500" />, label: "Service Speed", value: "40%↑" },
                            { icon: <TrendingUp className="text-rose-500" />, label: "Check Value", value: "20%↑" },
                            { icon: <Users className="text-rose-500" />, label: "Jaipur Partners", value: "50+" },
                            { icon: <QrCode className="text-rose-500" />, label: "Daily Transactions", value: "8k+" },
                        ].map((stat, i) => (
                            <div key={stat.label} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-rose-500/30 transition-all group">
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

            <Contact />
            <Footer />
        </main>
    );
}
