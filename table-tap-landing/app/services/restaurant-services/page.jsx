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
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-teal-50 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-teal-100 text-teal-600 font-bold text-sm mb-6 uppercase tracking-widest border border-teal-200">
                        World-Class Hospitality
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
                        Exceptional <span className="text-teal-600">Restaurant Services.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        At Table Tap, we don't just provide software; we provide a complete service ecosystem. From menu digitalization to staff training, we ensure your restaurant delivers excellence every single day.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="btn-premium px-10">Explore Our Services</button>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            { icon: <HeartHandshake className="text-teal-600 w-8 h-8" />, title: "Onboarding & Menu Setup", desc: "Our expert team handles the entire transition. We digitize your existing menu and optimize it for high conversion rates and visual appeal." },
                            { icon: <ShieldCheck className="text-teal-600 w-8 h-8" />, title: "24/7 Managed Services", desc: "Technical hiccups don't follow a schedule. Our dedicated support team is always on standby to ensure your digital ordering never goes down." },
                            { icon: <Sparkles className="text-teal-600 w-8 h-8" />, title: "Digital Transformation", desc: "We guide your restaurant through the shift from traditional paper-based systems to a fully optimized, data-driven digital powerhouse." },
                            { icon: <Smile className="text-teal-600 w-8 h-8" />, title: "Staff Training & Success", desc: "We provide comprehensive training sessions for your waiters, chefs, and managers to ensure everyone is comfortable with the new tech." }
                        ].map((service, i) => (
                            <div key={i} className="flex gap-6 p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl transition-all">
                                <div className="shrink-0 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    {service.icon}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{service.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium text-lg">{service.desc}</p>
                                </div>
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
