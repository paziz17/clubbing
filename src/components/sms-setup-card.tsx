"use client";
import { useState } from "react";
import { MessageSquare, Phone, CheckCircle2, ShieldOff, RefreshCw } from "lucide-react";

interface Props { smsEnabled: boolean; phone: string | null; }
type SetupStep = "idle" | "enter_phone" | "verify" | "done";

export function SmsSetupCard({ smsEnabled: initialEnabled, phone: initialPhone }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [step, setStep] = useState<SetupStep>("idle");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true); setError(null);
    const res = await fetch("/api/venue/sms-setup", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json(); setLoading(false);
    if (data.ok) { setStep("verify"); setTimeout(() => (document.getElementById("sms-v-0") as HTMLInputElement)?.focus(), 100); }
    else setError(data.error ?? "שגיאה");
  }

  async function verifyCode() {
    const token = code.join("");
    if (token.length < 6) { setError("הזן 6 ספרות"); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/venue/sms-setup", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: token }),
    });
    const data = await res.json(); setLoading(false);
    if (data.ok) { setEnabled(true); setStep("done"); }
    else { setError(data.error ?? "קוד שגוי"); setCode(["","","","","",""]); }
  }

  async function disable() {
    if (!confirm("האם לבטל אימות SMS?")) return;
    setLoading(true);
    await fetch("/api/venue/sms-setup", { method: "DELETE" });
    setLoading(false); setEnabled(false); setPhone(""); setStep("idle"); setCode(["","","","","",""]);
  }

  function onCodeInput(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...code]; next[i] = d; setCode(next);
    if (d && i < 5) (document.getElementById(`sms-v-${i+1}`) as HTMLInputElement)?.focus();
    if (!d && i > 0) (document.getElementById(`sms-v-${i-1}`) as HTMLInputElement)?.focus();
  }

  return (
    <div className="bg-bg-card border border-line rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? "bg-blue-500/15 border border-blue-500/30" : "bg-gold/10 border border-gold/25"}`}>
            <MessageSquare className={`w-5 h-5 ${enabled ? "text-blue-400" : "text-gold"}`} />
          </div>
          <div>
            <div className="font-semibold text-ink text-sm">אימות SMS</div>
            <div className="text-xs text-ink-muted mt-0.5">{enabled ? `פעיל — ${phone}` : "שלב שני — קוד ב-SMS"}</div>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${enabled ? "bg-blue-500/15 text-blue-400 border-blue-500/30" : "bg-gold/10 text-gold border-gold/25"}`}>
          {enabled ? "פעיל" : "כבוי"}
        </span>
      </div>

      {!enabled && step === "idle" && (
        <div>
          <p className="text-sm text-ink-muted mb-4">אחרי כניסה עם סיסמה, נשלח קוד חד-פעמי ל-SMS שלך לאימות.</p>
          <button onClick={() => setStep("enter_phone")} className="btn-gold h-9 px-5 text-sm flex items-center gap-2">
            <Phone className="w-4 h-4" /> הפעל אימות SMS
          </button>
        </div>
      )}

      {step === "enter_phone" && (
        <div>
          <p className="text-sm text-ink-muted mb-3">הזן מספר טלפון (פורמט בינ״ל):</p>
          <div className="flex gap-2">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+972501234567"
              dir="ltr" className="input flex-1 text-sm" />
            <button onClick={sendCode} disabled={loading || !phone}
              className="btn-gold h-10 px-4 text-sm whitespace-nowrap">
              {loading ? "שולח..." : "שלח קוד"}
            </button>
          </div>
          {error && <div className="text-danger text-xs mt-2">{error}</div>}
        </div>
      )}

      {step === "verify" && (
        <div>
          <p className="text-sm text-ink-muted mb-4">הזן את הקוד שנשלח ל-<span className="text-ink font-medium" dir="ltr">{phone}</span>:</p>
          <div className="flex gap-2 justify-center mb-4" dir="ltr">
            {code.map((d, i) => (
              <input key={i} id={`sms-v-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => onCodeInput(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Backspace" && !d && i > 0) (document.getElementById(`sms-v-${i-1}`) as HTMLInputElement)?.focus(); }}
                className="w-11 h-12 text-center text-xl font-bold rounded-xl border-2 bg-bg-elevated text-gold outline-none transition-all"
                style={{ borderColor: d ? "#D4AF37" : "#23232F" }} />
            ))}
          </div>
          {error && <div className="text-danger text-xs text-center mb-3">{error}</div>}
          <div className="flex gap-2 justify-center">
            <button onClick={sendCode} disabled={loading} className="h-9 px-3 text-xs rounded-lg border border-line text-ink-muted hover:border-gold/30 flex items-center gap-1 transition-colors">
              <RefreshCw className="w-3 h-3" /> שלח שוב
            </button>
            <button onClick={verifyCode} disabled={loading} className="btn-gold h-9 px-5 text-sm">
              {loading ? "מאמת..." : "אמת ← הפעל"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-3 py-2">
          <CheckCircle2 className="w-10 h-10 text-blue-400" />
          <p className="text-sm text-ink font-medium">אימות SMS הופעל!</p>
          <p className="text-xs text-ink-muted text-center">בכל כניסה ישלח קוד חד-פעמי ל-<span dir="ltr">{phone}</span></p>
        </div>
      )}

      {enabled && step !== "done" && (
        <button onClick={disable} disabled={loading}
          className="mt-2 text-xs text-danger/60 hover:text-danger transition-colors flex items-center gap-1">
          <ShieldOff className="w-3.5 h-3.5" /> {loading ? "מבטל..." : "בטל אימות SMS"}
        </button>
      )}
    </div>
  );
}
