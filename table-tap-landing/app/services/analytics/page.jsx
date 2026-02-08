import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { BarChart3, PieChart, TrendingUp, Search } from 'lucide-react';

export const metadata = {
    title: "AI-Powered Restaurant Analytics | Table Tap",
    description: "Get deep insights into your restaurant's performance. Track sales, customer behavior, and inventory trends with Table Tap's advanced analytics dashboard.",
    keywords: ["restaurant analytics software", "food business insights", "sales reporting for restaurants", "customer behavior tracking"]
};

export default function AnalyticsSolution() {
    return (
        <main className="min-h-screen bg-slate-900 text-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-blue-400 font-bold text-sm mb-6 uppercase tracking-widest border border-white/10">
                        Data-Driven Growth
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1]">
                        Insightful Data. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Smarter Decisions.</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Stop guessing what works. Table Tap tracks every click and every order to provide you with actionable insights that help reduce waste and increase profit margins.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20">Explore Analytics Dashboard</button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-slate-800/50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <TrendingUp className="text-blue-400" />, title: "Sales Trends", desc: "Identify your peak hours and high-volume days to optimize staffing." },
                            { icon: <PieChart className="text-emerald-400" />, title: "Popular Items", desc: "Know exactly which dishes are your champions and which need a tweak." },
                            { icon: <BarChart3 className="text-purple-400" />, title: "Revenue Analysis", desc: "Track daily, weekly, and monthly revenue with high-precision charts." },
                            { icon: <Search className="text-orange-400" />, title: "Guest Journey", desc: "Understand how customers browse your menu and where they convert." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-[32px] bg-slate-900 border border-white/5 hover:border-blue-500/30 transition-all">
                                <div className="mb-6">{item.icon}</div>
                                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
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
