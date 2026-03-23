/**
 * כניסת מפתח — פיתוח מקומי, דגל מפורש, או דיפלוי ב־*.vercel.app (כמו clubbing-two.vercel.app).
 * לכיבוי מוחלט גם ב־Vercel: NEXT_PUBLIC_DEV_LOGIN=false
 */
export function isDevLoginEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEV_LOGIN === "false") return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_LOGIN === "true"
  );
}

/** זמין בדפדפן אחרי mount — מאפשר דמו ב־Vercel בלי להגדיר משתנה */
export function isDevLoginAllowedOnHost(hostname: string): boolean {
  if (!hostname || process.env.NEXT_PUBLIC_DEV_LOGIN === "false") return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return hostname.endsWith(".vercel.app");
}
