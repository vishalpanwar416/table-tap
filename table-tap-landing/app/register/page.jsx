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
    AlertCircle,
    ChevronDown,
    Store,
    MapPinned,
    Navigation,
    FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import LocationPicker from '../components/LocationPicker';

// Demo plan (fallback if needed)
const demoPlan = {
    name: 'Demo',
    price: 0,
    features: ['Limited access', 'For testing only', 'Non-billable']
};

// Default plans (fallbacks while loading or if DB fails)
const defaultPlans = {
    lite: {
        name: 'Lite',
        price: 899,
        features: ['QR ordering & menu', 'Email billing included', 'Basic analytics', '10 staff seats', 'Pay-go WhatsApp billing']
    },
    standard: {
        name: 'Standard',
        price: 1199,
        features: ['Inventory & costing', 'Product/daypart analytics', '300 WhatsApp msgs included', '25 staff seats', 'Basic aggregator toggle']
    },
    professional: {
        name: 'Pro',
        price: 1699,
        features: ['AI insights & alerts', '800 WhatsApp msgs included', 'Full aggregator sync', 'Floor plan & KDS', 'Mini-site + custom domain']
    },
    pro: {
        name: 'Pro',
        price: 1699,
        features: ['AI insights & alerts', '800 WhatsApp msgs included', 'Full aggregator sync', 'Floor plan & KDS', 'Mini-site + custom domain']
    },
    enterprise: {
        name: 'Custom',
        price: null,
        features: ['Custom bundles', 'Dedicated CSM & SLA', 'Bulk WhatsApp pricing', 'Advanced integrations', 'Security & compliance options']
    }
};

// Indian States and Union Territories
const indianStates = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    // Union Territories
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
];

const CUSTOM_SERVICES = {
    'multi-outlet': 'Multi-Outlet Sync',
    'whatsapp-bundle': 'WhatsApp Pro Bundle',
    'ai-analytics': 'AI Smart Insights',
    'custom-domain': 'White-Label Domain',
    'audit-trails': 'Security Audit Trails',
    'dedicated-csm': 'Dedicated Support',
    'kds-floor': 'Digital KDS & Floor Plan'
};

function RegisterForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const selectedPlanId = searchParams.get('plan') || 'professional';
    const billingCycle = searchParams.get('billing') || 'monthly';

    const [dbPlans, setDbPlans] = useState(null);
    const [billingCycles, setBillingCycles] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPhonePrompt, setShowPhonePrompt] = useState(false);
    const [isPincodeLookup, setIsPincodeLookup] = useState(false);
    const [pincodeError, setPincodeError] = useState(null);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // Check for existing Google session on mount
    useEffect(() => {
        const checkGoogleSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const provider = session.user.app_metadata?.provider;
                if (provider === 'google') {
                    setIsGoogleUser(true);
                    setShowPhonePrompt(true);
                    setFormData(prev => ({
                        ...prev,
                        ownerName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                        ownerEmail: session.user.email || ''
                    }));
                }
            }
        };
        checkGoogleSession();
    }, []);

    // Sync URL parameters with formData
    useEffect(() => {
        const planParam = searchParams.get('plan');
        const billingParam = searchParams.get('billing');
        if (planParam) setFormData(prev => ({ ...prev, plan: planParam }));
        if (billingParam) setFormData(prev => ({ ...prev, billingCycle: billingParam }));
    }, [searchParams]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Plans
                const { data: planData, error: planError } = await supabase
                    .from('subscription_plans')
                    .select('*')
                    .eq('is_active', true);

                if (planError) throw planError;

                // Fetch Billing Cycles
                const { data: cycleData, error: cycleError } = await supabase
                    .from('billing_cycles')
                    .select('*')
                    .eq('is_active', true)
                    .order('duration_months', { ascending: true });

                if (cycleError) throw cycleError;

                if (planData && planData.length > 0) {
                    const formattedPlans = {};
                    planData.forEach(p => {
                        formattedPlans[p.key] = {
                            name: p.name,
                            price: p.base_price,
                            features: p.features,
                            plan_discount_percentage: p.plan_discount_percentage || 0
                        };
                    });
                    setDbPlans(formattedPlans);
                }

                if (cycleData && cycleData.length > 0) {
                    setBillingCycles(cycleData);
                    // Ensure current billing cycle exists in the fetched list, otherwise default to first
                    const currentCycle = searchParams.get('billing') || formData.billingCycle;
                    if (!cycleData.find(c => c.key === currentCycle)) {
                        setFormData(prev => ({ ...prev, billingCycle: cycleData[0].key }));
                    }
                }
            } catch (err) {
                console.error('Error fetching data in register page:', err);
            }
        };

        fetchData();
    }, []);

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/register?plan=${selectedPlanId}&billing=${billingCycle}`
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError('Failed to sign in with Google. Please try again.');
            setIsGoogleLoading(false);
        }
    };

    const handlePhoneSubmit = () => {
        if (!formData.ownerPhone) {
            setError('Please enter your phone number');
            return;
        }
        setError(null);
        setShowPhonePrompt(false);
        setCurrentStep(2); // Skip to restaurant details since owner info is complete
    };

    // Handle location selection from map picker
    const handleLocationSelect = (location) => {
        setFormData(prev => ({
            ...prev,
            address: location.address || prev.address,
            city: location.city || prev.city,
            state: location.state || prev.state,
            pincode: location.pincode || prev.pincode,
            googleMapsLink: location.googleMapsLink || prev.googleMapsLink
        }));
        setShowLocationPicker(false);
        setPincodeError(null);
    };

    // PIN code lookup function using India Post API
    const handlePincodeLookup = async (pincode) => {
        if (pincode.length !== 6) {
            setPincodeError(null);
            return;
        }

        setIsPincodeLookup(true);
        setPincodeError(null);

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                const postOffice = data[0].PostOffice[0];
                setFormData(prev => ({
                    ...prev,
                    city: postOffice.District || postOffice.Block || '',
                    state: postOffice.State || ''
                }));
                setPincodeError(null);
            } else {
                setPincodeError('Invalid PIN code');
            }
        } catch (err) {
            console.error('PIN code lookup error:', err);
            setPincodeError('Could not verify PIN code');
        } finally {
            setIsPincodeLookup(false);
        }
    };

    const activePlans = dbPlans || defaultPlans;

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
        { id: 3, title: 'Payment', icon: CreditCard },
        { id: 4, title: 'Review & Submit', icon: Check }
    ];

    const [paymentStatus, setPaymentStatus] = useState(null);
    const [paymentId, setPaymentId] = useState(null);
    const [razorpayKeyId, setRazorpayKeyId] = useState(null);

    // Fetch Razorpay Key ID from secure backend function
    useEffect(() => {
        const fetchPaymentConfig = async () => {
            try {
                console.log('Fetching payment config from Edge Function...');
                const { data, error } = await supabase.functions.invoke('get-payment-config');
                if (error) {
                    console.error('Edge Function error:', error);
                    throw error;
                }
                if (data?.key_id) {
                    console.log('Payment config received');
                    setRazorpayKeyId(data.key_id);
                }
            } catch (err) {
                console.error('Failed to load payment config from Edge Function:', err);
                // Fallback only for dev/testing if function fails
                if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
                    console.log('Falling back to local Razorpay key ID');
                    setRazorpayKeyId(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
                }
            }
        };
        fetchPaymentConfig();
    }, []);

    // Dynamic Plan Calculation
    const getActivePlan = () => {
        const currentPlanId = formData.plan || selectedPlanId;
        const basePlan = activePlans[currentPlanId] || activePlans.custom || activePlans.enterprise || activePlans.professional;
        const customPriceParam = searchParams.get('price');
        const customServicesParam = searchParams.get('services');
        const isEnterprise = currentPlanId === 'enterprise' || currentPlanId === 'custom' || currentPlanId === 'enterprise-custom';

        // Override if this is a custom plan request from Custom Plan Builder or URL params exist
        if (isEnterprise && (customPriceParam || customServicesParam)) {
            return {
                ...basePlan,
                name: 'Custom Enterprise Plan',
                price: customPriceParam ? parseInt(customPriceParam) : (basePlan.price || 29999),
                features: customServicesParam
                    ? customServicesParam.split(',').map(id => CUSTOM_SERVICES[id] || id)
                    : basePlan.features
            };
        }
        return basePlan;
    };

    const plan = getActivePlan();
    const calculatePrice = () => {
        if (!plan || !plan.price) return 'Custom';
        const currentCycle = billingCycles.find(c => c.key === formData.billingCycle) || { duration_months: 1, discount_percentage: 0 };
        const planDiscount = plan.plan_discount_percentage || 0;

        let cycleDiscount = 0;
        if (plan.cycle_discounts && plan.cycle_discounts[formData.billingCycle] !== undefined && plan.cycle_discounts[formData.billingCycle] !== null) {
            cycleDiscount = plan.cycle_discounts[formData.billingCycle];
        } else {
            cycleDiscount = currentCycle.discount_percentage || 0;
        }

        // Calculate the discounted month price (stacking discounts)
        const priceAfterPlanDiscount = plan.price * (1 - (planDiscount / 100));
        const discountedMonthPrice = Math.floor(priceAfterPlanDiscount * (1 - (cycleDiscount / 100)));

        return (discountedMonthPrice * currentCycle.duration_months);
    };

    const price = calculatePrice();
    const gst = plan && plan.price && typeof price === 'number' ? Math.round(price * 0.18) : 0;
    const total = plan && plan.price && typeof price === 'number' ? price + gst : 'Custom';

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
                if (!formData.ownerName || !formData.ownerEmail || !formData.ownerPhone) {
                    setError('Please fill in all required fields');
                    return false;
                }
                // Only validate password for non-Google users
                if (!isGoogleUser) {
                    if (!formData.password) {
                        setError('Please enter a password');
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
                }
                break;
            case 2:
                if (!formData.restaurantName || !formData.restaurantType || !formData.address || !formData.city || !formData.state || !formData.pincode) {
                    setError('Please fill in all required fields');
                    return false;
                }
                break;
            case 3:
                if (plan.price && paymentStatus !== 'success') {
                    setError('Please complete the payment to continue');
                    return false;
                }
                break;
        }
        setError(null);
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Load Razorpay script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Handle Razorpay payment
    const handlePayment = async () => {
        if (!plan.price) {
            // Enterprise plan - skip payment
            setPaymentStatus('success');
            nextStep();
            return;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setError('Failed to load payment gateway. Please try again.');
            return;
        }

        const amountInPaise = total * 100; // Convert to paise

        const options = {
            key: razorpayKeyId || 'rzp_test_yourkeyhere',
            amount: amountInPaise,
            currency: 'INR',
            name: 'Table Tap',
            description: `${plan.name} Plan - ${formData.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
            image: '/logo.png',
            handler: function (response) {
                // Payment successful
                setPaymentId(response.razorpay_payment_id);
                setPaymentStatus('success');
                setError(null);
                // Auto-advance to next step
                setCurrentStep(4);
            },
            prefill: {
                name: formData.ownerName,
                email: formData.ownerEmail,
                contact: formData.ownerPhone
            },
            notes: {
                restaurant_name: formData.restaurantName,
                plan: formData.plan,
                billing_cycle: formData.billingCycle
            },
            theme: {
                color: '#2A9D8F'
            },
            modal: {
                ondismiss: function () {
                    setPaymentStatus('cancelled');
                }
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
            setPaymentStatus('failed');
            setError(`Payment failed: ${response.error.description}`);
        });
        razorpay.open();
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

                    // Payment Info
                    payment_status: paymentStatus || (plan.price ? 'pending' : 'not_required'),
                    payment_id: paymentId || null,

                    // Status
                    status: 'pending_review',
                    created_at: new Date().toISOString()
                }]);

            if (submitError) throw submitError;

            // Send confirmation email (don't wait for it, fire and forget)
            try {
                fetch('/api/send-registration-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ownerName: formData.ownerName,
                        ownerEmail: formData.ownerEmail,
                        restaurantName: formData.restaurantName,
                        selectedPlan: formData.plan,
                        paymentId: paymentId
                    })
                }).catch(err => console.error('Email notification error:', err));
            } catch (emailErr) {
                // Don't fail registration if email fails
                console.error('Email send error:', emailErr);
            }

            setSuccess(true);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to submit registration. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        const statusUrl = `/application-status?email=${encodeURIComponent(formData.ownerEmail)}`;

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
                        <br /><br />
                        <span className="text-[#2A9D8F]">A confirmation email has been sent to {formData.ownerEmail}</span>
                    </p>
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                        <p className="text-sm text-gray-500 font-bold">Selected Plan</p>
                        <p className="text-2xl font-black text-gray-900">{plan.name}</p>
                        {plan.price && (
                            <p className="text-[#2A9D8F] font-bold">₹{total}/{formData.billingCycle === 'monthly' ? 'mo' : 'yr'} (incl. GST)</p>
                        )}
                        {paymentId && (
                            <p className="text-xs text-gray-400 mt-2">Payment ID: {paymentId}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link
                            href={statusUrl}
                            className="btn-premium inline-flex items-center justify-center gap-3 px-8 py-4 w-full"
                        >
                            <Clock size={20} /> Track Application Status
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 font-bold transition-colors"
                        >
                            <ArrowLeft size={18} /> Back to Home
                        </Link>
                    </div>
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

                                            {/* Phone Prompt for Google Users */}
                                            {showPhonePrompt && isGoogleUser ? (
                                                <div className="space-y-6">
                                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
                                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                                            <Check className="text-green-600" size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-green-800">Signed in with Google</p>
                                                            <p className="text-green-700 text-sm">{formData.ownerEmail}</p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 rounded-2xl p-6">
                                                        <p className="text-gray-900 font-bold mb-1">Welcome, {formData.ownerName}!</p>
                                                        <p className="text-gray-500 text-sm mb-6">Please provide your phone number to continue</p>

                                                        <div>
                                                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Phone Number *</label>
                                                            <input
                                                                type="tel"
                                                                name="ownerPhone"
                                                                value={formData.ownerPhone}
                                                                onChange={handleInputChange}
                                                                placeholder="Phone number"
                                                                className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                                required
                                                                autoFocus
                                                            />
                                                        </div>

                                                        <button
                                                            onClick={handlePhoneSubmit}
                                                            className="w-full mt-6 btn-premium flex items-center justify-center gap-2 py-4"
                                                        >
                                                            Continue <ArrowRight size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Google Sign-In Button */}
                                                    <button
                                                        onClick={handleGoogleSignIn}
                                                        disabled={isGoogleLoading}
                                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                                                    >
                                                        {isGoogleLoading ? (
                                                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                            </svg>
                                                        )}
                                                        {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                                                    </button>

                                                    {/* Divider */}
                                                    <div className="relative">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <div className="w-full border-t border-gray-200"></div>
                                                        </div>
                                                        <div className="relative flex justify-center text-sm">
                                                            <span className="px-4 bg-white text-gray-500 font-bold">or continue with email</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Full Name *</label>
                                                        <input
                                                            type="text"
                                                            name="ownerName"
                                                            value={formData.ownerName}
                                                            onChange={handleInputChange}
                                                            placeholder="Full name"
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
                                                                placeholder="Email address"
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
                                                                placeholder="Phone number"
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
                                            )}
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
                                                            placeholder="Restaurant name"
                                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Restaurant Type *</label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <Store size={20} className={formData.restaurantType ? 'text-[#2A9D8F]' : 'text-gray-400'} />
                                                            </div>
                                                            <select
                                                                name="restaurantType"
                                                                value={formData.restaurantType}
                                                                onChange={handleInputChange}
                                                                className={`w-full pl-12 pr-12 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold appearance-none cursor-pointer transition-all ${formData.restaurantType ? 'bg-[#2A9D8F]/5 border-[#2A9D8F]/30 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
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
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <ChevronDown size={20} className={formData.restaurantType ? 'text-[#2A9D8F]' : 'text-gray-400'} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Location Selection */}
                                                <div className="bg-gradient-to-r from-[#2A9D8F]/5 to-transparent p-4 rounded-2xl border border-[#2A9D8F]/10">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center">
                                                                <Navigation className="text-[#2A9D8F]" size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm">Restaurant Location</p>
                                                                <p className="text-gray-500 text-xs">Use map for accurate address</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowLocationPicker(true)}
                                                            className="px-4 py-2 bg-[#2A9D8F] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#238b7e] transition-colors"
                                                        >
                                                            <MapPin size={16} />
                                                            Select on Map
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Address *</label>
                                                    <textarea
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        placeholder="Street address (or select on map above)"
                                                        rows={2}
                                                        className={`w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900 resize-none ${formData.address ? 'bg-[#2A9D8F]/5' : 'bg-gray-50'}`}
                                                        required
                                                    />
                                                </div>

                                                <div className="grid md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">PIN Code *</label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                name="pincode"
                                                                value={formData.pincode}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                                    handleInputChange({ target: { name: 'pincode', value } });
                                                                    if (value.length === 6) {
                                                                        handlePincodeLookup(value);
                                                                    }
                                                                }}
                                                                placeholder="6-digit PIN"
                                                                maxLength={6}
                                                                className={`w-full px-6 py-4 bg-gray-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900 ${pincodeError ? 'border-red-300' : 'border-gray-200'}`}
                                                                required
                                                            />
                                                            {isPincodeLookup && (
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                    <div className="w-5 h-5 border-2 border-[#2A9D8F] border-t-transparent rounded-full animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {pincodeError && (
                                                            <p className="text-red-500 text-xs mt-1 font-medium">{pincodeError}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">City *</label>
                                                        <input
                                                            type="text"
                                                            name="city"
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            placeholder="Auto-filled from PIN"
                                                            className={`w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900 ${formData.city ? 'bg-green-50' : 'bg-gray-50'}`}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">State *</label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <MapPinned size={20} className={formData.state ? 'text-[#2A9D8F]' : 'text-gray-400'} />
                                                            </div>
                                                            <select
                                                                name="state"
                                                                value={formData.state}
                                                                onChange={handleInputChange}
                                                                className={`w-full pl-12 pr-12 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold appearance-none cursor-pointer transition-all ${formData.state ? 'bg-[#2A9D8F]/5 border-[#2A9D8F]/30 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                                                required
                                                            >
                                                                <option value="">Select State</option>
                                                                {indianStates.map((state) => (
                                                                    <option key={state} value={state}>{state}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <ChevronDown size={20} className={formData.state ? 'text-[#2A9D8F]' : 'text-gray-400'} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Restaurant Description (Optional)</label>
                                                    <textarea
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        placeholder="Brief description of your restaurant"
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
                                                            placeholder="GST number (optional)"
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
                                                            placeholder="FSSAI number (optional)"
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
                                                        placeholder="Google Maps link (optional)"
                                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-bold text-gray-900"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Payment */}
                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-14 h-14 bg-[#2A9D8F]/10 rounded-2xl flex items-center justify-center">
                                                    <CreditCard className="text-[#2A9D8F]" size={28} />
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payment</h2>
                                                    <p className="text-gray-500 font-bold">Complete your subscription payment</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Payment Summary */}
                                                <div className="bg-gradient-to-br from-[#2A9D8F]/5 to-emerald-50 rounded-3xl p-8 border border-[#2A9D8F]/20">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div>
                                                            <p className="text-sm text-gray-500 font-bold">Selected Plan</p>
                                                            <p className="text-2xl font-black text-gray-900">{plan.name}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500 font-bold">Billing</p>
                                                            <p className="text-lg font-black text-gray-900 capitalize">{formData.billingCycle}</p>
                                                        </div>
                                                    </div>

                                                    {plan.price ? (
                                                        <div className="space-y-3 border-t border-[#2A9D8F]/20 pt-6">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-600 font-bold">Plan Price</span>
                                                                <span className="font-black text-gray-900">₹{price}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-600 font-bold">GST (18%)</span>
                                                                <span className="font-black text-gray-900">₹{gst}</span>
                                                            </div>
                                                            <div className="flex justify-between text-lg border-t border-[#2A9D8F]/20 pt-3">
                                                                <span className="font-black text-gray-900">Total Amount</span>
                                                                <span className="font-black text-[#2A9D8F] text-2xl">₹{total}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="border-t border-[#2A9D8F]/20 pt-6">
                                                            <p className="text-gray-600 font-bold">Enterprise plans have custom pricing. Our team will contact you to discuss your requirements.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Payment Status */}
                                                {paymentStatus === 'success' && (
                                                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                                            <Check className="text-emerald-600" size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-emerald-800 text-lg">Payment Successful!</p>
                                                            <p className="text-emerald-700 text-sm">Payment ID: {paymentId}</p>
                                                            <p className="text-emerald-600 text-sm mt-1">Click &quot;Continue&quot; to complete your registration.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {paymentStatus === 'failed' && (
                                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                                            <AlertCircle className="text-red-600" size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-red-800 text-lg">Payment Failed</p>
                                                            <p className="text-red-700 text-sm">Please try again or use a different payment method.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {paymentStatus === 'cancelled' && (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                                                            <AlertCircle className="text-yellow-600" size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-yellow-800 text-lg">Payment Cancelled</p>
                                                            <p className="text-yellow-700 text-sm">You cancelled the payment. Click the button below to try again.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pay Now Button */}
                                                {plan.price && paymentStatus !== 'success' && (
                                                    <button
                                                        onClick={handlePayment}
                                                        className="w-full btn-premium flex items-center justify-center gap-3 py-5 text-lg"
                                                    >
                                                        <CreditCard size={24} />
                                                        Pay ₹{total} Now
                                                    </button>
                                                )}

                                                {!plan.price && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                                                        <p className="font-bold text-blue-800">Enterprise Plan</p>
                                                        <p className="text-blue-700 text-sm mt-1">No upfront payment required. Our team will reach out to discuss pricing based on your specific needs.</p>
                                                    </div>
                                                )}

                                                {/* Security Badge */}
                                                <div className="flex items-center justify-center gap-3 text-gray-400 text-sm">
                                                    <Shield size={16} />
                                                    <span className="font-bold">Secured by Razorpay • 256-bit SSL Encryption</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 4: Review & Submit */}
                                    {currentStep === 4 && (
                                        <motion.div
                                            key="step4"
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

                                                {/* Payment Summary */}
                                                {plan.price && paymentId && (
                                                    <div className="bg-emerald-50 rounded-3xl p-6">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <CreditCard size={20} className="text-emerald-600" />
                                                            <h3 className="font-black text-gray-900 uppercase text-sm tracking-wider">Payment Details</h3>
                                                        </div>
                                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-gray-400 font-bold">Status</p>
                                                                <p className="font-black text-emerald-600">Paid ✓</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-400 font-bold">Amount</p>
                                                                <p className="font-black text-gray-900">₹{total}</p>
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <p className="text-gray-400 font-bold">Payment ID</p>
                                                                <p className="font-black text-gray-900 text-xs">{paymentId}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

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
                                    ) : currentStep === 3 ? (
                                        // Payment step - show continue only if payment successful or enterprise plan
                                        (paymentStatus === 'success' || !plan.price) ? (
                                            <button
                                                onClick={nextStep}
                                                className="btn-premium flex items-center gap-2 px-8 py-4"
                                            >
                                                Continue <ArrowRight size={20} />
                                            </button>
                                        ) : (
                                            <div /> // Hide continue button until payment is done
                                        )
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
                                            <span className="text-5xl font-black text-gray-900">₹{price.toLocaleString()}</span>
                                            <span className="text-gray-400 font-bold">/{billingCycles.find(c => c.key === formData.billingCycle)?.label || formData.billingCycle}</span>
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
                                    <div className="flex gap-2 flex-wrap">
                                        {billingCycles.map((cycle) => (
                                            <button
                                                key={cycle.key}
                                                onClick={() => setFormData(prev => ({ ...prev, billingCycle: cycle.key }))}
                                                className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${formData.billingCycle === cycle.key
                                                    ? 'bg-[#2A9D8F] text-white shadow-lg'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {cycle.label} {cycle.discount_percentage > 0 ? `(-${cycle.discount_percentage}%)` : ''}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Picker Modal */}
            {showLocationPicker && (
                <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    onClose={() => setShowLocationPicker(false)}
                />
            )}
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
