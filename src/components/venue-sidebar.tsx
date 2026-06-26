"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  CreditCard,
  Settings,
  Radio,
  MessageCircle,
  Star,
  Music2,
  ShieldCheck,
  LogOut,
  TrendingUp,
  Bell,
  CalendarClock,
  Boxes,
  ScanLine,
  UsersRound,
  Megaphone,
  Beer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, normalizeRole, ROLE_LABELS, type Capability } from "@/lib/rbac";

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  cap?: Capability;
}

interface Group {
  title: string;
  items: Item[];
}

export function VenueSidebar({
  venueName,
  kitchenEnabled,
  role = "OWNER",
  displayName,
}: {
  venueName: string;
  kitchenEnabled?: boolean;
  role?: string;
  displayName?: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const roleNorm = normalizeRole(role);

  const rawGroups: Group[] = [
    {
      title: "ראשי",
      items: [
        { href: "/venue", label: "דשבורד", icon: LayoutDashboard, cap: "dashboard" },
        { href: "/venue/live", label: "ערב חי", icon: Radio, cap: "live" },
        { href: "/venue/scan", label: "סריקת כניסה", icon: ScanLine, cap: "scan" },
        { href: "/venue/events", label: "אירועים", icon: Calendar, cap: "events" },
      ],
    },
    {
      title: "ניהול לקוחות",
      items: [
        { href: "/venue/reservations", label: "הזמנות", icon: Ticket, cap: "reservations" },
        { href: "/venue/promoters", label: "יחצנים", icon: Megaphone, cap: "promoters" },
        { href: "/venue/customers", label: "לקוחות ודרגות", icon: Users, cap: "customers" },
        { href: "/venue/transactions", label: "תשלומים", icon: CreditCard, cap: "transactions" },
        { href: "/venue/campaigns", label: "Club Bot · WhatsApp", icon: MessageCircle, cap: "campaigns" },
      ],
    },
    {
      title: "מועדון ובמה",
      items: [
        { href: "/venue/reviews", label: "דירוגים וביקורות", icon: Star, cap: "reviews" },
        { href: "/venue/artists", label: "אומנים", icon: Music2, cap: "artists" },
        { href: "/venue/selection", label: "סלקציה · Exclusive", icon: ShieldCheck, cap: "selection" },
        // Unified bar + kitchen fast-sale POS (one screen, all items).
        ...(can(roleNorm, "bar") || (kitchenEnabled && can(roleNorm, "food"))
          ? [{ href: "/venue/bar", label: "בר ומטבח", icon: Beer } as Item]
          : []),
      ],
    },
    {
      title: "תפעול",
      items: [
        { href: "/venue/staff", label: "משמרות עובדים", icon: CalendarClock, cap: "staff" },
        { href: "/venue/inventory", label: "מחסן חכם", icon: Boxes, cap: "inventory" },
      ],
    },
    {
      title: "מערכת",
      items: [
        { href: "/venue/users", label: "משתמשים והרשאות", icon: UsersRound, cap: "users" },
        { href: "/venue/settings", label: "הגדרות", icon: Settings, cap: "settings" },
      ],
    },
  ];

  // Show only items the current role is allowed to access; drop empty groups.
  const groups: Group[] = rawGroups
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.cap || can(roleNorm, it.cap)) }))
    .filter((g) => g.items.length > 0);

  function isActive(href: string) {
    if (href === "/venue") return path === "/venue";
    return path?.startsWith(href);
  }

  async function logout() {
    await fetch("/api/venue/logout", { method: "POST" });
    router.push("/venue/login");
  }

  return (
    <aside className="w-64 shrink-0 border-l border-line bg-bg-soft flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-4 text-center relative">
        <div className="font-display text-gold-gradient text-xl tracking-[0.3em] leading-none">
          CLUBBING
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="h-px w-6 bg-gradient-to-l from-gold/50 to-transparent" />
          <span className="text-[9px] text-ink-dim tracking-[0.35em] uppercase">Venue CRM v1.3</span>
          <span className="h-px w-6 bg-gradient-to-r from-gold/50 to-transparent" />
        </div>
      </div>

      {/* ── Venue plaque ── */}
      <div className="px-4 pb-5 border-b border-line">
        <div className="relative rounded-xl border border-gold/30 bg-gradient-to-b from-gold/[0.08] to-transparent px-4 py-3.5 text-center shadow-[0_0_28px_rgba(212,175,55,0.08)] overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-px bg-gold-gradient opacity-70" />
          <div className="font-display-he text-lg font-bold text-ink leading-snug text-balance">
            {venueName}
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
            <span className="truncate">
              {displayName && displayName !== venueName ? displayName : "פאנל ניהול"}
            </span>
            <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
              {ROLE_LABELS[roleNorm]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold text-ink-dim uppercase tracking-widest">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                      active
                        ? "bg-gold/12 text-gold border border-gold/25 shadow-sm"
                        : "text-ink-muted hover:text-ink hover:bg-bg-card"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-gold" : "")} />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="mr-auto text-[10px] bg-gold/20 text-gold rounded-full px-1.5 py-0.5 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-line px-3 py-3 space-y-1">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>יציאה מהמערכת</span>
        </button>
      </div>
    </aside>
  );
}
