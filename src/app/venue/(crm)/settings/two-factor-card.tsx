"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

export default function TwoFactorCard({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [stage, setStage] = useState<"idle" | "setup" | "disabling">("idle");
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSetup() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/venue/2fa/setup", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setSecret(data.secret);
      setQr(data.qr);
      setStage("setup");
      setCode("");
    } else setError(data.error ?? "שגיאה");
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/venue/2fa/enable", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, code }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && data.ok) {
      setEnabled(true);
      setStage("idle");
      setSecret("");
      setQr("");
    } else setError(data.error ?? "קוד שגוי");
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/venue/2fa/disable", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && data.ok) {
      setEnabled(false);
      setStage("idle");
      setCode("");
    } else setError(data.error ?? "קוד שגוי");
  }

  return (
    <div className="bg-bg-card border border-line rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? "bg-emerald-400/10" : "bg-bg-elevated"}`}>
            {enabled ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldOff className="w-5 h-5 text-ink-muted" />}
          </div>
          <div>
            <h2 className="font-semibold text-ink">אימות דו-שלבי (2FA)</h2>
            <p className="text-sm text-ink-muted mt-0.5">
              הגנה נוספת לכניסת הבעלים — קוד חד-פעמי מאפליקציית אימות (Google Authenticator / Authy).
            </p>
            <div className="mt-2">
              {enabled ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> מופעל
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-dim" /> כבוי
                </span>
              )}
            </div>
          </div>
        </div>
        {stage === "idle" && (
          <button
            onClick={() => (enabled ? setStage("disabling") : startSetup())}
            disabled={loading}
            className={enabled
              ? "h-9 px-4 rounded-lg border border-danger/40 text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
              : "btn-gold h-9 px-4 text-sm font-semibold"}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : enabled ? "כיבוי" : "הפעלה"}
          </button>
        )}
      </div>

      {stage === "setup" && (
        <form onSubmit={confirmEnable} className="mt-6 pt-6 border-t border-line space-y-4">
          <p className="text-sm text-ink-muted">1. סרוק את הברקוד באפליקציית האימות:</p>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR" className="w-44 h-44 rounded-xl border border-line bg-white p-2" />
          )}
          <p className="text-xs text-ink-dim">
            או הזן ידנית את המפתח: <span className="font-mono text-gold break-all">{secret}</span>
          </p>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">2. הזן את הקוד מהאפליקציה לאישור</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="input w-40 tracking-[0.4em] text-center font-mono"
              placeholder="000000"
              inputMode="numeric"
              required
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStage("idle")} className="h-10 px-5 rounded-lg border border-line text-sm text-ink-muted hover:text-ink">ביטול</button>
            <button disabled={loading} className="btn-gold h-10 px-6 text-sm font-semibold">
              {loading ? "מאמת..." : "הפעל 2FA"}
            </button>
          </div>
        </form>
      )}

      {stage === "disabling" && (
        <form onSubmit={confirmDisable} className="mt-6 pt-6 border-t border-line space-y-4">
          <p className="text-sm text-ink-muted">הזן קוד אימות נוכחי כדי לכבות את ה-2FA:</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="input w-40 tracking-[0.4em] text-center font-mono"
            placeholder="000000"
            inputMode="numeric"
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStage("idle")} className="h-10 px-5 rounded-lg border border-line text-sm text-ink-muted hover:text-ink">ביטול</button>
            <button disabled={loading} className="h-10 px-6 rounded-lg bg-danger text-white text-sm font-semibold hover:bg-danger/90 transition-colors">
              {loading ? "מכבה..." : "כבה 2FA"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
