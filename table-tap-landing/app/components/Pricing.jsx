'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
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

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [billingCycles, setBillingCycles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(1);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { pricing } = data;
  const sliderRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Plans
        const { data: dbPlans, error: plansError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .eq('is_public', true)
          .order('base_price', { ascending: true });

        if (plansError) throw plansError;

        // Fetch Billing Cycles
        const { data: cycles, error: cyclesError } = await supabase
          .from('billing_cycles')
          .select('*')
          .eq('is_active', true)
          .order('duration_months', { ascending: true });

        if (cyclesError) throw cyclesError;

        if (dbPlans && dbPlans.length > 0) {
          setPlans(dbPlans);
          setActiveIndex(Math.floor(dbPlans.length / 2));
        }

        if (cycles && cycles.length > 0) {
          setBillingCycles(cycles);
          // Set initial billing cycle if available
          if (!cycles.find(c => c.key === billingCycle)) {
            setBillingCycle(cycles[0].key);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const scrollToIndex = (index, smooth = true) => {
    const node = sliderRef.current;
    if (!node || !node.children[index]) return;
    const slide = node.children[index];
    const offset = slide.offsetLeft - (node.clientWidth - slide.clientWidth) / 2;
    node.scrollTo({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (!loading && plans.length > 0) {
      scrollToIndex(activeIndex, false);
    }
  }, [loading, plans, activeIndex]);

  // Optimize scroll handler with a timeout to prevent excessive re-renders
  const scrollTimeout = useRef(null);
  const handleScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      const node = sliderRef.current;
      if (!node) return;
      const centerX = node.scrollLeft + node.clientWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      Array.from(node.children).forEach((child, idx) => {
        const rect = child.getBoundingClientRect();
        const slideCenter = child.offsetLeft + rect.width / 2;
        const dist = Math.abs(slideCenter - centerX);
        if (dist < minDist) {
          minDist = dist;
          closest = idx;
        }
      });
      if (closest !== activeIndex) {
        setActiveIndex(closest);
      }
    }, 100);
  };

  const adjustIndex = (delta) => {
    const next = Math.max(0, Math.min(plans.length - 1, activeIndex + delta));
    setActiveIndex(next);
    scrollToIndex(next);
  };

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-12 sm:py-16 md:py-24 bg-[#F8FAFC]/50 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 w-[500px] sm:w-[700px] md:w-[1000px] h-[500px] sm:h-[700px] md:h-[1000px] bg-[#2A9D8F]/5 rounded-full blur-[100px] sm:blur-[150px] -translate-x-1/2 -translate-y-1/2" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-full">
        <div className="text-center mb-10 sm:mb-20 md:mb-28">
          <div className="inline-flex items-center gap-3 bg-white px-4 sm:px-6 py-2 rounded-2xl shadow-sm border border-gray-100 mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Stars size={16} className="sm:w-[18px] sm:h-[18px] text-[#2A9D8F]" />
            <span id="pricing-badge" className="text-gray-900 text-[11px] sm:text-[12px] font-black uppercase tracking-[0.3em] font-sans">{pricing?.badge || "Simple Pricing"}</span>
          </div>
          <h2
            id="pricing-heading"
            className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-black text-gray-900 mb-8 sm:mb-14 leading-[0.9] tracking-tighter px-2"
          >
            {pricing?.title} <span className="gradient-text italic font-serif">{pricing?.titleHighlight}</span>
          </h2>

          <div className="flex justify-center mb-10">
            <div className="bg-gray-100/50 p-1.5 rounded-full flex items-center gap-1 relative border border-gray-100 flex-wrap justify-center min-h-[50px]">
              {mounted && billingCycles.map((cycle) => (
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

        <div className="relative max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 min-h-[500px]">
              <div className="relative mb-8">
                <div className="w-16 h-16 border-4 border-[#2A9D8F]/20 border-t-[#2A9D8F] rounded-full animate-spin" />
                <Stars className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#2A9D8F] w-6 h-6 animate-pulse" />
              </div>
              <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse text-center">Curating the best plans for your restaurant...</p>
            </div>
          ) : (
            <div className="relative">
              {/* Mobile/Tablet Slider Controls - Hidden on Desktop Grid */}
              <div className="flex lg:hidden justify-between items-center mb-10 px-2">
                <button
                  aria-label="Previous plan"
                  onClick={() => adjustIndex(-1)}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-xl border border-gray-100 hover:scale-110 active:scale-90 transition-all disabled:opacity-30"
                  disabled={activeIndex === 0}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2.5">
                  {plans.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeIndex ? 'bg-[#2A9D8F] w-8' : 'bg-gray-200 w-1.5'}`}
                    />
                  ))}
                </div>
                <button
                  aria-label="Next plan"
                  onClick={() => adjustIndex(1)}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-xl border border-gray-100 hover:scale-110 active:scale-90 transition-all disabled:opacity-30"
                  disabled={activeIndex === plans.length - 1}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Dynamic Plans Container */}
              <div
                ref={sliderRef}
                onScroll={handleScroll}
                className="flex lg:grid lg:grid-cols-4 gap-6 xl:gap-8 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-12 scrollbar-hide scroll-smooth"
                role="list"
                aria-label="Subscription plans"
              >
                {plans.map((plan, index) => {
                  const planKey = plan.key || plan.id;
                  const Icon = IconMap[planKey] || Stars;
                  const isPopular = plan.is_popular;
                  const badgeText = plan.badge_text || 'Most Popular';

                  // Mobile-only scaling/opacity logic
                  const distance = Math.abs(activeIndex - index);
                  const mobileScale = distance === 0 ? 'scale-[1.02]' : 'scale-[0.92]';
                  const mobileOpacity = distance === 0 ? 'opacity-100' : 'opacity-50';

                  return (
                    <article
                      key={plan.id || plan.key}
                      role="listitem"
                      className={`snap-center shrink-0 w-[88vw] sm:w-[420px] lg:w-full transition-all duration-500 lg:scale-100 lg:opacity-100 ${mobileScale} ${mobileOpacity}`}
                    >
                      <div className={`group h-full p-8 sm:p-12 lg:p-10 rounded-[48px] flex flex-col relative transition-all duration-500 border-2 ${isPopular
                        ? 'bg-white border-[#2A9D8F] shadow-[0_40px_100px_-20px_rgba(42,157,143,0.22)] lg:scale-[1.05] lg:-translate-y-4 z-20'
                        : 'bg-white/40 glass border-white/60 hover:border-[#2A9D8F]/30 hover:bg-white/80 shadow-sm hover:shadow-2xl hover:-translate-y-2'}`}>

                        {isPopular && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#2A9D8F] text-white px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center gap-2 whitespace-nowrap z-30">
                            <Stars size={14} className="animate-pulse" />
                            {badgeText}
                          </div>
                        )}

                        <div className={`w-16 h-16 sm:w-20 rounded-[28px] flex items-center justify-center mb-10 transition-all duration-700 group-hover:rotate-[8deg] ${isPopular ? 'bg-[#2A9D8F] text-white shadow-2xl shadow-[#2A9D8F]/30' : 'bg-gray-900 text-white'}`}>
                          <Icon size={32} className="group-hover:scale-110 transition-transform" />
                        </div>

                        <div className="mb-10">
                          <h3 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tighter group-hover:text-[#2A9D8F] transition-colors">{plan.name}</h3>
                          <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed min-h-[48px] opacity-80">{plan.description}</p>
                        </div>

                        <div className="mb-10">
                          {(plan.base_price || plan.price) ? (
                            <div className="flex flex-col">
                              {(() => {
                                const currentCycle = billingCycles.find(c => c.key === billingCycle) || { duration_months: 1, discount_percentage: 0, label: 'Monthly' };
                                const basePrice = plan.base_price || plan.price;
                                const planDiscount = plan.plan_discount_percentage || 0;

                                // Discount Logic:
                                // 1. Check for specific cycle discount in plan.cycle_discounts
                                // 2. Fallback to global billing cycle discount
                                let cycleDiscount = 0;
                                if (plan.cycle_discounts && plan.cycle_discounts[billingCycle] !== undefined && plan.cycle_discounts[billingCycle] !== null) {
                                  cycleDiscount = plan.cycle_discounts[billingCycle];
                                } else {
                                  cycleDiscount = currentCycle.discount_percentage || 0;
                                }

                                // Calculate the final price after all discounts
                                // Formula: Base * (1 - PlanSale%) * (1 - CycleDiscount%)
                                const priceAfterPlanDiscount = basePrice * (1 - (planDiscount / 100));
                                const discountedMonthPrice = Math.floor(priceAfterPlanDiscount * (1 - (cycleDiscount / 100)));

                                const totalPeriodPrice = discountedMonthPrice * currentCycle.duration_months;
                                const hasDiscount = discountedMonthPrice < basePrice;

                                return (
                                  <>
                                    <div className="flex flex-col gap-1">
                                      {hasDiscount && (
                                        <div className="flex items-center gap-2 mb-1 h-8">
                                          <span className="text-xl sm:text-2xl font-bold text-gray-400 line-through decoration-red-500/50 decoration-2">
                                            ₹{basePrice.toLocaleString()}
                                          </span>
                                          {(planDiscount > 0 || cycleDiscount > 0) && (
                                            <span className="bg-red-50 text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                              Save {Math.round((1 - (discountedMonthPrice / basePrice)) * 100)}%
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {!hasDiscount && <div className="h-8" />}
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-2xl sm:text-4xl font-black text-gray-300">₹</span>
                                        <span className="text-6xl sm:text-8xl font-black text-gray-900 tracking-tighter tabular-nums leading-none">
                                          {discountedMonthPrice.toLocaleString()}
                                        </span>
                                        <span className="text-gray-400 font-bold text-lg sm:text-2xl tracking-tighter ml-1">/mo</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col mt-4 ml-1 gap-2">
                                      <span className="text-[#2A9D8F] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] leading-none">
                                        {currentCycle.duration_months === 1
                                          ? 'Billed Monthly'
                                          : `Billed ${currentCycle.label} (₹${totalPeriodPrice.toLocaleString()})`
                                        }
                                      </span>
                                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.1em]">+ 18% GST Apply</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="h-[120px] flex items-center">
                              <div className="text-5xl font-black text-gray-900 tracking-tight">Custom</div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 mb-12 flex-1">
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Core Benefits:</div>
                          {plan.features.slice(0, 6).map((feature, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-4 group/feature">
                              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isPopular ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' : 'bg-gray-100 text-gray-400 group-hover/feature:bg-[#2A9D8F]/10 group-hover/feature:text-[#2A9D8F]'}`}>
                                <Check size={14} className="stroke-[3]" />
                              </div>
                              <span className="text-gray-700 font-bold text-[13px] sm:text-sm leading-tight group-hover/feature:text-gray-900 transition-colors">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Link
                          href={plan.use_custom_builder ? '/custom-plan' : `/register?plan=${planKey}&billing=${billingCycle}`}
                          className={`w-full py-6 rounded-[32px] font-black text-center text-sm sm:text-base transition-all tracking-[0.2em] uppercase hover:scale-[1.05] active:scale-[0.98] flex items-center justify-center ${isPopular
                            ? 'bg-[#2A9D8F] text-white shadow-[0_20px_40px_-10px_rgba(42,157,143,0.4)] hover:brightness-110'
                            : 'bg-gray-900 text-white hover:bg-[#2A9D8F] shadow-xl'
                            }`}
                        >
                          {plan.button_text || (plan.use_custom_builder ? 'Build Your Plan' : 'Get Started Now')}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
