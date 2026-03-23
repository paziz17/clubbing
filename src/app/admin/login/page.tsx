"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClubingPageShell } from "@/components/ClubingPageShell";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingGlassCard, clubingGoldCta, clubingInput, clubingMutedLink } from "@/lib/clubing-ui";

export default function AdminLoginPage() {
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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה בהתחברות");
        return;
      }
      router.push("/admin");
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
            כניסת מנהל מערכת
          </ClubingHeading>
          <p className="text-sm text-zinc-500">
            CRM מלא — כל המועדונים, האירועים וההזמנות במקום אחד
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            דמו מקומי: <span className="text-zinc-400">admin</span> / <span className="text-zinc-400">admin</span>
            <br />
            בייצור חובה להגדיר <span className="text-zinc-500">ADMIN_USERNAME</span>,{" "}
            <span className="text-zinc-500">ADMIN_PASSWORD</span> ו־<span className="text-zinc-500">ADMIN_SECRET</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={clubingInput}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">סיסמה</label>
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
          <Link href="/venue/login" className={`block ${clubingMutedLink}`}>
            כניסת מועדון בודד — רק האירועים שלי
          </Link>
          <Link href="/results" className={`block ${clubingMutedLink}`}>
            ← חזרה לאתר
          </Link>
        </div>
      </div>
    </ClubingPageShell>
  );
}
