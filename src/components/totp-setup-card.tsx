"use client";
import { useState } from "react";
import { ShieldCheck, ShieldOff, QrCode, CheckCircle2 } from "lucide-react";

interface Props { totpEnabled: boolean; onEnabled?: () => void; }

type SetupStep = "idle" | "scan" | "verify" | "done";

export function TotpSetupCard({ totpEnabled: initialEnabled, onEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<SetupStep>("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setLoading(true); setError(null);
    const res = await fetch("/api/venue/totp/setup");
    const data = await res.json();
    setLoading(false);
    setQr(data.qrDataUrl); setSecret(data.base32); setStep("scan");
  }

  async function confirmCode() {
    const token = code.join("");
    if (token.length < 6) { setError("הזן 6 ספרות"); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/venue/totp/setup", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) { setEnabled(true); setStep("done"); onEnabled?.(); }
    else { setError(data.error ?? "קוד שגוי"); setCode(["","","","","",""]); }
  }

  async function disable2FA() {
    if (!confirm("האם לבטל את האימות הדו-שלבי?")) return;
    setLoading(true);
    await fetch("/api/venue/totp/setup", { method: "DELETE" });
    setLoading(false); setEnabled(false); setStep("idle"); setQr(null); setSecret(null);
  }

  function onCodeInput(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...code]; next[i] = d; setCode(next);
    if (d && i < 5) (document.getElementById(`totp-${i+1}`) as HTMLInputElement)?.focus();
    if (!d && i > 0) (document.getElementById(`totp-${i-1}`) as HTMLInputElement)?.focus();
  }

  return (
    <div className="bg-bg-card border border-line rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-gold/10 border border-gold/25"}`}>
            {enabled ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldOff className="w-5 h-5 text-gold" />}
          </div>
          <div>
            <div className="font-semibold text-ink text-sm">אימות דו-שלבי (2FA)</div>
            <div className="text-xs text-ink-muted mt-0.5">{enabled ? "מופעל — הכניסה מוגנת" : "מומלץ — הגן על חשבונך"}</div>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${enabled ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-gold/10 text-gold border-gold/25"}`}>
          {enabled ? "פעיל" : "כבוי"}
        </span>
      </div>

      {/* Idle — not enabled */}
      {!enabled && step === "idle" && (
        <div>
          <p className="text-sm text-ink-muted mb-4">
            הפעל אימות דו-שלבי עם <strong className="text-ink">Google Authenticator</strong> או <strong className="text-ink">Microsoft Authenticator</strong>.
            בכל כניסה תתבקש להזין קוד בן 6 ספרות.
          </p>
          <button onClick={startSetup} disabled={loading} className="btn-gold h-9 px-5 text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4" /> {loading ? "טוען..." : "הפעל 2FA"}
          </button>
        </div>
      )}

      {/* Step: scan QR */}
      {step === "scan" && qr && (
        <div>
          <p className="text-sm text-ink-muted mb-4">סרוק את ה-QR עם האפליקציה, ואז הזן את הקוד שמופיע:</p>
          <div className="flex flex-col items-center gap-4">
            <img src={qr} alt="QR Code" className="w-48 h-48 rounded-xl border border-line bg-white p-2" />
            {secret && (
              <div className="text-center">
                <div className="text-xs text-ink-dim mb-1">או הזן ידנית:</div>
                <code className="text-xs bg-bg-elevated px-3 py-1.5 rounded-lg text-gold font-mono tracking-widest border border-line">{secret}</code>
              </div>
            )}
            <button onClick={() => setStep("verify")} className="btn-gold h-9 px-5 text-sm">סרקתי — המשך לאימות</button>
          </div>
        </div>
      )}

      {/* Step: verify code */}
      {step === "verify" && (
        <div>
          <p className="text-sm text-ink-muted mb-4">הזן את הקוד מהאפליקציה לאימות:</p>
          <div className="flex gap-2 justify-center mb-4" dir="ltr">
            {code.map((d, i) => (
              <input key={i} id={`totp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={(e) => onCodeInput(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) (document.getElementById(`totp-${i-1}`) as HTMLInputElement)?.focus(); }}
                className="w-11 h-12 text-center text-xl font-bold rounded-xl border-2 bg-bg-elevated text-gold outline-none transition-all"
                style={{ borderColor: d ? "#D4AF37" : "#23232F" }} />
            ))}
          </div>
          {error && <div className="text-danger text-xs text-center mb-3">{error}</div>}
          <div className="flex gap-2 justify-center">
            <button onClick={() => setStep("scan")} className="h-9 px-4 text-sm rounded-lg border border-line text-ink-muted hover:border-gold/30 transition-colors">חזור לסריקה</button>
            <button onClick={confirmCode} disabled={loading} className="btn-gold h-9 px-5 text-sm">
              {loading ? "מאמת..." : "אמת ← הפעל"}
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-3 py-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <p className="text-sm text-ink font-medium">האימות הדו-שלבי הופעל בהצלחה!</p>
          <p className="text-xs text-ink-muted text-center">מהכניסה הבאה תתבקש להזין קוד מהאפליקציה</p>
        </div>
      )}

      {/* Enabled — disable option */}
      {enabled && step !== "done" && (
        <button onClick={disable2FA} disabled={loading}
          className="mt-2 text-xs text-danger/60 hover:text-danger transition-colors flex items-center gap-1">
          <ShieldOff className="w-3.5 h-3.5" /> {loading ? "מבטל..." : "בטל אימות דו-שלבי"}
        </button>
      )}
    </div>
  );
}
