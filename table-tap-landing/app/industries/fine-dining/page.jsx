import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { GlassWater, Star, Sparkles, Smile } from 'lucide-react';

export const metadata = {
    title: "Premium QR Code Menu for Fine Dining Restaurants | Table Tap",
    description: "Elevate your fine dining experience with Table Tap. Elegant digital menus, visual storytelling, and seamless table service. No tech friction, just pure hospitality.",
    keywords: ["fine dining qr menu", "luxury restaurant digital menu", "contactless ordering for fine dining", "premium restaurant software"]
};

export default function FineDiningSolution() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-[#FAF9F6] relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <span className="inline-block px-4 py-2 rounded-full bg-slate-100 text-slate-600 font-bold text-sm mb-6 uppercase tracking-widest border border-slate-200">
                            Elegance Redefined
                        </span>
                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1]">
                            Sophistication Meets <br />
                            <span className="text-[#2A9D8F]">Seamless Tech.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl font-medium">
                            Table Tap understands that in fine dining, every detail matters. Our QR menus disappear into the experience, providing the information your guests want with the elegance they expect.
                        </p>
                        <div className="flex flex-wrap justify-center gap-5">
                            <button className="btn-premium px-10">Request a Private Demo</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fine Dining Specific Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {[
                            { icon: <Star />, title: "Visual Storytelling", desc: "Let your dishes shine with high-resolution imagery and detailed descriptions of provenance and technique." },
                            { icon: <Sparkles />, title: "Zero Friction", desc: "No app downloads, no account creation. Just a clean, branded interface that complements your table setting." },
                            { icon: <Smile />, title: "Staff Efficiency", desc: "Allow your captains to focus on hospitality and storytelling while guests browse the menu at their own pace." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 group hover:bg-slate-50 transition-colors rounded-3xl">
                                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
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
