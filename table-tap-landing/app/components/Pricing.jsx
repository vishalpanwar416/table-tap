'use client';

import { useState } from 'react';
import { Check, Zap, Sparkles, Building2 } from 'lucide-react';
import data from '../data/landing-data.json';

const IconMap = {
    starter: Zap,
    professional: Sparkles,
    enterprise: Building2
};

const Pricing = () => {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const { pricing } = data;
    const plans = pricing.plans;

    return (
        <section id="pricing" aria-labelledby="pricing-heading" className="py-24 bg-[#F8FAFC]/50 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 left-1/2 w-[1000px] h-[1000px] bg-[#2A9D8F]/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-32">
                    <div className="inline-flex items-center gap-3 bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 mb-10">
                        <Sparkles size={18} className="text-[#2A9D8F]" />
                        <span className="text-gray-900 text-[12px] font-black uppercase tracking-[0.3em]">{pricing.badge}</span>
                    </div>
                    <h2
                        id="pricing-heading"
                        className="text-6xl md:text-8xl lg:text-9xl font-black text-gray-900 mb-14 leading-[0.85] tracking-tighter"
                    >
                        {pricing.title} <span className="gradient-text italic font-serif">{pricing.titleHighlight}</span>
                    </h2>

                    {/* Billing Switcher */}
                    <div className="flex items-center justify-center gap-6">
                        <span className={`text-base font-black uppercase tracking-widest ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-300'} transition-colors`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            aria-label={`Switch to ${billingCycle === 'monthly' ? 'yearly' : 'monthly'} billing`}
                            aria-checked={billingCycle === 'yearly'}
                            role="switch"
                            className="w-20 h-10 bg-gray-900 rounded-full p-1.5 relative flex items-center shadow-2xl transition-all duration-500 hover:scale-110"
                        >
                            <div
                                className="w-7 h-7 bg-[#2A9D8F] rounded-full shadow-lg transition-all duration-300"
                                style={{ marginLeft: billingCycle === 'monthly' ? '0' : '36px' }}
                            />
                        </button>
                        <div className="flex flex-col items-start leading-none">
                            <span className={`text-base font-black uppercase tracking-widest ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-300'} transition-colors`}>
                                Yearly
                            </span>
                            <span className="text-[#2A9D8F] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Save 25%</span>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto items-end min-h-[400px]" role="list" aria-label="Subscription plans">
                    {plans.map((plan, index) => {
                        const Icon = IconMap[plan.id] || Sparkles;
                        return (
                            <article
                                key={plan.id}
                                role="listitem"
                                aria-label={`${plan.name} plan - ${plan.price ? `₹${plan.price} per month` : 'Custom pricing'}`}
                                className={`p-16 rounded-[64px] flex flex-col relative transition-all duration-500 hover:shadow-3xl animate-fade-in-up ${plan.popular
                                    ? 'bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-white border-[3px] scale-105 z-20 min-h-[720px]'
                                    : 'glass border-gray-100 hover:bg-white/60 min-h-[640px]'
                                    }`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#2A9D8F] text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-[#2A9D8F]/20">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-12 shadow-2xl ${plan.popular ? 'bg-[#2A9D8F] text-white' : 'bg-[#0F172A] text-white opacity-90'
                                    }`}>
                                    <Icon size={36} />
                                </div>
                                <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">{plan.name}</h3>
                                <p className="text-gray-500 text-sm font-bold mb-14 leading-relaxed opacity-70">{plan.description}</p>

                                <div className="mb-14">
                                    {plan.price ? (
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-gray-300">₹</span>
                                                <span className="text-8xl font-black text-gray-900 tracking-tighter leading-none">
                                                    {billingCycle === 'yearly' ? Math.floor(plan.price * 12 * 0.75) : plan.price}
                                                </span>
                                                <span className="text-gray-400 font-black text-xs uppercase tracking-widest pb-2">
                                                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                                </span>
                                            </div>
                                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">+ 18% GST</span>
                                        </div>
                                    ) : (
                                        <div className="text-6xl font-black text-gray-900 tracking-tighter">Custom</div>
                                    )}
                                </div>

                                <div className="space-y-6 mb-16 flex-1">
                                    {plan.features.map(feature => (
                                        <div key={feature} className="flex items-center gap-4 group">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 transition-colors">
                                                <Check size={12} className="text-emerald-500 group-hover:text-white" />
                                            </div>
                                            <span className="text-gray-900 font-black text-sm uppercase tracking-wider opacity-80">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href={`/register?plan=${plan.id}&billing=${billingCycle}`}
                                    aria-label={`${plan.price ? `Choose ${plan.name} plan` : `Contact sales for ${plan.name}`}`}
                                    className={`w-full py-6 rounded-[28px] font-black text-center text-lg transition-all tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] ${plan.popular
                                        ? 'bg-[#2A9D8F] text-white shadow-2xl shadow-[#2A9D8F]/30 hover:brightness-110'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-white shadow-sm'
                                        }`}
                                >
                                    {plan.price ? 'Choose Plan' : 'Contact Sales'}
                                </a>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
