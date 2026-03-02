'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Database, Eye, Lock, UserCheck, Cookie } from 'lucide-react';

export default function PrivacyPolicy() {
    const sections = [
        {
            icon: Database,
            title: "Information We Collect",
            content: [
                { subtitle: "Personal Information", items: ["Name and contact information (email, phone number)", "Restaurant details and business information", "Payment and billing information", "Order history and preferences"] },
                { subtitle: "Automatically Collected", items: ["Device information and browser type", "IP address and location data", "Usage data and analytics"] }
            ]
        },
        {
            icon: Eye,
            title: "How We Use Your Information",
            items: ["To provide and maintain our services", "To process orders and payments", "To communicate with you about updates and support", "To improve our platform and user experience", "To comply with legal obligations"]
        },
        {
            icon: UserCheck,
            title: "Data Sharing",
            description: "We do not sell your personal information. We may share your data with:",
            items: ["Payment processors (Razorpay, etc.) for transaction processing", "Cloud service providers for data storage", "Analytics providers to improve our services", "Legal authorities when required by law"]
        },
        {
            icon: Lock,
            title: "Data Security",
            description: "We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your data. However, no method of transmission over the internet is 100% secure."
        },
        {
            icon: Shield,
            title: "Your Rights",
            items: ["Access your personal data", "Correct inaccurate data", "Request deletion of your data", "Opt-out of marketing communications", "Data portability"]
        },
        {
            icon: Cookie,
            title: "Cookies",
            description: "We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookie preferences through your browser settings."
        }
    ];

    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-100">
                <div className="container mx-auto px-4 sm:px-6 text-center">
                    <div className="w-16 h-16 bg-[#2A9D8F]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-[#2A9D8F]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">Privacy Policy</h1>
                    <p className="text-slate-500">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </section>

            {/* Content */}
            <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
                    <p className="text-slate-600 leading-relaxed text-lg">
                        Table Tap (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our QR-based restaurant ordering platform.
                    </p>
                </div>

                <div className="space-y-6">
                    {sections.map((section) => (
                        <div
                            key={section.title}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center shrink-0">
                                        <section.icon className="w-6 h-6 text-[#2A9D8F]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 pt-2">{section.title}</h3>
                                </div>

                                {section.description && (
                                    <p className="text-slate-600 leading-relaxed mb-4">{section.description}</p>
                                )}

                                {section.content && section.content.map((sub, i) => (
                                    <div key={i} className="mb-4">
                                        <h4 className="font-semibold text-slate-800 mb-2">{sub.subtitle}</h4>
                                        <ul className="space-y-2">
                                            {sub.items.map((item, j) => (
                                                <li key={j} className="flex items-start gap-3 text-slate-600">
                                                    <span className="w-1.5 h-1.5 bg-[#2A9D8F] rounded-full mt-2 shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                                {section.items && (
                                    <ul className="space-y-2">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-600">
                                                <span className="w-1.5 h-1.5 bg-[#2A9D8F] rounded-full mt-2 shrink-0"></span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </main>
    );
}
