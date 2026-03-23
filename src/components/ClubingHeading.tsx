"use client";

const HEADING_SIZES = {
  /** כותרת ראשית בעמודים (תוצאות, פרופיל) */
  xl: "text-2xl sm:text-3xl md:text-4xl",
  /** CRM / כותרות משנה */
  lg: "text-xl sm:text-2xl md:text-3xl",
  md: "text-lg sm:text-xl",
  sm: "text-base sm:text-lg",
  /** התאמה למסך auth */
  screen: "text-3xl sm:text-4xl",
} as const;

type HeadingSize = keyof typeof HEADING_SIZES;

/**
 * כותרות בגרדיאנט זהב אנכי — כמו מסך ההתחברות
 */
export function ClubingHeading({
  children,
  className = "",
  as: Tag = "h1",
  size = "xl",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  size?: HeadingSize;
}) {
  return (
    <Tag className={`font-bold tracking-tight ${HEADING_SIZES[size]} ${className}`.trim()}>
      <span className="inline-block bg-gradient-to-b from-[#f5e6a8] via-[#d4af37] to-[#9a7320] bg-clip-text text-transparent drop-shadow-[0_3px_14px_rgba(0,0,0,0.75)]">
        {children}
      </span>
    </Tag>
  );
}
