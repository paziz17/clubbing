/** נתיב אחרי התחברות — נשמר לפני מעבר ל־/auth מעמוד העדפות */

export const POST_AUTH_REDIRECT_KEY = "clubing:postAuthRedirect";

export function setPostAuthRedirect(path: string): void {
  if (typeof window === "undefined") return;
  if (!path.startsWith("/") || path.startsWith("//")) return;
  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
}

/** URL מלא ל־NextAuth OAuth callback */
export function getPostAuthCallbackUrl(origin: string): string {
  if (typeof window === "undefined") return `${origin}/results`;
  const p = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  if (p && p.startsWith("/") && !p.startsWith("//")) return `${origin}${p}`;
  return `${origin}/results`;
}

/** אחרי התחברות מייל/סיסמה — קורא ומוחק */
export function consumePostAuthRedirect(): string {
  if (typeof window === "undefined") return "/results";
  const p = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  if (p && p.startsWith("/") && !p.startsWith("//")) return p;
  return "/results";
}
