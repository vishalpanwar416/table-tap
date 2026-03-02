import Link from 'next/link';
import { ArrowRight, RefreshCw, Zap, Palette, ShieldCheck } from 'lucide-react';

export default function WhySwitch() {
    return (
        <section className="py-24 bg-slate-50 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
                    <div className="md:w-1/2">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm mb-6">
                            <RefreshCw size={16} className="animate-spin-slow" /> Ready to upgrade?
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                            Switching to Table Tap is <span className="gradient-text">Instant and Easy.</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 font-medium">
                            Whether you&apos;re using Petpooja, DotPe, or a generic QR system, we help you migrate your entire menu and data in under 15 minutes. Experience the power of AI-first hospitality.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                            {[
                                { icon: <Zap size={18} />, text: "15-Min Migration" },
                                { icon: <Palette size={18} />, text: "Premium Branding" },
                                { icon: <ShieldCheck size={18} />, text: "Zero Commission" },
                                { icon: <RefreshCw size={18} />, text: "Live AI Insights" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 font-bold text-slate-700">
                                    <div className="text-emerald-500">{item.icon}</div>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                        <Link href="/alternatives" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:gap-4 transition-all group">
                            Compare Table Tap <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="md:w-1/2 relative">
                        <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-emerald-500/10 border border-slate-100 relative z-10">
                            <h3 className="text-xl font-black mb-6">Why restaurants switch:</h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-emerald-800 font-bold italic">&quot;We switched from Petpooja and saw a 14% increase in sales within the first month thanks to the AI upselling.&quot;</p>
                                    <p className="text-emerald-600 text-xs font-black mt-2 uppercase">— Bangalore Cafe Owner</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-blue-800 font-bold italic">&quot;The branding is on another level. It makes our restaurant look much more professional than DotPe did.&quot;</p>
                                    <p className="text-blue-600 text-xs font-black mt-2 uppercase">— Mumbai Fine Dining</p>
                                </div>
                            </div>
                        </div>
                        {/* Aesthetic blobs */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}
