"use client";

import { usePathname } from "next/navigation";
import { LogoHeader } from "@/components/LogoHeader";

/** בלי כותרת בעמוד הספלאש הראשי */
export function ConditionalLogoHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <LogoHeader />;
}
