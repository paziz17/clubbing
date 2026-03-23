"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { DocumentLang } from "@/components/DocumentLang";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={5 * 60}>
      <LanguageProvider>
        <DocumentLang />
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
