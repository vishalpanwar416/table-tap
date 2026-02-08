import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { Check, X, Zap, TrendingUp, Smile, Smartphone } from 'lucide-react';

export const metadata = {
    title: "Table Tap vs Petpooja | The Best Petpooja Alternative for Modern Restaurants",
    description: "Compare Table Tap vs Petpooja. Why trendy cafes and high-end restaurants in India are choosing Table Tap's AI-powered QR menu over traditional POS providers.",
    keywords: ["Petpooja alternative", "Petpooja vs Table Tap", "Best restaurant POS India", "modern QR menu system"]
};

export default function PetpoojaComparison() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            <section className="pt-32 pb-24 bg-gradient-to-b from-slate-50 to-white">
                <div className="container mx-auto px-4 text-center">
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold uppercase tracking-widest mb-6 inline-block">
                        Comparison Guide
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter">
                        Table Tap <span className="text-slate-400">vs</span> Petpooja
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                        Petpooja is a great legacy system, but for restaurants that prioritize <strong>customer experience</strong> and <strong>AI-driven growth</strong>, Table Tap is the modern answer.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Table Tap Pro column */}
                        <div className="p-10 rounded-[40px] bg-emerald-50 border border-emerald-100">
                            <h2 className="text-3xl font-black mb-8 text-emerald-900">Why Switch to Table Tap?</h2>
                            <ul className="space-y-6">
                                {[
                                    { title: "AI-Powered Upselling", desc: "Our menus suggest items based on time of day and trending pairings." },
                                    { title: "Premium Brand Aesthetics", desc: "A menu that looks like a high-end food magazine, not a spreadsheet." },
                                    { title: "Zero App Download", desc: "Guests order in 2 taps. Higher conversion, lower friction." },
                                    { title: "Predictive Analytics", desc: "Forecast your busiest hours and inventory needs automatically." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="mt-1"><Check className="text-emerald-500" /></div>
                                        <div>
                                            <h4 className="font-bold text-emerald-900">{item.title}</h4>
                                            <p className="text-emerald-700/80 text-sm">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Petpooja column */}
                        <div className="p-10 rounded-[40px] bg-slate-50 border border-slate-100">
                            <h2 className="text-3xl font-black mb-8 text-slate-900">Legacy Systems (Petpooja)</h2>
                            <ul className="space-y-6 opacity-60">
                                {[
                                    { title: "Complex Setup", desc: "Often requires hardware technicians and days of training." },
                                    { title: "Generic Designs", desc: "Menus often lack the visual 'wow' factor that drives sales." },
                                    { title: "Manual Reporting", desc: "Requires managers to spend hours digging through Excel sheets." },
                                    { title: "Customer Friction", desc: "Often requires multiple steps or account creation for simple orders." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="mt-1"><X className="text-slate-400" /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.title}</h4>
                                            <p className="text-slate-600 text-sm">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-4xl font-black text-center mb-16">The Feature Face-Off</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-6 font-bold uppercase tracking-widest text-slate-500 text-xs">Capability</th>
                                    <th className="py-6 font-black text-emerald-400">Table Tap</th>
                                    <th className="py-6 font-bold text-slate-400">Petpooja</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {
                                    [
                                        ["AI Predictive Ordering", "Yes (Native)", "No / Third-party"],
                                        ["Premium Guest UI", "Yes (Magazine Style)", "Standard List View"],
                                        ["Setup Time", "15 Minutes", "48+ Hours"],
                                        ["Swiggy/Zomato Sync", "Included", "Add-on Cost"],
                                        ["Inventory Forecasting", "Yes (AI Driven)", "Manual Entry"]
                                    ].map(([label, tt, pp], i) => (
                                        <tr key={i}>
                                            <td className="py-6 font-medium text-slate-300">{label}</td>
                                            <td className="py-6 font-black">{tt}</td>
                                            <td className="py-6 text-slate-500">{pp}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
