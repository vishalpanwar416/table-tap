import siteConfig from '../data/site-config.json';

export default function StructuredData({ settings }) {
  const company = settings?.company_details || {};
  const social = settings?.social_links || {};
  const { site, contact: siteContact, assets, pricing: sitePricing, map } = siteConfig;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": company.name || site.name,
    "url": company.website || site.baseUrl,
    "logo": settings?.system_logo?.url || assets.logoUrl,
    "description": "Table Tap helps restaurants deliver exceptional guest experiences through seamless QR-based digital ordering.",
    "foundingDate": "2024",
    "founders": [
      {
        "@type": "Person",
        "name": "Table Tap Team"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": company.city || siteContact.city,
      "addressRegion": company.state || siteContact.state,
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": company.phone || siteContact.phoneFormatted,
      "contactType": "sales",
      "email": company.email || siteContact.email,
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      social.twitter || "https://twitter.com/tabletap",
      social.linkedin || "https://www.linkedin.com/company/tabletap",
      social.instagram || "https://www.instagram.com/tabletap"
    ]
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Table Tap",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "abstract": "An AI-powered restaurant operating system specializing in QR-based ordering, predictive analytics, and automated guest engagement.",
    "knowsAbout": [
      "AI Restaurant Solutions",
      "Predictive Inventory Management",
      "Sentiment Analysis for Hospitality",
      "Contactless Digital Ordering",
      "Restaurant ROI Optimization"
    ],
    "offers": [
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "price": String(sitePricing.starterMonthly),
        "priceCurrency": "INR",
        "priceValidUntil": sitePricing.priceValidUntil,
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Professional Plan",
        "price": String(sitePricing.professionalMonthly),
        "priceCurrency": "INR",
        "priceValidUntil": sitePricing.priceValidUntil,
        "availability": "https://schema.org/InStock"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI-Powered Guest Predictive Ordering",
      "Real-time QR Code Menu Management",
      "Automated Sentiment Analysis for Reviews",
      "Swiggy & Zomato Unified Dashboard",
      "Inventory Forecasting AI",
      "WhatsApp Business API Integration",
      "Multi-lingual Digital Menus"
    ],
    "screenshot": `${site.baseUrl}/og-image.png`,
    "softwareVersion": "1.0",
    "author": {
      "@type": "Organization",
      "name": company.name || site.name
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Table Tap?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Table Tap is a QR-based restaurant ordering system that allows guests to scan a QR code at their table, browse the menu, and place orders directly from their phone without downloading any app."
        }
      },
      {
        "@type": "Question",
        "name": "How much does Table Tap cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Table Tap offers flexible pricing starting at ₹999/month for the Starter plan, ₹1999/month for the Professional plan with Swiggy & Zomato integration, and custom Enterprise pricing for restaurant chains."
        }
      },
      {
        "@type": "Question",
        "name": "Does Table Tap integrate with Swiggy and Zomato?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Table Tap's Professional and Enterprise plans include seamless integration with Swiggy and Zomato, allowing you to manage all orders from a single unified dashboard."
        }
      },
      {
        "@type": "Question",
        "name": "How quickly can I set up Table Tap?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Table Tap can be set up in as little as 15 minutes. Simply create your menu, generate QR codes for each table, and you're ready to start receiving orders."
        }
      },
      {
        "@type": "Question",
        "name": "Do customers need to download an app to order?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, Table Tap works directly in the customer's browser. Guests simply scan the QR code and can immediately browse the menu and place orders without downloading anything."
        }
      },
      {
        "@type": "Question",
        "name": "How does Table Tap use AI for restaurants?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Table Tap utilizes generative AI and machine learning to provide predictive ordering, automated guest sentiment analysis, and intelligent inventory forecasting. Our AI helps restaurants reduce waste and increase average order value through smart upselling."
        }
      },
      {
        "@type": "Question",
        "name": "Is Table Tap available in India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Table Tap is designed specifically for Indian restaurants with support for INR pricing, GST compliance, and integration with popular Indian food delivery platforms like Swiggy and Zomato."
        }
      }
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": company.name || site.name,
    "@id": company.website || site.baseUrl,
    "url": company.website || site.baseUrl,
    "telephone": company.phone || siteContact.phoneFormatted,
    "email": company.email || siteContact.email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": company.city || siteContact.city,
      "addressRegion": company.state || siteContact.state,
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": String(map.defaultCenter.lat),
      "longitude": String(map.defaultCenter.lng)
    },
    "priceRange": "₹₹",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": site.baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Features", "item": `${site.baseUrl}/#features` },
      { "@type": "ListItem", "position": 3, "name": "Pricing", "item": `${site.baseUrl}/#pricing` },
      { "@type": "ListItem", "position": 4, "name": "Contact", "item": `${site.baseUrl}/#contact` }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
