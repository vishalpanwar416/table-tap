'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, Shield, Database, Eye, Lock, UserCheck, Cookie, Mail, Phone, MapPin } from 'lucide-react';

export default function PrivacyPolicy() {
    const sections = [
        {
            icon: Database,
            title: "Information We Collect",
            color: "from-blue-400 to-blue-600",
            content: [
                { subtitle: "Personal Information", items: ["Name and contact information (email, phone number)", "Restaurant details and business information", "Payment and billing information", "Order history and preferences"] },
                { subtitle: "Automatically Collected", items: ["Device information and browser type", "IP address and location data", "Usage data and analytics"] }
            ]
        },
        {
            icon: Eye,
            title: "How We Use Your Information",
            color: "from-purple-400 to-purple-600",
            items: ["To provide and maintain our services", "To process orders and payments", "To communicate with you about updates and support", "To improve our platform and user experience", "To comply with legal obligations"]
        },
        {
            icon: UserCheck,
            title: "Data Sharing",
            color: "from-green-400 to-green-600",
            description: "We do not sell your personal information. We may share your data with:",
            items: ["Payment processors (Razorpay, etc.) for transaction processing", "Cloud service providers for data storage", "Analytics providers to improve our services", "Legal authorities when required by law"]
        },
        {
            icon: Lock,
            title: "Data Security",
            color: "from-orange-400 to-orange-600",
            description: "We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your data. However, no method of transmission over the internet is 100% secure."
        },
        {
            icon: Shield,
            title: "Your Rights",
            color: "from-teal-400 to-teal-600",
            items: ["Access your personal data", "Correct inaccurate data", "Request deletion of your data", "Opt-out of marketing communications", "Data portability"]
        },
        {
            icon: Cookie,
            title: "Cookies",
            color: "from-pink-400 to-pink-600",
            description: "We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookie preferences through your browser settings."
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
                            <Shield className="w-8 h-8 text-[#2A9D8F]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3">Privacy Policy</h1>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                    <p className="text-gray-600 leading-relaxed text-lg">
                        Table Tap ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our QR-based restaurant ordering platform.
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
                                
                                {section.content && section.content.map((sub, i) => (
                                    <div key={i} className="mb-4">
                                        <h4 className="font-semibold text-gray-800 mb-2">{sub.subtitle}</h4>
                                        <ul className="space-y-2">
                                            {sub.items.map((item, j) => (
                                                <li key={j} className="flex items-start gap-3 text-gray-600">
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

                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-8 bg-[#0F172A] rounded-3xl p-8 md:p-12 text-white"
                >
                    <h3 className="text-2xl font-bold mb-6">Contact Us</h3>
                    <p className="text-gray-300 mb-6">If you have questions about this Privacy Policy, please contact us:</p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <a href="mailto:vishalpanwar416@gmail.com" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <Mail className="w-5 h-5 text-[#2A9D8F]" />
                            <span className="text-sm">vishalpanwar416@gmail.com</span>
                        </a>
                        <a href="tel:+917500988212" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <Phone className="w-5 h-5 text-[#2A9D8F]" />
                            <span className="text-sm">+91 75009 88212</span>
                        </a>
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                            <MapPin className="w-5 h-5 text-[#2A9D8F]" />
                            <span className="text-sm">Hyderabad, India</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
