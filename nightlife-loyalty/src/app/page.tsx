"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, type User } from "@/context/AuthContext";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function HomePage() {
  const { user, loading, login } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-pulse text-rose-500 text-xl">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage demoMode={DEMO_MODE} onDemoLogin={login} demoLoading={demoLoading} setDemoLoading={setDemoLoading} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-zinc-800/50 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white">
          NightLife
        </Link>
        <div className="flex gap-3 items-center">
          <Link href="/wallet" className="text-zinc-400 hover:text-white text-sm">
            ארנק
          </Link>
          <Link href="/profile" className="text-zinc-400 hover:text-white text-sm">
            {user.name}
          </Link>
          <Link href="/staff" className="text-zinc-500 hover:text-white text-xs">
            צוות
          </Link>
          <Link href="/dashboard" className="text-zinc-500 hover:text-white text-xs">
            דשבורד
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">בחר מועדון</h2>
        <ClubsList />
      </main>
    </div>
  );
}

function LandingPage({ demoMode, onDemoLogin, demoLoading, setDemoLoading }: {
  demoMode?: boolean;
  onDemoLogin?: (token: string, user: User) => void;
  demoLoading?: boolean;
  setDemoLoading?: (v: boolean) => void;
}) {
  const handleDemoLogin = async () => {
    if (!onDemoLogin || !setDemoLoading) return;
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/test-login", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      onDemoLogin(data.token, data.user);
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
          NightLife Loyalty
        </h1>
        <p className="text-xl text-zinc-400 text-center mb-4">
          פלטפורמת נאמנות למועדונים — צבר קרדיטים, קבל הטבות
        </p>
        <p className="text-zinc-500 text-center mb-12 text-sm">
          סגור את הערב בקליק • QR בכניסה • 5% קרדיטים על כל הוצאה
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {demoMode ? (
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="px-8 py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-semibold transition"
            >
              {demoLoading ? "נכנס..." : "התנסה בדמו"}
            </button>
          ) : (
            <>
              <Link
                href="/auth"
                className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-center transition"
              >
                התחבר / הרשם
              </Link>
              <Link
                href="/auth"
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-center transition"
              >
                התחבר לטסט (ללא OTP)
              </Link>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-6">
            <p className="text-3xl mb-2">📱</p>
            <h3 className="text-white font-semibold mb-2">סגור את הערב</h3>
            <p className="text-zinc-500 text-sm">יצירת Pass ו-QR בכניסה למועדון</p>
          </div>
          <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-6">
            <p className="text-3xl mb-2">💳</p>
            <h3 className="text-white font-semibold mb-2">צבר קרדיטים</h3>
            <p className="text-zinc-500 text-sm">5% על כל הוצאה, תוקף 30 יום</p>
          </div>
          <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-6">
            <p className="text-3xl mb-2">🎁</p>
            <h3 className="text-white font-semibold mb-2">מממש הטבות</h3>
            <p className="text-zinc-500 text-sm">קוד חד-פעמי להנחה בבר</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClubsList() {
  const [clubs, setClubs] = useState<Array<{ id: string; name: string; location?: string }>>([]);

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClubs(data);
        else if (data.clubs) setClubs(data.clubs);
      })
      .catch(console.error);
  }, []);

  if (clubs.length === 0) {
    return <p className="text-zinc-500">טוען מועדונים...</p>;
  }

  return (
    <div className="space-y-4">
      {clubs.map((club) => (
        <div
          key={club.id}
          className="bg-[#14141f] border border-zinc-800 rounded-xl p-5 flex justify-between items-center"
        >
          <div>
            <h3 className="text-lg font-semibold text-white">{club.name}</h3>
            {club.location && (
              <p className="text-zinc-500 text-sm mt-1">{club.location}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/clubs/${club.id}`}
              className="px-4 py-2 text-zinc-400 hover:text-white border border-zinc-700 rounded-lg text-sm"
            >
              קח אותי לשם
            </Link>
            <Link
              href={`/clubs/${club.id}/pass`}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium"
            >
              סגור לי את הערב
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
