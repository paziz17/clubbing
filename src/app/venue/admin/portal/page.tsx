"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ShieldCheck } from "lucide-react";

type Step = "credentials" | "totp";

export default function AdminPortalPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    const res = await fetch("/api/venue/admin/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json(); setLoading(false);
    if (data.ok) { router.push("/venue/admin/dashboard"); return; }
    if (data.needsTotp) { setStep("totp"); setTimeout(() => totpRefs.current[0]?.focus(), 100); return; }
    setError(data.error ?? "פרטי גישה שגויים");
  }

  async function onTotp(e: React.FormEvent) {
    e.preventDefault();
    const code = totp.join(""); if (code.length < 6) { setError("הזן 6 ספרות"); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/venue/admin/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, totpToken: code }),
    });
    const data = await res.json(); setLoading(false);
    if (data.ok) { router.push("/venue/admin/dashboard"); return; }
    setError(data.error ?? "קוד שגוי"); setTotp(["","","","","",""]); setTimeout(() => totpRefs.current[0]?.focus(), 50);
  }

  function onDigitInput(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...totp]; next[i] = d; setTotp(next);
    if (d && i < 5) totpRefs.current[i + 1]?.focus();
    if (!d && i > 0) totpRefs.current[i - 1]?.focus();
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #06060A 0%, #0B0B15 50%, #06060A 100%)" }}>
      <AnimatePresence mode="wait">
        {step === "credentials" && (
          <motion.div key="creds" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="w-full max-w-md bg-bg-card border border-gold/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center mb-8">
              <img src="/icons/logo.png" alt="" className="w-16 h-16 rounded-2xl mb-4 object-contain" />
              <h2 className="text-lg font-semibold text-ink">כניסה למערכת</h2>
            </div>
            <form onSubmit={onCredentials} className="space-y-4">
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim" />
                <input value={username} onChange={e => setUsername(e.target.value)} className="input pr-10 w-full" placeholder="שם משתמש" autoComplete="username" required />
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input pr-10 w-full" placeholder="סיסמה" autoComplete="current-password" required />
              </div>
              {error && <div className="px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
              <button disabled={loading} className="btn-gold w-full h-11 text-sm font-semibold">{loading ? "מתחבר..." : "כניסה"}</button>
            </form>
          </motion.div>
        )}
        {step === "totp" && (
          <motion.div key="totp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="w-full max-w-md bg-bg-card border border-gold/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center"><ShieldCheck className="w-8 h-8 text-gold" /></div>
            </div>
            <form onSubmit={onTotp} className="space-y-6">
              <div className="flex gap-2.5 justify-center" dir="ltr"
                onPaste={e => { const t = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6); if (t.length===6) { setTotp(t.split("")); totpRefs.current[5]?.focus(); e.preventDefault(); } }}>
                {totp.map((d, i) => (
                  <input key={i} ref={el => { totpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => onDigitInput(i, e.target.value)}
                    onKeyDown={e => { if (e.key==="Backspace" && !d && i>0) totpRefs.current[i-1]?.focus(); }}
                    className="w-14 h-16 text-center text-3xl font-bold rounded-xl border-2 bg-bg-elevated text-gold outline-none transition-all"
                    style={{ borderColor: d ? "#D4AF37" : "#23232F" }} />
                ))}
              </div>
              {error && <div className="px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm text-center">{error}</div>}
              <button disabled={loading || totp.join("").length < 6} className="btn-gold w-full h-11 text-sm font-semibold">{loading ? "מאמת..." : "כניסה"}</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
