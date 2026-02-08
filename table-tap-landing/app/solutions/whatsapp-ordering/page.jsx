import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { MessageSquare, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

export const metadata = {
    title: "WhatsApp Ordering System for Restaurants | Table Tap",
    description: "Boost your restaurant's delivery and takeaway orders with Table Tap's WhatsApp integration. Let customers order directly through WhatsApp with a digital menu.",
    keywords: ["whatsapp ordering for restaurants", "whatsapp food ordering system India", "digital menu for whatsapp", "restaurant whatsapp bot"]
};

export default function WhatsAppOrdering() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-[#E7FFFA] relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="w-16 h-16 bg-[#25D366] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#25D366]/20">
                            <MessageSquare className="text-white w-10 h-10" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1]">
                            Order via <span className="text-[#25D366]">WhatsApp.</span> <br />
                            Zero Commission.
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl font-medium">
                            Stop paying 25-30% to delivery apps. Let your customers order through the app they already use every day. Simple, fast, and fully integrated with your Table Tap dashboard.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button className="px-8 py-4 bg-[#25D366] hover:bg-[#20bd5b] text-white rounded-2xl font-bold transition-all shadow-xl shadow-[#25D366]/30">Start WhatsApp Ordering</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { icon: <Zap className="text-[#25D366]" />, title: "Instant Setup", desc: "Convert your physical menu into a WhatsApp-shareable link in under 10 minutes." },
                            { icon: <TrendingUp className="text-[#25D366]" />, title: "Higher Retension", desc: "Build a direct relationship with your customers by owning their data and contact info." },
                            { icon: <ShieldCheck className="text-[#25D366]" />, title: "Secure Payments", desc: "Integrated UPI and card payments directly through the ordering link." }
                        ].map((feature, i) => (
                            <div key={i} className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:shadow-xl transition-all">
                                <div className="mb-6">{feature.icon}</div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
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
