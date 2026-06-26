import type { Metadata, Viewport } from "next";
import { Inter, Cinzel, Frank_Ruhl_Libre } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";

const body = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

const display = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Elegant Hebrew serif for premium display text (venue name, etc.)
const displayHe = Frank_Ruhl_Libre({
  subsets: ["hebrew"],
  variable: "--font-display-he",
  display: "swap",
  weight: ["500", "700", "900"],
});

export const metadata: Metadata = {
  title: "CLUBBING · Tel Aviv Nightlife",
  description:
    "פלטפורמת חיי הלילה המלאה — אירועים, כרטיסים, Club-it loyalty ופאנל ניהול למועדונים",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CLUBBING",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#06060A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${body.variable} ${display.variable} ${displayHe.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
