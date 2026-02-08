export default function StructuredData({ settings }) {
  const company = settings?.company_details || {};
  const social = settings?.social_links || {};

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": company.name || "Table Tap",
    "url": company.website || "https://table-tap.in",
    "logo": settings?.system_logo?.url || "https://vogixryubhpqziivspks.supabase.co/storage/v1/object/public/system-assets/logott.png",
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
      "addressLocality": company.city || "Hyderabad",
      "addressRegion": company.state || "Telangana",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": company.phone || "+91-75009-88212",
      "contactType": "sales",
      "email": company.email || "vishalpanwar416@gmail.com",
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
    "offers": [
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "price": "999",
        "priceCurrency": "INR",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Professional Plan",
        "price": "1999",
        "priceCurrency": "INR",
        "priceValidUntil": "2025-12-31",
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
      "QR Code Menu Ordering",
      "Real-time Order Management",
      "Swiggy & Zomato Integration",
      "Staff Management",
      "Inventory Tracking",
      "AI-Powered Analytics",
      "Multi-Platform Support"
    ],
    "screenshot": "https://table-tap.in/og-image.png",
    "softwareVersion": "1.0",
    "author": {
      "@type": "Organization",
      "name": company.name || "Table Tap"
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
    "name": company.name || "Table Tap",
    "@id": company.website || "https://table-tap.in",
    "url": company.website || "https://table-tap.in",
    "telephone": company.phone || "+91-75009-88212",
    "email": company.email || "vishalpanwar416@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": company.city || "Hyderabad",
      "addressRegion": company.state || "Telangana",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "17.385044",
      "longitude": "78.486671"
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
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://table-tap.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Features",
        "item": "https://table-tap.in/#features"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Pricing",
        "item": "https://table-tap.in/#pricing"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Contact",
        "item": "https://table-tap.in/#contact"
      }
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
