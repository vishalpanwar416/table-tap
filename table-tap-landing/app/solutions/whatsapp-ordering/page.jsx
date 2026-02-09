import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { MessageSquare, Receipt, Star, Users } from 'lucide-react';

export const metadata = {
    title: "WhatsApp Billing & Digital Receipts | Table Tap",
    description: "Go paperless with Table Tap's WhatsApp Billing. Send automated digital receipts, collect feedback, and build your customer CRM instantly.",
    keywords: ["whatsapp billing", "digital receipts restaurant", "paperless billing", "restaurant crm whatsapp", "whatsapp feedback system"]
};

export default function WhatsAppBilling() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#25D366]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="w-20 h-20 bg-[#25D366] rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-[#25D366]/30 animate-fade-in-up">
                            <MessageSquare className="text-white w-10 h-10" />
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            Get Bills on <span className="text-[#25D366]">WhatsApp.</span> <br />
                            <span className="gradient-text">Eco-Friendly & Smart.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Stop printing thousands of paper bills. Send digital receipts directly to your customer's WhatsApp. Collect feedback, build your CRM, and save paper instantly.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <button className="btn-premium px-8 py-4 bg-[#25D366] hover:bg-[#1faa50] text-white shadow-2xl shadow-[#25D366]/30 border-none">
                                Enable WhatsApp Billing
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: <Receipt className="text-[#25D366]" />, title: "Automated Receipts", desc: "Send a professional digital bill instantly after payment. No manual entry required." },
                            { icon: <Star className="text-[#25D366]" />, title: "Smart Feedback", desc: "Collect star ratings and reviews right after the meal, directly within WhatsApp." },
                            { icon: <Users className="text-[#25D366]" />, title: "Customer CRM", desc: "Automatically build a database of customer phone numbers for future marketing campaigns." }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="glass-card p-10 rounded-[40px] hover:-translate-y-2 transition-transform duration-300"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center">
                                    {React.cloneElement(feature.icon, { size: 28 })}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">{feature.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
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
