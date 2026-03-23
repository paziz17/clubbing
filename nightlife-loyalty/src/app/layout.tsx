import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "NightLife Loyalty | פלטפורמת נאמנות למועדונים",
  description: "סגור את הערב - צבר קרדיטים, קבל הטבות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
