import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Clubbing — Join the Party",
  description: "Discover events, parties and clubs that match your vibe",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('clubbing-locale');var d=document.documentElement;if(s==='he'||!s){d.lang='he';d.dir='rtl'}else{d.lang=s;d.dir='ltr'}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${heebo.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
