import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Layout, Palette, RefreshCw, BarChart } from 'lucide-react';

export const metadata = {
    title: "Dynamic Digital Menu Management | Table Tap",
    description: "Manage your restaurant menu in real-time. Update prices, add items, and create categories with Table Tap's easy-to-use digital menu builder.",
    keywords: ["digital menu management", "restaurant menu builder", "real-time menu update", "digital QR menu editor"]
};

export default function MenuManagementSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-emerald-50 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm mb-6 uppercase tracking-widest border border-emerald-200">
                        Menu Control
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
                        Update Your Menu <br />
                        <span className="text-emerald-600">in Seconds.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Ditch the expensive paper printing. With Table Tap, you have complete control over your offerings. Change prices, toggle out-of-stock items, and launch seasonal specials instantly.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all shadow-2xl">Start Building Your Menu</button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <RefreshCw className="text-emerald-600" />, title: "Real-time Sync", desc: "Changes reflect on all customer phones immediately without refreshing." },
                            { icon: <Palette className="text-emerald-600" />, title: "Beautiful Design", desc: "Highly visual layouts that make your food look irresistible." },
                            { icon: <Layout className="text-emerald-600" />, title: "Smart Categories", desc: "Organize items by cuisine, course, or popularity for easy browsing." },
                            { icon: <BarChart className="text-emerald-600" />, title: "Menu Analytics", desc: "See which items are viewed most and which ones drive your profit." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-500/30 transition-all">
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
