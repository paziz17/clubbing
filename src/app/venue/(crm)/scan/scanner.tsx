"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CheckCircle2, XCircle, AlertTriangle, ScanLine, Loader2 } from "lucide-react";

type ScanResult =
  | { result: "valid"; reservation: Info }
  | { result: "already_used"; checkedInAt: string; reservation: Info }
  | { result: "not_paid"; status: string; reservation: Info }
  | { result: "invalid" };

interface Info {
  id: string;
  name: string;
  eventName: string;
  ticketLabel: string | null;
  quantity: number;
  ticketCode: string;
}

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCodeRef = useRef<string>("");
  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState("");

  const verify = useCallback(async (code: string) => {
    if (!code || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/venue/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as ScanResult;
      setResult(json);
      if (navigator.vibrate) navigator.vibrate(json.result === "valid" ? 80 : [60, 60, 60]);
    } catch {
      setResult({ result: "invalid" });
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // Live camera scanning via the native BarcodeDetector (Chromium).
  useEffect(() => {
    if (!scanning) return;
    const AnyWin = window as any;
    if (!("BarcodeDetector" in AnyWin)) {
      setSupported(false);
      setScanning(false);
      return;
    }
    setSupported(true);
    let raf = 0;
    let stopped = false;
    const detector = new AnyWin.BarcodeDetector({ formats: ["qr_code"] });

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const value = codes[0].rawValue as string;
              if (value && value !== lastCodeRef.current) {
                lastCodeRef.current = value;
                await verify(value);
                setTimeout(() => (lastCodeRef.current = ""), 2500);
              }
            }
          } catch {
            /* frame not ready */
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setSupported(false);
        setScanning(false);
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [scanning, verify]);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Camera / scanner */}
      <div className="bg-bg-card border border-line rounded-2xl p-5">
        <div className="aspect-square w-full rounded-xl overflow-hidden bg-black relative flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-muted">
              <ScanLine className="w-12 h-12 opacity-40" />
              <span className="text-sm">המצלמה כבויה</span>
            </div>
          )}
          {scanning && (
            <div className="absolute inset-8 border-2 border-gold/70 rounded-xl pointer-events-none" />
          )}
        </div>

        <button
          onClick={() => {
            setResult(null);
            setScanning((s) => !s);
          }}
          className={`mt-4 w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 ${
            scanning ? "btn-ghost" : "btn-gold"
          }`}
        >
          <Camera className="w-4 h-4" />
          {scanning ? "עצור סריקה" : "הפעל מצלמה וסרוק"}
        </button>

        {supported === false && (
          <p className="text-xs text-warn mt-3 text-center">
            סריקת מצלמה לא נתמכת בדפדפן זה — השתמש/י בהזנה ידנית מצד שמאל.
          </p>
        )}

        {/* Manual fallback */}
        <div className="mt-4 pt-4 border-t border-line">
          <label className="text-xs text-ink-muted">הזנת קוד כרטיס ידנית</label>
          <form
            className="flex gap-2 mt-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              setResult(null);
              verify(manual.trim());
            }}
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="קוד הכרטיס מה-QR"
              className="flex-1 h-10 px-3 rounded-lg bg-bg-soft border border-line text-sm text-ink focus:border-gold/40 outline-none"
            />
            <button type="submit" disabled={busy} className="btn-gold h-10 px-4 text-sm">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "אמת"}
            </button>
          </form>
        </div>
      </div>

      {/* Result */}
      <div className="bg-bg-card border border-line rounded-2xl p-5 flex flex-col">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">תוצאת אימות</h2>
        <div className="flex-1 flex items-center justify-center">
          {!result && (
            <div className="text-center text-ink-dim">
              <ScanLine className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">סרוק/י QR או הזן/י קוד כדי לאמת כרטיס</p>
            </div>
          )}
          {result && <ResultCard result={result} />}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: ScanResult }) {
  if (result.result === "invalid") {
    return (
      <Box tone="bad" icon={<XCircle className="w-14 h-14" />} title="כרטיס לא נמצא">
        הקוד אינו תקין או אינו שייך למועדון זה.
      </Box>
    );
  }
  if (result.result === "not_paid") {
    const labels: Record<string, string> = {
      PENDING: "ממתין לתשלום", FAILED: "תשלום נכשל", REFUNDED: "הוחזר", CANCELLED: "בוטל",
    };
    return (
      <Box tone="warn" icon={<AlertTriangle className="w-14 h-14" />} title="כרטיס לא משולם">
        <Details info={result.reservation} />
        <p className="mt-2 text-warn font-semibold">סטטוס: {labels[result.status] ?? result.status}</p>
      </Box>
    );
  }
  if (result.result === "already_used") {
    return (
      <Box tone="warn" icon={<AlertTriangle className="w-14 h-14" />} title="כבר נכנס">
        <Details info={result.reservation} />
        <p className="mt-2 text-warn">
          נסרק כבר ב־{new Date(result.checkedInAt).toLocaleString("he-IL")}
        </p>
      </Box>
    );
  }
  return (
    <Box tone="ok" icon={<CheckCircle2 className="w-14 h-14" />} title="כניסה מאושרת ✓">
      <Details info={result.reservation} />
    </Box>
  );
}

function Box({
  tone, icon, title, children,
}: {
  tone: "ok" | "warn" | "bad";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const c = {
    ok: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    warn: "text-warn border-warn/40 bg-warn/10",
    bad: "text-danger border-danger/40 bg-danger/10",
  }[tone];
  return (
    <div className={`w-full rounded-xl border p-6 text-center ${c}`}>
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="text-xl font-bold mb-2">{title}</div>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

function Details({ info }: { info: Info }) {
  return (
    <div className="text-ink">
      <div className="font-semibold text-base">{info.name}</div>
      <div className="text-sm text-ink-muted">{info.eventName}</div>
      <div className="text-xs text-ink-muted mt-1">
        {info.ticketLabel ? `${info.ticketLabel} · ` : ""}
        {info.quantity} כניסות · קוד {info.ticketCode}
      </div>
    </div>
  );
}
