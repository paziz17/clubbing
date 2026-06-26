"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ROLE_LABELS, normalizeRole } from "@/lib/rbac";

/** Minimal top bar for POS-only roles (bartender / waiter) — no CRM sidebar. */
export function PosTopbar({
  venueName,
  displayName,
  role,
}: {
  venueName: string;
  displayName?: string;
  role?: string;
}) {
  const router = useRouter();
  const roleNorm = normalizeRole(role);

  async function logout() {
    await fetch("/api/venue/logout", { method: "POST" });
    router.push("/venue/login");
  }

  return (
    <header className="shrink-0 border-b border-line bg-bg-soft px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="font-display text-gold-gradient text-base tracking-[0.25em] hidden sm:block">
          CLUBBING
        </div>
        <span className="h-6 w-px bg-line hidden sm:block" />
        <div className="min-w-0">
          <div className="font-display-he text-base font-bold text-ink leading-tight truncate">
            {venueName}
          </div>
          <div className="text-[11px] text-ink-muted truncate">
            {displayName && displayName !== venueName ? displayName : "עמדת מכירה"}
            <span className="text-gold"> · {ROLE_LABELS[roleNorm]}</span>
          </div>
        </div>
      </div>
      <button
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-ink-muted hover:text-danger hover:border-danger/40 transition-colors"
      >
        <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">יציאה</span>
      </button>
    </header>
  );
}
