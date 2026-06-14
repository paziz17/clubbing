"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/venue/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && data.ok) router.push("/venue/admin/dashboard");
    else setError(data.error ?? "סיסמה שגויה");
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg,#06060A,#0B0B15 50%,#06060A)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-gold" />
          </div>
          <div className="font-display text-3xl text-gold-gradient tracking-[0.3em]">CLUBBING</div>
          <div className="text-[11px] text-ink-dim tracking-[0.35em] uppercase mt-1">Platform Admin</div>
        </div>

        <form onSubmit={onSubmit} className="bg-bg-soft border border-line rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-2">סיסמת מנהל פלטפורמה</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10 pl-10 w-full"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />{error}
            </div>
          )}
          <button disabled={loading} className="btn-gold w-full h-11 text-sm font-semibold">
            {loading ? "מתחבר..." : "כניסה לפאנל-על"}
          </button>
        </form>
      </div>
    </div>
  );
}
