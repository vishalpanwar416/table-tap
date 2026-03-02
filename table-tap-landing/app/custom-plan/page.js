'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/Header';
import siteConfig from '../data/site-config.json';
import Footer from '../components/Footer';
import {
    Building2,
    Check,
    MessageSquare,
    Brain,
    Globe,
    ShieldCheck,
    Headphones,
    Layers,
    Zap,
    ChevronRight,
    ArrowLeft,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP = {
    Building2,
    MessageSquare,
    Brain,
    Globe,
    ShieldCheck,
    Headphones,
    Layers,
    Zap
};

const DEFAULT_SERVICES = [
    {
        id: 'multi-outlet',
        name: 'Multi-Outlet Sync',
        description: 'Centralized control for chains and franchises.',
        icon: Building2,
        iconStr: 'Building2',
        basePrice: 999,
        unit: 'outlet',
        minUnit: 2
    },
    {
        id: 'whatsapp-bundle',
        name: 'WhatsApp Pro Bundle',
        description: '10,000 automated messages per month.',
        icon: MessageSquare,
        iconStr: 'MessageSquare',
        basePrice: 499,
        unit: 'bundle',
        minUnit: 1
    },
    {
        id: 'ai-analytics',
        name: 'AI Smart Insights',
        description: 'Predictive analytics and smart inventory alerts.',
        icon: Brain,
        iconStr: 'Brain',
        basePrice: 499,
        unit: 'fixed'
    },
    {
        id: 'custom-domain',
        name: 'White-Label Domain',
        description: 'Use your own domain for menu and ordering.',
        icon: Globe,
        iconStr: 'Globe',
        basePrice: 499,
        unit: 'fixed'
    },
    {
        id: 'audit-trails',
        name: 'Security Audit Trails',
        description: 'Full logs of every action taken by staff.',
        icon: ShieldCheck,
        iconStr: 'ShieldCheck',
        basePrice: 299,
        unit: 'fixed'
    },
    {
        id: 'dedicated-csm',
        name: 'Dedicated Support',
        description: 'A dedicated manager for your restaurant group.',
        icon: Headphones,
        iconStr: 'Headphones',
        basePrice: 1499,
        unit: 'fixed'
    },
    {
        id: 'kds-floor',
        name: 'Digital KDS & Floor Plan',
        description: 'Visual table management and kitchen display.',
        icon: Layers,
        iconStr: 'Layers',
        basePrice: 499,
        unit: 'fixed'
    }
];

export default function CustomPlanBuilder() {
    const router = useRouter();
    const [services, setServices] = useState(DEFAULT_SERVICES);
    const [loading, setLoading] = useState(true);
    const [enterpriseBasePrice, setEnterpriseBasePrice] = useState(siteConfig.pricing.enterpriseBaseMonthly);
    const [selectedItems, setSelectedItems] = useState(['multi-outlet', 'whatsapp-bundle', 'dedicated-csm']);
    const [outlets, setOutlets] = useState(2);
    const [bundles, setBundles] = useState(1);

    React.useEffect(() => {
        const fetchAddons = async () => {
            try {
                const { supabase } = await import('../lib/supabase');

                // Fetch addons from system_settings
                const settingsPromise = supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'custom_plan_addons')
                    .single();

                // Fetch enterprise base price
                const planPromise = supabase
                    .from('subscription_plans')
                    .select('base_price')
                    .eq('key', 'enterprise')
                    .single();

                const [settingsRes, planRes] = await Promise.all([settingsPromise, planPromise]);

                if (settingsRes.data && settingsRes.data.value && Array.isArray(settingsRes.data.value)) {
                    // map iconStr back to the React component
                    const mappedServices = settingsRes.data.value.map(item => ({
                        ...item,
                        icon: ICON_MAP[item.iconStr] || Zap // fallback icon
                    }));
                    setServices(mappedServices);
                }

                if (planRes.data && typeof planRes.data.base_price === 'number') {
                    setEnterpriseBasePrice(planRes.data.base_price);
                }
            } catch (err) {
                console.error('Error fetching custom addons:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAddons();
    }, []);

    const totalPrice = useMemo(() => {
        let total = enterpriseBasePrice;
        services.forEach(service => {
            if (selectedItems.includes(service.id)) {
                if (service.id === 'multi-outlet') {
                    total += service.basePrice * outlets;
                } else if (service.id === 'whatsapp-bundle') {
                    total += service.basePrice * bundles;
                } else {
                    total += service.basePrice;
                }
            }
        });
        return total;
    }, [selectedItems, outlets, bundles, enterpriseBasePrice, services]);

    const toggleItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <main className="min-h-screen bg-white">
            <Header />

            <div className="pt-24 pb-12 sm:pt-32 sm:pb-24 bg-[#F8FAFC]">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col md:flex-row gap-12">

                        {/* Left Column: Selector */}
                        <div className="flex-1">
                            <div className="mb-10">
                                <Link href="/#pricing" className="inline-flex items-center gap-2 text-[#2A9D8F] font-bold text-sm uppercase tracking-widest mb-6 hover:gap-3 transition-all">
                                    <ArrowLeft size={16} /> Back to Plans
                                </Link>
                                <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-4">
                                    Build Your <span className="gradient-text italic font-serif">Custom</span> Plan
                                </h1>
                                <p className="text-gray-500 font-bold max-w-xl">
                                    Select the premium services your restaurant group needs. We&apos;ll handle the scaling while you focus on hospitality.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                {services.map((service) => {
                                    const isSelected = selectedItems.includes(service.id);
                                    const Icon = service.icon || Zap;

                                    return (
                                        <div
                                            key={service.id}
                                            onClick={() => toggleItem(service.id)}
                                            className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer flex items-center gap-6 ${isSelected
                                                ? 'bg-white border-[#2A9D8F] shadow-[0_20px_40px_rgba(42,157,143,0.1)]'
                                                : 'bg-white/50 border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#2A9D8F] text-white' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                <Icon size={24} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm">{service.name}</h3>
                                                    <span className="text-[#2A9D8F] font-black">
                                                        +₹{service.basePrice.toLocaleString()}{service.unit !== 'fixed' ? `/${service.unit}` : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-bold opacity-70">{service.description}</p>

                                                <AnimatePresence>
                                                    {isSelected && service.unit !== 'fixed' && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4"
                                                        >
                                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantity:</span>
                                                            <div className="flex items-center bg-gray-50 rounded-full px-2 py-1">
                                                                <button
                                                                    onClick={() => service.id === 'multi-outlet' ? setOutlets(Math.max(2, outlets - 1)) : setBundles(Math.max(1, bundles - 1))}
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                                >-</button>
                                                                <span className="w-12 text-center font-black text-gray-900">
                                                                    {service.id === 'multi-outlet' ? outlets : bundles}
                                                                </span>
                                                                <button
                                                                    onClick={() => service.id === 'multi-outlet' ? setOutlets(outlets + 1) : setBundles(bundles + 1)}
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                                >+</button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-[#2A9D8F] border-[#2A9D8F]' : 'border-gray-200'
                                                }`}>
                                                {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column: Summary Card */}
                        <div className="w-full md:w-[400px]">
                            <div className="sticky top-32 p-8 sm:p-10 rounded-[48px] bg-white border border-gray-100 shadow-[0_40px_100px_rgba(0,0,0,0.08)] flex flex-col h-fit">
                                <div className="inline-flex items-center gap-2 bg-[#2A9D8F]/10 px-4 py-2 rounded-2xl mb-8">
                                    <Sparkles size={16} className="text-[#2A9D8F]" fill="currentColor" />
                                    <span className="text-[#2A9D8F] text-[10px] font-black uppercase tracking-[0.3em]">Estimated Quote</span>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-gray-400 text-2xl font-black">₹</span>
                                        <span className="text-6xl font-black text-gray-900 tracking-tighter leading-none">
                                            {totalPrice.toLocaleString()}
                                        </span>
                                        <span className="text-gray-400 font-black text-sm uppercase tracking-widest pb-1">
                                            /mo
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-4">+ 18% GST (Calculated at checkout)</p>
                                </div>

                                <div className="space-y-4 mb-10 border-y border-gray-50 py-8">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                                        <span>Base Enterprise</span>
                                        <span className="text-gray-900">₹{enterpriseBasePrice.toLocaleString()}</span>
                                    </div>
                                    {selectedItems.map(itemId => {
                                        const s = services.find(x => x.id === itemId);
                                        if (!s) return null;
                                        let price = s.basePrice;
                                        let qty = '';
                                        if (s.id === 'multi-outlet') {
                                            price *= outlets;
                                            qty = ` (x${outlets})`;
                                        } else if (s.id === 'whatsapp-bundle') {
                                            price *= bundles;
                                            qty = ` (x${bundles})`;
                                        }
                                        return (
                                            <div key={itemId} className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                                                <span>{s.name}{qty}</span>
                                                <span className="text-gray-900">₹{price.toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => router.push(`/register?plan=custom&price=${totalPrice}&services=${selectedItems.join(',')}`)}
                                    className="w-full py-6 rounded-[32px] bg-gray-900 text-white font-black uppercase tracking-widest hover:bg-[#2A9D8F] transition-all flex items-center justify-center gap-2 group"
                                >
                                    Request This Plan <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>

                                <p className="text-center text-[10px] text-gray-400 font-bold mt-6 leading-relaxed">
                                    Price may vary based on specific customization requests and integration complexity.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
