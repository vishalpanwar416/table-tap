import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { ChefHat, Monitor, Zap, CheckCircle } from 'lucide-react';

export const metadata = {
    title: "Kitchen Display System (KDS) for Restaurants | Table Tap",
    description: "Eliminate paper tickets with Table Tap's digital Kitchen Display System. Improve kitchen efficiency, reduce order errors, and speed up food preparation.",
    keywords: ["kitchen display system", "digital kds for restaurants", "paperless kitchen software", "restaurant kitchen management"]
};

export default function KDSSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-slate-900 relative overflow-hidden text-white">
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm mb-6 uppercase tracking-widest border border-emerald-500/30">
                        Optimized Back-of-House
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1]">
                        A Paperless, <br />
                        <span className="text-emerald-400">Precision Kitchen.</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Say goodbye to lost tickets and messy handwriting. Table Tap KDS sends orders directly from the table to the chef's screen, organized by priority and preparation time.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20">Upgrade Your Kitchen</button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Monitor className="text-emerald-600" />, title: "Digital Tickets", desc: "Clear, color-coded orders that are impossible to miss or misread." },
                            { icon: <Zap className="text-emerald-600" />, title: "Instant Notification", desc: "Alert staff the moment a dish is ready for service." },
                            { icon: <CheckCircle className="text-emerald-600" />, title: "Order Tracking", desc: "Monitor preparation times and identify bottlenecks in the kitchen." },
                            { icon: <ChefHat className="text-emerald-600" />, title: "Chef-Friendly UI", desc: "Large fonts and high-contrast design optimized for heat and steam." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100">
                                <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm">{item.icon}</div>
                                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
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
