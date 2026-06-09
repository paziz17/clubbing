"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TEMPLATES = [
  {
    id: "CHASER_50",
    emoji: "🥃",
    title: "צ׳ייסר 50% לנשים",
    message: "היי! הערב במועדון — צ׳ייסר 50% לנשים. הציגי את ההודעה הזו לברמן.",
  },
  {
    id: "FREE_ENTRY_WOMEN",
    emoji: "🎟",
    title: "כניסה חינם לנשים עד 00:00",
    message: "הערב — כניסה חינם לנשים עד חצות. הציגי את ההודעה הזו בכניסה.",
  },
  {
    id: "FREE_FIRST_DRINK_WOMEN_18",
    emoji: "🍸",
    title: "משקה ראשון חינם לנשים +18",
    message: "הערב — משקה ראשון חינם לנשים מגיל 18+. הציגי את ההודעה לברמן.",
  },
];

export function CampaignComposer({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState("CHASER_50");
  const [message, setMessage] = useState(TEMPLATES[0].message);
  const [audience, setAudience] = useState("WOMEN_ONLY");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  function pick(id: string) {
    setKind(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (t) setMessage(t.message);
  }

  async function send() {
    setSending(true);
    const res = await fetch("/api/venue/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, message, audience }),
    });
    const data = await res.json();
    setResult(data);
    setSending(false);
    router.refresh();
  }

  return (
    <Card className="p-5 space-y-4">
      <div>
        <label className="block text-xs text-ink-muted mb-2 uppercase tracking-wider">
          תבנית
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className={`p-3 rounded-lg border text-right transition-all ${
                kind === t.id
                  ? "border-gold bg-gold/10"
                  : "border-line bg-bg-soft hover:border-gold/40"
              }`}
            >
              <div className="text-2xl mb-1">{t.emoji}</div>
              <div className="text-sm font-semibold text-ink">{t.title}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-muted mb-2 uppercase tracking-wider">
          הודעה
        </label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
      </div>

      <div>
        <label className="block text-xs text-ink-muted mb-2 uppercase tracking-wider">
          קהל יעד
        </label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="input h-11 w-full"
        >
          <option value="ALL_MEMBERS">כל חברי המועדון</option>
          <option value="WOMEN_ONLY">נשים בלבד</option>
          <option value="MEN_ONLY">גברים בלבד</option>
          <option value="SILVER_AND_UP">Silver ומעלה</option>
        </select>
      </div>

      {/* WhatsApp preview */}
      <div className="rounded-xl p-4 max-w-md mx-auto" style={{ background: "#0a160a", borderColor: "#25D366" }}>
        <div className="text-xs text-green-300 mb-1">CLUBBING · עכשיו</div>
        <div className="text-green-50 text-sm whitespace-pre-wrap">{message}</div>
      </div>

      <Button onClick={send} disabled={sending} className="w-full h-11">
        {sending ? "..." : "שלח/י קמפיין"}
      </Button>

      {result && (
        <div className="text-sm">
          <p className="text-success">
            ✓ הקמפיין נוצר · {result.recipients} נמענים · {result.delivered} נשלחו דרך {result.mode}
          </p>
          {result.fallback?.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-gold">
                {result.fallback.length} קישורי wa.me לפתיחה ידנית
              </summary>
              <ul className="mt-2 space-y-1">
                {result.fallback.slice(0, 10).map((url: string) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}
