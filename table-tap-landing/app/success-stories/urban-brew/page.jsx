import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Quote, TrendingUp, Users, Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
    title: "Urban Brew Cafe Case Study | 22% Sales Boost with Table Tap",
    description: "Discover how The Urban Brew Cafe in Bangalore used Table Tap's AI upselling to increase revenue by 22% and reduce staff workload by 30%.",
};

export default function UrbanBrewCaseStudy() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            <section className="pt-32 pb-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-wrap gap-4 mb-8">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase tracking-widest">Cafe & Bakery</span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-widest">Bangalore, IN</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">
                            The Urban Brew: <br />
                            <span className="gradient-text">22% More Revenue.</span>
                        </h1>
                    </div>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="prose prose-lg prose-slate max-w-none">
                                <h2 className="text-3xl font-black mb-6">The Challenge</h2>
                                <p className="text-slate-600 leading-relaxed font-medium mb-6">
                                    The Urban Brew Cafe was struggling with peak-hour rushes in Bangalore’s HSR Layout. Guests were waiting 10-15 minutes just to see a menu, resulting in abandoned tables and frustrated staff. Manual upselling was non-existent as waiters were too busy just taking basic orders.
                                </p>

                                <h2 className="text-3xl font-black mb-6">The Solution</h2>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    They implemented Table Tap’s **AI-Powered QR System**. Guests could now scan and browse instantaneously. Our AI automatically suggested add-ons like &quot;extra cheese&quot; or &quot;pairing with a cold brew,&quot; which increased the average ticket value automatically.
                                </p>
                            </div>

                            <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden">
                                <Quote className="absolute top-10 right-10 text-white/10" size={120} />
                                <div className="relative z-10">
                                    <p className="text-2xl font-medium italic mb-8">
                                        &quot;Table Tap didn&apos;t just replace our menus; it became our best salesperson. The AI knows exactly what to suggest and when. Our dessert sales alone have doubled.&quot;
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-black">AK</div>
                                        <div>
                                            <p className="font-black">Arjun Kapoor</p>
                                            <p className="text-slate-400 text-sm font-bold">Founder, The Urban Brew</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Results */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 sticky top-32">
                                <h3 className="text-xl font-black">Key Outcomes:</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp size={24} /></div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">22%</p>
                                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Monthly Revenue</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Users size={24} /></div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">30%</p>
                                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Staff Efficiency</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><Smartphone size={24} /></div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">4.9/5</p>
                                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Guest Rating</p>
                                        </div>
                                    </div>
                                </div>
                                <hr className="border-slate-50" />
                                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                    Get Similar Results <ArrowRight size={18} />
                                </button>
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
