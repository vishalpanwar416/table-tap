import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Contact from '../../components/Contact';
import { MessageSquare, Heart, Sparkles, Languages, Zap, Shield } from 'lucide-react';

export const metadata = {
    title: "AI Customer Feedback & Reputation Management | Table Tap AI",
    description: "Understand your guests better with Table Tap AI. Sentiment analysis, automated response suggestions, and real-time feedback loops to improve your restaurant's rating.",
    keywords: ["AI restaurant feedback", "sentiment analysis for food", "automated guest responses", "restaurant reputation management AI"]
};

export default function AIFeedbackSolution() {
    return (
        <main className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-[#F8FAFC]/30">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#E11D48]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2A9D8F]/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <MessageSquare size={16} className="text-[#E11D48]" />
                        <span className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                            Listen with AI
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Turn Feedback <br />
                        <span className="gradient-text">Into Growth.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Every guest has a story. Our AI reads between the lines of every review and feedback note, identifying trends that human eyes miss. Respond faster and smarter with Table Tap AI.
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="btn-premium px-10 py-4 shadow-2xl shadow-[#E11D48]/20 hover:shadow-[#E11D48]/40">Start Listening</button>
                    </div>
                </div>
            </section>

            {/* AI Feedback Features */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <MessageSquare />,
                                title: "Sentiment Analysis",
                                desc: "Our AI automatically categorizes feedback as positive, neutral, or negative, allowing you to prioritize dissatisfied guests instantly."
                            },
                            {
                                icon: <Languages />,
                                title: "Multilingual Support",
                                desc: "No matter what language your guests speak, our AI translates and analyzes feedback for consistent intelligence."
                            },
                            {
                                icon: <Sparkles />,
                                title: "Smart Reply Suggestions",
                                desc: "Respond to Google Reviews and private feedback in seconds with context-aware, professional response drafts."
                            }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-card p-10 rounded-[40px] hover:-translate-y-2 transition-transform duration-300 group"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#E11D48] shadow-lg group-hover:rotate-12 transition-transform">
                                    {React.cloneElement(item.icon, { size: 28 })}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">{item.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Contact />
            <Footer />
        </main>
    );
}
