"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { FacebookIcon, GoogleIcon, InstagramIcon } from "@/components/SocialIcons";
import { ClubingHeroBackground } from "@/components/ClubingHeroBackground";
import { ClubingHeading } from "@/components/ClubingHeading";
import { clubingChoiceButton, clubingGlassCard, clubingGoldCta, clubingInput } from "@/lib/clubing-ui";
import { isDevLoginEnabled } from "@/lib/dev-login";
import { consumePostAuthRedirect } from "@/lib/post-auth-redirect";

type Flow = "choose" | "existing" | "new" | "verify";

function SocialButtons({
  signInWithProvider,
}: {
  signInWithProvider: (p: "facebook" | "google" | "instagram") => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => signInWithProvider("facebook")}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-zinc-900/80 to-black/90 px-6 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-[#1877F2]/70 hover:shadow-[0_0_24px_rgba(24,119,242,0.2)] active:scale-[0.99]"
      >
        <span className="text-[#1877F2]">
          <FacebookIcon className="w-6 h-6" />
        </span>
        Facebook
      </button>
      <button
        type="button"
        onClick={() => signInWithProvider("instagram")}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-zinc-900/80 to-black/90 px-6 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-[#E4405F]/70 hover:shadow-[0_0_24px_rgba(228,64,95,0.2)] active:scale-[0.99]"
      >
        <span className="text-[#E4405F]">
          <InstagramIcon className="w-6 h-6" />
        </span>
        Instagram
      </button>
      <button
        type="button"
        onClick={() => signInWithProvider("google")}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-zinc-900/80 to-black/90 px-6 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-[#d4af37] hover:shadow-[0_0_28px_rgba(212,175,55,0.18)] active:scale-[0.99]"
      >
        <GoogleIcon className="w-6 h-6" />
        Google
      </button>
    </>
  );
}

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithProvider, signInWithEmailPassword, loginDeveloper } = useAuth();
  const devLoginEnabled = isDevLoginEnabled();
  const { t } = useLanguage();
  const [flow, setFlow] = useState<Flow>("choose");
  const [providersReady, setProvidersReady] = useState<boolean | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regErr, setRegErr] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [pendingPassword, setPendingPassword] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyErr, setVerifyErr] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const errorCode = searchParams.get("error");
  const errorMsg = errorCode
    ? (() => {
        const msg = t(`auth.error.${errorCode}`);
        return msg.startsWith("auth.error.") ? t("auth.error.Default") : msg;
      })()
    : null;

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((p) => setProvidersReady(Object.keys(p).filter((k) => k !== "credentials").length > 0))
      .catch(() => setProvidersReady(false));
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    setLoginLoading(true);
    try {
      const r = await signInWithEmailPassword(loginEmail, loginPassword);
      if (!r.ok) {
        setLoginErr(t("auth.err.credentials"));
        setLoginLoading(false);
        return;
      }
      router.replace(consumePostAuthRedirect());
      router.refresh();
    } catch {
      setLoginErr(t("auth.error.Default"));
    }
    setLoginLoading(false);
  };

  const mapRegisterError = (code: string) => {
    const m: Record<string, string> = {
      name: t("auth.err.name"),
      email: t("auth.err.email"),
      phone: t("auth.err.phone"),
      password: t("auth.err.password"),
      taken: t("auth.err.taken"),
      mail: t("auth.err.mail"),
      mail_config: t("auth.err.mail_config"),
    };
    return m[code] ?? t("auth.error.Default");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErr("");
    setRegLoading(true);
    setDevCode(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRegErr(mapRegisterError(data.error ?? "server"));
        setRegLoading(false);
        return;
      }
      setPendingPassword(regPassword);
      setRegPassword("");
      if (data.devCode) setDevCode(String(data.devCode));
      setFlow("verify");
    } catch {
      setRegErr(t("auth.error.Default"));
    }
    setRegLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyErr("");
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, code: verifyCode.replace(/\s/g, "") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerifyErr(t("auth.err.code"));
        setVerifyLoading(false);
        return;
      }
      const r = await signInWithEmailPassword(regEmail, pendingPassword);
      if (!r.ok) {
        setFlow("existing");
        setVerifyErr("");
        setLoginEmail(regEmail);
        router.replace("/auth");
        setVerifyLoading(false);
        return;
      }
      router.replace(consumePostAuthRedirect());
      router.refresh();
    } catch {
      setVerifyErr(t("auth.error.Default"));
    }
    setVerifyLoading(false);
  };

  const divider = (
    <div className="relative my-7">
      <div className="absolute inset-0 flex items-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d4af37]/45 to-transparent" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="rounded-full border border-[#d4af37]/20 bg-black/55 px-4 py-1 text-zinc-400 backdrop-blur-md">
          {t("auth.or")}
        </span>
      </div>
    </div>
  );

  return (
    <div className="clubing-auth-enter min-h-[100dvh] w-full">
      <ClubingHeroBackground
        variant="auth"
        className="flex min-h-[100dvh] flex-col items-center justify-center px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-10 sm:pb-10"
      >
      <ClubingHeading size="screen" className="-mt-1 mb-2 text-center sm:-mt-2 sm:mb-2.5">
        {t("auth.title")}
      </ClubingHeading>
      <div
        aria-hidden
        className="mx-auto mb-5 h-px w-full max-w-[min(11rem,78%)] rounded-full bg-gradient-to-r from-transparent from-[8%] via-[#d4af37]/85 to-transparent to-[92%] shadow-[0_0_10px_rgba(212,175,55,0.3)] sm:mb-6"
      />

      {errorMsg && flow === "choose" && (
        <div className="mb-3 max-w-sm rounded-2xl border border-amber-400/35 bg-amber-500/[0.12] p-4 text-center text-sm text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.12)] backdrop-blur-md">
          {errorMsg}
        </div>
      )}

      <div className={`w-full max-w-sm space-y-4 px-7 py-9 sm:py-10 ${clubingGlassCard}`}>
        {flow === "choose" && (
          <div className="space-y-10 sm:space-y-12">
            <div className="space-y-4">
              <button type="button" onClick={() => setFlow("existing")} className={clubingChoiceButton}>
                {t("auth.existingMember")}
              </button>
              <p className="px-1 pb-1 text-center text-xs leading-relaxed text-zinc-500">{t("auth.existingHint")}</p>
            </div>
            <div className="space-y-4">
              <button type="button" onClick={() => setFlow("new")} className={clubingChoiceButton}>
                {t("auth.newMember")}
              </button>
              <p className="px-1 pb-1 text-center text-xs leading-relaxed text-zinc-500">{t("auth.newHint")}</p>
            </div>
            {devLoginEnabled && (
              <div className="space-y-4 border-t border-[#d4af37]/20 pt-8 sm:pt-10">
                <button
                  type="button"
                  onClick={() => {
                    loginDeveloper();
                    router.replace(consumePostAuthRedirect());
                    router.refresh();
                  }}
                  className={clubingChoiceButton}
                >
                  {t("auth.developerLogin")}
                </button>
                <p className="px-1 pb-1 text-center text-xs leading-relaxed text-zinc-500">{t("auth.developerHint")}</p>
              </div>
            )}
          </div>
        )}

        {flow === "existing" && (
          <>
            <p className="mb-2 text-center text-sm font-medium text-zinc-400">{t("auth.socialLogin")}</p>
            <SocialButtons signInWithProvider={signInWithProvider} />
            {divider}
            <p className="text-center text-sm font-medium text-zinc-400">{t("auth.emailLogin")}</p>
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={t("auth.emailLabel")}
                className={clubingInput}
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t("auth.passwordLabel")}
                className={clubingInput}
              />
              {loginErr && <p className="text-red-400 text-sm text-center">{loginErr}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className={clubingGoldCta}
              >
                {loginLoading ? "…" : t("auth.signInEmail")}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setFlow("choose");
                setLoginErr("");
              }}
              className="w-full py-2 text-sm text-zinc-500 transition hover:text-[#f0d78c]"
            >
              {t("auth.back")}
            </button>
          </>
        )}

        {flow === "new" && (
          <>
            <p className="mb-2 text-center text-sm font-medium text-zinc-400">{t("auth.socialLogin")}</p>
            <SocialButtons signInWithProvider={signInWithProvider} />
            {divider}
            <p className="text-center text-sm font-semibold text-[#e8c96b]">{t("auth.registerSection")}</p>
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder={t("auth.registerFullName")}
                className={clubingInput}
              />
              <input
                type="email"
                required
                autoComplete="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder={t("auth.emailLabel")}
                className={clubingInput}
              />
              <input
                type="tel"
                required
                autoComplete="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder={t("auth.registerPhone")}
                className={clubingInput}
              />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder={t("auth.passwordLabel")}
                minLength={8}
                className={clubingInput}
              />
              {regErr && <p className="text-red-400 text-sm text-center">{regErr}</p>}
              <button
                type="submit"
                disabled={regLoading}
                className={clubingGoldCta}
              >
                {regLoading ? t("auth.registerSending") : t("auth.registerButton")}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setFlow("choose");
                setRegErr("");
              }}
              className="w-full py-2 text-sm text-zinc-500 transition hover:text-[#f0d78c]"
            >
              {t("auth.back")}
            </button>
          </>
        )}

        {flow === "verify" && (
          <>
            <h2 className="text-center text-xl font-semibold text-[#f0d78c]">{t("auth.verifyTitle")}</h2>
            <p className="text-zinc-400 text-sm text-center">{t("auth.verifySent")}</p>
            <p className="text-zinc-500 text-xs text-center">{regEmail}</p>
            {devCode && (
              <p className="text-amber-200/90 text-xs text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                {t("auth.devCodeHint")} <strong className="tracking-widest">{devCode}</strong>
              </p>
            )}
            <form onSubmit={handleVerify} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t("auth.verifyCode")}
                className={`${clubingInput} text-center text-2xl tracking-[0.4em] placeholder:text-base placeholder:tracking-normal`}
              />
              {verifyErr && <p className="text-red-400 text-sm text-center">{verifyErr}</p>}
              <button
                type="submit"
                disabled={verifyLoading || verifyCode.length !== 6}
                className={clubingGoldCta}
              >
                {verifyLoading ? "…" : t("auth.verifyButton")}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setFlow("new");
                setVerifyCode("");
                setVerifyErr("");
                setDevCode(null);
              }}
              className="w-full py-2 text-sm text-zinc-500 transition hover:text-[#f0d78c]"
            >
              {t("auth.back")}
            </button>
          </>
        )}

        {providersReady === false && flow !== "verify" && (
          <a
            href="https://github.com/paziz17/clubbing/blob/main/FIX-LOGIN.md"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-amber-500/90 text-sm text-center mt-4 hover:underline"
          >
            {t("auth.fixLogin")}
          </a>
        )}
      </div>
    </ClubingHeroBackground>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="clubing-auth-enter min-h-[100dvh] w-full">
          <ClubingHeroBackground variant="auth" className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-[max(2rem,env(safe-area-inset-top),env(safe-area-inset-bottom))]">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
          </ClubingHeroBackground>
        </div>
      }
    >
      <AuthInner />
    </Suspense>
  );
}
