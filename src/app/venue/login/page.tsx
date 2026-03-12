"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#d4af37] text-center mb-2">CRM מועדון</h1>
        <p className="text-zinc-500 text-sm text-center mb-6">
          דמו: democlub/demo123 | theblock/block123
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">שם המועדון</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/70"
              placeholder="democlub"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1">סיסמה (שם המועדון)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#111111] border border-[#d4af37]/40 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/70"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-[#d4af37] text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#d4af37] hover:bg-[#f0d78c] disabled:opacity-50 text-[#0a0a0a] rounded-xl font-semibold transition"
          >
            {loading ? "מתחבר..." : "התחבר"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <Link href="/admin/login" className="block text-zinc-500 text-sm hover:text-white transition">
            מנהל מערכת (admin) — כל המועדונים
          </Link>
          <Link href="/results" className="block text-zinc-500 text-sm hover:text-white transition">
            ← חזרה לאתר
          </Link>
        </div>
      </div>
    </div>
  );
}
