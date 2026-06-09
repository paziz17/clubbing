"use client";

import { motion } from "framer-motion";
import type { ClubItTier } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { TIER_LABEL_HE } from "@/lib/tier";

interface Props {
  name?: string;
  last4?: string;
  tier?: ClubItTier;
  size?: "sm" | "md" | "lg";
  preview?: boolean;
  className?: string;
}

const tierHalo: Record<ClubItTier, string> = {
  REGULAR: "ring-1 ring-gold/30",
  SILVER: "ring-2 ring-tier-silver/50 tier-halo-silver",
  GOLD: "ring-2 ring-gold/60 tier-halo-gold",
  PLATINUM: "ring-2 ring-tier-platinum/60 tier-halo-platinum",
};

const tierLabel: Record<ClubItTier, string> = {
  REGULAR: "REGULAR",
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "PLATINUM",
};

export function ClubItCard({
  name = "YOUR NAME",
  last4 = "••••",
  tier = "REGULAR",
  size = "md",
  preview = false,
  className,
}: Props) {
  const dims = {
    sm: "w-56 h-36",
    md: "w-80 h-52",
    lg: "w-[360px] h-[230px]",
  }[size];

  const display = name.length > 26 ? name.slice(0, 26) : name;
  const fontSize = display.length > 18 ? "text-lg" : "text-xl";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className={cn(
        "relative rounded-2xl overflow-hidden bg-bg-card border border-gold/40",
        dims,
        tierHalo[tier],
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, #0a0a14 0%, #15151f 50%, #0a0a14 100%)",
      }}
    >
      {/* shimmer */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
      </div>

      {/* corner ornament */}
      <div className="absolute top-3 left-3 text-gold/60 text-[10px] tracking-[0.3em] font-display">
        CLUBBING · {tierLabel[tier]}
      </div>

      {/* big C */}
      <div className="absolute top-3 right-3 text-gold font-display text-3xl leading-none">
        C
      </div>

      {/* chip */}
      <div className="absolute top-12 right-4 w-9 h-7 rounded bg-gradient-to-br from-gold-warm to-gold-deep border border-gold/60">
        <div className="absolute inset-1 grid grid-cols-2 gap-px opacity-50">
          <div className="bg-black/30 rounded-sm" />
          <div className="bg-black/30 rounded-sm" />
          <div className="bg-black/30 rounded-sm" />
          <div className="bg-black/30 rounded-sm" />
        </div>
      </div>

      {/* name */}
      <div className="absolute bottom-12 right-4 left-4">
        <div className={cn("text-ink font-display tracking-wider", fontSize)}>
          {display || "YOUR NAME"}
        </div>
      </div>

      {/* last4 */}
      <div className="absolute bottom-4 right-4 text-gold/80 font-mono tracking-widest text-sm">
        •••• {last4}
      </div>

      {/* tier badge */}
      <div className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.2em] text-gold/80">
        {TIER_LABEL_HE[tier]}
      </div>

      {preview && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-bg/80 text-[10px] text-ink-muted">
          תצוגה
        </div>
      )}
    </motion.div>
  );
}
