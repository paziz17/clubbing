"use client";

import { useState } from "react";
import { Mail, Wallet, Check } from "lucide-react";

export function TicketActions({
  reservationId,
  defaultEmail,
}: {
  reservationId: string;
  defaultEmail?: string | null;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function sendEmail() {
    let email = defaultEmail ?? "";
    if (!email) {
      const input = window.prompt("לאיזו כתובת מייל לשלוח את הכרטיס?");
      if (!input) return;
      email = input.trim();
    }
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch(`/api/tickets/${reservationId}/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "שליחה נכשלה");
      setStatus("sent");
      setMessage(
        data.mode === "resend"
          ? `הכרטיס נשלח ל-${data.to}`
          : "הכרטיס מוכן לשליחה (מצב דמו — אימייל לא הוגדר בסביבה זו)"
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "שליחה נכשלה");
    }
  }

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost h-11 text-sm inline-flex items-center justify-center gap-1.5">
          <Wallet className="w-4 h-4" />
          הוסף ל־Wallet
        </button>
        <button
          onClick={sendEmail}
          disabled={status === "sending"}
          className="btn-ghost h-11 text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {status === "sent" ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          {status === "sending" ? "שולח..." : status === "sent" ? "נשלח" : "שלח למייל"}
        </button>
      </div>
      {message && (
        <p
          className={`text-xs mt-2 text-center ${
            status === "error" ? "text-danger" : "text-ink-muted"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
