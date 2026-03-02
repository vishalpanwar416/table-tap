import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Sparkles, Check, Zap, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

export const metadata = {
    title: "Table Tap vs MenuTiger | The Intelligent Alternative to MenuTiger",
    description: "Compare Table Tap vs MenuTiger. Move beyond simple QR menus to a fully integrated AI restaurant suite designed for the Indian market.",
    keywords: ["MenuTiger alternative", "MenuTiger vs Table Tap", "best digital menu builder", "AI restaurant system"]
};

export default function MenuTigerComparison() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            <section className="pt-32 pb-24 bg-orange-50">
                <div className="container mx-auto px-4 text-center">
                    <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-bold uppercase tracking-widest mb-6 inline-block">
                        Intelligence vs Simplicity
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-slate-900">
                        Table Tap <span className="text-slate-400">vs</span> MenuTiger
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                        MenuTiger is a solid menu builder. Table Tap is an <strong>AI Operating System</strong> for your entire restaurant.
                    </p>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100">
                            <Zap className="text-orange-500 mb-6" />
                            <h3 className="text-xl font-bold mb-4">India-First Logic</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Unlike global tools, we are built for India. Native GST billing, Swiggy/Zomato sync, and UPI payments are baked in, not bolted on.</p>
                        </div>
                        <div className="p-8 rounded-[40px] bg-emerald-50 border border-emerald-100">
                            <Sparkles className="text-emerald-500 mb-6" />
                            <h3 className="text-xl font-bold mb-4">Predictive AI</h3>
                            <p className="text-emerald-700/80 text-sm leading-relaxed">We don&apos;t just show a QR menu; we predict guest behavior and suggest items to increase your Average Ticket Value by 15%.</p>
                        </div>
                        <div className="p-8 rounded-[40px] bg-blue-50 border border-blue-100">
                            <Heart className="text-blue-500 mb-6" />
                            <h3 className="text-xl font-bold mb-4">Guest Emotion</h3>
                            <p className="text-blue-700/80 text-sm leading-relaxed">Our AI analyzes guest feedback and sentiment in real-time. MenuTiger provides data; we provide intelligence.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
