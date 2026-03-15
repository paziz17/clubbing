// כתובת האתר — לשימוש בשרת (SSR) כשצריך URL מלא
function getBase(): string {
  const nextPublic = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  const authUrl = (process.env.AUTH_URL || "").trim().replace(/\/$/, "");
  if (nextPublic) return nextPublic;
  if (authUrl) return authUrl;
  return "https://clubbing-two.vercel.app";
}

export function appUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getBase()}${p}`;
}
