'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    User,
    CreditCard,
    Check,
    MapPin,
    Phone,
    Mail,
    Clock,
    Utensils,
    Users,
    Sparkles,
    Shield,
    AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const plans = {
    starter: {
        name: 'Starter',
        price: 999,
        features: ['Up to 15 Tables', 'QR Menu & Ordering', 'Order Management', 'Basic Analytics', 'Email Support']
    },
    professional: {
        name: 'Professional',
        price: 1999,
        features: ['Unlimited Tables', 'Swiggy & Zomato Sync', 'Staff Management', 'Inventory Tracking', 'AI Analytics', 'Offers & Promotions', 'Priority Support']
    },
    enterprise: {
        name: 'Enterprise',
        price: null,
        features: ['Multi-Location Support', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'On-Site Training', 'White-Label Options']
    }
};

function RegisterForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const selectedPlanId = searchParams.get('plan') || 'professional';
    const billingCycle = searchParams.get('billing') || 'monthly';

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        // Owner Details
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        password: '',
        confirmPassword: '',

        // Restaurant Details
        restaurantName: '',
        restaurantType: '',  // cuisine_type
        description: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        seatingCapacity: '',
        openingHours: '',
        closingHours: '',

        // Legal & Compliance
        gstNumber: '',
        fssaiLicense: '',

        // Optional
        googleMapsLink: '',

        // Plan
        plan: selectedPlanId,
        billingCycle: billingCycle
    });

    const steps = [
        { id: 1, title: 'Owner Details', icon: User },
        { id: 2, title: 'Restaurant Info', icon: Building2 },
        { id: 3, title: 'Review & Submit', icon: Check }
    ];

    const plan = plans[formData.plan] || plans.professional;
    const price = plan.price ? (formData.billingCycle === 'yearly' ? Math.floor(plan.price * 12 * 0.75) : plan.price) : 'Custom';
    const gst = plan.price ? Math.round(price * 0.18) : 0;
    const total = plan.price ? price + gst : 'Custom';

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.ownerName || !formData.ownerEmail || !formData.ownerPhone || !formData.password) {
                    setError('Please fill in all required fields');
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    return false;
                }
                if (formData.password.length < 6) {
                    setError('Password must be at least 6 characters');
                    return false;
                }
                break;
            case 2:
                if (!formData.restaurantName || !formData.restaurantType || !formData.address || !formData.city || !formData.state || !formData.pincode) {
                    setError('Please fill in all required fields');
                    return false;
                }
                break;
        }
        setError(null);
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Submit registration request to Supabase
            const { data, error: submitError } = await supabase
                .from('restaurant_registrations')
                .insert([{
                    // Owner Info
                    owner_name: formData.ownerName,
                    owner_email: formData.ownerEmail,
                    owner_phone: formData.ownerPhone,

                    // Restaurant Info
                    restaurant_name: formData.restaurantName,
                    restaurant_type: formData.restaurantType,
                    description: formData.description || null,
                    address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    seating_capacity: formData.seatingCapacity ? parseInt(formData.seatingCapacity) : null,
                    opening_hours: formData.openingHours && formData.closingHours
                        ? `${formData.openingHours} - ${formData.closingHours}`
                        : null,

                    // Legal & Compliance
                    gst_number: formData.gstNumber || null,
                    fssai_license: formData.fssaiLicense || null,
                    google_maps_link: formData.googleMapsLink || null,

                    // Plan Info
                    selected_plan: formData.plan,
                    billing_cycle: formData.billingCycle,
                    plan_price: plan.price,
                    gst_amount: gst,
                    total_amount: total,

                    // Status
                    status: 'pending_review',
                    created_at: new Date().toISOString()
                }]);

            if (submitError) throw submitError;

            setSuccess(true);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to submit registration. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[48px] p-16 max-w-lg text-center shadow-2xl"
                >
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Check className="text-emerald-500" size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Registration Submitted!</h1>
                    <p className="text-gray-500 font-bold mb-8 leading-relaxed">
                        Thank you for choosing Table Tap! Our team will review your application and get back to you within 24-48 hours.
                    </p>
                    <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                        <p className="text-sm text-gray-500 font-bold">Selected Plan</p>
                        <p className="text-2xl font-black text-gray-900">{plan.name}</p>
                        {plan.price && (
                            <p className="text-[#2A9D8F] font-bold">₹{total}/{formData.billingCycle === 'monthly' ? 'mo' : 'yr'} (incl. GST)</p>
                        )}
                    </div>
                    <Link
                        href="/"
                        className="btn-premium inline-flex items-center gap-3 px-8 py-4"
                    >
                        Back to Home <ArrowRight size={20} />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Table Tap" width={140} height={56} className="h-12 w-auto" />
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                        <ArrowLeft size={18} /> Back to Home
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12">
                <div className="max-w-6xl mx-auto">
                    {/* Progress Steps */}
                    <div className="mb-12">
                        <div className="flex items-center justify-center gap-4">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${currentStep === step.id
                                        ? 'bg-[#2A9D8F] text-white shadow-xl shadow-[#2A9D8F]/20'
                                        : currentStep > step.id
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        <step.icon size={20} />
                                        <span className="font-black text-sm uppercase tracking-wider hidden md:block">{step.title}</span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-12 h-1 mx-2 rounded-full ${currentStep > step.id ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Form Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[48px] p-10 shadow-xl border border-gray-100">
                                <AnimatePresence mode="wait">
                                    {/* Step 1: Owner Details */}
                                    {currentStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-14 h-14 bg-[#2A9D8F]/10 rounded-2xl flex items-center justify-center">
                                                    <User className="text-[#2A9D8F]" size={28} />
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Owner Details</h2>
                                                    <p className="text-gray-500 font-bold">Tell us about yourself</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Full Name *</label>
                                                    <input
                                                        type="text"
                                                        name="ownerName"
                                                        value={formData.ownerName}
                                                        onChange={handleInputChange}
                                                        placeholder="Rajesh Kumar"
                                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Email *</label>
                                                        <input
                                                            type="email"
                                                            name="ownerEmail"
                                                            value={formData.ownerEmail}
                                                            onChange={handleInputChange}
                                                            placeholder="you@restaurant.com"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Phone *</label>
                                                        <input
                                                            type="tel"
                                                            name="ownerPhone"
                                                            value={formData.ownerPhone}
                                                            onChange={handleInputChange}
                                                            placeholder="+91 98765 43210"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Password *</label>
                                                        <input
                                                            type="password"
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleInputChange}
                                                            placeholder="••••••••"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Confirm Password *</label>
                                                        <input
                                                            type="password"
                                                            name="confirmPassword"
                                                            value={formData.confirmPassword}
                                                            onChange={handleInputChange}
                                                            placeholder="••••••••"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 2: Restaurant Details */}
                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-14 h-14 bg-[#2A9D8F]/10 rounded-2xl flex items-center justify-center">
                                                    <Building2 className="text-[#2A9D8F]" size={28} />
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Restaurant Info</h2>
                                                    <p className="text-gray-500 font-bold">Tell us about your restaurant</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Restaurant Name *</label>
                                                        <input
                                                            type="text"
                                                            name="restaurantName"
                                                            value={formData.restaurantName}
                                                            onChange={handleInputChange}
                                                            placeholder="The Good Place"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Restaurant Type *</label>
                                                        <select
                                                            name="restaurantType"
                                                            value={formData.restaurantType}
                                                            onChange={handleInputChange}
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        >
                                                            <option value="">Select Type</option>
                                                            <option value="fine-dining">Fine Dining</option>
                                                            <option value="casual-dining">Casual Dining</option>
                                                            <option value="cafe">Cafe</option>
                                                            <option value="quick-service">Quick Service</option>
                                                            <option value="food-court">Food Court</option>
                                                            <option value="cloud-kitchen">Cloud Kitchen</option>
                                                            <option value="bar-restaurant">Bar & Restaurant</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Address *</label>
                                                    <textarea
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        placeholder="123, Main Street, Banjara Hills"
                                                        rows={2}
                                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900 resize-none"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">City *</label>
                                                        <input
                                                            type="text"
                                                            name="city"
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            placeholder="Hyderabad"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">State *</label>
                                                        <input
                                                            type="text"
                                                            name="state"
                                                            value={formData.state}
                                                            onChange={handleInputChange}
                                                            placeholder="Telangana"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Pincode *</label>
                                                        <input
                                                            type="text"
                                                            name="pincode"
                                                            value={formData.pincode}
                                                            onChange={handleInputChange}
                                                            placeholder="500034"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Restaurant Description (Optional)</label>
                                                    <textarea
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        placeholder="Tell us about your restaurant - your specialty, ambiance, story..."
                                                        rows={3}
                                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900 resize-none"
                                                    />
                                                </div>

                                                <div className="grid md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Seating Capacity</label>
                                                        <input
                                                            type="number"
                                                            name="seatingCapacity"
                                                            value={formData.seatingCapacity}
                                                            onChange={handleInputChange}
                                                            placeholder="50"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Opening Time</label>
                                                        <input
                                                            type="time"
                                                            name="openingHours"
                                                            value={formData.openingHours}
                                                            onChange={handleInputChange}
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Closing Time</label>
                                                        <input
                                                            type="time"
                                                            name="closingHours"
                                                            value={formData.closingHours}
                                                            onChange={handleInputChange}
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">GST Number (Optional)</label>
                                                        <input
                                                            type="text"
                                                            name="gstNumber"
                                                            value={formData.gstNumber}
                                                            onChange={handleInputChange}
                                                            placeholder="22AAAAA0000A1Z5"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">FSSAI License (Optional)</label>
                                                        <input
                                                            type="text"
                                                            name="fssaiLicense"
                                                            value={formData.fssaiLicense}
                                                            onChange={handleInputChange}
                                                            placeholder="12345678901234"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Google Maps Link (Optional)</label>
                                                    <input
                                                        type="url"
                                                        name="googleMapsLink"
                                                        value={formData.googleMapsLink}
                                                        onChange={handleInputChange}
                                                        placeholder="https://maps.google.com/..."
                                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Review & Submit */}
                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-14 h-14 bg-[#2A9D8F]/10 rounded-2xl flex items-center justify-center">
                                                    <Check className="text-[#2A9D8F]" size={28} />
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Review & Submit</h2>
                                                    <p className="text-gray-500 font-bold">Confirm your details</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Owner Summary */}
                                                <div className="bg-gray-50 rounded-3xl p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <User size={20} className="text-[#2A9D8F]" />
                                                        <h3 className="font-black text-gray-900 uppercase text-sm tracking-wider">Owner Details</h3>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-400 font-bold">Name</p>
                                                            <p className="font-black text-gray-900">{formData.ownerName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 font-bold">Email</p>
                                                            <p className="font-black text-gray-900">{formData.ownerEmail}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 font-bold">Phone</p>
                                                            <p className="font-black text-gray-900">{formData.ownerPhone}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Restaurant Summary */}
                                                <div className="bg-gray-50 rounded-3xl p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Building2 size={20} className="text-[#2A9D8F]" />
                                                        <h3 className="font-black text-gray-900 uppercase text-sm tracking-wider">Restaurant Details</h3>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-400 font-bold">Restaurant Name</p>
                                                            <p className="font-black text-gray-900">{formData.restaurantName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 font-bold">Cuisine Type</p>
                                                            <p className="font-black text-gray-900 capitalize">{formData.restaurantType.replace('-', ' ')}</p>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <p className="text-gray-400 font-bold">Address</p>
                                                            <p className="font-black text-gray-900">{formData.address}, {formData.city}, {formData.state} - {formData.pincode}</p>
                                                        </div>
                                                        {formData.description && (
                                                            <div className="md:col-span-2">
                                                                <p className="text-gray-400 font-bold">Description</p>
                                                                <p className="font-black text-gray-900">{formData.description}</p>
                                                            </div>
                                                        )}
                                                        {formData.seatingCapacity && (
                                                            <div>
                                                                <p className="text-gray-400 font-bold">Seating Capacity</p>
                                                                <p className="font-black text-gray-900">{formData.seatingCapacity} seats</p>
                                                            </div>
                                                        )}
                                                        {(formData.openingHours && formData.closingHours) && (
                                                            <div>
                                                                <p className="text-gray-400 font-bold">Operating Hours</p>
                                                                <p className="font-black text-gray-900">{formData.openingHours} - {formData.closingHours}</p>
                                                            </div>
                                                        )}
                                                        {formData.gstNumber && (
                                                            <div>
                                                                <p className="text-gray-400 font-bold">GST Number</p>
                                                                <p className="font-black text-gray-900">{formData.gstNumber}</p>
                                                            </div>
                                                        )}
                                                        {formData.fssaiLicense && (
                                                            <div>
                                                                <p className="text-gray-400 font-bold">FSSAI License</p>
                                                                <p className="font-black text-gray-900">{formData.fssaiLicense}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Terms */}
                                                <div className="bg-blue-50 rounded-3xl p-6 flex gap-4">
                                                    <Shield className="text-blue-500 flex-shrink-0" size={24} />
                                                    <div>
                                                        <p className="font-bold text-blue-900 text-sm">Your data is secure</p>
                                                        <p className="text-blue-700 text-sm">By submitting, you agree to our Terms of Service and Privacy Policy. Your information will be reviewed by our team within 24-48 hours.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error Message */}
                                {error && (
                                    <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
                                        <AlertCircle size={20} />
                                        {error}
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-10 pt-8 border-t border-gray-100">
                                    {currentStep > 1 ? (
                                        <button
                                            onClick={prevStep}
                                            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-colors"
                                        >
                                            <ArrowLeft size={20} /> Previous
                                        </button>
                                    ) : (
                                        <div />
                                    )}

                                    {currentStep < 3 ? (
                                        <button
                                            onClick={nextStep}
                                            className="btn-premium flex items-center gap-2 px-8 py-4"
                                        >
                                            Continue <ArrowRight size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="btn-premium flex items-center gap-2 px-8 py-4 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                                            {!isSubmitting && <Check size={20} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Plan Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-[48px] p-8 shadow-xl border border-gray-100 sticky top-32">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="text-[#2A9D8F]" size={20} />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Selected Plan</span>
                                </div>

                                <h3 className="text-3xl font-black text-gray-900 mb-2">{plan.name}</h3>

                                <div className="flex items-baseline gap-2 mb-6">
                                    {plan.price ? (
                                        <>
                                            <span className="text-5xl font-black text-gray-900">₹{price}</span>
                                            <span className="text-gray-400 font-bold">/{formData.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                        </>
                                    ) : (
                                        <span className="text-4xl font-black text-gray-900">Custom Pricing</span>
                                    )}
                                </div>

                                {plan.price && (
                                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-bold">Plan Price</span>
                                            <span className="font-black text-gray-900">₹{price}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-bold">GST (18%)</span>
                                            <span className="font-black text-gray-900">₹{gst}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                                            <span className="text-gray-900 font-black">Total</span>
                                            <span className="font-black text-[#2A9D8F] text-lg">₹{total}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Check size={12} className="text-emerald-600" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Billing Cycle</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, billingCycle: 'monthly' }))}
                                            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${formData.billingCycle === 'monthly'
                                                ? 'bg-[#2A9D8F] text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, billingCycle: 'yearly' }))}
                                            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${formData.billingCycle === 'yearly'
                                                ? 'bg-[#2A9D8F] text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            Yearly (25% off)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F]"></div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
