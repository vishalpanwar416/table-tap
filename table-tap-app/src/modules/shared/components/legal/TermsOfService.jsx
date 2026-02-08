import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Scale, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "1. Acceptance of Terms",
            content: "By accessing or using Table Tap, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services."
        },
        {
            title: "2. Description of Service",
            content: "Table Tap provides a digital ordering and management platform for restaurants and their customers, including QR-based menus, order tracking, and payment processing."
        },
        {
            title: "3. User Accounts",
            content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use."
        },
        {
            title: "4. Restaurant Use",
            content: "Restaurants using Table Tap are responsible for the accuracy of their menus, pricing, and fulfillment of orders. Table Tap is a platform and not a party to the transaction between the restaurant and the customer."
        },
        {
            title: "5. Payments",
            content: "Payments made through Table Tap are processed by third-party providers. You agree to provide accurate payment information and authorize us to charge the specified amounts."
        },
        {
            title: "6. Prohibited Conduct",
            content: "Users may not use the service for any illegal purposes, to transmit harmful code, or to interfere with the integrity or performance of the platform."
        },
        {
            title: "7. Limitation of Liability",
            content: "To the maximum extent permitted by law, Table Tap shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the service."
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
                        <h1 className="text-2xl font-bold">Terms of Service</h1>
                        <p className="text-gray-400 text-sm">Last updated: February 2026</p>
                    </div>
                    <div className="ml-auto w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                        <FileText className="text-orange-500" size={20} />
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 px-6 py-10"
                >
                    <div className="prose prose-invert max-w-none space-y-12">
                        <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <p className="text-gray-300 leading-relaxed italic">
                                Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Table Tap mobile application and website operated by Table Tap ("us", "we", or "our").
                            </p>
                        </div>

                        {sections.map((section, index) => (
                            <motion.section
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="space-y-4"
                            >
                                <h2 className="text-xl font-bold text-orange-500 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-sm">
                                        {index + 1}
                                    </span>
                                    {section.title}
                                </h2>
                                <p className="text-gray-300 leading-relaxed pl-11">
                                    {section.content}
                                </p>
                            </motion.section>
                        ))}

                        <div className="pt-10 border-t border-white/10 text-center text-gray-400 text-sm pb-20">
                            <p>&copy; 2026 Table Tap. All rights reserved.</p>
                            <p className="mt-2 text-xs">For any legal inquiries, please contact legal@table-tap.in</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsOfService;
