import { League_Spartan } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "./context/ModalContext";
import LeadModal from "./components/LeadModal";

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  metadataBase: new URL('https://tabletap.in'),
  title: {
    default: "Table Tap - QR Based Restaurant Ordering System | Your Table. Your Time.",
    template: "%s | Table Tap"
  },
  description: "Transform your restaurant with Table Tap's QR-based ordering system. Scan, order, and pay seamlessly. Reduce wait times by 40%, increase revenue by 25%. Free trial available.",
  keywords: [
    "restaurant ordering system",
    "QR code menu",
    "digital menu",
    "contactless ordering",
    "restaurant management",
    "table ordering",
    "restaurant POS",
    "food ordering app",
    "restaurant technology",
    "India restaurant software"
  ],
  authors: [{ name: "Table Tap" }],
  creator: "Table Tap",
  publisher: "Table Tap",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://tabletap.in",
    siteName: "Table Tap",
    title: "Table Tap - QR Based Restaurant Ordering System",
    description: "Transform your restaurant with QR-based ordering. Scan, order, and pay seamlessly. Reduce wait times by 40%.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Table Tap - Restaurant Ordering System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Table Tap - QR Based Restaurant Ordering System",
    description: "Transform your restaurant with QR-based ordering. Scan, order, pay seamlessly.",
    images: ["/og-image.png"],
    creator: "@tabletap",
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://tabletap.in",
  },
};

export const viewport = {
  themeColor: "#2A9D8F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${leagueSpartan.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <ModalProvider>
          {children}
          <LeadModal />
        </ModalProvider>
      </body>
    </html>
  );
}
