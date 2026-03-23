import Link from "next/link";
import { ClubingLogoIcon } from "@/components/ClubingLogoIcon";
import { LOGO_LAB_OPTIONS } from "@/lib/logo-lab-options";
import { clubingGlassCard, clubingMutedLink } from "@/lib/clubing-ui";

export default function LogoLabPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4">
          <Link href="/" className={clubingMutedLink}>
            ← חזרה לדף הבית
          </Link>
        </p>
        <h1 className="mb-2 bg-gradient-to-b from-[#f5e6a8] via-[#d4af37] to-[#7a5a12] bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
          22 דוגמאות למרכז התקליט
        </h1>
        <p className="mb-10 max-w-2xl text-sm leading-relaxed text-zinc-400">
          כל כרטיס מציג את אותו תקליט עם עיצוב מרכזי אחר. ברירת המחדל באפליקציה היא{" "}
          <strong className="text-zinc-300">מצפן (north)</strong> — ל־CB / C / דופק:{" "}
          <code className="text-zinc-500">centerVariant=…</code>.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LOGO_LAB_OPTIONS.map(({ variant, title, blurb }) => (
            <div
              key={variant}
              className={`flex flex-col items-center gap-4 p-6 text-center ${clubingGlassCard}`}
            >
              <ClubingLogoIcon
                centerVariant={variant}
                className="h-24 w-24 animate-[spin_2.4s_linear_infinite] opacity-95 drop-shadow-[0_0_28px_rgba(212,175,55,0.35)] sm:h-28 sm:w-28"
              />
              <div>
                <p className="font-semibold text-[#e8c96b]">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
