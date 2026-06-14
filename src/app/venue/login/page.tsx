"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function VenueLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/venue/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) router.push(data.redirect ?? "/venue");
    else setError(data.error ?? "שגיאת התחברות — בדוק פרטים");
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex"
      style={{
        background: "linear-gradient(135deg, #06060A 0%, #0B0B15 50%, #06060A 100%)",
      }}
    >
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center px-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(212,175,55,0.15), transparent)",
          }}
        />
        <div className="relative z-10 text-center">
          <div className="font-display text-6xl text-gold-gradient tracking-[0.3em] mb-4">
            CLUBBING
          </div>
          <div className="text-ink-muted text-sm tracking-[0.4em] uppercase mb-12">
            Venue Management Platform
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-right">
            {[
              { n: "🎟️", l: "מכירת כרטיסים ו-QR" },
              { n: "👥", l: "ניהול לקוחות ונאמנות" },
              { n: "📊", l: "דוחות בזמן אמת" },
              { n: "📦", l: "מלאי, עובדים ומשמרות" },
            ].map((s) => (
              <div key={s.l} className="bg-bg-card/50 border border-line/50 rounded-xl p-4">
                <div className="font-display text-2xl text-gold">{s.n}</div>
                <div className="text-xs text-ink-muted mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-[420px] flex flex-col items-center justify-center px-8 py-12 bg-bg-soft border-r border-line">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="mb-10">
            <div className="font-display text-3xl text-gold-gradient tracking-[0.3em] mb-1">
              CLUBBING
            </div>
            <div className="text-xs text-ink-dim tracking-widest uppercase">Venue CRM</div>
          </div>

          <h2 className="text-xl font-semibold text-ink mb-1">כניסה לפאנל ניהול</h2>
          <p className="text-sm text-ink-muted mb-8">הזן את פרטי הגישה שלך כדי להיכנס</p>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-2">שם משתמש</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pr-10"
                  placeholder="mirpeset"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-2">סיסמה</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10 pl-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="btn-gold w-full h-11 text-sm font-semibold"
            >
              {loading ? "מתחבר..." : "כניסה למערכת"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-xs text-ink-dim mb-3 font-medium">חשבונות הדגמה:</p>
            <div className="space-y-2">
              {[
                { user: "mirpeset", label: "מרפסת מלה — רמת ישי" },
              ].map((d) => (
                <button
                  key={d.user}
                  type="button"
                  onClick={() => { setUsername(d.user); setPassword("demo1234"); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-card border border-line hover:border-gold/30 hover:bg-bg-elevated transition-all text-sm text-right"
                >
                  <span className="text-ink-muted">{d.user}</span>
                  <span className="text-ink">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
