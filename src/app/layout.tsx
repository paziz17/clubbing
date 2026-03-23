import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { Providers } from "@/components/Providers";
import { ConditionalLogoHeader } from "@/components/ConditionalLogoHeader";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-clubing",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Clubing — Join The Party!",
  description: "גלה אירועים, מסיבות ומועדונים בהתאם לטעמך",
  applicationName: "Clubing",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${rubik.variable} font-sans antialiased`}>
        <Providers>
          <div className="relative z-10">
            <ConditionalLogoHeader />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
