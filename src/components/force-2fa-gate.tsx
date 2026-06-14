"use client";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { TotpSetupCard } from "@/components/totp-setup-card";

export function Force2faGate({ venueName }: { venueName: string }) {
  const router = useRouter();
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-6 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-xl font-semibold text-ink mb-1">נדרש אימות דו-שלבי</h1>
          <p className="text-sm text-ink-muted">
            להגנת החשבון של {venueName}, יש להפעיל אימות דו-שלבי (2FA) לפני הכניסה למערכת.
          </p>
        </div>
        <TotpSetupCard totpEnabled={false} onEnabled={() => router.refresh()} />
      </div>
    </div>
  );
}
