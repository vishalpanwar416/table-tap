'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import data from '../data/landing-data.json';
import { useSettings } from '../context/SettingsContext';

const IconMap = {
    mail: Mail,
    phone: Phone,
    'map-pin': MapPin
};

const Contact = () => {
    const { contact: localContact } = data;
    const { company, loading } = useSettings();

    // Override with database settings if available
    const contact = {
        ...localContact,
        info: localContact.info.map(item => {
            if (!company) return item;
            if (item.type === 'mail' && company.email) return { ...item, value: company.email };
            if (item.type === 'phone' && company.phone) return { ...item, value: company.phone };
            if (item.type === 'map-pin' && company.address) {
                const fullAddress = `${company.address}, ${company.city}, ${company.state} - ${company.pincode}`;
                return { ...item, value: fullAddress };
            }
            return item;
        })
    };
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
        <section id="contact" aria-labelledby="contact-heading" className="py-8 sm:py-16 md:py-24 relative bg-white overflow-hidden">
            {/* Background - smaller on mobile */}
            <div className="absolute bottom-0 right-0 w-[300px] sm:w-[600px] md:w-[800px] h-[300px] sm:h-[600px] md:h-[800px] bg-[#2A9D8F]/5 rounded-full blur-[80px] sm:blur-[120px] translate-x-1/4 sm:translate-x-1/3 translate-y-1/4 sm:translate-y-1/3" />

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-full">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-20 md:gap-32 items-start">
                    <div className="w-full">
                        <div className="inline-flex items-center gap-2 sm:gap-3 bg-gray-900 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl mb-4 sm:mb-10">
                            <Sparkles size={12} className="sm:w-4 sm:h-4 text-[#2A9D8F]" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">{contact.badge}</span>
                        </div>
                        <h2
                            id="contact-heading"
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 mb-4 sm:mb-12 leading-[1.1] sm:leading-[0.85] tracking-tighter"
                        >
                            {contact.titlePrefix} <br className="hidden sm:block" />
                            <span className="gradient-text italic font-serif ml-1 sm:ml-0">{contact.titleHighlight}</span>
                        </h2>
                        <p className="text-gray-500 text-sm sm:text-lg md:text-2xl font-bold max-w-xl mb-6 sm:mb-10 leading-relaxed border-l-2 sm:border-l-4 border-gray-100 pl-4 sm:pl-10">
                            {contact.description}
                        </p>

                        <div className="space-y-4 sm:space-y-8">
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
                                        className={`flex items-center gap-3 sm:gap-5 group animate-fade-in-up min-h-[44px] sm:min-h-[48px] py-1 sm:py-2 ${isClickable ? 'cursor-pointer' : ''}`}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                        aria-label={`${info.label}: ${info.value}`}
                                    >
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#2A9D8F]/10 flex items-center justify-center text-[#2A9D8F] group-hover:bg-[#2A9D8F] group-hover:text-white transition-all duration-300 shrink-0">
                                            {Icon && <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5">{info.label}</p>
                                            <p className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-[#2A9D8F] transition-colors break-words">{info.value}</p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div className="glass p-5 sm:p-10 md:p-16 rounded-2xl sm:rounded-[48px] md:rounded-[64px] relative border-white shadow-3xl overflow-hidden animate-fade-in-up mt-4 sm:mt-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />

                        {formStatus === 'success' ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12 sm:py-20 relative z-10">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-6 sm:mb-10">
                                    <CheckCircle className="text-emerald-500 w-12 h-12 sm:w-[48px] sm:h-[48px]" />
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">{contact.form.successTitle}</h3>
                                <p className="text-gray-500 font-bold text-base sm:text-lg max-w-xs mb-8 sm:mb-10">{contact.form.successText}</p>
                                <button onClick={() => setFormStatus('idle')} className="btn-outline px-6 sm:px-8 py-3 sm:py-4 font-black min-h-[48px]">Send New Inquiry</button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 sm:mb-4 tracking-tight">
                                    Send us a Message
                                </h3>
                                <p className="text-gray-500 font-bold text-sm sm:text-lg mb-6 sm:mb-10">
                                    We'd love to hear from you!
                                </p>
                                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8" aria-label="Contact form for demo request">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                        <div className="space-y-1.5 sm:space-y-3">
                                            <label htmlFor="contact-name" className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Full Name</label>
                                            <input
                                                id="contact-name"
                                                type="text" placeholder="Your name"
                                                autoComplete="name"
                                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-5 bg-white border border-gray-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]" required />
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-3">
                                            <label htmlFor="contact-email" className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Email Address</label>
                                            <input
                                                id="contact-email"
                                                type="email" placeholder="Your email"
                                                autoComplete="email"
                                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-5 bg-white border border-gray-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]" required />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-3">
                                        <label htmlFor="contact-restaurant" className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Restaurant Name</label>
                                        <input
                                            id="contact-restaurant"
                                            type="text" placeholder="Your restaurant name"
                                            autoComplete="organization"
                                            value={formData.restaurant} onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                                            className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-5 bg-white border border-gray-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5 sm:space-y-3">
                                        <label htmlFor="contact-message" className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Message</label>
                                        <textarea
                                            id="contact-message"
                                            rows={4}
                                            value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-white border border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-gray-900 font-bold text-sm sm:text-base focus:ring-2 focus:ring-[#2A9D8F]/20 focus:outline-none transition-all placeholder:text-gray-300 resize-none min-h-[100px] sm:min-h-[120px]"
                                            placeholder="Your message"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                                            <AlertCircle size={16} /> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit" disabled={formStatus === 'sending'}
                                        className="btn-premium w-full py-3 sm:py-5 md:py-6 text-sm sm:text-lg md:text-xl rounded-xl sm:rounded-2xl shadow-2xl shadow-[#2A9D8F]/20 flex items-center justify-center gap-2 sm:gap-4 group uppercase tracking-widest font-black hover:scale-[1.02] active:scale-[0.98] transition-transform min-h-[44px] sm:min-h-[48px]"
                                    >
                                        {formStatus === 'sending' ? 'Sending...' : 'Send Request'}
                                        <div className="group-hover:translate-x-2 transition-transform">
                                            <Send size={18} className="sm:w-[22px] sm:h-[22px]" />
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
