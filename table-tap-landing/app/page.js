import dynamic from 'next/dynamic';
import Header from './components/Header';
import Hero from './components/Hero';

// Optimize: Lazy load components below the fold to improve initial load speed
const Services = dynamic(() => import('./components/Services'));
const Features = dynamic(() => import('./components/Features'));
const HowItWorks = dynamic(() => import('./components/HowItWorks'));
const Pricing = dynamic(() => import('./components/Pricing'));
const Contact = dynamic(() => import('./components/Contact'));
const Footer = dynamic(() => import('./components/Footer'));

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Fixed Header */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Services Section */}
      <Services />

      {/* Features Section */}
      <Features />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Pricing Section */}
      <Pricing />

      {/* Contact Section */}
      <Contact />

      {/* Footer */}
      <Footer />
    </main>
  );
}
