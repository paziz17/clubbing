"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<"phone" | "verify" | "signup">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (DEMO_MODE) router.replace("/");
  }, [router]);

  if (DEMO_MODE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-zinc-500">מפנה...</p>
      </div>
    );
  }

  const requestOTP = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      setDevCode(data.devCode);
      setStep("verify");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: code.trim(),
          ...(step === "signup" && { name, birthdate, email: email || undefined }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresSignup) {
          setStep("signup");
        } else {
          throw new Error(data.error || "שגיאה");
        }
        return;
      }
      login(data.token, data.user);
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
      <Link href="/" className="text-rose-500 hover:text-rose-400 mb-6">
        ← חזרה
      </Link>
      <h1 className="text-2xl font-bold text-white mb-8">התחבר / הרשם</h1>

      {step === "phone" && (
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={async () => {
              setError("");
              setLoading(true);
              try {
                const res = await fetch("/api/auth/test-login", { method: "POST" });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "שגיאה");
                login(data.token, data.user);
                router.push("/");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium border border-emerald-500"
          >
            התחבר לטסט (ללא OTP)
          </button>
          <p className="text-zinc-500 text-sm text-center">או</p>
          <input
            type="tel"
            placeholder="מספר טלפון"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
          />
          <button
            onClick={requestOTP}
            disabled={loading || !phone}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-medium"
          >
            {loading ? "שולח..." : "שלח קוד"}
          </button>
        </div>
      )}

      {(step === "verify" || step === "signup") && (
        <div className="w-full max-w-sm space-y-4">
          {devCode && (
            <p className="text-amber-400 text-sm">קוד לפיתוח: {devCode}</p>
          )}
          <button
            type="button"
            onClick={async () => {
              setError("");
              setLoading(true);
              try {
                const res = await fetch("/api/auth/otp/request", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "שגיאה");
                setDevCode(data.devCode);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !phone}
            className="text-zinc-500 hover:text-rose-400 text-sm underline"
          >
            שלח קוד מחדש
          </button>
          <input
            type="text"
            placeholder="קוד אימות"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
          />
          {step === "signup" && (
            <>
              <input
                type="text"
                placeholder="שם פרטי"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
              />
              <input
                type="date"
                placeholder="תאריך לידה"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
              />
              <input
                type="email"
                placeholder="דוא״ל (אופציונלי)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
              />
            </>
          )}
          <button
            onClick={verifyOTP}
            disabled={loading || !code || (step === "signup" && (!name || !birthdate))}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-medium"
          >
            {loading ? "מאמת..." : "אימות"}
          </button>
        </div>
      )}

      {error && <p className="text-rose-400 text-sm mt-4">{error}</p>}
    </div>
  );
}
