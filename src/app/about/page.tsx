"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showAuth />
      <main className="flex-1 px-6 py-12 max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl text-gray-900 mb-6">אודות</h1>
        <p className="text-gray-600 mb-6">Clubbing - גלה אירועים ומסיבות בהתאם לטעמך.</p>
        <Link href="/" className="text-[#f05537] hover:underline font-medium">← חזרה</Link>
      </main>
      <Footer />
    </div>
  );
}
