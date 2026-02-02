'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, FileText, User, CreditCard, ShieldCheck, Scale, Clock, AlertTriangle, Gavel, Mail, Phone } from 'lucide-react';

export default function TermsOfService() {
    const sections = [
        {
            icon: FileText,
            title: "Description of Service",
            color: "from-blue-400 to-blue-600",
            description: "Table Tap provides a QR-based digital ordering system for restaurants, including menu management, order processing, payment integration, and analytics features."
        },
        {
            icon: User,
            title: "User Accounts",
            color: "from-purple-400 to-purple-600",
            items: ["You must provide accurate and complete registration information", "You are responsible for maintaining the security of your account", "You must notify us immediately of any unauthorized access", "One account per restaurant/business entity"]
        },
        {
            icon: CreditCard,
            title: "Subscription & Payments",
            color: "from-green-400 to-green-600",
            items: ["Subscription fees are billed monthly or annually as selected", "All prices are in Indian Rupees (INR) and exclude GST (18%)", "Payment is due at the beginning of each billing cycle", "We reserve the right to modify pricing with 30 days notice", "Failed payments may result in service suspension"]
        },
        {
            icon: ShieldCheck,
            title: "Acceptable Use",
            color: "from-orange-400 to-orange-600",
            description: "You agree not to:",
            items: ["Use the service for any illegal purposes", "Upload harmful, offensive, or inappropriate content", "Attempt to gain unauthorized access to our systems", "Resell or redistribute our services without permission", "Interfere with other users' access to the service"]
        },
        {
            icon: Scale,
            title: "Intellectual Property",
            color: "from-teal-400 to-teal-600",
            description: "Table Tap and its original content, features, and functionality are owned by Table Tap and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of your content (menus, images, etc.) uploaded to our platform."
        },
        {
            icon: Clock,
            title: "Service Availability",
            color: "from-pink-400 to-pink-600",
            description: "We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform scheduled maintenance with advance notice. We are not liable for any downtime or service interruptions."
        },
        {
            icon: AlertTriangle,
            title: "Limitation of Liability",
            color: "from-red-400 to-red-600",
            description: "Table Tap shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our total liability shall not exceed the amount paid by you in the last 12 months."
        },
        {
            icon: Gavel,
            title: "Termination",
            color: "from-indigo-400 to-indigo-600",
            description: "Either party may terminate the subscription with 30 days written notice. We may suspend or terminate accounts that violate these terms immediately. Upon termination, your data will be retained for 30 days before deletion."
        }
    ];

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="bg-[#0F172A] text-white">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-[#2A9D8F] hover:text-[#3DBDAD] transition-all duration-300 p-2 -ml-2 rounded-full hover:bg-white/5"
                        >
                            <ChevronLeft size={28} />
                            <span className="font-medium">Back</span>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mt-8 pb-8"
                    >
                        <div className="w-16 h-16 bg-[#2A9D8F]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-8 h-8 text-[#2A9D8F]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3">Terms of Service</h1>
                        <p className="text-gray-400">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-12 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
                    <p className="text-gray-600 leading-relaxed text-lg">
                        By accessing or using Table Tap&apos;s services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                    </p>
                </motion.div>

                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shrink-0`}>
                                        <section.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 pt-2">{section.title}</h3>
                                </div>

                                {section.description && (
                                    <p className="text-gray-600 leading-relaxed mb-4">{section.description}</p>
                                )}

                                {section.items && (
                                    <ul className="space-y-2">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-600">
                                                <span className="w-1.5 h-1.5 bg-[#2A9D8F] rounded-full mt-2 shrink-0"></span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Governing Law */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="mt-8 bg-gray-100 rounded-2xl p-8 border border-gray-200"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
                            <Scale className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Governing Law</h3>
                            <p className="text-gray-600 leading-relaxed">
                                These terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="mt-8 bg-[#0F172A] rounded-3xl p-8 md:p-12 text-white"
                >
                    <h3 className="text-2xl font-bold mb-6">Questions?</h3>
                    <p className="text-gray-300 mb-6">For questions about these Terms of Service, contact us:</p>
                    <div className="flex flex-wrap gap-4">
                        <a href="mailto:vishalpanwar416@gmail.com" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <Mail className="w-5 h-5 text-[#2A9D8F]" />
                            <span className="text-sm">vishalpanwar416@gmail.com</span>
                        </a>
                        <a href="tel:+917500988212" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <Phone className="w-5 h-5 text-[#2A9D8F]" />
                            <span className="text-sm">+91 75009 88212</span>
                        </a>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
