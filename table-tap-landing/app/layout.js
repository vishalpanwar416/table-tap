import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { ModalProvider } from "./context/ModalContext";
import StructuredData from "./components/StructuredData";

// Lazy load modal - it's hidden initially and interaction-only
import LeadModal from "./components/LeadModal";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL('https://table-tap.in'),
  title: {
    default: "Table Tap - QR Based Restaurant Ordering System India | Digital Menu & Contactless Ordering",
    template: "%s | Table Tap - Restaurant Ordering System"
  },
  description: "India's leading QR-based restaurant ordering system. Transform your restaurant with digital menus, contactless ordering, Swiggy & Zomato integration. Reduce wait times by 40%, increase revenue by 25%. Start free trial today. ₹999/month.",
  keywords: [
    // Primary keywords
    "QR code restaurant ordering system",
    "digital menu for restaurants India",
    "contactless ordering system",
    "restaurant QR menu",
    // Location-specific
    "restaurant ordering software India",
    "restaurant management system Hyderabad",
    "digital menu India",
    "QR ordering Bangalore",
    "restaurant POS Mumbai",
    "cafe ordering system Delhi",
    // Feature keywords
    "Swiggy Zomato integration",
    "restaurant order management",
    "table ordering system",
    "restaurant inventory management",
    "restaurant staff management",
    // Long-tail keywords
    "best QR code menu app for restaurants",
    "how to create digital menu for restaurant",
    "restaurant ordering without app download",
    "unified restaurant order dashboard",
    // Industry terms
    "restaurant technology solutions",
    "hospitality management software",
    "food service technology",
    "restaurant automation",
    "smart restaurant solutions"
  ],
  authors: [{ name: "Table Tap", url: "https://table-tap.in" }],
  creator: "Table Tap",
  publisher: "Table Tap",
  category: "Technology",
  classification: "Restaurant Software",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://table-tap.in",
    siteName: "Table Tap",
    title: "Table Tap - QR Based Restaurant Ordering System | Digital Menu India",
    description: "Transform your restaurant with India's best QR-based ordering system. Digital menus, Swiggy & Zomato integration, real-time orders. Start free trial - ₹999/month.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Table Tap - QR Based Restaurant Ordering System for Indian Restaurants",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tabletap",
    creator: "@tabletap",
    title: "Table Tap - QR Restaurant Ordering System India",
    description: "Digital menu & contactless ordering for restaurants. Swiggy & Zomato integration. Reduce wait times 40%. Free trial available!",
    images: {
      url: "/og-image.png",
      alt: "Table Tap Restaurant Ordering System",
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual Google Search Console verification code
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  alternates: {
    canonical: "https://table-tap.in",
    languages: {
      "en-IN": "https://table-tap.in",
    },
  },
  other: {
    "msapplication-TileColor": "#2A9D8F",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Table Tap",
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  themeColor: "#2A9D8F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", // safe area for notched devices
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className="scroll-smooth" dir="ltr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="geo.region" content="IN-TG" />
        <meta name="geo.placename" content="Hyderabad" />
        <meta name="geo.position" content="17.385044;78.486671" />
        <meta name="ICBM" content="17.385044, 78.486671" />
        <StructuredData />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <ModalProvider>
          {children}
          <LeadModal />
        </ModalProvider>
      </body>
    </html>
  );
}
