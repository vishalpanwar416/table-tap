'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
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
    const [formStatus, setFormStatus] = useState('idle');
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
        <section id="contact" aria-labelledby="contact-heading" className="py-24 relative bg-white overflow-hidden">
            {/* Background */}
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#2A9D8F]/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-32 items-start">
                    <div>
                        <div className="inline-flex items-center gap-3 bg-gray-900 text-white px-5 py-2 rounded-2xl mb-10">
                            <Sparkles size={16} className="text-[#2A9D8F]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">{contact.badge}</span>
                        </div>
                        <h2
                            id="contact-heading"
                            className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-12 leading-[0.85] tracking-tighter"
                        >
                            {contact.titlePrefix} <br />
                            <span className="gradient-text italic font-serif">{contact.titleHighlight}</span>
                        </h2>
                        <p className="text-gray-500 text-2xl font-bold max-w-xl mb-10 leading-relaxed border-l-4 border-gray-100 pl-10">
                            {contact.description}
                        </p>

                        <div className="space-y-8">
                            {contact.info.map((info, index) => {
                                const Icon = IconMap[info.type];
                                
                                const getHref = () => {
                                    if (info.type === 'mail') return `mailto:${info.value}`;
                                    if (info.type === 'phone') return `tel:${info.value.replace(/\s/g, '')}`;
                                    if (info.type === 'map-pin') return `https://maps.google.com/?q=${encodeURIComponent(info.value)}`;
                                    return '#';
                                };

                                const isClickable = info.type === 'mail' || info.type === 'phone' || info.type === 'map-pin';

                                return (
                                    <a
                                        key={info.label}
                                        href={getHref()}
                                        target={info.type === 'map-pin' ? '_blank' : undefined}
                                        rel={info.type === 'map-pin' ? 'noopener noreferrer' : undefined}
                                        className={`flex items-center gap-5 group animate-fade-in-up ${isClickable ? 'cursor-pointer' : ''}`}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                        aria-label={`${info.label}: ${info.value}`}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[#2A9D8F]/10 flex items-center justify-center text-[#2A9D8F] group-hover:bg-[#2A9D8F] group-hover:text-white transition-all duration-300">
                                            {Icon && <Icon size={22} />}
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">{info.label}</p>
                                            <p className="text-lg font-semibold text-gray-900 group-hover:text-[#2A9D8F] transition-colors">{info.value}</p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div className="glass p-16 rounded-[64px] relative border-white shadow-3xl overflow-hidden animate-fade-in-up">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />

                        {formStatus === 'success' ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 relative z-10">
                                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-10">
                                    <CheckCircle className="text-emerald-500" size={48} />
                                </div>
                                <h3 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">{contact.form.successTitle}</h3>
                                <p className="text-gray-500 font-bold text-lg max-w-xs mb-10">{contact.form.successText}</p>
                                <button onClick={() => setFormStatus('idle')} className="btn-outline px-8 py-4 font-black">Send New Inquiry</button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black text-gray-900 mb-12 tracking-tight">{contact.form.title}</h3>
                                <form onSubmit={handleSubmit} className="space-y-8" aria-label="Contact form for demo request">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label htmlFor="contact-name" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Full Name</label>
                                            <input
                                                id="contact-name"
                                                type="text" placeholder="Your name"
                                                autoComplete="name"
                                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-8 py-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900" required />
                                        </div>
                                        <div className="space-y-3">
                                            <label htmlFor="contact-email" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Email Address</label>
                                            <input
                                                id="contact-email"
                                                type="email" placeholder="Your email"
                                                autoComplete="email"
                                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-8 py-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900" required />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="contact-restaurant" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Restaurant Name</label>
                                        <input
                                            id="contact-restaurant"
                                            type="text" placeholder="Your restaurant name"
                                            autoComplete="organization"
                                            value={formData.restaurant} onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                                            className="w-full px-8 py-5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900" required
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label htmlFor="contact-message" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Message</label>
                                        <textarea
                                            id="contact-message"
                                            rows={4}
                                            value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-white border border-gray-100 rounded-2xl px-8 py-5 text-gray-900 font-bold focus:ring-2 focus:ring-[#2A9D8F]/20 focus:outline-none transition-all placeholder:text-gray-300 resize-none"
                                            placeholder="Your message"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                                            <AlertCircle size={16} /> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit" disabled={formStatus === 'sending'}
                                        className="btn-premium w-full py-6 text-xl rounded-2xl shadow-2xl shadow-[#2A9D8F]/20 flex items-center justify-center gap-4 group uppercase tracking-widest font-black hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                    >
                                        {formStatus === 'sending' ? 'Sending Request...' : 'Send Request'}
                                        <div className="group-hover:translate-x-2 transition-transform">
                                            <Send size={22} />
                                        </div>
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
