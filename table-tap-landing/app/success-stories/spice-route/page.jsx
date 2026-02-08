import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Quote, TrendingUp, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
    title: "Spice Route Fine Dine Case Study | 40% Faster Table Turnaround",
    description: "See how Spice Route Mumbai optimized their fine-dining operations and eliminated order delays using Table Tap's intelligent KDS and digital ordering suite.",
};

export default function SpiceRouteCaseStudy() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            <section className="pt-32 pb-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-wrap gap-4 mb-8">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-black uppercase tracking-widest">Fine Dining</span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-widest">Mumbai, IN</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">
                            Spice Route: <br />
                            <span className="gradient-text">Elite Efficiency.</span>
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
                                    In a high-pressure fine dining environment, communication between the front-of-house and the kitchen is critical. Spice Route was experiencing "Friday-night bottlenecks" where handwritten KOTs (Kitchen Order Tickets) were getting lost or misread, leading to comped meals and unhappy guests.
                                </p>

                                <h2 className="text-3xl font-black mb-6">The Solution</h2>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    They deployed Table Tap’s **Integrated KDS (Kitchen Display System)** alongside the digital menu. Orders now flow directly from the guest's phone to the kitchen screen in milliseconds. The system even prioritizes appetizers and warns chefs when a table has been waiting too long.
                                </p>
                            </div>

                            <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden">
                                <Quote className="absolute top-10 right-10 text-white/10" size={120} />
                                <div className="relative z-10">
                                    <p className="text-2xl font-medium italic mb-8">
                                        "Fine dining is about the details. Table Tap ensures that the technical details are perfect so our staff can focus 100% on guest hospitality, not running KOTs to the kitchen."
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center font-black">VR</div>
                                        <div>
                                            <p className="font-black">Vikram Roy</p>
                                            <p className="text-slate-400 text-sm font-bold">General Manager, Spice Route</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Results */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 sticky top-32">
                                <h3 className="text-xl font-black">Performance Stats:</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Clock size={24} /></div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">40%</p>
                                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Faster Table Turn</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><CheckCircle2 size={24} /></div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">100%</p>
                                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Order Accuracy</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><ShieldCheck size={24} /></div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">ROI</p>
                                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Achieved in 14 Days</p>
                                        </div>
                                    </div>
                                </div>
                                <hr className="border-slate-50" />
                                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                    Request a System Tour <ArrowRight size={18} />
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
