/**
 * Role-Based Access Control for the Venue CRM.
 *
 * Roles:
 *  - OWNER   — full access, including team-user management and settings.
 *  - MANAGER — full operational access (incl. refunds), no user management.
 *  - STAFF   — day-to-day operations, no money actions / settings / users.
 *  - DOOR    — entry only (scan + live view).
 */

export type Role = "OWNER" | "MANAGER" | "STAFF" | "DOOR" | "BAR";

export const ROLES: Role[] = ["OWNER", "MANAGER", "STAFF", "DOOR", "BAR"];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "בעלים",
  MANAGER: "מנהל/ת",
  STAFF: "צוות",
  DOOR: "כניסה/דלת",
  BAR: "ברמן/ית",
};

/**
 * Capabilities map to CRM areas (and a few sensitive actions).
 * Keep keys in sync with NAV area keys and the route guard map below.
 */
export type Capability =
  | "dashboard"
  | "live"
  | "scan"
  | "events"
  | "reservations"
  | "promoters"
  | "customers"
  | "transactions"
  | "campaigns"
  | "reviews"
  | "artists"
  | "selection"
  | "food"
  | "bar"
  | "staff"
  | "inventory"
  | "settings"
  | "users"
  | "refund"
  | "credit";

const ALL: Capability[] = [
  "dashboard", "live", "scan", "events", "reservations", "promoters", "customers",
  "transactions", "campaigns", "reviews", "artists", "selection", "food", "bar",
  "staff", "inventory", "settings", "users", "refund", "credit",
];

export const ROLE_CAPS: Record<Role, Capability[]> = {
  OWNER: ALL,
  MANAGER: ALL.filter((c) => c !== "users"),
  STAFF: [
    "dashboard", "live", "scan", "events", "reservations", "promoters", "customers",
    "reviews", "artists", "selection", "food", "bar", "staff", "inventory",
  ],
  // Bartender session: fast-sale interface only (no CRM data exposure).
  BAR: ["bar"],
  DOOR: ["live", "scan"],
};

export function normalizeRole(role?: string | null): Role {
  const r = (role || "").toUpperCase();
  return (ROLES as string[]).includes(r) ? (r as Role) : "STAFF";
}

export function can(role: string | null | undefined, cap: Capability): boolean {
  const caps = ROLE_CAPS[normalizeRole(role)] ?? [];
  return caps.includes(cap);
}

/** Landing page per role after login (bounces DOOR → scanner, BAR → bar POS). */
export function defaultLandingFor(role: string | null | undefined): string {
  const r = normalizeRole(role);
  if (r === "DOOR") return "/venue/scan";
  if (r === "BAR") return "/venue/bar";
  return "/venue";
}

/**
 * Maps a CRM pathname (under /venue) to the capability required to view it.
 * Returns null when no specific capability is required (e.g. logout endpoints).
 */
export function capabilityForPath(pathname: string): Capability | null {
  const p = pathname.replace(/\/+$/, "");
  if (p === "/venue" || p === "") return "dashboard";
  const seg = p.replace(/^\/venue\//, "").split("/")[0];
  const map: Record<string, Capability> = {
    "": "dashboard",
    live: "live",
    scan: "scan",
    events: "events",
    reservations: "reservations",
    promoters: "promoters",
    customers: "customers",
    transactions: "transactions",
    campaigns: "campaigns",
    reviews: "reviews",
    artists: "artists",
    selection: "selection",
    food: "food",
    bar: "bar",
    staff: "staff",
    inventory: "inventory",
    settings: "settings",
    users: "users",
  };
  return map[seg] ?? null;
}
