import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { LayoutDashboard, Users, Clock, ShoppingBag } from 'lucide-react';

export const metadata = {
    title: "All-in-One Restaurant POS & Dashboard | Table Tap",
    description: "Manage your entire restaurant operation from one unified dashboard. Track live orders, manage staff, and view real-time analytics with Table Tap POS.",
    keywords: ["restaurant pos system", "cloud-based pos india", "order management dashboard", "restaurant operations software"]
};

export default function POSSolution() {
    return (
        <main className="min-h-screen bg-slate-50">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-indigo-600 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 transform translate-x-1/2" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-white font-bold text-sm mb-6 uppercase tracking-widest border border-white/20">
                            Centralized Command Center
                        </span>
                        <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1]">
                            Your Entire Restaurant, <br />
                            <span className="text-indigo-200">One Dashboard.</span>
                        </h1>
                        <p className="text-xl text-indigo-100 mb-12 leading-relaxed max-w-2xl font-medium">
                            Table Tap's cloud-based POS gives you a bird's eye view of your business. Manage multiple outlets, track live table statuses, and oversee staff performance from anywhere in the world.
                        </p>
                        <div className="flex flex-wrap gap-5">
                            <button className="px-10 py-5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-bold transition-all shadow-xl">Get Your Free Demo</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <LayoutDashboard className="text-indigo-600" />, title: "Live Monitoring", desc: "Watch orders flow from table to kitchen in real-time." },
                            { icon: <Users className="text-indigo-600" />, title: "Staff Management", desc: "Assign roles, track attendance, and monitor server speed." },
                            { icon: <ShoppingBag className="text-indigo-600" />, title: "Inventory Sync", desc: "Automatically deduct stock as orders are placed." },
                            { icon: <Clock className="text-indigo-600" />, title: "Table Matrix", desc: "Visual representation of your floor plan with live statuses." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all">
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
