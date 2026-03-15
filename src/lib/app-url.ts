// כתובת האתר — לשימוש בשרת (SSR) כשצריך URL מלא
function getBase(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  return "https://clubbing-two.vercel.app";
}

export function appUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getBase()}${p}`;
}
