import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Lock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "1. Information We Collect",
            content: "We collect information you provide directly to us, such as your name, email address, phone number, and restaurant details. We also collect automated data like IP addresses, browser types, and order history."
        },
        {
            title: "2. How We Use Your Data",
            content: "Your data is used to provide and improve our services, process payments, send notifications about your orders, and ensure the security of our platform."
        },
        {
            title: "3. Sharing of Information",
            content: "We do not sell your personal data. We share information with restaurants you order from and third-party service providers (like payment processors) necessary to fulfill your requests."
        },
        {
            title: "4. Data Security",
            content: "We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security."
        },
        {
            title: "5. Your Rights",
            content: "You have the right to access, correct, or delete your personal information. You can manage most of this directly through your account settings or by contacting our support team."
        },
        {
            title: "6. Cookies",
            content: "We use cookies to enhance your experience, remember your preferences, and analyze how our service is used. You can control cookie settings through your browser."
        },
        {
            title: "7. Third-Party Services",
            content: "We use trusted third-party services to operate and improve our platform. These include Vercel Analytics (for performance monitoring), Sentry (for error tracking), Razorpay (for secure payments), Meta/WhatsApp (for notifications), and Resend (for emails). Each provider processes data according to their own privacy policies."
        },
        {
            title: "8. Changes to This Policy",
            content: "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'last updated' date."
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white font-spartan lg:p-10">
            <div className="max-w-[390px] md:max-w-4xl lg:max-w-5xl mx-auto flex flex-col h-full">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl px-6 py-8 flex items-center border-b border-white/10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-orange-500 hover:bg-orange-500/10 rounded-full transition-colors"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <div className="ml-4">
                        <h1 className="text-2xl font-bold">Privacy Policy</h1>
                        <p className="text-gray-400 text-sm">Last updated: February 2026</p>
                    </div>
                    <div className="ml-auto w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                        <ShieldCheck className="text-orange-500" size={20} />
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 px-6 py-10"
                >
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-orange-500/5 rounded-3xl border border-orange-500/10 flex items-start gap-4">
                                <Lock className="text-orange-500 shrink-0" size={24} />
                                <div>
                                    <h3 className="font-bold mb-1">Secure by Design</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">Your data is encrypted both in transit and at rest using banking-grade security.</p>
                                </div>
                            </div>
                            <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-start gap-4">
                                <Eye className="text-blue-500 shrink-0" size={24} />
                                <div>
                                    <h3 className="font-bold mb-1">Transparent Usage</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">We are clear about what we collect and why. No hidden tracking, no data selling.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {sections.map((section, index) => (
                                <motion.section
                                    key={index}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative group lg:border-l-2 lg:border-white/5 lg:pl-8 lg:hover:border-orange-500/30 transition-colors"
                                >
                                    <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <div className="hidden lg:block absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-zinc-900 border-2 border-white/10 group-hover:border-orange-500 transition-colors" />
                                        {section.title}
                                    </h2>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {section.content}
                                    </p>
                                </motion.section>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-white/10 text-center text-gray-500 text-sm pb-20">
                            <p>For privacy-related requests, please email privacy@table-tap.in</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
