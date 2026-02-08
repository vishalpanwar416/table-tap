import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { LayoutGrid, Users, ClipboardCheck, BarChart2 } from 'lucide-react';

export const metadata = {
    title: "All-in-One Restaurant Management Software | Table Tap",
    description: "Simplified restaurant management with Table Tap. Handle orders, staff, inventory, and customer feedback from a single, intuitive platform.",
    keywords: ["restaurant management system", "restaurant software India", "cloud restaurant management", "digital restaurant operations"]
};

export default function RestaurantManagement() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-slate-50 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <span className="inline-block px-4 py-2 rounded-full bg-[#2A9D8F]/10 text-[#2A9D8F] font-bold text-sm mb-6 uppercase tracking-widest border border-[#2A9D8F]/20">
                            Complete Operatonal Control
                        </span>
                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
                            Manage Smarter, <br />
                            <span className="text-[#2A9D8F]">Grow Faster.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                            Table Tap is more than just a QR menu. It's a comprehensive restaurant management system that streamlines your entire operation, from the moment a guest sits down to the final checkout.
                        </p>
                        <div className="flex flex-wrap justify-center gap-5">
                            <button className="btn-premium px-10">See How It Works</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Modules */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">One Platform, Every Department.</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">We've modularized restaurant management to give you exactly what you need.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: <LayoutGrid className="text-[#2A9D8F]" />, title: "Order Tracking", desc: "Monitor every table's order status, prep time, and service speed in real-time." },
                            { icon: <Users className="text-[#2A9D8F]" />, title: "Staff Control", desc: "Manage permissions and see server performance metrics instantly." },
                            { icon: <ClipboardCheck className="text-[#2A9D8F]" />, title: "Inventory", desc: "Low-stock alerts and automated deductions as orders are served." },
                            { icon: <BarChart2 className="text-[#2A9D8F]" />, title: "Live Reporting", desc: "Daily sales summaries and profit analytics delivered to your phone." }
                        ].map((module, i) => (
                            <div key={i} className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group">
                                <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                                    {module.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{module.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{module.desc}</p>
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
