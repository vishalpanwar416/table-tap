import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Coffee, Zap, CreditCard, Heart } from 'lucide-react';

export const metadata = {
    title: "Best POS & QR Ordering for Cafes & Bakeries | Table Tap",
    description: "Speed up your cafe service with Table Tap. Digital menus for bakeries, visual ordering, and instant WhatsApp billing. Reduce counter queues by 50%.",
    keywords: ["cafe ordering system", "bakery pos software", "coffee shop qr menu", "digital menu for cafes"]
};

export default function CafeSolution() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-[#FFFBF0] relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-600 font-bold text-sm mb-6 uppercase tracking-widest">
                            Built for Speed
                        </span>
                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1]">
                            More Coffee. <br />
                            <span className="text-[#E76F51]">Less Queues.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl">
                            Table Tap helps cafes and bakeries serve customers faster. Guests scan at their table or at the counter to view your daily specials and pay instantly.
                        </p>
                        <div className="flex flex-wrap justify-center gap-5">
                            <button className="btn-premium bg-[#0F172A] px-10">Get Your Cafe Online</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cafe Specific Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { icon: <Coffee />, title: "Visual Menus", desc: "Show off your latte art and freshly baked pastries with a high-res visual gallery." },
                            { icon: <Zap />, title: "Quick Checkout", desc: "Integrated payment options mean guests can pay as they order. No more waiting for the check." },
                            { icon: <Heart />, title: "Loyalty Integration", desc: "Track your regulars and offer them personalized discounts automatically." }
                        ].map((item, i) => (
                            <div key={i} className="text-center p-8">
                                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-6">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
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
