import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ModalProvider } from "./context/ModalContext";
import { SettingsProvider } from "./context/SettingsContext";
import StructuredData from "./components/StructuredData";
import LeadModalWrapper from "./components/LeadModalWrapper";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import siteConfig from "./data/site-config.json";
import { getLandingSettings } from "./lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const { site, assets, analytics, pricing } = siteConfig;

export const metadata = {
  metadataBase: new URL(site.baseUrl),
  title: {
    default: "Table Tap - QR Based Restaurant Ordering System India | Digital Menu & Contactless Ordering",
    template: "%s | Table Tap - Restaurant Ordering System"
  },
  description: `India's leading QR-based restaurant ordering system. Transform your restaurant with digital menus, contactless ordering, Swiggy & Zomato integration. Reduce wait times by 40%, increase revenue by 25%. Start free trial today. ₹${pricing.starterMonthly}/month.`,
  keywords: [
    "QR code restaurant ordering system",
    "digital menu for restaurants India",
    "contactless ordering system",
    "restaurant QR menu",
    "restaurant ordering software India",
    "restaurant management system Hyderabad",
    "digital menu India",
    "QR ordering Bangalore",
    "restaurant POS Mumbai",
    "cafe ordering system Delhi",
    "Swiggy Zomato integration",
    "restaurant order management",
    "table ordering system",
    "restaurant inventory management",
    "restaurant staff management",
    "best QR code menu app for restaurants",
    "how to create digital menu for restaurant",
    "restaurant ordering without app download",
    "unified restaurant order dashboard",
    "restaurant technology solutions",
    "hospitality management software",
    "food service technology",
    "restaurant automation",
    "smart restaurant solutions"
  ],
  authors: [{ name: site.name, url: site.baseUrl }],
  creator: site.name,
  publisher: site.name,
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
    locale: site.locale,
    url: site.baseUrl,
    siteName: site.name,
    title: "Table Tap - QR Based Restaurant Ordering System | Digital Menu India",
    description: `Transform your restaurant with India's best QR-based ordering system. Digital menus, Swiggy & Zomato integration, real-time orders. Start free trial - ₹${pricing.starterMonthly}/month.`,
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
    site: site.twitterHandle,
    creator: site.twitterHandle,
    title: "Table Tap - QR Restaurant Ordering System India",
    description: "Digital menu & contactless ordering for restaurants. Swiggy & Zomato integration. Reduce wait times 40%. Free trial available!",
    images: {
      url: "/og-image.png",
      alt: "Table Tap Restaurant Ordering System",
    },
  },
  verification: {
    google: analytics.googleVerification,
  },
  alternates: {
    canonical: site.baseUrl,
    languages: {
      "en-IN": site.baseUrl,
    },
  },
  other: {
    "msapplication-TileColor": "#2A9D8F",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": site.name,
  },
  icons: {
    icon: assets.logoUrl,
    shortcut: assets.logoUrl,
    apple: assets.logoUrl,
  },
};

export const viewport = {
  themeColor: "#2A9D8F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", // safe area for notched devices
};

/** Contact, company, logo, hero: from system_settings when available; site-config is fallback. */
export default async function RootLayout({ children }) {
  const settings = await getLandingSettings();

  return (
    <html lang="en-IN" className="scroll-smooth" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <link rel="icon" href={assets.logoUrl} sizes="any" />
        <link rel="preload" href={assets.logoUrl} as="image" />
        <link rel="preconnect" href={`https://${assets.supabaseStorageHost}`} />
        <link rel="dns-prefetch" href={`https://${assets.supabaseStorageHost}`} />
        <StructuredData settings={settings} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-gray-900`}
        suppressHydrationWarning
      >
        <SettingsProvider initialSettings={settings}>
          <ModalProvider>
            {children}
            <LeadModalWrapper />
            <Analytics />
            <SpeedInsights />
          </ModalProvider>
        </SettingsProvider>
      </body>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${analytics.gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${analytics.gaId}');
        `}
      </Script>
    </html>
  );
}
