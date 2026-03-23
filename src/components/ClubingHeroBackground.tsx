"use client";

import Image from "next/image";

/**
 * רקע CLUBING — וידאו אורות מועדון (סגול/מגנטה/ניאון), עם פייד ותמונת poster.
 * וידאו חינם: Pexels — https://www.pexels.com/video/colorful-nightclub-lights-5011044/
 * תמונת poster: Unsplash — https://unsplash.com/photos/8XLapfNMW04
 *
 * הפילטר חייב לשבת על עטיפה — לא רק על <video> (במיוחד Safari).
 */
export const CLUBING_HERO_IMAGE =
  "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1920&q=80";

export const CLUBING_HERO_VIDEO = "/hero/purple-club-lights.mp4";

const VIDEO_WRAPPER_FILTER =
  "blur(22px) brightness(0.48) saturate(0.7) contrast(0.92)";

type ClubingHeroBackgroundProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "splash" | "auth";
  imagePriority?: boolean;
};

const ATMOSPHERE_SPLASH =
  "linear-gradient(180deg,rgba(2,2,8,0.88)_0%,rgba(4,3,14,0.5)_18%,rgba(8,4,18,0.2)_38%,rgba(10,5,20,0.16)_55%,rgba(8,4,16,0.34)_82%,rgba(4,2,10,0.55)_100%)";

const ATMOSPHERE_AUTH =
  "linear-gradient(180deg,rgba(2,2,8,0.93)_0%,rgba(4,3,14,0.58)_20%,rgba(6,4,16,0.3)_42%,rgba(6,4,14,0.4)_68%,rgba(3,2,10,0.76)_100%)";

export function ClubingHeroBackground({
  children,
  className = "",
  variant = "splash",
  imagePriority = false,
}: ClubingHeroBackgroundProps) {
  const atmosphere = variant === "auth" ? ATMOSPHERE_AUTH : ATMOSPHERE_SPLASH;

  return (
    <div
      className={`relative min-h-screen min-h-[100dvh] w-full overflow-hidden bg-[#06040c] ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 min-h-[100dvh] w-full overflow-hidden bg-[#06040c]"
        aria-hidden
      >
        <Image
          src={CLUBING_HERO_IMAGE}
          alt=""
          fill
          priority={imagePriority}
          sizes="100vw"
          className="hidden object-cover object-[50%_72%] motion-reduce:block sm:object-[50%_70%]"
          style={{
            filter: "blur(28px) brightness(0.55) saturate(0.75)",
            WebkitFilter: "blur(28px) brightness(0.55) saturate(0.75)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[118%] w-[118%] motion-reduce:hidden"
          style={{
            filter: VIDEO_WRAPPER_FILTER,
            WebkitFilter: VIDEO_WRAPPER_FILTER,
            transform: "translate(-50%, -50%) translateZ(0)",
          }}
        >
          <video
            className="h-full w-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload={imagePriority ? "auto" : "metadata"}
            poster={CLUBING_HERO_IMAGE}
          >
            <source src={CLUBING_HERO_VIDEO} type="video/mp4" />
          </video>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] min-h-[100dvh] bg-[radial-gradient(ellipse_95%_80%_at_50%_48%,rgba(6,4,14,0.38)_0%,rgba(2,2,8,0.75)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] min-h-[100dvh] bg-gradient-to-b from-black/35 via-black/15 to-black/38"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[3] min-h-[100dvh] bg-gradient-to-b from-fuchsia-950/10 via-fuchsia-900/14 to-purple-950/18"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[4] min-h-[100dvh] bg-[linear-gradient(90deg,rgba(0,0,0,0.52)_0%,transparent_18%,transparent_82%,rgba(0,0,0,0.52)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[5] min-h-[100dvh]"
        style={{ background: atmosphere }}
        aria-hidden
      />
      {/* שכבה אחידה — דהייה ברורה “מאחורי” הטקסט */}
      <div
        className="pointer-events-none absolute inset-0 z-[6] min-h-[100dvh] bg-[rgba(6,3,14,0.42)]"
        aria-hidden
      />
      <div className="relative z-10 min-h-0">{children}</div>
    </div>
  );
}
