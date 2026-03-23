/** כניסת מפתח — רק בפיתוח או כשמפעילים במפורש (לא לפרודקשן) */
export function isDevLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_LOGIN === "true"
  );
}
