/**
 * String-literal "enums" (SQLite-friendly).
 * Replaces the @prisma/client enums after the local-only migration.
 *
 * Each value is also exported as a const tuple so callers can iterate.
 */

// ----- Identity -----
export const UserRoles = ["BLINER", "VENUE_OWNER", "BAR_STAFF", "ADMIN"] as const;
export type UserRole = (typeof UserRoles)[number];

export const Genders = ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"] as const;
export type Gender = (typeof Genders)[number];

// ----- Events -----
export const EventStatuses = ["DRAFT", "PUBLISHED", "ENDED"] as const;
export type EventStatus = (typeof EventStatuses)[number];

export const EventTypes = ["PARTY", "LIVE", "COCKTAILS", "AFTERHOURS"] as const;
export type EventType = (typeof EventTypes)[number];

export const AgeBands = ["AGE_18_21", "AGE_21_25", "AGE_25_30", "AGE_30_40", "AGE_40_PLUS"] as const;
export type AgeBand = (typeof AgeBands)[number];

// ----- Reservations / Payments -----
export const ReservationStatuses = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
] as const;
export type ReservationStatus = (typeof ReservationStatuses)[number];

export const PaymentMethods = [
  "STRIPE_CARD",
  "APPLE_PAY",
  "GOOGLE_PAY",
  "CLUB_IT",
  "CREDITS",
  "MIXED",
  "DEMO",
] as const;
export type PaymentMethod = (typeof PaymentMethods)[number];

// ----- Club-it -----
export const ClubItTiers = ["REGULAR", "SILVER", "GOLD", "PLATINUM"] as const;
export type ClubItTier = (typeof ClubItTiers)[number];

/** Coerce a possibly-unsafe string from the DB into a typed tier (falls back to REGULAR). */
export function asTier(value: string | null | undefined): ClubItTier {
  return (ClubItTiers as readonly string[]).includes(value ?? "")
    ? (value as ClubItTier)
    : "REGULAR";
}

export const CreditLedgerKinds = [
  "EARN_PURCHASE",
  "EARN_BUMP",
  "REDEEM_BAR",
  "REDEEM_FOOD",
  "EXPIRE",
  "ADJUST",
] as const;
export type CreditLedgerKind = (typeof CreditLedgerKinds)[number];

export const VoucherStatuses = ["ACTIVE", "REDEEMED", "EXPIRED", "CANCELLED"] as const;
export type VoucherStatus = (typeof VoucherStatuses)[number];

// ----- Campaigns -----
export const CampaignKinds = [
  "CHASER_50",
  "FREE_ENTRY_WOMEN",
  "FREE_FIRST_DRINK_WOMEN_18",
  "CUSTOM",
] as const;
export type CampaignKind = (typeof CampaignKinds)[number];

export const CampaignAudiences = [
  "ALL_MEMBERS",
  "WOMEN_ONLY",
  "MEN_ONLY",
  "SILVER_AND_UP",
] as const;
export type CampaignAudience = (typeof CampaignAudiences)[number];

export const CampaignStatuses = ["DRAFT", "SENDING", "SENT", "FAILED"] as const;
export type CampaignStatus = (typeof CampaignStatuses)[number];

// ----- Reviews -----
export const ReviewCrmStatuses = ["UNREAD", "READ", "HANDLED"] as const;
export type ReviewCrmStatus = (typeof ReviewCrmStatuses)[number];

// ----- Selection -----
export const ExclusiveStatuses = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] as const;
export type ExclusiveStatus = (typeof ExclusiveStatuses)[number];

// ----- Kitchen -----
export const FoodCategories = ["PIZZA", "STARTER", "MAIN", "DRINK", "DESSERT"] as const;
export type FoodCategory = (typeof FoodCategories)[number];

export const FoodOrderStatuses = [
  "PENDING",
  "PREPARING",
  "READY",
  "COLLECTED",
  "CANCELLED",
] as const;
export type FoodOrderStatus = (typeof FoodOrderStatuses)[number];

// ----- Helpers for SQLite-stored CSV arrays -----
export const parseCsv = (s: string | null | undefined): string[] =>
  s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];

export const stringifyCsv = (arr: readonly (string | undefined | null)[] | undefined): string =>
  (arr ?? []).filter(Boolean).join(",");

// ----- Helpers for SQLite-stored JSON columns -----
export function parseJson<T = unknown>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export const stringifyJson = (value: unknown): string => JSON.stringify(value ?? {});
