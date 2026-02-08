import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Zap, Clock, BarChart3, Globe } from 'lucide-react';

export const metadata = {
    title: "QR Menu for QSR & Food Courts | Table Tap",
    description: "Speed up your QSR or Food Court with Table Tap. High-speed QR ordering, real-time kitchen displays, and multi-brand support for food courts in India.",
    keywords: ["QSR ordering system", "food court management software", "self-service kiosk qr", "fast food digital menu"]
};

export default function QSRSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-orange-50 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-600 font-bold text-sm mb-6 uppercase tracking-widest border border-orange-200">
                        Built for Speed
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
                        Kill the Queue. <br />
                        <span className="text-orange-500">Boost the Volume.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        For QSRs and Food Courts, every second is revenue. Table Tap reduces ordering time by 70%, allowing your kitchen to focus on what matters: serving great food, fast.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-2xl">Scale Your QSR Now</button>
                    </div>
                </div>
            </section>

            {/* QSR Stats */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Clock className="text-orange-500" />, title: "3 Min Reduction", desc: "Average time saved per order at the counter." },
                            { icon: <Zap className="text-orange-500" />, title: "99% Precision", desc: "Order accuracy with direct-to-KDS integration." },
                            { icon: <BarChart3 className="text-orange-500" />, title: "20% Upsell", desc: "Automated add-on suggestions at checkout." },
                            { icon: <Globe className="text-orange-500" />, title: "Multi-Brand", desc: "Manage 10+ brands from one food court dashboard." }
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-8 rounded-3xl bg-slate-50">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">{stat.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{stat.title}</h3>
                                <p className="text-slate-500 text-sm">{stat.desc}</p>
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
