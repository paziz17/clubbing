import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Providers } from "@/components/Providers";
import { LogoHeader } from "@/components/LogoHeader";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Clubbing — Join the Party",
  description: "גלה אירועים, מסיבות ומועדונים בהתאם לטעמך",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <Providers>
          <LogoHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
