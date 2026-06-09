"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { formatILS, formatCredits, formatTimeHe } from "@/lib/utils";

interface Props {
  venueId: string;
  venueName: string;
  event: any | null;
}

interface LiveStats {
  verified: number;
  revenue: number;
  creditsTonight: number;
  recent: any[];
}

export function LiveDashboard({ venueId, venueName, event }: Props) {
  const [stats, setStats] = useState<LiveStats>({
    verified: 0,
    revenue: 0,
    creditsTonight: 0,
    recent: [],
  });
  const [toast, setToast] = useState<any | null>(null);

  useEffect(() => {
    async function poll() {
      const res = await fetch(`/api/venue/live?venueId=${venueId}`);
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => {
          // detect new reservation
          if (
            data.recent[0] &&
            (!prev.recent[0] || prev.recent[0].id !== data.recent[0].id)
          ) {
            if (prev.recent.length > 0) {
              setToast(data.recent[0]);
              setTimeout(() => setToast(null), 5000);
            }
          }
          return data;
        });
      }
    }
    poll();
    const t = setInterval(poll, 30_000);
    return () => clearInterval(t);
  }, [venueId]);

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* LIVE banner */}
      <div className="rounded-xl border border-danger/40 bg-gradient-to-r from-danger/15 via-bg-card to-bg-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-danger" />
          </span>
          <span className="font-semibold text-danger uppercase tracking-widest text-xs">
            ● LIVE כעת באוויר
          </span>
        </div>
        <div className="text-right">
          <div className="text-ink font-semibold">{event?.name ?? `${venueName} · אין אירוע פעיל`}</div>
          {event && (
            <div className="text-xs text-ink-muted">
              {venueName} · {formatTimeHe(event.startsAt)}
            </div>
          )}
        </div>
      </div>

      {/* 3 real-time counters */}
      <div className="grid grid-cols-3 gap-4">
        <LiveCounter label="מאומתים בכניסה" value={stats.verified.toString()} accent="emerald" />
        <LiveCounter label="הכנסה הערב" value={formatILS(stats.revenue)} accent="gold" />
        <LiveCounter label="קרדיטים נצברו הלילה" value={`+${formatCredits(stats.creditsTonight)}`} accent="purple" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">הזמנות אחרונות</h2>
          <span className="text-xs text-ink-muted">מתעדכן כל 30 שניות</span>
        </div>
        <div className="space-y-2">
          {stats.recent.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">
              עוד אין הזמנות הלילה
            </p>
          ) : (
            stats.recent.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-3 rounded-lg bg-bg-soft ${
                  i === 0 ? "ring-1 ring-gold/40" : ""
                }`}
              >
                <div>
                  <div className="text-ink text-sm font-semibold">
                    {r.userName ?? r.guestName ?? "אורח"}
                    {i === 0 && <Badge variant="gold" className="mr-2">חדש</Badge>}
                  </div>
                  <div className="text-xs text-ink-muted">{r.eventName}</div>
                </div>
                <div className="text-right">
                  <div className="text-gold font-semibold">{formatILS(r.totalAgorot)}</div>
                  <div className="text-xs text-emerald-400">+{r.creditsEarned} קרדיטים</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed bottom-6 left-6 z-50 bg-bg-elevated border border-gold/40 rounded-xl p-4 shadow-gold-strong max-w-sm"
          >
            <div className="text-xs text-ink-muted mb-1">תשלום חדש</div>
            <div className="text-ink font-semibold">{toast.userName ?? toast.guestName}</div>
            <div className="text-sm text-gold">
              {formatILS(toast.totalAgorot)} · +{toast.creditsEarned} קרדיטים
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveCounter({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "emerald" | "gold" | "purple";
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400",
    gold: "text-gold",
    purple: "text-purple-400",
  };
  return (
    <div className="kpi-card animate-pulse-gold">
      <div className="text-xs text-ink-muted uppercase tracking-wider">{label}</div>
      <div className={`font-display text-4xl ${colors[accent]}`}>{value}</div>
    </div>
  );
}
