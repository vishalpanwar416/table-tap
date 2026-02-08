import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Bot, Zap, Coffee, ShoppingCart, UserCheck, ShieldCheck } from 'lucide-react';

export const metadata = {
    title: "AI Virtual Server & Automated Ordering | Table Tap",
    description: "Replace the 'where is my order' stress with Table Tap's AI Virtual Server. Automated order confirmation, smart status updates, and 24/7 guest assistance.",
    keywords: ["AI virtual server", "automated restaurant ordering", "AI waiter", "smart order assistant", "restaurant digital assistant"]
};

export default function AIOrderingSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 font-bold text-sm mb-6 uppercase tracking-widest border border-blue-200">
                        Next-Gen Ordering
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
                        The Server That <br />
                        <span className="text-blue-600">Never Sleeps.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Introduce your guests to our AI Virtual Server. It takes orders, answers questions about allergens, suggests drink pairings, and provides live preparation updates—freeing your human staff to focus on hospitality.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all shadow-2xl">Deploy Your AI Server</button>
                    </div>
                </div>
            </section>

            {/* AI Assistant Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Bot className="text-blue-600" />,
                                title: "Instant Assistance",
                                desc: "No more waving for the waiter. Guests get answers to 'where is my bill' or 'is this vegan' instantly."
                            },
                            {
                                icon: <ShoppingCart className="text-blue-600" />,
                                title: "Smart Cart",
                                desc: "AI automatically recommends the best-selling sides and beverages as guests add items to their cart."
                            },
                            {
                                icon: <Zap className="text-blue-600" />,
                                title: "Live Prep Sync",
                                desc: "Direct integration with our KDS shows guests exactly when their meal enters the wok."
                            },
                            {
                                icon: <UserCheck className="text-blue-600" />,
                                title: "Personalized Menus",
                                desc: "The AI recognizes returning guests and highlights their 'usual' orders for lightning-fast re-ordering."
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all">
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
