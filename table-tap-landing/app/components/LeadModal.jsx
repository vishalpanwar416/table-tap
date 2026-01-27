'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useModal } from '../context/ModalContext';

const LeadModal = () => {
    const { isModalOpen, closeModal, initialPlan } = useModal();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', restaurant: '', message: '', plan: initialPlan });
    const [formStatus, setFormStatus] = useState('idle'); // idle, sending, success, error
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isModalOpen) {
            setFormData(prev => ({ ...prev, plan: initialPlan }));
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isModalOpen, initialPlan]);

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

            // Auto close after success? Maybe wait for user to close.
        } catch (err) {
            console.error('Submission error:', err);
            setError('Failed to send inquiry. Please try again.');
            setFormStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isModalOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl relative flex flex-col">
                            {/* Header */}
                            <div className="px-8 pt-8 pb-4 flex justify-between items-start bg-white z-10 sticky top-0">
                                <div>
                                    <div className="inline-flex items-center gap-2 bg-[#2A9D8F]/10 px-3 py-1 rounded-full mb-3">
                                        <Sparkles size={12} className="text-[#2A9D8F]" />
                                        <span className="text-[#2A9D8F] text-[10px] font-black uppercase tracking-widest">Join the Journey</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">Get Started</h3>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 pt-0">
                                {formStatus === 'success' ? (
                                    <div className="flex flex-col items-center justify-center text-center py-10">
                                        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                                            <CheckCircle className="text-emerald-500" size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Request Received!</h3>
                                        <p className="text-gray-500 font-bold max-w-xs mb-8">
                                            We'll be in touch shortly to help you transform your restaurant experience.
                                        </p>
                                        <button
                                            onClick={closeModal}
                                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-2">Full Name</label>
                                            <input
                                                type="text" placeholder="John Doe"
                                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900 text-sm" required />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-2">Email</label>
                                                <input
                                                    type="email" placeholder="john@example.com"
                                                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900 text-sm" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-2">Phone</label>
                                                <input
                                                    type="tel" placeholder="+91 98..."
                                                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900 text-sm" required />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-2">Restaurant Name</label>
                                            <input
                                                type="text" placeholder="The Good Place"
                                                value={formData.restaurant} onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900 text-sm" required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-2">Message (Optional)</label>
                                            <textarea
                                                rows={3}
                                                value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] transition-all font-bold text-gray-900 text-sm resize-none"
                                                placeholder="Any specific requirements?"
                                            />
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
                                                <AlertCircle size={14} /> {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit" disabled={formStatus === 'sending'}
                                            className="w-full py-5 bg-[#2A9D8F] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-[#2A9D8F]/30 hover:bg-[#21867a] hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                                        >
                                            {formStatus === 'sending' ? 'Sending...' : 'Submit Request'}
                                            {!formStatus.includes('sending') && <Send size={16} className="group-hover:translate-x-1 transition-transform" />}
                                        </button>

                                        <p className="text-center text-[10px] text-gray-400 font-bold">
                                            By submitting, you agree to our Terms & Privacy Policy.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LeadModal;
