'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Check,
  Stars,
  Wind,
  Zap,
  Orbit,
  Dna
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import data from '../data/landing-data.json';

const IconMap = {
  lite: Wind,
  standard: Zap,
  pro: Orbit,
  enterprise: Dna,
  custom: Dna,
  demo: Zap
};

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [billingCycles, setBillingCycles] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { pricing } = data;

  useEffect(() => {
    setMounted(true);

    async function fetchData() {
      try {
        setLoading(true);
        // Fetch Plans
        const { data: dbPlans, error: plansError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .eq('is_public', true)
          .order('base_price', { ascending: true });

        if (plansError) {
          const msg = plansError?.message || plansError?.code || JSON.stringify(plansError);
          console.warn('Pricing: subscription_plans fetch failed:', msg);
          throw plansError;
        }

        // Fetch Billing Cycles
        const { data: cycles, error: cyclesError } = await supabase
          .from('billing_cycles')
          .select('*')
          .eq('is_active', true)
          .order('duration_months', { ascending: true });

        if (cyclesError) {
          const msg = cyclesError?.message || cyclesError?.code || JSON.stringify(cyclesError);
          console.warn('Pricing: billing_cycles fetch failed:', msg);
          throw cyclesError;
        }

        if (dbPlans && dbPlans.length > 0) {
          setPlans(dbPlans);
        }

        if (cycles && cycles.length > 0) {
          setBillingCycles(cycles);
          if (!cycles.find(c => c.key === billingCycle)) {
            setBillingCycle(cycles[0].key);
          }
        }
      } catch (err) {
        const msg = err?.message || err?.code || (typeof err === 'object' && Object.keys(err || {}).length ? JSON.stringify(err) : String(err));
        console.warn('Pricing: error fetching plans/cycles. Using fallback. Details:', msg);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch plans/cycles once on mount
  }, []);

  if (!mounted) return null;

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-24 sm:py-32 bg-[#F8FAFC]/50 relative overflow-hidden font-spartan">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#2A9D8F]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#2A9D8F]/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container relative z-10 mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-gray-100 mb-8"
          >
            <Stars size={16} className="text-[#2A9D8F]" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 leading-none">
              {pricing?.badge || "Simple Pricing"}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-8xl font-black text-gray-900 mb-10 tracking-tighter leading-[0.9]"
          >
            {pricing?.title || "No Hidden"} <span className="gradient-text italic font-serif">{pricing?.titleHighlight || "Surprises."}</span>
          </motion.h2>

          <div className="flex justify-center mb-10">
            <div className="bg-gray-100/50 p-1.5 rounded-full flex items-center gap-1 relative border border-gray-100 flex-wrap justify-center min-h-[50px]">
              {billingCycles.map((cycle) => (
                <button
                  key={cycle.key}
                  onClick={() => setBillingCycle(cycle.key)}
                  className={`relative px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 z-10 ${billingCycle === cycle.key ? 'text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <span className="relative z-10">
                    {cycle.label}
                  </span>
                  {billingCycle === cycle.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gray-900 rounded-full shadow-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {cycle.discount_percentage > 0 && (
                    <span className={`absolute -top-3 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black whitespace-nowrap shadow-sm border ${billingCycle === cycle.key ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]' : 'bg-white text-[#2A9D8F] border-[#2A9D8F]/20'
                      }`}>
                      -{cycle.discount_percentage}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 min-h-[500px]">
              <div className="relative mb-8">
                <div className="w-16 h-16 border-4 border-[#2A9D8F]/20 border-t-[#2A9D8F] rounded-full animate-spin" />
                <Stars className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#2A9D8F] w-6 h-6 animate-pulse" />
              </div>
              <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse text-center">Curating the best plans for your restaurant...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 min-h-[400px] text-center">
              <p className="text-gray-500 font-medium mb-6 max-w-md">Plans are loading from our servers. If you see this, check your connection or try again later.</p>
              <Link href="/#contact" className="btn-premium">Get in touch for pricing</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {plans.map((plan) => {
                const planKey = plan.key || plan.id;
                const Icon = IconMap[planKey] || Stars;
                const isPopular = plan.is_popular;

                return (
                  <article key={plan.id || plan.key} className="w-full">
                    <div className={`group h-full p-8 lg:p-10 rounded-[40px] flex flex-col relative transition-all duration-500 border-2 ${isPopular
                      ? 'bg-white border-[#2A9D8F] shadow-[0_30px_70px_-15px_rgba(42,157,143,0.15)] lg:scale-[1.05] lg:-translate-y-4 z-20'
                      : 'bg-white/60 glass border-white/60 hover:border-[#2A9D8F]/30 hover:bg-white/80 shadow-sm hover:shadow-2xl hover:-translate-y-2'
                      }`}>

                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2A9D8F] text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 whitespace-nowrap z-30">
                          <Stars size={12} className="animate-pulse" />
                          {plan.badge_text || "Most Popular"}
                        </div>
                      )}

                      <div className="mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${isPopular ? 'bg-[#2A9D8F] text-white rotate-6 group-hover:rotate-12' : 'bg-gray-900 text-white group-hover:rotate-6'}`}>
                          <Icon size={28} />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter mb-2">{plan.name}</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed line-clamp-2">{plan.description}</p>
                      </div>

                      <div className="mb-8 p-6 rounded-[24px] bg-gray-50/50 group-hover:bg-[#2A9D8F]/5 transition-colors duration-500">
                        {(!plan.use_custom_builder && (plan.base_price || plan.price)) ? (
                          <div className="flex flex-col justify-end">
                            {(() => {
                              const currentCycle = billingCycles.find(c => c.key === billingCycle) || { duration_months: 1, discount_percentage: 0, label: 'Monthly' };
                              const basePrice = plan.base_price || plan.price || 0;
                              const planDiscount = plan.plan_discount_percentage || 0;

                              let cycleDiscount = 0;
                              if (plan.cycle_discounts && plan.cycle_discounts[billingCycle] !== undefined) {
                                cycleDiscount = plan.cycle_discounts[billingCycle];
                              } else {
                                cycleDiscount = currentCycle.discount_percentage || 0;
                              }

                              const priceAfterPlanDiscount = basePrice * (1 - (planDiscount / 100));
                              const discountedMonthPrice = Math.floor(priceAfterPlanDiscount * (1 - (cycleDiscount / 100)));
                              const totalPeriodPrice = discountedMonthPrice * currentCycle.duration_months;
                              const hasDiscount = discountedMonthPrice < basePrice;

                              return (
                                <div key={billingCycle}>
                                  <div className="flex flex-col gap-0.5">
                                    {hasDiscount && (
                                      <div className="flex items-center gap-2 mb-0.5 h-6">
                                        <span className="text-base sm:text-xl font-bold text-gray-400 line-through decoration-red-500/50">
                                          ₹{basePrice.toLocaleString()}
                                        </span>
                                        <span className="bg-red-50 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                          Save {Math.round((1 - (discountedMonthPrice / basePrice)) * 100)}%
                                        </span>
                                      </div>
                                    )}
                                    {!hasDiscount && <div className="h-6" />}
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xl sm:text-2xl font-black text-gray-300">₹</span>
                                      <span className="text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                                        {discountedMonthPrice.toLocaleString()}
                                      </span>
                                      <span className="text-gray-400 font-bold text-sm tracking-tighter ml-1">/mo</span>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <span className="text-[#2A9D8F] font-black text-[10px] uppercase tracking-[0.1em]">
                                      {currentCycle.duration_months === 1
                                        ? 'Billed Monthly'
                                        : `Billed ${currentCycle.label} (₹${totalPeriodPrice.toLocaleString()})`
                                      }
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="h-[80px] flex items-center">
                            <div className="text-4xl font-black text-gray-900 tracking-tight">Custom</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3.5 mb-10 flex-1">
                        {(plan.features || []).slice(0, 6).map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-3 group/feature">
                            <div className={`mt-1 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${isPopular ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' : 'bg-gray-100 text-gray-400'}`}>
                              <Check size={11} className="stroke-[4]" />
                            </div>
                            <span className="text-gray-600 font-bold text-xs sm:text-sm leading-tight group-hover/feature:text-gray-900 transition-colors">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={plan.use_custom_builder ? '/custom-plan' : `/register?plan=${planKey}&billing=${billingCycle}`}
                        className={`w-full py-4.5 rounded-[22px] font-black text-center text-sm transition-all tracking-widest uppercase ${isPopular
                          ? 'bg-[#2A9D8F] text-white shadow-xl shadow-[#2A9D8F]/20 hover:scale-[1.02] hover:brightness-110'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                          }`}
                      >
                        {plan.button_text || (plan.use_custom_builder ? 'Build Now' : 'Get Started')}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
