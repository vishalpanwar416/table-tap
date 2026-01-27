'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import data from '../data/landing-data.json';

const IconMap = {
    mail: Mail,
    phone: Phone,
    'map-pin': MapPin
};

const Contact = () => {
    const { contact } = data;
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', restaurant: '', message: '', plan: 'professional' });
    const [formStatus, setFormStatus] = useState('idle'); // idle, sending, success, error
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormStatus('sending');
        setError(null);

        try {
            const { error: submitError } = await supabase
                .from('landing_inquiries')
                .insert([{
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    restaurant_name: formData.restaurant,
                    message: formData.message,
                    interested_plan: formData.plan,
                    status: 'new'
                }]);

            if (submitError) throw submitError;

            setFormStatus('success');
            setFormData({ name: '', email: '', phone: '', restaurant: '', message: '', plan: 'professional' });
        } catch (err) {
            console.error('Submission error:', err);
            setError('Failed to send inquiry. Please try again.');
            setFormStatus('error');
        }
    };

    return (
        <section id="contact" className="py-64 relative bg-white overflow-hidden">
            {/* Background Aesthetic Section */}
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#2A9D8F]/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-32 items-start">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-3 bg-gray-900 text-white px-5 py-2 rounded-2xl mb-10"
                        >
                            <Sparkles size={16} className="text-[#2A9D8F]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">{contact.badge}</span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-12 leading-[0.85] tracking-tighter"
                        >
                            {contact.titlePrefix} <br />
                            <span className="gradient-text italic font-serif">{contact.titleHighlight}</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-500 text-2xl font-bold max-w-xl mb-20 leading-relaxed border-l-4 border-gray-100 pl-10"
                        >
                            {contact.description}
                        </motion.p>

                        <div className="space-y-12">
                            {contact.info.map((info, index) => {
                                const Icon = IconMap[info.type];
                                return (
                                    <motion.div
                                        key={info.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-8 group"
                                    >
                                        <div className="w-16 h-16 rounded-[24px] bg-[#0F172A] flex items-center justify-center text-[#2A9D8F] group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-xl shadow-gray-200">
                                            {Icon && <Icon size={28} />}
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">{info.label}</p>
                                            <p className="text-2xl font-black text-gray-900 tracking-tight">{info.value}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="glass p-16 rounded-[64px] relative border-white shadow-3xl overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />

                        {formStatus === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center py-20 relative z-10"
                            >
                                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-10">
                                    <CheckCircle className="text-emerald-500" size={48} />
                                </div>
                                <h3 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">{contact.form.successTitle}</h3>
                                <p className="text-gray-500 font-bold text-lg max-w-xs mb-10">{contact.form.successText}</p>
                                <button onClick={() => setFormStatus('idle')} className="btn-outline px-8 py-4 font-black">Send New Inquiry</button>
                            </motion.div>
                        ) : (
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black text-gray-900 mb-12 tracking-tight">{contact.form.title}</h3>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Full Name</label>
                                            <input
                                                type="text" placeholder="John Doe"
                                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-8 py-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900" required />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Email Address</label>
                                            <input
                                                type="email" placeholder="john@restaurant.com"
                                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-8 py-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900" required />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Restaurant Name</label>
                                        <input
                                            type="text" placeholder="The Pizza Hub"
                                            value={formData.restaurant} onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                                            className="w-full px-8 py-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900" required
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Message</label>
                                        <textarea
                                            rows={4}
                                            value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-white border border-gray-100 rounded-2xl px-8 py-5 text-gray-900 font-bold focus:ring-2 focus:ring-[#2A9D8F]/20 focus:outline-none transition-all placeholder:text-gray-300 resize-none"
                                            placeholder="Tell us about your needs..."
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                                            <AlertCircle size={16} /> {error}
                                        </div>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit" disabled={formStatus === 'sending'}
                                        className="btn-premium w-full py-6 text-xl rounded-2xl shadow-2xl shadow-[#2A9D8F]/20 flex items-center justify-center gap-4 group uppercase tracking-widest font-black"
                                    >
                                        {formStatus === 'sending' ? 'Sending Request...' : 'Send Request'}
                                        <div className="group-hover:translate-x-2 transition-transform">
                                            <Send size={22} />
                                        </div>
                                    </motion.button>
                                </form>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
