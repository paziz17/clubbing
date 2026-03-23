"use client";

/**
 * רקע אחיד לכל האפליקציה: שחור עמוק + זוהר סגול/מג׳נטה עדין + נגיעת זהב במרכז.
 */
export function ClubingPageShell({
  children,
  className = "",
  contentClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={`relative min-h-screen min-h-[100dvh] overflow-hidden bg-black text-zinc-200 ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -right-[25%] top-0 h-[65vh] w-[90vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18)_0%,rgba(219,39,119,0.09)_42%,transparent_72%)] blur-3xl" />
        <div className="absolute -left-[22%] bottom-[0%] h-[55vh] w-[75vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.24)_0%,rgba(147,51,234,0.08)_48%,transparent_70%)] blur-3xl" />
        <div className="absolute left-1/2 top-[-12%] h-[52vh] w-[135%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.11)_0%,transparent_58%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/[0.92]" />
      </div>
      <div className={`relative z-10 ${contentClassName}`.trim()}>{children}</div>
    </div>
  );
}
