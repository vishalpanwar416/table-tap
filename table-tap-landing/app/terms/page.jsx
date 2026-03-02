'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import siteConfig from '../data/site-config.json';
import { FileText, User, CreditCard, ShieldCheck, Scale, Clock, AlertTriangle, Gavel } from 'lucide-react';

export default function TermsOfService() {
    const sections = [
        {
            icon: FileText,
            title: "Description of Service",
            description: "Table Tap provides a QR-based digital ordering system for restaurants, including menu management, order processing, payment integration, and analytics features."
        },
        {
            icon: User,
            title: "User Accounts",
            items: ["You must provide accurate and complete registration information", "You are responsible for maintaining the security of your account", "You must notify us immediately of any unauthorized access", "One account per restaurant/business entity"]
        },
        {
            icon: CreditCard,
            title: "Subscription & Payments",
            items: ["Subscription fees are billed monthly or annually as selected", "All prices are in Indian Rupees (INR) and exclude GST (18%)", "Payment is due at the beginning of each billing cycle", "We reserve the right to modify pricing with 30 days notice", "Failed payments may result in service suspension"]
        },
        {
            icon: ShieldCheck,
            title: "Acceptable Use",
            description: "You agree not to:",
            items: ["Use the service for any illegal purposes", "Upload harmful, offensive, or inappropriate content", "Attempt to gain unauthorized access to our systems", "Resell or redistribute our services without permission", "Interfere with other users' access to the service"]
        },
        {
            icon: Scale,
            title: "Intellectual Property",
            description: "Table Tap and its original content, features, and functionality are owned by Table Tap and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of your content (menus, images, etc.) uploaded to our platform."
        },
        {
            icon: Clock,
            title: "Service Availability",
            description: "We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform scheduled maintenance with advance notice. We are not liable for any downtime or service interruptions."
        },
        {
            icon: AlertTriangle,
            title: "Limitation of Liability",
            description: "Table Tap shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our total liability shall not exceed the amount paid by you in the last 12 months."
        },
        {
            icon: Gavel,
            title: "Termination",
            description: "Either party may terminate the subscription with 30 days written notice. We may suspend or terminate accounts that violate these terms immediately. Upon termination, your data will be retained for 30 days before deletion."
        }
    ];

    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-100">
                <div className="container mx-auto px-4 sm:px-6 text-center">
                    <div className="w-16 h-16 bg-[#2A9D8F]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-[#2A9D8F]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">Terms of Service</h1>
                    <p className="text-slate-500">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </section>

            {/* Content */}
            <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Acceptance of Terms</h2>
                    <p className="text-slate-600 leading-relaxed text-lg">
                        By accessing or using Table Tap&apos;s services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
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

                <div className="mt-8 bg-slate-50 rounded-2xl p-8 border border-slate-100">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                            <Scale className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Governing Law</h3>
                            <p className="text-slate-600 leading-relaxed">
                                These terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in {siteConfig.legal.governingLawJurisdiction}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
