"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingGlassCard, clubingGoldCta, clubingInput, clubingMutedLink } from "@/lib/clubing-ui";

export default function VenueLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/venue/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה בהתחברות");
        return;
      }
      router.push("/venue");
    } catch {
      setError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClubingPageShell contentClassName="flex flex-col items-center justify-center px-6 py-12">
      <div className={`w-full max-w-sm space-y-6 p-7 ${clubingGlassCard}`}>
        <div className="text-center">
          <ClubingHeading size="lg" className="mb-2 block">
            CRM מועדון
          </ClubingHeading>
          <p className="text-sm text-zinc-500">
            דמו: <span className="text-zinc-400">goldroom</span> / <span className="text-zinc-400">club123</span>
            {" · "}
            <span className="text-zinc-400">basementjaffa</span> / <span className="text-zinc-400">club123</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">שם המועדון</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={clubingInput}
              placeholder="goldroom"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">סיסמה (שם המועדון)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={clubingInput}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          <button type="submit" disabled={loading} className={clubingGoldCta}>
            {loading ? "מתחבר..." : "התחבר"}
          </button>
        </form>

        <div className="space-y-2 text-center text-sm">
          <Link href="/admin/login" className={`block ${clubingMutedLink}`}>
            מנהל מערכת (admin) — כל המועדונים
          </Link>
          <Link href="/results" className={`block ${clubingMutedLink}`}>
            ← חזרה לאתר
          </Link>
        </div>
      </div>
    </ClubingPageShell>
  );
}
