import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { HeartHandshake, Sparkles, Smile, ShieldCheck } from 'lucide-react';

export const metadata = {
    title: "Premium Restaurant Services & Support | Table Tap",
    description: "Experience the gold standard in restaurant service technology. From onboarding to implementation, Table Tap provides end-to-end services for modern food businesses.",
    keywords: ["restaurant services India", "restaurant tech support", "restaurant digital transformation", "hospitality service software"]
};

export default function RestaurantServices() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E76F51]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <HeartHandshake size={16} className="text-[#E76F51]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            World-Class Hospitality
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Exceptional <br />
                        <span className="gradient-text">Restaurant Services.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        At Table Tap, we don't just provide software; we provide a complete service ecosystem. From menu digitalization to staff training, we ensure your restaurant delivers excellence every single day.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#E76F51]/20 hover:shadow-[#E76F51]/40">Explore Our Services</button>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: <HeartHandshake />, title: "Onboarding & Menu Setup", desc: "Our expert team handles the entire transition. We digitize your existing menu and optimize it for high conversion rates and visual appeal." },
                            { icon: <ShieldCheck />, title: "24/7 Managed Services", desc: "Technical hiccups don't follow a schedule. Our dedicated support team is always on standby to ensure your digital ordering never goes down." },
                            { icon: <Sparkles />, title: "Digital Transformation", desc: "We guide your restaurant through the shift from traditional paper-based systems to a fully optimized, data-driven digital powerhouse." },
                            { icon: <Smile />, title: "Staff Training & Success", desc: "We provide comprehensive training sessions for your waiters, chefs, and managers to ensure everyone is comfortable with the new tech." }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-card p-10 rounded-[40px] hover:-translate-y-2 transition-transform duration-300 group"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-8 w-16 h-16 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#E76F51] shadow-lg group-hover:rotate-12 transition-transform">
                                    {React.cloneElement(item.icon, { size: 32 })}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">{item.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed text-lg">{item.desc}</p>
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
