"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

/**
 * Shows the logged-in user profile picture in a gold-bordered circle.
 * Falls back to initials when no image is available.
 * Clicking it navigates to /club-it (loyalty card / profile page).
 */
export function UserAvatar({ size = 36 }: { size?: number }) {
  const { data: session } = useSession();
  if (!session?.user) return null;

  const { name, image } = session.user;
  const initials = name
    ? name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <Link
      href="/club-it"
      aria-label="פרופיל משתמש"
      className="block shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-full border-2 border-gold/70 overflow-hidden bg-gold/10 flex items-center justify-center shadow-[0_0_12px_-2px_rgba(201,162,74,0.5)] hover:border-gold transition-colors"
        style={{ width: size, height: size }}
      >
        {image ? (
          <Image
            src={image}
            alt={name ?? "פרופיל"}
            width={size}
            height={size}
            className="object-cover w-full h-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className="text-gold font-semibold select-none"
            style={{ fontSize: size * 0.38 }}
          >
            {initials}
          </span>
        )}
      </div>
    </Link>
  );
}
