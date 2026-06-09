import type { ClubItTier } from "@/lib/enums";

// Default tier thresholds (cumulative spend in agorot) — per PDF spec
export const DEFAULT_TIER_THRESHOLDS_AGOROT: Record<ClubItTier, number> = {
  REGULAR: 0,
  SILVER: 50_000,    // ₪500
  GOLD: 200_000,     // ₪2,000
  PLATINUM: 500_000, // ₪5,000
};

// Default credit-back rate per tier
export const DEFAULT_TIER_RATES: Record<ClubItTier, number> = {
  REGULAR: 0.02,
  SILVER: 0.03,
  GOLD: 0.04,
  PLATINUM: 0.05,
};

export const TIER_ORDER: ClubItTier[] = [
  "REGULAR",
  "SILVER",
  "GOLD",
  "PLATINUM",
];

export const TIER_LABEL_HE: Record<ClubItTier, string> = {
  REGULAR: "רגיל",
  SILVER: "כסף",
  GOLD: "זהב",
  PLATINUM: "פלטינום",
};

export function computeTier(
  totalSpentAgorot: number,
  thresholds?: Partial<Record<ClubItTier, number>>
): ClubItTier {
  const t = { ...DEFAULT_TIER_THRESHOLDS_AGOROT, ...thresholds };
  if (totalSpentAgorot >= t.PLATINUM) return "PLATINUM";
  if (totalSpentAgorot >= t.GOLD) return "GOLD";
  if (totalSpentAgorot >= t.SILVER) return "SILVER";
  return "REGULAR";
}

export function nextTier(current: ClubItTier): ClubItTier | null {
  const i = TIER_ORDER.indexOf(current);
  return i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : null;
}

export function progressToNextTier(
  totalSpentAgorot: number,
  thresholds?: Partial<Record<ClubItTier, number>>
): {
  current: ClubItTier;
  next: ClubItTier | null;
  remainingAgorot: number;
  percent: number;
} {
  const t = { ...DEFAULT_TIER_THRESHOLDS_AGOROT, ...thresholds };
  const current = computeTier(totalSpentAgorot, t);
  const next = nextTier(current);
  if (!next)
    return { current, next: null, remainingAgorot: 0, percent: 100 };
  const base = t[current];
  const target = t[next];
  const percent = Math.min(
    100,
    Math.round(((totalSpentAgorot - base) / (target - base)) * 100)
  );
  return {
    current,
    next,
    remainingAgorot: Math.max(0, target - totalSpentAgorot),
    percent,
  };
}

export function tierRate(
  tier: ClubItTier,
  override?: Partial<Record<ClubItTier, number>>
): number {
  return { ...DEFAULT_TIER_RATES, ...override }[tier];
}
