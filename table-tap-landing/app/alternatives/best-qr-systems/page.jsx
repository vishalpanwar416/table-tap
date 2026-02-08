import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Star, CheckCircle2, Award, Zap, Palette, Layout } from 'lucide-react';

export const metadata = {
    title: "Best QR Menu Systems in India (2024) | Table Tap vs MenuTiger vs TableQR",
    description: "Discover the best QR menu systems for Indian restaurants. A detailed comparison of Table Tap, MenuTiger, TableQR, and FineDine. Find the perfect fit for your brand.",
    keywords: ["best QR menu system", "TableQR alternative", "MenuTiger vs Table Tap", "SproutQR reviews", "restaurant digital menu comparison"]
};

export default function BestQRSystems() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <Header />

            <section className="pt-32 pb-20 bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-7xl font-black mb-8">
                        The 5 Best QR Menu <br />
                        <span className="text-emerald-500">Systems in 2024.</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                        Compare the top-rated digital menu providers to see which one aligns with your restaurant’s aesthetic and operational goals.
                    </p>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="space-y-12">
                        {[
                            {
                                name: "Table Tap",
                                tag: "Best Overall & AI",
                                icon: <Zap className="text-emerald-500" />,
                                desc: "The only AI-first system in India. It doesn't just show a menu; it understands your guests and upsells automatically. Perfect for high-growth cafes and fine dining.",
                                points: ["Real-time AI upselling", "Magazine-grade UI", "Flat-fee pricing"]
                            },
                            {
                                name: "MenuTiger",
                                tag: "Best for Basic Customization",
                                icon: <Palette className="text-orange-500" />,
                                desc: "Waiters and managers like MenuTiger for its simple brand-matching tools. However, it lacks the advanced predictive analytics found in Table Tap.",
                                points: ["Custom brand colors", "Simple QR generator", "Global availability"]
                            },
                            {
                                name: "FineDine",
                                tag: "Best for Tablet Menus",
                                icon: <Layout className="text-blue-500" />,
                                desc: "Focused on high-end, tablet-based visual menus for luxury dining. While beautiful, the mobile experience is often heavier than Table Tap's lightweight web-app.",
                                points: ["Luxury visuals", "Wine pairing engine", "Staff management integration"]
                            },
                            {
                                name: "TableQR / SproutQR",
                                tag: "Budget Friendly",
                                icon: <Star className="text-yellow-500" />,
                                desc: "Quick and simple QR solutions for small venues. Good for the early stages, but restaurants often outgrow them when they need deep Swiggy/Zomato integration.",
                                points: ["Fast setup", "Basic ordering", "Entry-level pricing"]
                            }
                        ].map((provider, i) => (
                            <div key={i} className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl">{provider.icon}</div>
                                        <div>
                                            <h3 className="text-3xl font-black">{provider.name}</h3>
                                            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{provider.tag}</span>
                                        </div>
                                    </div>
                                    <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">View Comparison</button>
                                </div>
                                <p className="text-slate-600 text-lg mb-8 leading-relaxed font-medium">{provider.desc}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {provider.points.map((pt, j) => (
                                        <div key={j} className="flex items-center gap-3 text-slate-500">
                                            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                            <span className="font-bold text-sm tracking-tight">{pt}</span>
                                        </div>
                                    ))}
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
