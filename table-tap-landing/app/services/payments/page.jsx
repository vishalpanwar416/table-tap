import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { CreditCard, ShieldCheck, Zap, Smartphone } from 'lucide-react';

export const metadata = {
    title: "Seamless Contactless Payments for Restaurants | Table Tap",
    description: "Accept UPI, Cards, and Net Banking directly from your QR menu. Table Tap's integrated payment system reduces checkout friction and speeds up table turnover.",
    keywords: ["restaurant contactless payments", "UPI payment for restaurants India", "QR code payment system", "digital billing for restaurants"]
};

export default function PaymentsSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-blue-50 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 font-bold text-sm mb-6 uppercase tracking-widest border border-blue-200">
                        Unified Payments
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
                        Payments as Smooth <br />
                        <span className="text-blue-600">as Your Service.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Eliminate the "bill-please" wait time. Let your guests pay instantly via UPI or cards directly from their phone. Fast, secure, and automatically synced with your dashboard.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all shadow-2xl">Enable Digital Payments</button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Smartphone className="text-blue-600" />, title: "UPI Ready", desc: "Native support for GPay, PhonePe, and Paytm ensures zero friction." },
                            { icon: <ShieldCheck className="text-blue-600" />, title: "Secure & PCI", desc: "Enterprise-grade encryption for all card transactions." },
                            { icon: <Zap className="text-blue-600" />, title: "Instant Settlement", desc: "Get your funds settled directly into your bank account." },
                            { icon: <CreditCard className="text-blue-600" />, title: "Digital Bills", desc: "Automated GST-compliant invoices sent directly to customer WhatsApp/Email." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-500/30 transition-all">
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
