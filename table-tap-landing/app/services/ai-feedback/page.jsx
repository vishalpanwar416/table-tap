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
            <section className="pt-32 pb-24 bg-rose-50 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-rose-100 text-rose-600 font-bold text-sm mb-6 uppercase tracking-widest border border-rose-200">
                        Listen with AI
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
                        Turn Feedback <br />
                        <span className="text-rose-500 Into Growth.">Into Growth.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Every guest has a story. Our AI reads between the lines of every review and feedback note, identifying trends that human eyes miss. Respond faster and smarter with Table Tap AI.
                    </p>
                    <div className="flex flex-wrap justify-center gap-5">
                        <button className="px-10 py-5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all shadow-2xl">Start Listening to Your Guests</button>
                    </div>
                </div>
            </section>

            {/* AI Feedback Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <MessageSquare className="text-rose-500 w-8 h-8" />,
                                title: "Sentiment Analysis",
                                desc: "Our AI automatically categorizes feedback as positive, neutral, or negative, allowing you to prioritize dissatisfied guests instantly."
                            },
                            {
                                icon: <Languages className="text-rose-500 w-8 h-8" />,
                                title: "Multilingual Support",
                                desc: "No matter what language your guests speak, our AI translates and analyzes feedback for consistent intelligence."
                            },
                            {
                                icon: <Sparkles className="text-rose-500 w-8 h-8" />,
                                title: "Smart Reply Suggestions",
                                desc: "Respond to Google Reviews and private feedback in seconds with context-aware, professional response drafts."
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:border-rose-500/20 transition-all">
                                <div className="mb-8 p-4 bg-white rounded-2xl w-fit shadow-sm">{item.icon}</div>
                                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
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
