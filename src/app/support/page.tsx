"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function SupportPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header showAuth />
      <main className="flex-1 px-6 py-12 max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl text-white mb-6">{t("footer.support")}</h1>
        <p className="text-zinc-400 mb-6">
          {t("footer.support") === "תמיכה"
            ? "לשאלות ותמיכה, צרו איתנו קשר במייל: support@clubbing.app"
            : "For questions and support, contact us at: support@clubbing.app"}
        </p>
        <Link href="/" className="text-white border border-white px-6 py-3 inline-block tracking-widest uppercase hover:bg-white hover:text-black transition">
          ← {t("nav.back")}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
