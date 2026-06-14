"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";

const CLICKS_NEEDED = 10;
const CLICK_GAP_RESET_MS = 3000; // reset if clicks are too far apart

export default function NotFoundDecoy() {
  const router = useRouter();
  const count = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onLogoClick() {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    count.current += 1;
    if (count.current >= CLICKS_NEEDED) {
      count.current = 0;
      router.push("/venue/admin/portal");
      return;
    }
    resetTimer.current = setTimeout(() => { count.current = 0; }, CLICK_GAP_RESET_MS);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0f",
        color: "#e5e5e5",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <img
        src="/icons/logo.png"
        alt=""
        onClick={onLogoClick}
        draggable={false}
        style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 28, cursor: "default", userSelect: "none", opacity: 0.92 }}
      />
      <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, letterSpacing: "-2px", color: "#f5f5f5" }}>404</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12, color: "#cfcfcf" }}>Not Found</div>
      <div style={{ fontSize: 14, marginTop: 8, color: "#8a8a8a", maxWidth: 420 }}>
        The requested URL was not found on this server.
      </div>
      <div style={{ marginTop: 40, fontSize: 12, color: "#5a5a5a", borderTop: "1px solid #1c1c22", paddingTop: 16, width: 280 }}>
        404.clubbing.co.il
      </div>
    </div>
  );
}
