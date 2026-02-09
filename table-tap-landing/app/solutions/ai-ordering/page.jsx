import React from 'react';
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
            <section className="pt-32 pb-24 bg-[#F8FAFC]/30 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E76F51]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <Bot size={16} className="text-[#2A9D8F]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            Next-Gen Ordering
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        The Server That <br />
                        <span className="gradient-text">Never Sleeps.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Introduce your guests to our AI Virtual Server. It takes orders, answers questions, suggests pairings, and provides live updates—freeing your staff to focus on hospitality.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-8 py-4 text-lg shadow-2xl shadow-[#2A9D8F]/20 hover:shadow-[#2A9D8F]/40">
                            Deploy Your AI Server
                        </button>
                    </div>
                </div>
            </section>

            {/* AI Assistant Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Bot className="text-[#2A9D8F]" />,
                                title: "Instant Assistance",
                                desc: "No more waving for the waiter. Guests get answers to 'where is my bill' or 'is this vegan' instantly."
                            },
                            {
                                icon: <ShoppingCart className="text-[#2A9D8F]" />,
                                title: "Smart Cart",
                                desc: "AI automatically recommends the best-selling sides and beverages as guests add items to their cart."
                            },
                            {
                                icon: <Zap className="text-[#2A9D8F]" />,
                                title: "Live Prep Sync",
                                desc: "Direct integration with our KDS shows guests exactly when their meal enters the wok."
                            },
                            {
                                icon: <UserCheck className="text-[#2A9D8F]" />,
                                title: "Personalized Menus",
                                desc: "The AI recognizes returning guests and highlights their 'usual' orders for lightning-fast re-ordering."
                            }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-card p-8 rounded-[32px] flex flex-col items-start hover:-translate-y-2 transition-transform duration-300"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-6 p-4 bg-[#F8FAFC] rounded-2xl w-fit shadow-inner">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-4">{item.title}</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.desc}</p>
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
