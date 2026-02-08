import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Sparkles, Brain, Zap, TrendingUp, Cpu, Bot } from 'lucide-react';

export const metadata = {
    title: "AI-Powered Restaurant Solutions | Future of Dining | Table Tap",
    description: "Transform your restaurant with Table Tap's AI suite. Automated upselling, predictive inventory, and AI-driven guest insights to boost your profit by 30%.",
    keywords: ["AI for restaurants", "artificial intelligence restaurant software", "smart restaurant solutions", "AI food ordering", "predictive analytics for cafes"]
};

export default function AIRestaurantSolution() {
    return (
        <main className="min-h-screen bg-slate-950 text-white selection:bg-[#2A9D8F] selection:text-white">
            <Header />

            {/* Futuristic Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#2A9D8F]/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#2A9D8F] font-bold text-sm mb-8 animate-bounce">
                        <Sparkles className="w-4 h-4" />
                        AI-DRIVEN HOSPITALITY
                    </div>
                    <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.9] tracking-tighter">
                        The First <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A9D8F] via-emerald-400 to-blue-500">Autonomous</span> <br />
                        Chef's Assistant.
                    </h1>
                    <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Stop managing, start growing. Table Tap AI analyzes your sales patterns, predicts busy hours, and automatically suggests upsells to your guests, increasing average order value by 20% without human effort.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <button className="px-12 py-5 bg-[#2A9D8F] hover:bg-[#238b7e] text-white rounded-2xl font-bold transition-all shadow-2xl shadow-[#2A9D8F]/30 flex items-center gap-2">
                            Activate AI Dashboard <Zap className="w-5 h-5 fill-current" />
                        </button>
                    </div>
                </div>
            </section>

            {/* AI Capabilities Grid */}
            <section className="py-24 bg-slate-900 border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Brain className="w-10 h-10 text-[#2A9D8F]" />,
                                title: "Predictive Ordering",
                                desc: "Our AI forecasts tomorrow's sales based on past data, weather, and local events to help you optimize inventory."
                            },
                            {
                                icon: <Cpu className="text-blue-400 w-10 h-10" />,
                                title: "Smart Upselling",
                                desc: "Dynamically recommend food pairings to guests while they browse your QR menu, just like Amazon."
                            },
                            {
                                icon: <Bot className="text-purple-400 w-10 h-10" />,
                                title: "AI Guest Retention",
                                desc: "Automatically send personalized offers to your regulars based on their favorite dishes and peak visit times."
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group">
                                <div className="mb-8 p-5 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-3xl font-bold mb-6">{item.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-br from-[#2A9D8F]/20 to-blue-500/20 rounded-[60px] p-12 md:p-24 border border-white/10 text-center">
                        <h2 className="text-4xl md:text-6xl font-black mb-12">Numbers Speak Louder <br />Than Algorithms.</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div>
                                <div className="text-6xl font-black text-[#2A9D8F] mb-4">22%</div>
                                <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Higher Check Value</div>
                            </div>
                            <div>
                                <div className="text-6xl font-black text-blue-400 mb-4">15%</div>
                                <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Less Food Waste</div>
                            </div>
                            <div>
                                <div className="text-6xl font-black text-purple-400 mb-4">3x</div>
                                <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Faster Table Service</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
