import Header from '../components/Header';
import Footer from '../components/Footer';
import Contact from '../components/Contact';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ArrowRight, Quote, TrendingUp, Clock, Zap } from 'lucide-react';

export const metadata = {
    title: "Customer Success Stories | How Restaurants Grow with Table Tap",
    description: "Read how leading restaurants in India reduced wait times, increased average order value, and improved guest satisfaction using Table Tap's AI-powered QR system.",
    keywords: ["restaurant success stories", "Table Tap case studies", "QR menu ROI", "restaurant growth India"]
};

const stories = [
    {
        restaurant: "The Urban Brew Cafe",
        location: "Bangalore",
        result: "+22% Revenue",
        impact: "AI-driven upselling increased dessert and beverage sales by 22% in the first quarter.",
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800",
        href: "/success-stories/urban-brew"
    },
    {
        restaurant: "Spice Route Fine Dine",
        location: "Mumbai",
        result: "40% Faster Service",
        impact: "Digital ordering reduced peak-hour table turnaround time by 15 minutes per guest.",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
        href: "/success-stories/spice-route"
    },
    {
        restaurant: "Social Bytes QSR",
        location: "Hyderabad",
        result: "Zero Order Errors",
        impact: "Automated KDS integration eliminated manual entry errors and improved kitchen efficiency.",
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
        href: "/success-stories/social-bytes"
    }
];

export default function SuccessStories() {
    return (
        <main className="min-h-screen bg-slate-50">
            <Header />

            <section className="pt-32 pb-20 bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-bold text-sm mb-6">
                        <Star size={16} fill="currentColor" /> Proven Results
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">
                        Stories of <span className="gradient-text">Growth.</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                        See how over 500+ restaurants are using Table Tap to redefine hospitality and maximize their profits.
                    </p>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {stories.map((story, i) => (
                            <Link href={story.href} key={i} className="group bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all">
                                <div className="h-64 relative overflow-hidden">
                                    <Image src={story.image} alt={story.restaurant} width={800} height={400} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl font-black text-slate-900 text-sm shadow-xl">
                                        {story.result}
                                    </div>
                                </div>
                                <div className="p-8">
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">{story.location}</p>
                                    <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{story.restaurant}</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                                        {story.impact}
                                    </p>
                                    <span className="flex items-center gap-2 font-black text-slate-900 text-sm group-hover:gap-4 transition-all">
                                        Read Case Study <ArrowRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Breakdown */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    <h2 className="text-4xl font-black text-center mb-16 italic">Average Partner Impact:</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <div>
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <TrendingUp className="text-emerald-400" size={32} />
                            </div>
                            <h4 className="text-5xl font-black mb-2">15%</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Revenue Growth</p>
                        </div>
                        <div>
                            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                                <Clock className="text-blue-400" size={32} />
                            </div>
                            <h4 className="text-5xl font-black mb-2">35%</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Faster Turnaround</p>
                        </div>
                        <div>
                            <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                                <Zap className="text-orange-400" size={32} />
                            </div>
                            <h4 className="text-5xl font-black mb-2">99%</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Order Accuracy</p>
                        </div>
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
