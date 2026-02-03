'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Zap, Sparkles, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import data from '../data/landing-data.json';

const IconMap = {
  starter: Zap,
  professional: Sparkles,
  enterprise: Building2,
};

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [activeIndex, setActiveIndex] = useState(1); // center plan by default
  const { pricing } = data;
  const plans = pricing.plans;
  const sliderRef = useRef(null);

  const scrollToIndex = (index, smooth = true) => {
    const node = sliderRef.current;
    if (!node || !node.children[index]) return;
    const slide = node.children[index];
    const offset = slide.offsetLeft - (node.clientWidth - slide.clientWidth) / 2;
    node.scrollTo({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToIndex(activeIndex, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
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
    setActiveIndex(closest);
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
          <div className="inline-flex items-center gap-3 bg-white px-4 sm:px-6 py-2 rounded-2xl shadow-sm border border-gray-100 mb-6 sm:mb-10">
            <Sparkles size={16} className="sm:w-[18px] sm:h-[18px] text-[#2A9D8F]" />
            <span className="text-gray-900 text-[11px] sm:text-[12px] font-black uppercase tracking-[0.3em]">{pricing.badge}</span>
          </div>
          <h2
            id="pricing-heading"
            className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-black text-gray-900 mb-8 sm:mb-14 leading-[0.9] tracking-tighter px-2"
          >
            {pricing.title} <span className="gradient-text italic font-serif">{pricing.titleHighlight}</span>
          </h2>

          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            <span className={`text-sm sm:text-base font-black uppercase tracking-widest ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-300'} transition-colors`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              aria-label={`Switch to ${billingCycle === 'monthly' ? 'yearly' : 'monthly'} billing`}
              aria-checked={billingCycle === 'yearly'}
              role="switch"
              className="w-14 h-8 sm:w-20 sm:h-10 bg-gray-900 rounded-full p-1.5 relative flex items-center shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 min-h-[44px] min-w-[56px] sm:min-w-[80px]"
            >
              <div
                className={`w-5 h-5 sm:w-7 sm:h-7 bg-[#2A9D8F] rounded-full shadow-lg transition-all duration-300 ${billingCycle === 'yearly' ? 'translate-x-6 sm:translate-x-9' : 'translate-x-0'}`}
              />
            </button>
            <div className="flex flex-col items-start leading-none">
              <span className={`text-sm sm:text-base font-black uppercase tracking-widest ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-300'} transition-colors`}>
                Yearly
              </span>
              <span className="text-[#2A9D8F] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-1">Save 25%</span>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="absolute inset-y-0 left-0 right-0 pointer-events-none bg-gradient-to-r from-[#F8FAFC] via-transparent to-[#F8FAFC]" />

          <div className="flex justify-between items-center mb-4 sm:mb-6 px-4 sm:px-6">
            <button
              aria-label="Previous plan"
              onClick={() => adjustIndex(-1)}
              className="rounded-full p-3 bg-white shadow-lg border border-gray-100 hover:scale-105 active:scale-95 transition disabled:opacity-40"
              disabled={activeIndex === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label="Next plan"
              onClick={() => adjustIndex(1)}
              className="rounded-full p-3 bg-white shadow-lg border border-gray-100 hover:scale-105 active:scale-95 transition disabled:opacity-40"
              disabled={activeIndex === plans.length - 1}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-2 sm:px-4 pb-4 scrollbar-hide scroll-smooth"
            role="list"
            aria-label="Subscription plans"
          >
            {plans.map((plan, index) => {
              const Icon = IconMap[plan.id] || Sparkles;
              const distance = Math.abs(activeIndex - index);
              const scaleClass = distance === 0 ? 'scale-[1.02] sm:scale-[1.06]' : distance === 1 ? 'scale-[0.94]' : 'scale-[0.9]';
              const opacityClass = distance === 0 ? 'opacity-100' : 'opacity-70';

              return (
                <article
                  key={plan.id}
                  role="listitem"
                  aria-label={`${plan.name} plan - ${plan.price ? `₹${plan.price} per month` : 'Custom pricing'}`}
                  className={`snap-center shrink-0 w-[82vw] sm:w-[70vw] md:w-[420px] lg:w-[460px] transition-transform duration-500 ${scaleClass} ${opacityClass}`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                >
                  <div className={`p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-[40px] md:rounded-[48px] h-full flex flex-col relative shadow-2xl transition-all duration-500 ${plan.popular ? 'bg-white border-2 border-white shadow-[0_30px_80px_rgba(0,0,0,0.12)]' : 'glass border border-gray-100 hover:bg-white/60'}`}>
                    {plan.popular && (
                      <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 bg-[#2A9D8F] text-white px-4 sm:px-8 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] shadow-xl shadow-[#2A9D8F]/20">
                        Most Popular
                      </div>
                    )}

                    <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-[28px] flex items-center justify-center mb-8 sm:mb-12 shadow-2xl ${plan.popular ? 'bg-[#2A9D8F] text-white' : 'bg-[#0F172A] text-white opacity-90'}`}>
                      <Icon size={28} className="sm:w-9 sm:h-9 md:w-[36px] md:h-[36px]" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tighter">{plan.name}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm font-bold mb-8 sm:mb-14 leading-relaxed opacity-70">{plan.description}</p>

                    <div className="mb-8 sm:mb-14">
                      {plan.price ? (
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-black text-gray-300">₹</span>
                            <span className="text-5xl sm:text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-none">
                              {billingCycle === 'yearly' ? Math.floor(plan.price * 12 * 0.75) : plan.price}
                            </span>
                            <span className="text-gray-400 font-black text-[10px] sm:text-xs uppercase tracking-widest pb-2">
                              /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                          <span className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-2">+ 18% GST</span>
                        </div>
                      ) : (
                        <div className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tighter">Custom</div>
                      )}
                    </div>

                    <div className="space-y-4 sm:space-y-6 mb-10 sm:mb-16 flex-1">
                      {plan.features.map(feature => (
                        <div key={feature} className="flex items-center gap-3 sm:gap-4 group">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-colors">
                            <Check size={12} className="text-emerald-500 group-hover:text-white" />
                          </div>
                          <span className="text-gray-900 font-black text-xs sm:text-sm uppercase tracking-wider opacity-80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={`/register?plan=${plan.id}&billing=${billingCycle}`}
                      aria-label={`${plan.price ? `Choose ${plan.name} plan` : `Contact sales for ${plan.name}`}`}
                      className={`w-full py-4 sm:py-5 md:py-6 rounded-2xl sm:rounded-[28px] font-black text-center text-base sm:text-lg transition-all tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] min-h-[48px] flex items-center justify-center ${plan.popular
                        ? 'bg-[#2A9D8F] text-white shadow-2xl shadow-[#2A9D8F]/30 hover:brightness-110'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-white shadow-sm'
                        }`}
                    >
                      {plan.price ? 'Choose Plan' : 'Contact Sales'}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex justify-center gap-3 mt-6 sm:mt-8">
            {plans.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveIndex(idx);
                  scrollToIndex(idx);
                }}
                aria-label={`Go to ${plans[idx].name} plan`}
                className={`h-2.5 rounded-full transition-all ${idx === activeIndex ? 'bg-[#2A9D8F] w-8' : 'bg-gray-300 w-2.5'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
