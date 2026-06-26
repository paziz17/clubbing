"use client";

import { useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";

export function PromoterLinks({
  code,
  events,
}: {
  code: string;
  events: { id: string; name: string }[];
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = eventId ? `${origin}/r/${code}?e=${eventId}` : "";

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (events.length === 0) {
    return <span className="text-xs text-ink-muted">אין אירועים פעילים</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="input h-9 text-xs max-w-[160px]"
      >
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <button
        onClick={copy}
        title={link}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-muted hover:border-gold/40 hover:text-gold transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? "הועתק" : "העתק לינק"}
      </button>
    </div>
  );
}
